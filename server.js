// Add this at the very top of server.js
console.log('🚀 Server starting...');
console.log('📝 NODE_ENV:', process.env.NODE_ENV);
console.log('📝 MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');

// Check if running on Vercel
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
console.log('🏗️  Running on Vercel:', isVercel);
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import connectDB, { getDBStatus } from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";

// Route imports
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import assignmentRoutes from "./routes/assignmentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import plagiarismRoutes from "./routes/plagiarismRoutes.js";
import recommender from "./utils/recommender.js";

dotenv.config();

// Pre-train the ML recommender model using the raw fyp_projects.csv dataset
recommender.train();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import User from "./models/User.js";
import Department from "./models/Department.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";
import Submission from "./models/Submission.js";
import Announcement from "./models/Announcement.js";
import Assignment from "./models/Assignment.js";
import Feedback from "./models/Feedback.js";
import Template from "./models/Template.js";
import SystemLog from "./models/SystemLog.js";

async function seedData() {
  try {
    const existingUsersCount = await User.countDocuments({});
    if (existingUsersCount === 0) {
      const adminPassword = "adminp@ssword123";
      await User.create({
        name: "Global Admin",
        email: "fat2004med@gmail.com",
        password: adminPassword,
        role: "Admin",
        isFirstLogin: false,
        isActive: true
      });
      console.log("✅ Initial Admin account initialized.");
    }
  } catch (error) {
    console.error("Initialization error:", error);
  }
}

const app = express();
const PORT = 3000;

// Trust proxy for secure headers behind Cloud Run / reverse proxy
app.set("trust proxy", true);

// Basic middleware
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Serve uploads folder statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Register API routes early so server is responsive immediately
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

    // 1. Create database record
    try {
      const ContactMessage = (await import("./models/ContactMessage.js")).default;
      await ContactMessage.create({
        name,
        email,
        subject,
        message
      });
      console.log(`[Contact] Saved new message from ${email}`);
    } catch (err) {
      console.error("Database error saving contact message:", err.message);
    }

    // 2. Log event in audit logs with Client IP
    try {
      const SystemLog = (await import("./models/SystemLog.js")).default;
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

    // 3. Notify administrator accounts
    try {
      const User = (await import("./models/User.js")).default;
      const Notification = (await import("./models/Notification.js")).default;
      const adminAccounts = await User.find({ role: "Admin" });
      if (adminAccounts && adminAccounts.length > 0) {
        for (const admin of adminAccounts) {
          await Notification.create({
            recipient: admin._id,
            title: `New Support Inquiry: ${subject}`,
            message: `${name} has submitted a support question: "${message.substring(0, 100)}..."`,
            type: "General"
          });
        }
      }
    } catch (err) {
      console.error("Admin notification error for contact message:", err.message);
    }

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully. Our team will review and reply within 24 hours!"
    });
  } catch (error) {
    next(error);
  }
});

// Project Recommendation Engine API (Off-line ML TF-IDF Cosine Similarity)
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

// Diagnostic / Debug Endpoint: /api/test
app.get("/api/test", async (req, res) => {
  const dbConnected = getDBStatus();
  res.status(200).json({
    success: true,
    message: "Backend API is online and communicating successfully!",
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

// Health check route - MUST be accessible immediately
app.get("/api/health", async (req, res) => {
  let counts = { projects: 0, users: 0, depts: 0 };
  if (getDBStatus()) {
    try {
      counts.projects = await Project.countDocuments();
      counts.users = await User.countDocuments();
      counts.depts = await Department.countDocuments();
    } catch (e) {
      console.error("Health check project count failed:", e.message);
    }
  }
  res.json({ 
    status: "ok", 
    database: getDBStatus() ? "connected" : "disconnected",
    initializing: !getDBStatus(),
    counts
  });
});

async function startServer() {
  // ✅ Connect to database in ALL environments
  console.log("🔄 Connecting to database...");
  try {
    await connectDB();
    if (getDBStatus()) {
      console.log("✅ Database connected successfully!");
      await seedData();
    } else {
      console.log("⚠️ Database connection failed or not ready");
    }
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }

  if (process.env.NODE_ENV !== "production") {
    console.log("🔄 Initializing Vite dev server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(__dirname, "."),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    console.log(`📁 Serving static from: ${distPath}`);
    
    if (!fs.existsSync(distPath)) {
      console.error("❌ dist folder not found! Run 'npm run build' first.");
      
      app.get("*", (req, res) => {
        if (req.path.startsWith('/api')) return;
        res.status(200).send(`
          <html>
            <head><title>SmartFYP</title></head>
            <body>
              <h1>🚀 SmartFYP Application</h1>
              <p>Build not found. Please rebuild the application.</p>
              <p>API is available at <a href="/api/health">/api/health</a></p>
            </body>
          </html>
        `);
      });
    } else {
      app.use(express.static(distPath, {
        maxAge: '1d',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          }
          if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        }
      }));

      app.get("*", (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.use(errorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📝 Database status: ${getDBStatus() ? '✅ Connected' : '❌ Not connected'}`);
    console.log(`📝 API URL: http://localhost:${PORT}/api/health`);
  });
}

// Start the server instance
startServer();

// Export app for serverless / testing
export default app;
