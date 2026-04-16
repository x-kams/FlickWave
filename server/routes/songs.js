import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import Song from "../models/Song.js";

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const allowedMimeTypes = new Set([
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg",
  "audio/flac", "audio/aac", "audio/x-m4a", "audio/mp4",
]);
const allowedExtensions = new Set([".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"]);

// ── Extract filename from a stored audioUrl ────────────────────────────────────
// Uses URL constructor so query-params / fragments never corrupt the filename.
// Returns null if the URL is external (not one of our uploads).
function extractUploadFilename(audioUrl) {
  if (!audioUrl || !audioUrl.includes("/uploads/")) return null;
  try {
    // Full URL stored during upload: http://localhost:5000/uploads/filename.mp3
    const pathname = new URL(audioUrl).pathname;   // → /uploads/filename.mp3
    return path.basename(pathname);                 // → filename.mp3
  } catch {
    // Fallback for relative paths or malformed URLs
    const after = audioUrl.split("/uploads/").pop() || "";
    return path.basename(after) || null;
  }
}

// ── Delete a local upload file — logs result, never throws ────────────────────
function deleteUploadFile(audioUrl) {
  const filename = extractUploadFilename(audioUrl);
  if (!filename) {
    console.log("ℹ️  No local upload file to delete for:", audioUrl || "(empty)");
    return;
  }
  const filePath = path.join(uploadsDir, filename);
  if (!fs.existsSync(filePath)) {
    console.warn("⚠️  Upload file not found on disk:", filePath);
    return;
  }
  try {
    fs.unlinkSync(filePath);
    console.log("🗑️  Deleted upload file:", filename);
  } catch (err) {
    console.error("❌ Could not delete upload file:", filePath, "→", err.message);
  }
}

function isValidExternalAudioUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch { return false; }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const mimeAllowed = allowedMimeTypes.has(file.mimetype) || file.mimetype.startsWith("audio/");
    const extAllowed  = allowedExtensions.has(extension);
    if (mimeAllowed && extAllowed) { cb(null, true); return; }
    cb(new Error("Only valid audio files are allowed (mp3, wav, ogg, flac, aac, m4a)."));
  },
});

// ── GET all songs ──────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST — add song ────────────────────────────────────────────────────────────
router.post("/", upload.single("audioFile"), async (req, res) => {
  try {
    const { title, artistId, albumId, cover, audioUrl, duration } = req.body;

    if (!title || !artistId || !albumId) {
      if (req.file) deleteUploadFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({ error: "title, artistId, albumId are required" });
    }

    const trimmedTitle = String(title).trim();
    if (!trimmedTitle || trimmedTitle.length > 200) {
      if (req.file) deleteUploadFile(`/uploads/${req.file.filename}`);
      return res.status(400).json({ error: "title must be 1–200 characters" });
    }

    let finalAudioUrl = typeof audioUrl === "string" ? audioUrl.trim() : "";
    if (req.file) {
      finalAudioUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    } else if (finalAudioUrl && !isValidExternalAudioUrl(finalAudioUrl)) {
      return res.status(400).json({ error: "audioUrl must be a valid http(s) URL" });
    }

    const parsedDuration = Number(duration);
    const normalizedDuration = Number.isFinite(parsedDuration) && parsedDuration >= 0 ? parsedDuration : 0;

    const song = await Song.create({
      title: trimmedTitle, artistId, albumId,
      cover: cover || "",
      audioUrl: finalAudioUrl,
      duration: normalizedDuration,
      playCount: 0,
    });

    res.status(201).json(song);
  } catch (err) {
    if (req.file) deleteUploadFile(`/uploads/${req.file.filename}`);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE — remove from MongoDB AND from uploads folder ──────────────────────
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid song id" });
    }

    const song = await Song.findByIdAndDelete(req.params.id);
    if (!song) return res.status(404).json({ error: "Song not found" });

    // Always attempt to delete the physical file — logs outcome to terminal
    deleteUploadFile(song.audioUrl);

    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH — increment play count ───────────────────────────────────────────────
router.patch("/:id/play", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Invalid song id" });
    }
    const song = await Song.findByIdAndUpdate(
      req.params.id,
      { $inc: { playCount: 1 } },
      { new: true }
    );
    if (!song) return res.status(404).json({ error: "Song not found" });
    res.json({ success: true, playCount: song.playCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;