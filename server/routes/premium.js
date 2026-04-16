import express from "express";

const router = express.Router();

// dummy premium route
router.get("/", (req, res) => {
  res.json({
    message: "Premium route working 🚀",
  });
});

export default router;