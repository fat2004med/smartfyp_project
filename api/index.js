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

// Try to initialize recommender safely without throwing on read-only environments
try {
  if (recommender && !recommender.isTrained) {
    recommender.train();
  }
} catch (e) {
  console.warn("Recommender training note:", e.message);
}

const app = express();

app.set("trust proxy", 1);

// CORS for Vercel Serverless
app.use(
  cors({
    origin: true, // Echo origin to allow credentials
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Selected-Role", "X-Requested-With", "Accept"],
  })
);

app.options("*", cors());

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Serverless Database Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection warning in request:", err.message);
  }
  next();
});

// Diagnostic / Debug Endpoints (handles both /api/test and /test in case Vercel rewrites strip prefix)
const handleTest = async (req, res) => {
  const dbConnected = getDBStatus();
  res.status(200).json({
    success: true,
    message: "Backend API is online and communicating successfully!",
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || "production",
      hasMongoUri: Boolean(process.env.MONGODB_URI || process.env.MONGO_URI),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      hasViteApiUrl: Boolean(process.env.VITE_API_URL),
    },
    database: {
      connected: dbConnected,
      status: dbConnected ? "Connected to MongoDB Atlas" : "Disconnected / Checking credentials",
    },
  });
};

app.get("/api/test", handleTest);
app.get("/test", handleTest);

// Health Check Endpoints
const handleHealth = async (req, res) => {
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
};

app.get("/api/health", handleHealth);
app.get("/health", handleHealth);

// Contact Message Handler
const handleContact = async (req, res, next) => {
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
};

app.post("/api/contact", handleContact);
app.post("/contact", handleContact);

// Recommendations Handler
const handleRecommendations = async (req, res, next) => {
  try {
    const { query, domain, techStack, limit } = req.body;

    if (!recommender.isTrained) {
      recommender.train();
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
};

app.post("/api/recommendations", handleRecommendations);
app.post("/recommendations", handleRecommendations);

// Register Main API Routes (both with /api prefix and without /api prefix for maximum compatibility)
const routeModules = [
  { path: "auth", router: authRoutes },
  { path: "users", router: userRoutes },
  { path: "departments", router: departmentRoutes },
  { path: "projects", router: projectRoutes },
  { path: "submissions", router: submissionRoutes },
  { path: "tasks", router: taskRoutes },
  { path: "announcements", router: announcementRoutes },
  { path: "templates", router: templateRoutes },
  { path: "dashboard", router: dashboardRoutes },
  { path: "assignments", router: assignmentRoutes },
  { path: "notifications", router: notificationRoutes },
  { path: "plagiarism", router: plagiarismRoutes },
];

routeModules.forEach(({ path, router }) => {
  app.use(`/api/${path}`, router);
  app.use(`/${path}`, router);
});

// Global Error Handler
app.use(errorHandler);

export default app;
