import express from "express";
import fs from "fs";
import path from "path";
import axios from "axios";
import { protect } from "../middleware/auth.js";
import upload from "../middleware/upload.js";
import SystemLog from "../models/SystemLog.js";
import PlagiarismSource from "../models/PlagiarismSource.js";
import plagiarismEngine from "../utils/plagiarismEngine.js";
import { extractTextFromFile, estimateAiProbability } from "../utils/plagiarismChecker.js";

const router = express.Router();

const PYTHON_ML_URL = process.env.PYTHON_ML_URL || "http://127.0.0.1:5000";

// Ensure internal engine is loaded on startup
plagiarismEngine.init().catch(err => console.warn("Engine startup init:", err.message));

/**
 * 1. POST /api/plagiarism/upload-scan (and /upload)
 * Accepts file (PDF, DOCX, TXT) and threshold (default 0.40)
 */
router.post(["/upload-scan", "/upload"], protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No document file was uploaded." });
    }

    const rawThreshold = req.body.threshold || req.query.threshold;
    const threshold = rawThreshold !== undefined && rawThreshold !== "" ? parseFloat(rawThreshold) : 0.40;

    let responseData = null;

    // Check if external Python Flask ML service is reachable
    let pythonServiceAvailable = false;
    try {
      const FormData = (await import("undici")).FormData;
      const fileBuffer = fs.readFileSync(req.file.path);
      const formData = new FormData();
      const blob = new Blob([fileBuffer]);
      formData.append("file", blob, req.file.originalname);
      formData.append("threshold", String(threshold));

      const pyRes = await fetch(`${PYTHON_ML_URL}/upload`, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json"
        },
        signal: AbortSignal.timeout(1200)
      });

      if (pyRes.ok) {
        const pyData = await pyRes.json();
        responseData = pyData;
        pythonServiceAvailable = true;

        if (!responseData.summary) {
          const topMatch = responseData.breakdown && responseData.breakdown.length > 0 ? responseData.breakdown[0] : null;
          if (responseData.is_plagiarized) {
            responseData.summary = `Fine-Tuned Model Screening: Critical semantic similarity detected! Overlap score is ${(responseData.overall_score * 100).toFixed(1)}%, exceeding threshold ${(responseData.threshold * 100).toFixed(0)}%. ${topMatch ? `Strongest vector correlation observed with "${topMatch.title}" (${(topMatch.similarity * 100).toFixed(1)}%).` : ""}`;
          } else {
            responseData.summary = `Fine-Tuned Model Screening: Document originality verified. Overall semantic similarity index is ${(responseData.overall_score * 100).toFixed(1)}%, within permissible academic limits.`;
          }
        }
      }
    } catch (pyErr) {
      // Python microservice not running on localhost:5000 -> use high-precision built-in embedding engine
      pythonServiceAvailable = false;
    }

    if (!responseData) {
      // Extract text locally from PDF/DOCX/TXT
      const text = await extractTextFromFile(req.file.path, req.file.mimetype, req.file.originalname);
      if (!text || text.trim().length < 15) {
        return res.status(400).json({
          success: false,
          error: "Could not extract sufficient text from the uploaded document."
        });
      }

      // Ensure engine has loaded latest final documentations
      await plagiarismEngine.init();

      // Evaluate against all stored sources with multi-factor academic similarity
      const evaluation = plagiarismEngine.evaluate(text, threshold);

      const aiProb = estimateAiProbability(text);

      let summary = `Academic integrity screening complete. Evaluated similarity against ${evaluation.total_sources_evaluated} indexed peer documents.`;
      if (evaluation.is_plagiarized) {
        summary = `⚠️ Critical overlap detected! Overall similarity index is ${(evaluation.overall_score * 100).toFixed(1)}%, exceeding the permissible threshold of ${(threshold * 100).toFixed(0)}%.`;
      } else {
        summary = `✅ Document is within acceptable academic thresholds with an overall match score of ${(evaluation.overall_score * 100).toFixed(1)}%.`;
      }

      responseData = {
        overall_score: evaluation.overall_score,
        overall_percentage: evaluation.overall_percentage,
        is_plagiarized: evaluation.is_plagiarized,
        threshold: evaluation.threshold,
        threshold_percentage: evaluation.threshold_percentage,
        breakdown: evaluation.breakdown,
        total_sources_evaluated: evaluation.total_sources_evaluated,
        filename: req.file.originalname,
        aiProbability: aiProb,
        summary
      };
    }

    // System audit log
    try {
      await SystemLog.create({
        level: "Info",
        event: "Document Plagiarism Scan",
        user: req.user?.email || "User",
        details: `File: ${req.file.originalname} | Overall Score: ${(responseData.overall_score * 100).toFixed(1)}% | Is Plagiarized: ${responseData.is_plagiarized}`,
        ip: req.ip || "Internal"
      });
    } catch (logErr) {
      // Ignore logging failure
    }

    return res.status(200).json({
      success: true,
      data: responseData,
      overall_score: responseData.overall_score,
      is_plagiarized: responseData.is_plagiarized,
      threshold: responseData.threshold,
      breakdown: responseData.breakdown
    });
  } catch (error) {
    console.error("Plagiarism upload error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze document plagiarism."
    });
  }
});

/**
 * 2. POST /api/plagiarism/add-source
 * Adds a new source document into the database and updates in-memory embedding cache
 */
router.post("/add-source", protect, async (req, res) => {
  try {
    const { title, content, author } = req.body;
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "Both 'title' and 'content' are required to index a source document."
      });
    }

    // Also forward to Python service if online
    try {
      await axios.post(`${PYTHON_ML_URL}/add-source`, { title, content }, { timeout: 2000 });
    } catch (e) {
      // Python offline, handled by local engine
    }

    const result = await plagiarismEngine.addSource(title, content, author || req.user?.name || "System");

    return res.status(201).json({
      success: true,
      message: `Source document '${title}' indexed into plagiarism repository.`,
      data: result
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. GET /api/plagiarism/sources
 * List all source document titles in database
 */
router.get("/sources", protect, async (req, res) => {
  try {
    await plagiarismEngine.init();
    const activeSources = plagiarismEngine.sources || [];
    return res.status(200).json({
      success: true,
      count: activeSources.length,
      sources: activeSources.map(s => ({
        id: s._id,
        title: s.title,
        author: s.author || "Final Documentation",
        year: s.year || new Date().getFullYear()
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. DELETE /api/plagiarism/source/:id
 * Delete a specific indexed source document
 */
router.delete("/source/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    await PlagiarismSource.findByIdAndDelete(id);
    await plagiarismEngine.init();
    return res.status(200).json({
      success: true,
      message: "Source document removed successfully."
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5. POST /api/plagiarism/clear-all
 * Clean all seeded/demo source documents
 */
router.post("/clear-all", protect, async (req, res) => {
  try {
    await PlagiarismSource.deleteMany({});
    await plagiarismEngine.init();
    return res.status(200).json({
      success: true,
      message: "All indexed plagiarism sources cleared."
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5b. POST /api/plagiarism/sync-repository
 * Automatically index all FYP projects and archive documents into repository
 */
router.post("/sync-repository", protect, async (req, res) => {
  try {
    await plagiarismEngine.syncRepositorySources(true);
    const activeSources = plagiarismEngine.sources || [];
    return res.status(200).json({
      success: true,
      message: `Successfully indexed ${activeSources.length} final documentation source documents from admin project records.`,
      count: activeSources.length,
      sources: activeSources.map(s => ({
        id: s._id,
        title: s.title,
        author: s.author || "Final Documentation",
        year: s.year || new Date().getFullYear(),
        docType: s.docType || "FYP Final Documentation"
      }))
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 6. POST /api/plagiarism/check-text
 * Raw text scanner
 */
router.post("/check-text", protect, async (req, res) => {
  try {
    const { text, content, threshold = 0.40 } = req.body;
    const targetText = text || content;

    if (!targetText || targetText.trim().length < 10) {
      return res.status(400).json({ success: false, error: "Content must have at least 10 characters." });
    }

    await plagiarismEngine.init();
    const evaluation = plagiarismEngine.evaluate(targetText, parseFloat(threshold));
    return res.status(200).json({
      success: true,
      data: evaluation,
      overall_score: evaluation.overall_score,
      is_plagiarized: evaluation.is_plagiarized,
      threshold: evaluation.threshold,
      breakdown: evaluation.breakdown
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
