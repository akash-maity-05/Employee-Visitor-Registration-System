import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      match: /^V-\d{4,}$/,
    },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    mobile: { type: String, required: true, trim: true, maxlength: 200 },
    company: { type: String, required: true, trim: true, maxlength: 200 },
    person: { type: String, required: true, trim: true, maxlength: 200 },
    purpose: { type: String, required: true, trim: true, maxlength: 200 },
    date: { type: Date, required: true, default: Date.now, immutable: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_document, record) {
        delete record._id;
        delete record.createdAt;
        delete record.updatedAt;
        return record;
      },
    },
  },
);

visitorSchema.index({ date: -1 });

export default mongoose.model("Visitor", visitorSchema);
