/**
 * promptService.js
 *
 * Uses Claude (Anthropic API) to convert user answers into a structured
 * music generation prompt.
 *
 * Swappable: replace buildPromptWithClaude() with buildPromptWithOpenAI()
 * to switch providers — the interface stays the same.
 */

// ── Claude implementation ─────────────────────────────────────────────────────
export async function buildMusicPrompt(answers) {
  const {
    mood, genre, tempo, instruments,
    useCase, vocals, duration,
  } = answers;

  const systemPrompt = `You are a professional music producer and prompt engineer.
Your job is to convert user preferences into a precise, detailed music generation prompt.
Always respond with ONLY valid JSON — no markdown, no code fences, no extra text.`;

  const userMessage = `A user wants to generate a music track with these preferences:
- Mood: ${mood}
- Genre: ${genre}
- Tempo: ${tempo}
- Instruments: ${instruments}
- Use case: ${useCase}
- Vocals: ${vocals}
- Duration: ${duration} seconds

Create a detailed music generation prompt as JSON with exactly these fields:
{
  "description": "A vivid, detailed description of the music (2-3 sentences)",
  "bpm": "Specific BPM number or range (e.g. '120' or '90-100')",
  "structure": "Song structure (e.g. 'intro 4 bars, verse 16 bars, chorus 8 bars')",
  "instruments": "Comma-separated list of all instruments",
  "style_tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}`;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("⚠️  ANTHROPIC_API_KEY not set — using fallback prompt builder");
    return buildFallbackPrompt(answers);
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:  "POST",
    headers: {
      "Content-Type":      "application/json",
      "x-api-key":         apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 600,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Claude API error:", err);
    return buildFallbackPrompt(answers);
  }

  const data    = await res.json();
  const rawText = data.content?.[0]?.text?.trim() ?? "";

  try {
    const parsed = JSON.parse(rawText);
    // Validate required fields
    if (!parsed.description || !parsed.bpm || !parsed.instruments) {
      throw new Error("Missing required fields");
    }
    return {
      description: String(parsed.description),
      bpm:         String(parsed.bpm),
      structure:   String(parsed.structure || ""),
      instruments: String(parsed.instruments),
      style_tags:  Array.isArray(parsed.style_tags) ? parsed.style_tags.map(String) : [],
    };
  } catch {
    console.error("Failed to parse Claude response, using fallback");
    return buildFallbackPrompt(answers);
  }
}

// ── Fallback — used when API key is missing or Claude fails ───────────────────
function buildFallbackPrompt(answers) {
  const { mood, genre, tempo, instruments, useCase, vocals, duration } = answers;
  const tempoMap = { slow: "70", medium: "110", fast: "140", "very fast": "160" };
  const bpm = tempoMap[tempo?.toLowerCase()] ?? "100";

  return {
    description: `A ${mood} ${genre} track with ${tempo} tempo, featuring ${instruments}. Perfect for ${useCase}. ${vocals === "yes" ? "Includes vocals." : "Instrumental only."}`,
    bpm,
    structure:   `intro 4 bars, main section ${Math.max(4, Math.floor(duration / 4))} bars, outro 4 bars`,
    instruments: instruments || `${genre} standard instrumentation`,
    style_tags:  [mood, genre, tempo, vocals === "yes" ? "vocal" : "instrumental", useCase]
      .filter(Boolean)
      .map(t => t.toLowerCase().replace(/\s+/g, "-")),
  };
}