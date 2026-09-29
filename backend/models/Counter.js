import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    sequence: { type: Number, default: 999 },
  },
  { versionKey: false },
);

export default mongoose.model("Counter", counterSchema);
