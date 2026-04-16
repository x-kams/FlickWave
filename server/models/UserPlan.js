import mongoose from "mongoose";

const userPlanSchema = new mongoose.Schema(
  {
    email:               { type: String, required: true, unique: true, lowercase: true },
    plan:                { type: String, enum: ["free", "basic", "premium"], default: "free" },
    generationsUsed:     { type: Number, default: 0 },
    generationsResetAt:  { type: Date,   default: () => startOfMonth() },
    downloadsToday:      { type: Number, default: 0 },
    lastDownloadDate:    { type: Date,   default: null },
  },
  { timestamps: true }
);

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Plan limits
export const PLAN_LIMITS = {
  free: {
    generations: 3,
    maxDuration: 5,
    download: false,
    quality: "low",
    label: "Free",
  },
  basic: {
    generations: 20,
    maxDuration: 30,
    download: true,
    quality: "standard",
    label: "Basic",
  },
  premium: {
    generations: 200,
    maxDuration: 60,
    download: true,
    quality: "high",
    label: "Premium",
  },
};

export default mongoose.model("UserPlan", userPlanSchema);