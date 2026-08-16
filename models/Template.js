import mongoose from "mongoose";

const templateSchema = new mongoose.Schema(
  {
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    scope: { type: String, enum: ["College", "Department"], default: "College" },
  },
  { timestamps: true }
);

const Template = mongoose.model("Template", templateSchema);
export default Template;
