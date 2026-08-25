import { GoogleGenAI } from "@google/genai";
import Submission from "../models/Submission.js";
import plagiarismEngine from "./plagiarismEngine.js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// Global memory cache to prevent re-extracting text from unchanged uploaded files
const textCache = new Map();

// Standard initialization with telemetry user-agent as per gemini-api guidelines
let ai = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
        timeout: 15000,
      },
    });
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI:", err);
  }
}

// Built-in academic dataset to act as a baseline/fallback standard
const OPEN_SOURCE_ACADEMIC_DATASET = [
  {
    title: "Design and Implementation of Agile Task Management Systems for College Portals",
    type: "Institutional Thesis",
    abstract: "This project outlines a collaborative sprint planner, task logs tracking metrics, automated visual gantt boards, and role delegation schemas optimized for undergraduate final year projects.",
    text: "This project outlines a collaborative sprint planner, task logs tracking metrics, automated visual gantt boards, and role delegation schemas optimized for undergraduate final year projects. College portals and department web applications can utilize these robust design patterns."
  },
  {
    title: "Distributed Real-time Document Similarity Analytics across Heterogeneous Repositories",
    type: "Academic Journal",
    abstract: "Focuses on building high-performance text-tokenizers using sliding-window hash algorithms (Winnowing) to evaluate academic documentation manuscripts and detect logical overlaps natively.",
    text: "Focuses on building high-performance text-tokenizers using sliding-window hash algorithms (Winnowing) to evaluate academic documentation manuscripts and detect logical overlaps natively. Distributed real-time document similarity analytics evaluate academic documents."
  },
  {
    title: "Secure Enterprise Web Portals with Multi-role RBAC Access Controls",
    type: "GitHub Repository",
    abstract: "Open-source codebase for Express routers and MongoDB databases utilizing JSON Web Token validation headers and granular role-based permissions models to guard system logs.",
    text: "Open-source codebase for Express routers and MongoDB databases utilizing JSON Web Token validation headers and granular role-based permissions models to guard system logs. Secure enterprise web portals with multi-role RBAC access control structures."
  },
  {
    title: "Interactive AI Classroom Assistant and LLM Generative Code Auditor",
    type: "Academic Journal",
    abstract: "Analyzing syntactic structures and predictability markers in student thesis manuscripts to calculate probability signatures of generative models and automated code writing assistants.",
    text: "Analyzing syntactic structures and predictability markers in student thesis manuscripts to calculate probability signatures of generative models and automated code writing assistants. Probability signatures of generative models, automated code writing assistants, and student thesis are audited."
  }
];

/**
 * Robust extraction of plain text from docx, pdf, or text files
 */
export async function extractTextFromFile(filePath, mimeType, filename) {
  try {
    const isPdf = mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf");
    const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || filename.toLowerCase().endsWith(".docx") || filename.toLowerCase().endsWith(".doc");

    if (isDocx) {
      try {
        const mammoth = await import("mammoth");
        const extraction = await mammoth.default.extractRawText({ path: filePath });
        if (extraction.value && extraction.value.trim().length > 0) {
          return extraction.value;
        }
      } catch (docErr) {
        // Fallback to text reading if docx is unzipped or mock text
      }
      return fs.readFileSync(filePath, "utf-8");
    } else if (isPdf) {
      const fileBuffer = fs.readFileSync(filePath);
      const pdfModule = await import("pdf-parse");
      const pdf = pdfModule.default || pdfModule;
      
      if (typeof pdf === "function") {
        const data = await pdf(fileBuffer);
        return data.text || "";
      } else if (pdf && pdf.PDFParse) {
        const parser = new pdf.PDFParse({ data: fileBuffer });
        const textResult = await parser.getText();
        await parser.destroy();
        return textResult.text || "";
      } else {
        console.warn("pdf-parse import did not resolve to a standard function. Attempting raw buffer text fallback.");
        return fileBuffer.toString("utf-8");
      }
    } else {
      return fs.readFileSync(filePath, "utf-8");
    }
  } catch (error) {
    console.error(`Error extracting text from file ${filePath}:`, error);
    return "";
  }
}

/**
 * Estimate AI likelihood based on transition patterns and density
 */
export function estimateAiProbability(text) {
  if (!text) return 0;
  const content = text.toLowerCase();
  
  const patterns = [
    "furthermore", "moreover", "in conclusion", "it is important to note",
    "testament to", "delve", "not only", "but also", "in summary",
    "pave the way", "crucial role", "vibrant", "holistic", "meticulous",
    "rich tapestry", "landscape of", "paradigm shift"
  ];
  
  let matchesCount = 0;
  for (const p of patterns) {
    const regex = new RegExp(`\\b${p}\\b`, "g");
    const count = (content.match(regex) || []).length;
    matchesCount += count;
  }
  
  const wordsCount = text.split(/\s+/).filter(Boolean).length || 1;
  const density = matchesCount / wordsCount;
  
  const prob = Math.round(Math.min(95, Math.max(8, 10 + density * 900)));
  return prob;
}

/**
 * Compare two texts using word tokenization and 4-gram matching
 */
export function compareTexts(text1, text2) {
  if (!text1 || !text2) return { score: 0, matches: [] };

  const clean1 = text1.toLowerCase().replace(/[^\w\s]/g, " ");
  const clean2 = text2.toLowerCase().replace(/[^\w\s]/g, " ");

  const words1 = clean1.split(/\s+/).filter(w => w.length > 3);
  const words2 = clean2.split(/\s+/).filter(w => w.length > 3);

  if (words1.length === 0 || words2.length === 0) return { score: 0, matches: [] };

  const n = 4;
  const ngrams1 = [];
  for (let i = 0; i <= words1.length - n; i++) {
    ngrams1.push(words1.slice(i, i + n).join(" "));
  }

  const ngrams2Set = new Set();
  for (let i = 0; i <= words2.length - n; i++) {
    ngrams2Set.add(words2.slice(i, i + n).join(" "));
  }

  let matchesCount = 0;
  const matchedPhrases = [];
  
  for (const gram of ngrams1) {
    if (ngrams2Set.has(gram)) {
      matchesCount++;
      if (matchedPhrases.length < 3 && !matchedPhrases.includes(gram)) {
        matchedPhrases.push(gram);
      }
    }
  }

  const totalGrams = Math.max(ngrams1.length, 1);
  const rawScore = (matchesCount / totalGrams) * 100;
  
  const finalScore = Math.min(100, Math.round(rawScore * 1.5));

  const matches = [];
  if (finalScore > 0 && matchedPhrases.length > 0) {
    for (const phrase of matchedPhrases) {
      const index1 = clean1.indexOf(phrase);
      const index2 = clean2.indexOf(phrase);

      const matchedSnippet = index1 !== -1
        ? text1.substring(Math.max(0, index1 - 60), Math.min(text1.length, index1 + phrase.length + 60)).replace(/\s+/g, " ").trim() + "..."
        : phrase + "...";

      const originalSnippet = index2 !== -1
        ? text2.substring(Math.max(0, index2 - 60), Math.min(text2.length, index2 + phrase.length + 60)).replace(/\s+/g, " ").trim() + "..."
        : phrase + "...";

      matches.push({
        similarity: finalScore,
        matchedSnippet,
        originalSnippet
      });
    }
  }

  return {
    score: finalScore,
    matches
  };
}

/**
 * Generate AI-assisted summary using Gemini
 */
async function generateAiSummary(currentTitle, currentText, matches, maxScore) {
  try {
    if (!ai) {
      throw new Error("Gemini AI client not initialized.");
    }

    const textSample = currentText.substring(0, 1500);
    const matchesDescription = matches.map(m => 
      `- Overlaps by ${m.similarity}% with document "${m.sourceTitle}" (${m.sourceType}). 
       Matched Snippet: "${m.matchedSnippet}"
       Original Snippet: "${m.originalSnippet}"`
    ).join("\n");

    const prompt = `You are an academic integrity and plagiarism auditor for Final Year Projects (FYP) at the university.
Review the following plagiarism check report and write a professional, objective, 1-2 sentence executive summary of the findings.
The student submitted the document titled: "${currentTitle}".
Overall Plagiarism Similarity Index Match Score: ${maxScore}%.

Overlap Details:
${matchesDescription || "No significant overlaps were discovered."}

Student Document Sample text:
"""
${textSample}
"""

Guidelines:
1. Provide a professional, academic assessment.
2. If match score is high (above 20%), explain where the overlap is and name the sources.
3. If match score is low (under 15%), confirm that the document shows perfect academic originality.
4. Output ONLY the executive summary text. Do not include introductory phrases like "Summary:" or labels.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    return response.text ? response.text.trim() : "";
  } catch (err) {
    console.warn("Gemini executive summary generation failed, using fallback:", err);
    return "";
  }
}

/**
 * Checks a specific text against the database of student submissions strictly marked as final documentation
 */
async function runPlagiarismCompare(currentTitle, currentText, excludeSubmissionId = null) {
  let maxScore = 0;
  const matchedSources = [];

  // Ensure high-precision multi-factor plagiarism engine is initialized with all indexed sources
  try {
    await plagiarismEngine.init();
  } catch (initErr) {
    console.warn("Plagiarism engine init warning:", initErr);
  }

  // 1. Fetch other student submissions from database that are marked as final documentation during creation (or phase Final)
  const query = {
    fileUrl: { $exists: true, $ne: null },
    $or: [
      { isFinalDocumentation: true },
      { phase: "Final" }
    ]
  };
  if (excludeSubmissionId) {
    query._id = { $ne: excludeSubmissionId };
  }

  const submissions = await Submission.find(query)
    .populate("project")
    .populate("submittedBy");

  // Map to hold student submissions text
  for (const sub of submissions) {
    if (!sub.fileUrl) continue;

    // Resolve local path on disk
    let fileUrl = sub.fileUrl;
    if (fileUrl.startsWith("/")) {
      fileUrl = "." + fileUrl;
    }
    const absolutePath = path.resolve(fileUrl);
    if (!fs.existsSync(absolutePath)) continue;

    // Retrieve or extract text with const block
    const targetText = textCache.has(sub.fileUrl)
      ? textCache.get(sub.fileUrl)
      : await (async () => {
          const ext = path.extname(absolutePath).toLowerCase();
          let mimeType = "text/plain";
          if (ext === ".pdf") mimeType = "application/pdf";
          else if (ext === ".docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          const txt = await extractTextFromFile(absolutePath, mimeType, path.basename(absolutePath));
          if (txt) {
            textCache.set(sub.fileUrl, txt);
          }
          return txt;
        })();

    if (!targetText || targetText.trim().length < 10) continue;

    // Compare with both compareTexts n-gram analyzer and compareDocuments engine
    const engineComp = plagiarismEngine.compareDocuments(currentText, targetText);
    const tokenComp = compareTexts(currentText, targetText);
    const scoreVal = Math.round(Math.max(engineComp.score * 100, tokenComp.score));

    if (scoreVal > 0) {
      if (scoreVal > maxScore) {
        maxScore = scoreVal;
      }
      
      const studentName = sub.submittedBy?.name || "Team Member";
      const projectTitle = sub.project?.title || sub.title || "FYP Document";
      
      matchedSources.push({
        sourceTitle: `${projectTitle} (Final Documentation by ${studentName})`,
        sourceType: "Final Documentation",
        similarity: scoreVal,
        matchedSnippet: tokenComp.matches[0]?.matchedSnippet || "Lexical overlap detected in document body.",
        originalSnippet: tokenComp.matches[0]?.originalSnippet || "Reference passage in student archive."
      });
    }
  }

  // Also evaluate against stored PlagiarismSource documents in the engine if available
  const engineEval = plagiarismEngine.evaluate(currentText, 0.40);
  if (engineEval && engineEval.breakdown && engineEval.breakdown.length > 0) {
    for (const item of engineEval.breakdown) {
      const srcSimilarity = Math.round((item.similarity || item.contribution || 0) * 100);
      if (srcSimilarity > 0) {
        if (srcSimilarity > maxScore) {
          maxScore = srcSimilarity;
        }
        matchedSources.push({
          sourceTitle: item.title || "Academic Baseline Source",
          sourceType: "Peer Archive",
          similarity: srcSimilarity,
          matchedSnippet: item.snippet || "Content overlap identified across institutional index.",
          originalSnippet: item.snippet || "Reference passage in institutional index."
        });
      }
    }
  }

  // Sort matched sources by similarity descending
  matchedSources.sort((a, b) => b.similarity - a.similarity);

  // Take top 4 matched sources
  const finalMatches = matchedSources.slice(0, 4);

  // If no final documentation has overlaps, score is 0
  if (matchedSources.length === 0) {
    maxScore = 0;
  }

  // Generate Summary (with Gemini AI support)
  let summary = await generateAiSummary(currentTitle, currentText, finalMatches, maxScore);
  
  if (!summary) {
    const plagiarismStatus = maxScore < 15 ? "Safe" : maxScore <= 40 ? "Needs Review" : "High Risk";
    summary = `Originality check complete. The uploaded document was cross-compared exclusively against uploaded final documentations in the database. Similarity Index is evaluated at ${maxScore}% (${plagiarismStatus}). ${
      finalMatches.length > 0 
        ? `Overlapping patterns discovered matching: ${finalMatches.slice(0, 2).map(m => `"${m.sourceTitle}"`).join(" and ")}.`
        : "No matching final documentations found with overlapping content."
    }`;
  }

  const aiProbability = estimateAiProbability(currentText);

  return {
    plagiarismScore: maxScore,
    plagiarismStatus: maxScore < 15 ? "Safe" : maxScore <= 40 ? "Needs Review" : "High Risk",
    aiProbability,
    summary,
    matchedSources: finalMatches
  };
}

/**
 * Perform a general plagiarism scan (compatibility wrapper)
 */
export async function scanAdhocPlagiarism(text, _mode = "Text", _target = "Web Search Comparison") {
  try {
    if (!text || text.trim().length < 10) {
      throw new Error("Text content is too short for plagiarism analysis.");
    }
    return await runPlagiarismCompare("Pasted Manuscript", text);
  } catch (error) {
    console.error("Adhoc plagiarism check failed:", error);
    throw error;
  }
}

/**
 * Scan a specific student submission in our database
 */
export async function scanSubmissionPlagiarism(submissionId) {
  try {
    const submission = await Submission.findById(submissionId).populate("project").populate("submittedBy");
    if (!submission) {
      throw new Error("Submission not found in records.");
    }

    let extractedText = "";
    
    // Attempt to extract text from fileUrl if present
    if (submission.fileUrl) {
      let fileUrl = submission.fileUrl;
      if (fileUrl.startsWith("/")) {
        fileUrl = "." + fileUrl;
      }
      const absolutePath = path.resolve(fileUrl);
      if (fs.existsSync(absolutePath)) {
        const ext = path.extname(absolutePath).toLowerCase();
        let mimeType = "text/plain";
        if (ext === ".pdf") mimeType = "application/pdf";
        else if (ext === ".docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        
        extractedText = await extractTextFromFile(absolutePath, mimeType, path.basename(absolutePath));
      }
    }

    // Fallback/Combine with description
    if (!extractedText) {
      extractedText = `
Submission Title: ${submission.title || "Untitled FYP Deliverable"}
Submission Phase: ${submission.phase || "Draft Documentation"}
Comments / Details: ${submission.description || ""} ${submission.comment || ""}
`;
    }

    const report = await runPlagiarismCompare(
      submission.title || "FYP Submission", 
      extractedText, 
      submissionId
    );

    // Save report parameters back to the Submission model
    submission.plagiarismScore = report.plagiarismScore;
    submission.plagiarismStatus = report.plagiarismStatus;
    submission.plagiarismReport = {
      scanTimestamp: new Date(),
      matchedSources: report.matchedSources,
      aiProbability: report.aiProbability,
      summary: report.summary,
      scannedTextPreview: extractedText.substring(0, 1000)
    };

    await submission.save();
    return submission;
  } catch (error) {
    console.error("Submission plagiarism scan failed:", error);
    throw error;
  }
}

/**
 * Perform plagiarism check on an uploaded document file
 */
export async function scanFilePlagiarism(filePath, mimeType, filename, _mode = "Text", _target = "Web Search Comparison") {
  try {
    const fileContent = await extractTextFromFile(filePath, mimeType, filename);
    if (!fileContent || fileContent.trim().length < 10) {
      throw new Error("No readable text found in the uploaded document. Please check the file content.");
    }
    return await runPlagiarismCompare(filename, fileContent);
  } catch (error) {
    console.error("scanFilePlagiarism error:", error);
    throw error;
  }
}
