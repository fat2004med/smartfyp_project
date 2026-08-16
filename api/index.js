import express from "express";
import cors from "cors";
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

// Validate Environment Variables on Startup
function validateEnv() {
  const missing = [];
  if (!process.env.MONGODB_URI && !process.env.MONGO_URI) missing.push("MONGODB_URI (or MONGO_URI)");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");

  if (missing.length > 0) {
    console.warn(
      `\x1b[33m⚠️ WARNING: Missing recommended environment variables on Vercel: ${missing.join(", ")}\x1b[0m`
    );
  } else {
    console.log("✅ Environment variable validation passed.");
  }
}
validateEnv();

// Initialize recommender system safely
try {
  if (!recommender.isTrained) {
    recommender.train();
  }
} catch (e) {
  console.warn("Recommender training warning:", e.message);
}

const app = express();

// Trust proxy for Vercel edge/serverless routing
app.set("trust proxy", 1);

// Robust CORS configuration for Vercel
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.VITE_API_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server) or Vercel preview URLs
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive fallback for standard SPA requests
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Selected-Role", "X-Requested-With", "Accept"],
  })
);

// Handle preflight across all routes
app.options("*", cors());

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Serverless DB Connection Middleware (connects on-demand per request)
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection error in serverless request:", err.message);
  }
  next();
});

// Diagnostic / Debug Endpoint: /api/test
app.get("/api/test", async (req, res) => {
  const dbConnected = getDBStatus();
  res.status(200).json({
    success: true,
    message: "Backend API is online and communicating successfully with Vercel serverless function!",
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || "development",
      hasMongoUri: Boolean(process.env.MONGODB_URI || process.env.MONGO_URI),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      hasViteApiUrl: Boolean(process.env.VITE_API_URL),
    },
    database: {
      connected: dbConnected,
      status: dbConnected ? "Connected to MongoDB Atlas" : "Disconnected / Checking credentials",
    },
  });
});

// System Health Endpoint: /api/health
app.get("/api/health", async (req, res) => {
  const isDbReady = getDBStatus();
  let counts = { projects: 0, users: 0, departments: 0 };
  let dbError = null;

  if (isDbReady) {
    try {
      counts.projects = await Project.countDocuments();
      counts.users = await User.countDocuments();
      counts.departments = await Department.countDocuments();
    } catch (e) {
      dbError = e.message;
    }
  }

  res.status(isDbReady ? 200 : 503).json({
    status: isDbReady ? "healthy" : "degraded",
    database: isDbReady ? "connected" : "disconnected",
    dbError,
    serverless: true,
    platform: "Vercel Serverless Functions",
    timestamp: new Date().toISOString(),
    counts,
  });
});

// Register API Routes
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

// Register Public Contact Form Endpoint
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
        ip: req.ip || "Internal",
      });
    } catch (err) {
      console.error("System logging error for contact message:", err.message);
    }

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully. Our team will review and reply within 24 hours!",
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
          message: "Recommender system model is not yet trained or loaded.",
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
      metrics: results.metrics,
    });
  } catch (error) {
    next(error);
  }
});

// Global Error Handler Middleware
app.use(errorHandler);

export default app;
