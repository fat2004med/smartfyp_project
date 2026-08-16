import mongoose from "mongoose";

const projectGroupSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    teamLeader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    teamName: { type: String },
    technologies: [{ type: String }],
    year: { type: Number, default: () => new Date().getFullYear() },
    status: {
      type: String,
      enum: ["Proposed", "Active", "Approved", "Completed", "Rejected"],
      default: "Proposed",
    },
    outcomes: { type: String },
    abstract: { type: String },
    isApprovedByAdmin: { type: Boolean, default: false },
    feedback: [{
        author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        content: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

const ProjectGroup = mongoose.model("ProjectGroup", projectGroupSchema);
export default ProjectGroup;
