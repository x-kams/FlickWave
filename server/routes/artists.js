import express from "express";
import Artist from "../models/Artist.js";
import Album from "../models/Album.js";
import Song from "../models/Song.js";

const router = express.Router();

// GET all
router.get("/", async (req, res) => {
  try {
    const artists = await Artist.find().sort({ createdAt: -1 });
    res.json(artists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST
router.post("/", async (req, res) => {
  try {
    const { name, image, bio } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Artist name zaroori hai" });
    }
    const artist = await Artist.create({
      name: name.trim(),
      image: image || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300",
      bio: bio || "FlickWave artist",
    });
    res.status(201).json(artist);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — artist ke saath us ke albums aur songs bhi hata do
router.delete("/:id", async (req, res) => {
  try {
    const artist = await Artist.findByIdAndDelete(req.params.id);
    if (!artist) return res.status(404).json({ error: "Artist nahi mila" });
    await Album.deleteMany({ artistId: req.params.id });
    await Song.deleteMany({ artistId: req.params.id });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
