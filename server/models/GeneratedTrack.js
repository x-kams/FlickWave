import mongoose from "mongoose";

const generatedTrackSchema = new mongoose.Schema(
  {
    userEmail:   { type: String, required: true, index: true },
    prompt: {
      description: { type: String, default: "" },
      bpm:         { type: String, default: "" },
      structure:   { type: String, default: "" },
      instruments: { type: String, default: "" },
      style_tags:  [{ type: String }],
    },
    answers: {
      mood:        { type: String, default: "" },
      genre:       { type: String, default: "" },
      tempo:       { type: String, default: "" },
      instruments: { type: String, default: "" },
      useCase:     { type: String, default: "" },
      vocals:      { type: String, default: "no" },
      duration:    { type: Number, default: 5 },
    },
    audioUrl:    { type: String, default: "" },
    status:      { type: String, enum: ["pending", "processing", "done", "failed"], default: "pending" },
    errorMsg:    { type: String, default: "" },
    plan:        { type: String, enum: ["free", "basic", "premium"], default: "free" },
    durationSec: { type: Number, default: 5 },
    quality:     { type: String, enum: ["low", "standard", "high"], default: "low" },
  },
  { timestamps: true }
);

generatedTrackSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("GeneratedTrack", generatedTrackSchema);