import mongoose from "mongoose";

const albumSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true, trim: true },
    artistId: { type: String, required: true },
    cover:    { type: String, default: "" },
    year:     { type: Number, default: new Date().getFullYear() },
  },
  { timestamps: true }
);

albumSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Album", albumSchema);
