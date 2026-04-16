import express from "express";
import Album from "../models/Album.js";
import Song from "../models/Song.js";

const router = express.Router();

// GET all
router.get("/", async (req, res) => {
  try {
    const albums = await Album.find().sort({ createdAt: -1 });
    res.json(albums);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST
router.post("/", async (req, res) => {
  try {
    const { title, artistId, cover, year } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: "Album title zaroori hai" });
    if (!artistId) return res.status(400).json({ error: "artistId zaroori hai" });

    const album = await Album.create({
      title: title.trim(),
      artistId,
      cover: cover || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300",
      year: Number(year) || new Date().getFullYear(),
    });
    res.status(201).json(album);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — album ke saath us ke songs bhi hata do
router.delete("/:id", async (req, res) => {
  try {
    const album = await Album.findByIdAndDelete(req.params.id);
    if (!album) return res.status(404).json({ error: "Album nahi mila" });
    await Song.deleteMany({ albumId: req.params.id });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
