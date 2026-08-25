import mongoose from "mongoose";

const plagiarismSourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    embedding: {
      type: [Number],
      required: true,
      validate: [
        (arr) => Array.isArray(arr) && arr.length > 0,
        "Embedding must be a non-empty array of floats",
      ],
    },
    dimension: { type: Number, default: 384 },
    fileUrl: { type: String },
    docType: { type: String, default: "FYP Final Documentation" },
    author: { type: String },
    year: { type: Number, default: () => new Date().getFullYear() },
  },
  { timestamps: true }
);

// Index for fast search and listing
plagiarismSourceSchema.index({ createdAt: -1 });

const PlagiarismSource = mongoose.model("PlagiarismSource", plagiarismSourceSchema);
export default PlagiarismSource;
