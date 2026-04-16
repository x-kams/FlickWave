/**
 * server/routes/generate.js
 *
 * POST /api/generate/music       — start generation job
 * GET  /api/generate/status/:id  — poll job status
 * GET  /api/generate/tracks      — list user's generated tracks
 * GET  /api/generate/usage       — check plan + remaining quota
 * POST /api/generate/upgrade     — change plan (demo; add payment in prod)
 */

import express from "express";
import GeneratedTrack        from "../models/GeneratedTrack.js";
import UserPlan, { PLAN_LIMITS } from "../models/UserPlan.js";
import { buildMusicPrompt }  from "../services/promptService.js";
import { generateAudio }     from "../services/musicService.js";

const router = express.Router();

// ── Helper: get or create UserPlan ────────────────────────────────────────────
async function getOrCreatePlan(email) {
  let plan = await UserPlan.findOne({ email: email.toLowerCase() });
  if (!plan) plan = await UserPlan.create({ email: email.toLowerCase() });
  // Reset monthly counter if we're in a new month
  const now        = new Date();
  const resetMonth = new Date(plan.generationsResetAt);
  if (now.getMonth() !== resetMonth.getMonth() || now.getFullYear() !== resetMonth.getFullYear()) {
    plan.generationsUsed    = 0;
    plan.generationsResetAt = now;
    await plan.save();
  }
  return plan;
}

// ── POST /api/generate/music ──────────────────────────────────────────────────
router.post("/music", async (req, res) => {
  const { email, answers } = req.body;

  if (!email || !answers) {
    return res.status(400).json({ error: "email and answers are required" });
  }

  const { mood, genre, tempo, instruments, useCase, vocals, duration } = answers;
  if (!mood || !genre || !tempo || !instruments || !useCase) {
    return res.status(400).json({ error: "mood, genre, tempo, instruments and useCase are required" });
  }

  // ── Check quota ───────────────────────────────────────────────────────────
  const userPlan = await getOrCreatePlan(email);
  const limits   = PLAN_LIMITS[userPlan.plan];

  if (userPlan.generationsUsed >= limits.generations) {
    return res.status(403).json({
      error: `Generation limit reached for your ${limits.label} plan (${limits.generations}/month). Please upgrade.`,
      plan:  userPlan.plan,
      limit: limits.generations,
      used:  userPlan.generationsUsed,
    });
  }

  // Clamp duration to plan max
  const requestedDuration = Number(duration) || 5;
  const clampedDuration   = Math.min(requestedDuration, limits.maxDuration);

  // ── Create a job record immediately (status: pending) ─────────────────────
  const track = await GeneratedTrack.create({
    userEmail:   email.toLowerCase(),
    answers:     { mood, genre, tempo, instruments, useCase, vocals: vocals || "no", duration: clampedDuration },
    status:      "processing",
    plan:        userPlan.plan,
    durationSec: clampedDuration,
    quality:     limits.quality,
    prompt:      { description: "", bpm: "", structure: "", instruments: "", style_tags: [] },
  });

  // Increment usage NOW (optimistic — prevents race conditions)
  userPlan.generationsUsed += 1;
  await userPlan.save();

  // Respond immediately with job ID — client polls for completion
  res.status(202).json({
    jobId:     track.id,
    status:    "processing",
    message:   "Music generation started. Poll /api/generate/status/:id for updates.",
    plan:      userPlan.plan,
    remaining: limits.generations - userPlan.generationsUsed,
  });

  // ── Run generation asynchronously (non-blocking) ─────────────────────────
  setImmediate(async () => {
    try {
      console.log(`🎵 Building prompt for job ${track.id}…`);
      const prompt = await buildMusicPrompt({
        mood, genre, tempo, instruments, useCase,
        vocals: vocals || "no",
        duration: clampedDuration,
      });

      await GeneratedTrack.findByIdAndUpdate(track._id, { prompt });
      console.log(`🤖 Prompt built. Sending to music model…`);

      const audioUrl = await generateAudio(prompt, clampedDuration);

      await GeneratedTrack.findByIdAndUpdate(track._id, {
        status:   "done",
        audioUrl,
        prompt,
      });
      console.log(`✅ Job ${track.id} complete: ${audioUrl}`);
    } catch (err) {
      console.error(`❌ Job ${track.id} failed:`, err.message);
      await GeneratedTrack.findByIdAndUpdate(track._id, {
        status:   "failed",
        errorMsg: err.message,
      });
      // Refund usage on failure
      await UserPlan.updateOne({ email: email.toLowerCase() }, { $inc: { generationsUsed: -1 } });
    }
  });
});

// ── GET /api/generate/status/:id ─────────────────────────────────────────────
router.get("/status/:id", async (req, res) => {
  try {
    const track = await GeneratedTrack.findById(req.params.id);
    if (!track) return res.status(404).json({ error: "Job not found" });
    res.json(track);
  } catch {
    res.status(400).json({ error: "Invalid job ID" });
  }
});

// ── GET /api/generate/tracks?email=xxx ────────────────────────────────────────
router.get("/tracks", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email query param required" });

  const tracks = await GeneratedTrack.find({ userEmail: email.toLowerCase() })
    .sort({ createdAt: -1 })
    .limit(50);

  res.json(tracks);
});

// ── GET /api/generate/usage?email=xxx ─────────────────────────────────────────
router.get("/usage", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "email query param required" });

  const userPlan = await getOrCreatePlan(email);
  const limits   = PLAN_LIMITS[userPlan.plan];

  res.json({
    plan:         userPlan.plan,
    label:        limits.label,
    used:         userPlan.generationsUsed,
    limit:        limits.generations,
    remaining:    Math.max(0, limits.generations - userPlan.generationsUsed),
    maxDuration:  limits.maxDuration,
    canDownload:  limits.download,
    quality:      limits.quality,
    resetAt:      userPlan.generationsResetAt,
  });
});

// ── POST /api/generate/upgrade ────────────────────────────────────────────────
// In production: validate payment receipt before upgrading.
// This endpoint is called by admin OR a payment webhook.
router.post("/upgrade", async (req, res) => {
  const { email, plan, adminSecret } = req.body;

  if (!email || !plan) {
    return res.status(400).json({ error: "email and plan are required" });
  }
  if (!["free", "basic", "premium"].includes(plan)) {
    return res.status(400).json({ error: "plan must be free, basic, or premium" });
  }

  // Simple admin secret guard — replace with payment verification in production
  const expectedSecret = process.env.ADMIN_SECRET || "flickwave-admin-2025";
  if (adminSecret !== expectedSecret) {
    return res.status(403).json({ error: "Invalid admin secret" });
  }

  const userPlan = await getOrCreatePlan(email);
  userPlan.plan  = plan;
  await userPlan.save();

  res.json({
    success: true,
    email,
    plan,
    limits: PLAN_LIMITS[plan],
  });
});

// ── DELETE /api/generate/tracks/:id ───────────────────────────────────────────
router.delete("/tracks/:id", async (req, res) => {
  const { email } = req.body;
  try {
    const track = await GeneratedTrack.findById(req.params.id);
    if (!track)                           return res.status(404).json({ error: "Track not found" });
    if (track.userEmail !== email?.toLowerCase()) return res.status(403).json({ error: "Not your track" });
    await track.deleteOne();
    res.json({ success: true });
  } catch {
    res.status(400).json({ error: "Invalid track ID" });
  }
});

export default router;