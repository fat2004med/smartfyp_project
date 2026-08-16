import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    deadline: { type: Date },
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    status: {
      type: String,
      enum: ["Not Started", "Pending", "In Progress", "Reviewing", "Completed", "Blocked"],
      default: "Not Started",
    },
    submission: {
      link: { type: String },
      fileUrl: { type: String },
      comments: { type: String },
      submittedAt: { type: Date },
      grade: { type: String },
      feedback: { type: String }
    }
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;
