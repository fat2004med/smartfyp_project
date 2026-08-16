import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectDB, { getDBStatus } from "../config/db.js";
import errorHandler from "../middleware/errorHandler.js";

// Route imports
import authRoutes from "../routes/authRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import departmentRoutes from "../routes/departmentRoutes.js";
import projectRoutes from "../routes/projectRoutes.js";
import submissionRoutes from "../routes/submissionRoutes.js";
import taskRoutes from "../routes/taskRoutes.js";
import announcementRoutes from "../routes/announcementRoutes.js";
import templateRoutes from "../routes/templateRoutes.js";
import dashboardRoutes from "../routes/dashboardRoutes.js";
import assignmentRoutes from "../routes/assignmentRoutes.js";
import notificationRoutes from "../routes/notificationRoutes.js";
import plagiarismRoutes from "../routes/plagiarismRoutes.js";
import recommender from "../utils/recommender.js";

import Project from "../models/Project.js";
import User from "../models/User.js";
import Department from "../models/Department.js";

dotenv.config();

// Train the recommender if not trained
try {
  if (!recommender.isTrained) {
    recommender.train();
  }
} catch (e) {
  console.warn("Recommender training warning:", e.message);
}

const app = express();

app.set("trust proxy", true);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serverless DB Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection attempt error in serverless function:", err.message);
  }
  next();
});

// Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/plagiarism", plagiarismRoutes);

// Register public contact forms
app.post("/api/contact", async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "Please provide name, email, subject and message content." });
    }

    try {
      const ContactMessage = (await import("../models/ContactMessage.js")).default;
      await ContactMessage.create({ name, email, subject, message });
    } catch (err) {
      console.error("Database error saving contact message:", err.message);
    }

    try {
      const SystemLog = (await import("../models/SystemLog.js")).default;
      await SystemLog.create({
        level: "Info",
        event: "Contact Form Submitted",
        user: email || "Guest",
        details: `Topic: ${subject} | Submitter: ${name} (${email}) | Content: "${message.substring(0, 70)}..."`,
        ip: req.ip || "Internal"
      });
    } catch (err) {
      console.error("System logging error for contact message:", err.message);
    }

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully. Our team will review and reply within 24 hours!"
    });
  } catch (error) {
    next(error);
  }
});

// Project Recommendation Engine API
app.post("/api/recommendations", async (req, res, next) => {
  try {
    const { query, domain, techStack, limit } = req.body;
    
    if (!recommender.isTrained) {
      const trained = recommender.train();
      if (!trained) {
        return res.status(500).json({
          success: false,
          message: "Recommender system model is not yet trained or loaded."
        });
      }
    }

    const results = recommender.getRecommendations(
      query || "",
      domain || "",
      techStack || "",
      limit || 6
    );

    return res.status(200).json({
      success: true,
      data: results.recommendations,
      inferenceTimeMs: results.inferenceTimeMs,
      metrics: results.metrics
    });
  } catch (error) {
    next(error);
  }
});

// Health check route
app.get("/api/health", async (req, res) => {
  let counts = { projects: 0, users: 0, depts: 0 };
  if (getDBStatus()) {
    try {
      counts.projects = await Project.countDocuments();
      counts.users = await User.countDocuments();
      counts.depts = await Department.countDocuments();
    } catch (e) {
      console.error("Health check count failed:", e.message);
    }
  }
  res.json({ 
    status: "ok", 
    database: getDBStatus() ? "connected" : "disconnected",
    serverless: true,
    counts
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
