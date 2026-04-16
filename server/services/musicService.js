/**
 * musicService.js
 *
 * Calls Replicate's MusicGen model to generate audio from a text prompt.
 * Swap MUSIC_PROVIDER env var to switch models.
 *
 * Supported: "replicate" (MusicGen) | "stability" (Stable Audio)
 */

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Main entry point ──────────────────────────────────────────────────────────
export async function generateAudio(prompt, durationSec) {
  const provider = process.env.MUSIC_PROVIDER || "replicate";

  switch (provider) {
    case "replicate":
      return generateWithMusicGen(prompt, durationSec);
    case "stability":
      return generateWithStableAudio(prompt, durationSec);
    default:
      return generateWithMusicGen(prompt, durationSec);
  }
}

// ── Replicate — MusicGen ──────────────────────────────────────────────────────
async function generateWithMusicGen(prompt, durationSec) {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    throw new Error("REPLICATE_API_KEY is not set in .env");
  }

  const description = `${prompt.description}. Instruments: ${prompt.instruments}. Style: ${prompt.style_tags?.join(", ")}. BPM: ${prompt.bpm}.`;

  // Create prediction
  const createRes = await fetch("https://api.replicate.com/v1/predictions", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      version: "671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb", // MusicGen melody
      input: {
        prompt:             description,
        duration:           Math.min(Math.max(durationSec, 1), 60),
        model_version:      "stereo-large",
        output_format:      "mp3",
        normalization_strategy: "peak",
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`Replicate create failed: ${err.detail || createRes.status}`);
  }

  const prediction = await createRes.json();
  const predId     = prediction.id;
  console.log(`🎵 MusicGen prediction started: ${predId}`);

  // Poll until done (max 3 minutes)
  const audioUrl = await pollReplicate(predId, apiKey);
  return audioUrl;
}

// Poll Replicate prediction until done or failed
async function pollReplicate(predId, apiKey, maxWaitMs = 180_000) {
  const pollInterval = 4000;
  const deadline     = Date.now() + maxWaitMs;

  while (Date.now() < deadline) {
    await sleep(pollInterval);

    const res = await fetch(`https://api.replicate.com/v1/predictions/${predId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json();

    if (data.status === "succeeded") {
      const output = Array.isArray(data.output) ? data.output[0] : data.output;
      console.log(`✅ MusicGen done: ${output}`);
      return output; // returns a URL pointing to the generated mp3
    }

    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`MusicGen ${data.status}: ${data.error || "unknown error"}`);
    }

    console.log(`⏳ MusicGen status: ${data.status}`);
  }

  throw new Error("MusicGen timed out after 3 minutes");
}

// ── Stability AI — Stable Audio ───────────────────────────────────────────────
async function generateWithStableAudio(prompt, durationSec) {
  const apiKey = process.env.STABILITY_API_KEY;
  if (!apiKey) {
    throw new Error("STABILITY_API_KEY is not set in .env");
  }

  const description = `${prompt.description}. Style: ${prompt.style_tags?.join(", ")}.`;

  const res = await fetch("https://api.stability.ai/v2beta/audio/stable-audio/generate", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      prompt:   description,
      seconds:  Math.min(durationSec, 60),
      output_format: "mp3",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Stability AI failed: ${err.message || res.status}`);
  }

  // Stability returns binary audio — save to uploads
  const buffer   = Buffer.from(await res.arrayBuffer());
  const filename = `generated-${Date.now()}.mp3`;
  const uploadsDir = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  fs.writeFileSync(path.join(uploadsDir, filename), buffer);

  return `/uploads/${filename}`; // served as static file
}

// ── Utility ───────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}