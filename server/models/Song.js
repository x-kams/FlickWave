import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    artistId:  { type: String, required: true },
    albumId:   { type: String, required: true },
    duration:  { type: Number, default: 0 },
    playCount: { type: Number, default: 0 },
    cover:     { type: String, default: "" },
    audioUrl:  { type: String, default: "" },
  },
  { timestamps: true }
);

// toJSON mein _id ko id ke tor par bhi bhejo
songSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Song", songSchema);
