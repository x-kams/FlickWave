import express from "express";

const router = express.Router();

// dummy endpoint
router.get("/", (req, res) => {
  res.json({
    message: "Recommend route working 🎵",
  });
});

export default router;