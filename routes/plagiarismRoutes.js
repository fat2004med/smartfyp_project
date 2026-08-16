import express from "express";
import { scanAdhocPlagiarism, scanFilePlagiarism } from "../utils/plagiarismChecker.js";
import { protect } from "../middleware/auth.js";
import SystemLog from "../models/SystemLog.js";
import upload from "../middleware/upload.js";

const router = express.Router();

// File Upload scan
router.post("/upload-scan", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No document file was uploaded." });
    }
    
    const { mode, target } = req.body;
    const report = await scanFilePlagiarism(
      req.file.path,
      req.file.mimetype,
      req.file.originalname,
      mode || "Text",
      target || "Web Search Comparison"
    );

    // Audit logs entry for intelligence tracking
    try {
      await SystemLog.create({
        level: "Info",
        event: "Document Plagiarism Scanner File Upload",
        user: req.user?.email || "Unknown User",
        details: `File: ${req.file.originalname} | Mime: ${req.file.mimetype} | Score: ${report.plagiarismScore}% | AI Probability: ${report.aiProbability}%`,
        ip: req.ip || "Internal"
      });
    } catch (logErr) {
      console.error("Logging upload scan event failed:", logErr);
    }

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error("Upload scan error:", error);
    return res.status(500).json({ message: error.message || "File plagiarism assessment failed." });
  }
});

// Ad-hoc playground / paste-checker scan
router.post("/adhoc-scan", protect, async (req, res) => {
  try {
    const { text, mode, target } = req.body;
    
    if (!text || text.trim().length < 10) {
      return res.status(400).json({ message: "Content too short to analyze. Please provide at least 10 characters." });
    }

    const report = await scanAdhocPlagiarism(text, mode, target);

    // Audit logs entry for intelligence tracking
    try {
      await SystemLog.create({
        level: "Info",
        event: "Adhoc Plagiarism Check Run",
        user: req.user?.email || "Unknown User",
        details: `Mode: ${mode || "Text"} | Target: ${target || "Standard"} | Score: ${report.plagiarismScore}% | AI Probability: ${report.aiProbability}%`,
        ip: req.ip || "Internal"
      });
    } catch (logErr) {
      console.error("Logging adhoc scan event failed:", logErr);
    }

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error("Adhoc check error response:", error);
    return res.status(500).json({ message: error.message || "Plagiarism analysis failed. Check prompt formatting." });
  }
});

export default router;
