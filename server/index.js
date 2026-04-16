// import express from "express";
// import mongoose from "mongoose";
// import cors from "cors";
// import dotenv from "dotenv";
// import path from "path";
// import { fileURLToPath } from "url";
// import songRoutes from "./routes/songs.js";
// import artistRoutes from "./routes/artists.js";
// import albumRoutes from "./routes/albums.js";
// import emailRoutes from "./routes/email.js";

// // dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env") });
// dotenv.config();

// const app = express();
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// const PORT = process.env.PORT || 5000;
// const isProduction = process.env.NODE_ENV === "production";

// const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || "")
//   .split(",")
//   .map((origin) => origin.trim())
//   .filter(Boolean);
// const devOrigins = ["http://localhost:5173", "http://localhost:4173", "http://localhost:3000"];
// const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : (!isProduction ? devOrigins : []);

// const corsOptions = {
//   origin(origin, callback) {
//     if (!origin) return callback(null, true);
//     if (allowedOrigins.includes(origin)) return callback(null, true);
//     return callback(new Error("CORS origin denied"));
//   },
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
// };

// app.disable("x-powered-by");
// app.use((req, res, next) => {
//   res.setHeader("X-Content-Type-Options", "nosniff");
//   res.setHeader("X-Frame-Options", "DENY");
//   res.setHeader("Referrer-Policy", "no-referrer");
//   res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
//   next();
// });
// app.use(cors(corsOptions));
// app.use(express.json({ limit: "1mb" }));
// app.use(express.urlencoded({ extended: true, limit: "1mb" }));
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// app.use("/api/songs", songRoutes);
// app.use("/api/artists", artistRoutes);
// app.use("/api/albums", albumRoutes);
// app.use("/api/email", emailRoutes);

// app.get("/api/health", (req, res) => {
//   res.json({ status: "ok", message: "FlickWave server is running" });
// });

// app.use((req, res) => {
//   res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
// });

// app.use((err, req, res, _next) => {
//   console.error("Server Error:", err.message);
//   const status = Number.isInteger(err.status) ? err.status : 500;
//   const message = status >= 500 && isProduction ? "Internal server error" : (err.message || "Internal server error");
//   res.status(status).json({ error: message });
// });

// const MONGODB_URI = process.env.MONGODB_URI;
// if (!MONGODB_URI) {
//   console.error("MONGODB_URI is missing from .env");
//   process.exit(1);
// }

// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     console.log("MongoDB connected");
//     app.listen(PORT, () => {
//       console.log(`FlickWave server running on port ${PORT}`);
//       console.log("GMAIL_USER:", process.env.GMAIL_USER);
// console.log("GMAIL_PASS exists:", !!process.env.GMAIL_PASS);
//       console.log(`Mailer user configured: ${process.env.GMAIL_USER ? "yes" : "no"}`);
//     });
//   })
//   .catch((err) => {
//     console.error("MongoDB connection failed:", err.message);
//     process.exit(1);
//   });


import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import songRoutes from "./routes/songs.js";
import artistRoutes from "./routes/artists.js";
import albumRoutes from "./routes/albums.js";
import emailRoutes from "./routes/email.js";
import recommendRoutes from "./routes/recommend.js";
import premiumRoutes from "./routes/premium.js";
import generateRoutes from "./routes/generate.js";

// Load env
dotenv.config({ path: ".env" });

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;

/* ---------------- MIDDLEWARE ---------------- */

// CORS (open for dev; tighten later if needed)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------------- ROUTES ---------------- */

app.use("/api/songs", songRoutes);
app.use("/api/artists", artistRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/premium", premiumRoutes);
app.use("/api/generate", generateRoutes);

/* ---------------- HEALTH CHECK ---------------- */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "FlickWave server running ✅",
  });
});

/* ---------------- ERROR HANDLING ---------------- */

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: `Route ${req.method} ${req.url} not found`,
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({
    error: err.message || "Internal server error",
  });
});

/* ---------------- DATABASE ---------------- */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI missing from .env");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 FlickWave server on port ${PORT}`);
      console.log(
        `🎵 Music generation: ${process.env.MUSIC_PROVIDER || "replicate"}`
      );
      console.log(
        `🤖 AI prompts: ${
          process.env.ANTHROPIC_API_KEY ? "Claude" : "fallback (no API key)"
        }`
      );
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB failed:", err.message);
    process.exit(1);
  });