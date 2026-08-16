import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorRole: { type: String },
    publisherRole: { type: String },
    createdAsRole: { type: String },
    targetRoles: [{ type: String, enum: ["Admin", "HOD", "Supervisor", "Team Leader", "Team Member"] }],
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    title: { type: String, required: true },
    description: { type: String, required: true },
    attachmentUrl: { type: String },
    fileType: { type: String },
    category: { type: String, enum: ["General", "Academic", "Event", "Urgent"], default: "General" },
    priority: { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    expiryDate: { type: Date },
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;
