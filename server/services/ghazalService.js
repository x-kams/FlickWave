/**
 * ghazalService.js
 *
 * Ghazal → Professional Song Pipeline:
 * 1. Claude API → analyzes ghazal meter, mood, raag → builds detailed music prompt
 * 2. Replicate (Bark / MusicGen) → generates audio with vocals
 * 3. Returns audio URL
 *
 * ENV required:
 *   ANTHROPIC_API_KEY   — for ghazal analysis
 *   REPLICATE_API_KEY   — for audio generation
 *   SUNO_API_KEY        — (optional) for higher quality vocal output
 */

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Claude analyzes the ghazal and builds a rich music prompt
// ─────────────────────────────────────────────────────────────────────────────
export async function analyzeGhazalWithClaude(ghazalText, style = "Classical") {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set in .env");

  const systemPrompt = `You are an expert in Urdu/Punjabi poetry, Indian classical music, and AI music generation.
Your job is to analyze a ghazal and produce a detailed JSON prompt for an AI music generation system.
Always respond with VALID JSON only — no markdown, no explanation outside the JSON.`;

  const userPrompt = `Analyze this ghazal and create a professional music generation prompt.

Ghazal Text:
"""
${ghazalText}
"""

Requested Style: ${style}

Return this exact JSON structure:
{
  "musicPrompt": "A detailed English description for MusicGen AI (2-3 sentences describing the full track, instruments, tempo, mood, vocal style)",
  "barkText": "The ghazal text formatted for Bark TTS singing — wrap each sher (couplet) in ♪...♪ with line breaks between them",
  "instruments": "comma-separated instruments (e.g. harmonium, tabla, sitar, tanpura, sarangi)",
  "bpm": "exact BPM number as string (e.g. '72')",
  "raag": "appropriate Indian classical raag name",
  "mood": "primary mood in one word",
  "style_tags": ["array", "of", "relevant", "music", "tags"],
  "transliteration": "romanized version of first two lines only",
  "meaning": "English meaning of the ghazal in 1-2 sentences"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-opus-4-20250514",
      max_tokens: 1024,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude API failed: ${err.error?.message || res.status}`);
  }

  const data    = await res.json();
  const rawText = data.content[0].text.trim();

  // Strip any accidental markdown fences
  const clean = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${clean.slice(0, 200)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2A — Replicate Bark: generate SINGING vocal audio from text
// ─────────────────────────────────────────────────────────────────────────────
export async function generateVocalsWithBark(barkText, voicePreset = "v2/hi_speaker_9") {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) throw new Error("REPLICATE_API_KEY is not set in .env");

  // Bark suno-ai model — supports singing with ♪ notation
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      version: "b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787", // suno-ai/bark
      input: {
        prompt:       barkText,
        history_prompt: voicePreset,  // Hindi/South Asian voice
        text_temp:    0.7,
        waveform_temp: 0.7,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`Bark create failed: ${err.detail || createRes.status}`);
  }

  const prediction = await createRes.json();
  return pollReplicate(prediction.id, apiKey, 240_000); // 4 min max
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2B — Replicate MusicGen: generate INSTRUMENTAL background track
// ─────────────────────────────────────────────────────────────────────────────
export async function generateInstrumentalWithMusicGen(analysisResult, durationSec) {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) throw new Error("REPLICATE_API_KEY is not set in .env");

  const description = `${analysisResult.musicPrompt}. Instruments: ${analysisResult.instruments}. Raag: ${analysisResult.raag}. BPM: ${analysisResult.bpm}. Style: ${analysisResult.style_tags?.join(", ")}.`;

  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb", // MusicGen
      input: {
        prompt:                 description,
        duration:               Math.min(Math.max(durationSec, 5), 60),
        model_version:          "stereo-large",
        output_format:          "mp3",
        normalization_strategy: "peak",
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`MusicGen create failed: ${err.detail || createRes.status}`);
  }

  const prediction = await createRes.json();
  return pollReplicate(prediction.id, apiKey, 180_000);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2C — Suno AI: generate FULL song with professional vocals (best quality)
// ─────────────────────────────────────────────────────────────────────────────
export async function generateWithSuno(ghazalText, analysisResult) {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) throw new Error("SUNO_API_KEY is not set in .env");

  // Suno official API
  const res = await fetch("https://studio-api.prod.suno.com/api/generate/v2/", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt:       `[${analysisResult.style_tags?.join(", ")}]\n\n${ghazalText}`,
      mv:           "chirp-v3-5",
      title:        `Ghazal — ${analysisResult.raag}`,
      tags:         analysisResult.style_tags?.join(", "),
      make_instrumental: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Suno API failed: ${err.message || res.status}`);
  }

  const data = await res.json();
  // Poll Suno for completion
  return pollSuno(data[0]?.id, apiKey);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ENTRY POINT — chooses the best provider automatically
// ─────────────────────────────────────────────────────────────────────────────
export async function generateGhazalSong(ghazalText, style, durationSec = 30) {
  console.log("🎶 Step 1: Analyzing ghazal with Claude…");
  const analysis = await analyzeGhazalWithClaude(ghazalText, style);
  console.log(`✅ Raag: ${analysis.raag} | BPM: ${analysis.bpm} | Mood: ${analysis.mood}`);

  let audioUrl;

  // Priority: Suno (best vocals) → Bark (OK vocals) → MusicGen (instrumental only)
  if (process.env.SUNO_API_KEY) {
    console.log("🎤 Step 2: Generating with Suno AI (full vocals)…");
    audioUrl = await generateWithSuno(ghazalText, analysis);
  } else if (process.env.REPLICATE_API_KEY) {
    // Try Bark for vocals first
    try {
      console.log("🎤 Step 2: Generating vocals with Bark…");
      audioUrl = await generateVocalsWithBark(analysis.barkText);
    } catch (barkErr) {
      console.warn("⚠️ Bark failed, falling back to MusicGen instrumental:", barkErr.message);
      console.log("🎵 Step 2: Generating instrumental with MusicGen…");
      audioUrl = await generateInstrumentalWithMusicGen(analysis, durationSec);
    }
  } else {
    throw new Error("No audio generation API key found. Set SUNO_API_KEY or REPLICATE_API_KEY in .env");
  }

  return { audioUrl, analysis };
}

// ─────────────────────────────────────────────────────────────────────────────
// Polling helpers
// ─────────────────────────────────────────────────────────────────────────────
async function pollReplicate(predId, apiKey, maxWaitMs = 180_000) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await sleep(4000);
    const res  = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    if (data.status === "succeeded") {
      const output = Array.isArray(data.output) ? data.output[0] : data.output;
      return output;
    }
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Replicate ${data.status}: ${data.error || "unknown"}`);
    }
    console.log(`⏳ Replicate status: ${data.status}`);
  }
  throw new Error("Replicate timed out");
}

async function pollSuno(clipId, apiKey, maxWaitMs = 300_000) {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    await sleep(5000);
    const res  = await fetch(`https://studio-api.prod.suno.com/api/feed/?ids=${clipId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();
    const clip = data[0];
    if (clip?.status === "complete") return clip.audio_url;
    if (clip?.status === "error")    throw new Error(`Suno error: ${clip.error}`);
    console.log(`⏳ Suno status: ${clip?.status}`);
  }
  throw new Error("Suno timed out");
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
