import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "frontdesk-profile" },
    name: { type: String, default: "", trim: true, maxlength: 200 },
    role: { type: String, default: "Receptionist", trim: true, maxlength: 200 },
  },
  { timestamps: true, versionKey: false },
);

profileSchema.set("toJSON", {
  transform(_document, profile) {
    delete profile._id;
    delete profile.createdAt;
    delete profile.updatedAt;
    return profile;
  },
});

export default mongoose.model("Profile", profileSchema);
