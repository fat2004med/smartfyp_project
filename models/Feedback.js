import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    submission: { type: mongoose.Schema.Types.ObjectId, ref: "Submission", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    category: { type: String, enum: ["General", "Documentation", "Code", "Presentation"], default: "General" },
    rating: { type: Number, min: 1, max: 5 },
    role: { type: String, required: true }, // Role of the person giving feedback
    status: { type: String, enum: ["New", "Read"], default: "New" },
  },
  { timestamps: true }
);

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
