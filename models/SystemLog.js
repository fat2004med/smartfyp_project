import mongoose from "mongoose";

const systemLogSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["Info", "Warning", "Error"],
      default: "Info",
    },
    event: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      required: true,
      default: "System",
    },
    details: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      default: "Internal",
    },
  },
  { timestamps: true }
);

const SystemLog = mongoose.model("SystemLog", systemLogSchema);
export default SystemLog;
