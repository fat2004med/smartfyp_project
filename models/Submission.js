import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    fileUrl: { type: String },
    links: [String],
    phase: { type: String, required: true }, // e.g., Proposal, SRS, Design, Final
    startDate: { type: Date },
    endDate: { type: Date },
    templateUrl: { type: String },
    status: {
      type: String,
      enum: ["Not Submitted", "Pending TL", "Pending Supervisor", "Pending HOD", "Pending Admin", "Approved", "Rejected"],
      default: "Not Submitted",
    },
    semester: { type: Number, default: 7 },
    isFinalDocumentation: { type: Boolean, default: false },
    history: [
      {
        fileUrl: String,
        links: [String],
        submittedAt: { type: Date, default: Date.now },
        version: Number,
        comment: String,
        feedbacks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Feedback" }],
        approvals: [
          {
            role: String,
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            status: String,
            timestamp: { type: Date, default: Date.now },
          },
        ],
      }
    ],
    feedbacks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Feedback" }],
    grade: { type: String }, // e.g., A, B+, C
    score: { type: Number }, // e.g., 85
    plagiarismScore: { type: Number },
    plagiarismStatus: { type: String, enum: ["Safe", "Needs Review", "High Risk", "Not Checked"], default: "Not Checked" },
    plagiarismReport: {
      scanTimestamp: Date,
      matchedSources: [
        {
          sourceTitle: String,
          sourceType: String,
          similarity: Number,
          matchedSnippet: String,
          originalSnippet: String,
        }
      ],
      aiProbability: Number,
      summary: String,
      scannedTextPreview: String
    },
    approvals: [
      {
        role: String,
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Submission = mongoose.model("Submission", submissionSchema);
export default Submission;
