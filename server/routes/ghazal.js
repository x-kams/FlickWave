/**
 * server/routes/ghazal.js
 *
 * POST /api/ghazal/generate  — start ghazal → song generation
 * GET  /api/ghazal/status/:id — poll job status
 * GET  /api/ghazal/tracks?email=x — list user's ghazal tracks
 */

import express from "express";
import GeneratedTrack from "../models/GeneratedTrack.js";
import { generateGhazalSong } from "../services/ghazalService.js";

const router = express.Router();

// ── POST /api/ghazal/generate ─────────────────────────────────────────────────
router.post("/generate", async (req, res) => {
  const { email, ghazalText, style, duration } = req.body;

  if (!email || !ghazalText) {
    return res.status(400).json({ error: "email and ghazalText are required" });
  }

  if (ghazalText.trim().length < 20) {
    return res.status(400).json({ error: "Ghazal text is too short. Please enter at least 2 lines." });
  }

  const durationSec = Math.min(Number(duration) || 30, 60);
  const styleChoice = style || "Classical";

  // Create job record
  const track = await GeneratedTrack.create({
    userEmail:   email.toLowerCase(),
    answers: {
      mood:        "Ghazal",
      genre:       styleChoice,
      tempo:       "Slow",
      instruments: "harmonium, tabla, sitar",
      useCase:     "Ghazal Studio",
      vocals:      "yes",
      duration:    durationSec,
    },
    status:      "processing",
    plan:        "basic",
    durationSec,
    quality:     "high",
    prompt: {
      description: "Analyzing ghazal…",
      bpm:         "",
      structure:   "",
      instruments: "harmonium, tabla, sitar",
      style_tags:  ["ghazal", "urdu", styleChoice.toLowerCase()],
    },
    // Store extra ghazal-specific data in errorMsg field temporarily
    // (we'll add a proper field in production)
  });

  res.status(202).json({
    jobId:   track.id,
    status:  "processing",
    message: "Ghazal analysis started. Poll /api/ghazal/status/:id for updates.",
  });

  // ── Run async ────────────────────────────────────────────────────────────
  setImmediate(async () => {
    try {
      console.log(`🎶 Ghazal job ${track.id} started for style: ${styleChoice}`);

      const { audioUrl, analysis } = await generateGhazalSong(
        ghazalText,
        styleChoice,
        durationSec
      );

      await GeneratedTrack.findByIdAndUpdate(track._id, {
        status:   "done",
        audioUrl,
        prompt: {
          description: analysis.musicPrompt,
          bpm:         analysis.bpm,
          structure:   `Raag: ${analysis.raag}`,
          instruments: analysis.instruments,
          style_tags:  analysis.style_tags || [],
        },
      });

      console.log(`✅ Ghazal job ${track.id} complete: ${audioUrl}`);
    } catch (err) {
      console.error(`❌ Ghazal job ${track.id} failed:`, err.message);
      await GeneratedTrack.findByIdAndUpdate(track._id, {
        status:   "failed",
        errorMsg: err.message,
      });
    }
  });
});

// ── GET /api/ghazal/status/:id ────────────────────────────────────────────────
router.get("/status/:id", async (req, res) => {
  try {
    const track = await GeneratedTrack.findById(req.params.id);
    if (!track) return res.status(404).json({ error: "Job not found" });
    res.json(track);
  } catch {
    res.status(400).json({ error: "Invalid job ID" });
  }
});

// ── GET /api/ghazal/tracks?email=x ───────────────────────────────────────────
router.get("/tracks", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email required" });

  const tracks = await GeneratedTrack.find({
    userEmail: email.toLowerCase(),
    "answers.useCase": "Ghazal Studio",
  })
    .sort({ createdAt: -1 })
    .limit(30);

  res.json(tracks);
});

export default router;
