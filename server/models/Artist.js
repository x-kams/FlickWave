import mongoose from "mongoose";

const artistSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    bio:   { type: String, default: "" },
  },
  { timestamps: true }
);

artistSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("Artist", artistSchema);
