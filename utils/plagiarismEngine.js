import fs from "fs";
import path from "path";
import User from "../models/User.js";
import Department from "../models/Department.js";
import PlagiarismSource from "../models/PlagiarismSource.js";
import Project from "../models/Project.js";
import Submission from "../models/Submission.js";
import { extractTextFromFile } from "./textExtractor.js";

// Clean and tokenize text
const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can't", "cannot", "could",
  "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for",
  "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's",
  "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm",
  "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't",
  "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours",
  "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't",
  "so", "some", "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
  "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too",
  "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "weren't", "what",
  "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
  "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves"
]);

export class EmbeddingPlagiarismEngine {
  constructor() {
    this.sources = [];
    this.sourceEmbeddings = [];
    this.dimension = 384;
    this.isInitialized = false;
  }

  // Tokenize and clean text into significant words
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 1 && !STOP_WORDS.has(t));
  }

  // Extract raw word tokens preserving order
  getAllWords(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  // Split text into distinct sentences/statements
  getSentences(text) {
    if (!text) return [];
    return text
      .split(/[.!?\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);
  }

  // Generate word N-grams (n = 3 or 4)
  getNgrams(words, n = 3) {
    if (!words || words.length < n) return [];
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n).join(" "));
    }
    return ngrams;
  }

  // Compute Term Frequency vector map with sublinear scaling
  getTfMap(tokens) {
    const counts = new Map();
    for (const t of tokens) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }
    const tf = new Map();
    for (const [t, count] of counts.entries()) {
      tf.set(t, 1 + Math.log(count));
    }
    return tf;
  }

  // Compute Cosine similarity between two TF maps
  computeTfCosine(tf1, tf2) {
    if (tf1.size === 0 || tf2.size === 0) return 0;

    let dot = 0;
    let norm1Sq = 0;
    let norm2Sq = 0;

    for (const [term, val1] of tf1.entries()) {
      norm1Sq += val1 * val1;
      const val2 = tf2.get(term);
      if (val2 !== undefined) {
        dot += val1 * val2;
      }
    }

    for (const val2 of tf2.values()) {
      norm2Sq += val2 * val2;
    }

    const norm1 = Math.sqrt(norm1Sq);
    const norm2 = Math.sqrt(norm2Sq);

    if (norm1 === 0 || norm2 === 0) return 0;
    return Math.max(0, Math.min(1.0, dot / (norm1 * norm2)));
  }

  // Generate 384-dimensional dense vector embedding (with balanced positive/negative hash projection)
  generateEmbedding(text) {
    const tokens = this.tokenize(text);
    const vec = new Float32Array(this.dimension);

    if (tokens.length === 0) {
      return Array.from(vec);
    }

    tokens.forEach((token, index) => {
      let hash = 0;
      for (let i = 0; i < token.length; i++) {
        hash = (hash << 5) - hash + token.charCodeAt(i);
        hash |= 0;
      }

      const primaryIdx = Math.abs(hash) % this.dimension;
      const sign = (hash & 1) === 0 ? 1 : -1;
      const weight = 1.0 / Math.sqrt(tokens.length);

      vec[primaryIdx] += sign * weight * 1.5;

      const secondaryIdx = Math.abs((hash * 31) ^ (index + 1)) % this.dimension;
      const sign2 = ((hash >> 1) & 1) === 0 ? 1 : -1;
      vec[secondaryIdx] += sign2 * weight * 1.0;
    });

    let sumSq = 0;
    for (let i = 0; i < this.dimension; i++) {
      sumSq += vec[i] * vec[i];
    }
    const norm = Math.sqrt(sumSq);
    if (norm > 0) {
      for (let i = 0; i < this.dimension; i++) {
        vec[i] /= norm;
      }
    }

    return Array.from(vec);
  }

  // Compute multi-factor academic plagiarism score between two documents
  compareDocuments(queryText, referenceText) {
    if (!queryText || !referenceText) {
      return { score: 0, matchedGramsCount: 0, totalGramsCount: 0, matchedSentencesCount: 0 };
    }

    const queryWords = this.getAllWords(queryText);
    const refWords = this.getAllWords(referenceText);

    if (queryWords.length < 5 || refWords.length < 5) {
      return { score: 0, matchedGramsCount: 0, totalGramsCount: 0, matchedSentencesCount: 0 };
    }

    // 1. N-Gram Shingling (3-grams and 4-grams)
    const query3Grams = this.getNgrams(queryWords, 3);
    const ref3GramsSet = new Set(this.getNgrams(refWords, 3));

    let matched3Grams = 0;
    for (const gram of query3Grams) {
      if (ref3GramsSet.has(gram)) {
        matched3Grams++;
      }
    }
    const ngramOverlap3 = query3Grams.length > 0 ? (matched3Grams / query3Grams.length) : 0;

    const query4Grams = this.getNgrams(queryWords, 4);
    const ref4GramsSet = new Set(this.getNgrams(refWords, 4));

    let matched4Grams = 0;
    for (const gram of query4Grams) {
      if (ref4GramsSet.has(gram)) {
        matched4Grams++;
      }
    }
    const ngramOverlap4 = query4Grams.length > 0 ? (matched4Grams / query4Grams.length) : 0;

    // Combined n-gram overlap
    const ngramScore = (ngramOverlap3 * 0.6) + (ngramOverlap4 * 0.4);

    // 2. Sentence-level fuzzy containment (pre-tokenized & bounded for memory safety)
    const querySentences = this.getSentences(queryText).slice(0, 150);
    const refSentences = this.getSentences(referenceText).slice(0, 150);
    let matchedSentences = 0;

    if (querySentences.length > 0 && refSentences.length > 0) {
      // Pre-compute token sets once for reference sentences to avoid inner loop heap allocation
      const refTokenSets = [];
      for (const rSent of refSentences) {
        const rTokens = new Set(this.tokenize(rSent));
        if (rTokens.size >= 3) {
          refTokenSets.push(rTokens);
        }
      }

      for (const qSent of querySentences) {
        const qTokens = new Set(this.tokenize(qSent));
        if (qTokens.size < 3) continue;

        let bestOverlap = 0;
        for (const rTokens of refTokenSets) {
          let common = 0;
          for (const t of qTokens) {
            if (rTokens.has(t)) common++;
          }
          const jaccard = common / Math.max(qTokens.size, 1);
          if (jaccard > bestOverlap) {
            bestOverlap = jaccard;
          }
          if (bestOverlap >= 0.70) break;
        }

        if (bestOverlap >= 0.60) {
          matchedSentences++;
        }
      }
    }
    const sentenceScore = querySentences.length > 0 ? (matchedSentences / querySentences.length) : 0;

    // 3. TF-IDF Cosine similarity
    const queryTf = this.getTfMap(this.tokenize(queryText));
    const refTf = this.getTfMap(this.tokenize(referenceText));
    const tfidfScore = this.computeTfCosine(queryTf, refTf);

    // 4. Weighted Composite Score
    let finalScore = 0;
    if (ngramScore > 0.01 || sentenceScore > 0.01) {
      finalScore = (ngramScore * 0.50) + (sentenceScore * 0.35) + (tfidfScore * 0.15);
    } else {
      // If no 3-grams or sentences match, lexical overlap is minimal; tfidf can at most contribute slightly if vocabulary matches
      finalScore = tfidfScore * 0.15;
    }

    // Exact match safeguard
    if (queryWords.join(" ") === refWords.join(" ")) {
      finalScore = 1.0;
    }

    finalScore = Math.max(0, Math.min(1.0, finalScore));

    return {
      score: parseFloat(finalScore.toFixed(4)),
      matchedGramsCount: matched3Grams,
      totalGramsCount: query3Grams.length,
      matchedSentencesCount: matchedSentences,
      totalSentencesCount: querySentences.length
    };
  }

  // Auto-sync repository sources ONLY from Projects in admin records that have Final Documentation marked during creation of submission slot
  async syncRepositorySources(force = false) {
    try {
      // 1. Wipe previous / stale sources so only valid final documentation documents of admin project records exist
      await PlagiarismSource.deleteMany({});

      // 2. Fetch projects from database (admin project records)
      const projects = await Project.find({})
        .populate("department", "name")
        .populate("supervisor", "name email")
        .populate("teamLeader", "name")
        .lean();

      const seenKeys = new Set();
      const docsToIndex = [];

      for (const p of projects) {
        if (!p.title || p.title.trim().length < 3) continue;

        // Submissions for this project marked as final documentation during creation of slot
        const finalSubs = await Submission.find({
          project: p._id,
          isFinalDocumentation: true,
          $or: [
            { fileUrl: { $exists: true, $nin: [null, ""] } },
            { status: { $ne: "Not Submitted" } },
            { "history.0": { $exists: true } }
          ]
        }).populate("submittedBy", "name email").lean();

        // Project's own finalDocumentations records (marked final in project records)
        const projFinalDocs = (p.finalDocumentations || []).filter(d =>
          d && (d.fileUrl || d.title) && d.status !== "Not Submitted"
        );

        // Collect from valid submissions
        for (const sub of finalSubs) {
          const docTitle = (sub.title || "Final Documentation").trim();
          const normKey = `${p._id}_${docTitle.toLowerCase()}`;
          if (seenKeys.has(normKey)) continue;
          seenKeys.add(normKey);

          docsToIndex.push({
            project: p,
            submission: sub,
            docTitle: docTitle,
            fileUrl: sub.fileUrl || (sub.history && sub.history[0]?.fileUrl),
            subDescription: sub.description || "",
            subDate: sub.createdAt || Date.now()
          });
        }

        // Collect from project.finalDocumentations (if not already added)
        for (const doc of projFinalDocs) {
          const docTitle = (doc.title || "Final Documentation").trim();
          const normKey = `${p._id}_${docTitle.toLowerCase()}`;
          if (seenKeys.has(normKey)) continue;
          seenKeys.add(normKey);

          docsToIndex.push({
            project: p,
            submission: null,
            docTitle: docTitle,
            fileUrl: doc.fileUrl,
            subDescription: "",
            subDate: Date.now()
          });
        }
      }

      for (const item of docsToIndex) {
        const p = item.project;
        const sub = item.submission;
        const docTitle = item.docTitle;
        const fileUrl = item.fileUrl;

        // Format clean, descriptive title
        let formattedTitle = `${p.title} (${docTitle})`;
        if (docTitle.toLowerCase().includes(p.title.toLowerCase().slice(0, 10))) {
          formattedTitle = docTitle;
        } else if (docTitle.toLowerCase() === "final documentation") {
          formattedTitle = `${p.title} (Final Documentation)`;
        }

        // Author line
        const author = `${p.teamName ? p.teamName + " • " : ""}${p.department?.name || "Final Documentation"}`;

        // Extract physical document text if file exists
        let extractedDocText = "";
        const candidatePaths = [];
        if (fileUrl) {
          const cleanUrl = fileUrl.startsWith("/") ? "." + fileUrl : fileUrl;
          candidatePaths.push(path.resolve(cleanUrl));
          const baseName = path.basename(cleanUrl);
          const uploadsDir = path.resolve("uploads");
          if (fs.existsSync(uploadsDir)) {
            candidatePaths.push(path.join(uploadsDir, baseName));
          }
        }

        // If SmartFYP and latest documentation exists, also include it
        if (p.title.toLowerCase().includes("smartfyp")) {
          const smartFypLatest = path.resolve("uploads/1788138255871-latest_documentation_SmartFYP.pdf");
          if (fs.existsSync(smartFypLatest)) {
            candidatePaths.push(smartFypLatest);
          }
        }

        for (const cp of candidatePaths) {
          if (fs.existsSync(cp)) {
            const ext = path.extname(cp).toLowerCase();
            let mimeType = "text/plain";
            if (ext === ".pdf") mimeType = "application/pdf";
            else if (ext === ".docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            try {
              const txt = await extractTextFromFile(cp, mimeType, path.basename(cp));
              if (txt && txt.trim().length > 20) {
                extractedDocText = txt.length > 30000 ? txt.slice(0, 30000) : txt;
                break;
              }
            } catch (err) {
              console.warn("File extraction warn for", cp, err.message);
            }
          }
        }

        // Build rich comprehensive text for comparison
        const combinedText = [
          `Project Title: ${p.title}`,
          `Document: ${docTitle}`,
          p.teamName ? `Team: ${p.teamName}` : "",
          p.department?.name ? `Department: ${p.department.name}` : "",
          p.supervisor?.name ? `Supervisor: ${p.supervisor.name}` : "",
          p.description ? `Abstract & Overview: ${p.description}` : "",
          p.abstract && p.abstract !== p.description ? `Abstract: ${p.abstract}` : "",
          item.subDescription ? `Submission Notes: ${item.subDescription}` : "",
          extractedDocText ? `Extracted Content:\n${extractedDocText}` : ""
        ].filter(Boolean).join("\n\n").trim();

        const embedding = this.generateEmbedding(combinedText);

        await PlagiarismSource.create({
          title: formattedTitle.trim(),
          content: combinedText,
          embedding,
          dimension: this.dimension,
          author,
          year: p.year || new Date(item.subDate).getFullYear(),
          docType: "FYP Final Documentation",
          fileUrl: fileUrl || null,
          projectId: p._id,
          submissionId: sub?._id || null
        });
      }

      // Directly update memory cache
      const stored = await PlagiarismSource.find({}).lean();
      this.sources = stored.map(src => ({
        _id: src._id.toString(),
        title: src.title,
        content: src.content || src.title,
        embedding: src.embedding,
        author: src.author || "Final Documentation",
        year: src.year || new Date().getFullYear(),
        docType: src.docType || "FYP Final Documentation",
        projectId: src.projectId?.toString() || null,
        submissionId: src.submissionId?.toString() || null,
        fileUrl: src.fileUrl || null
      }));
      this.sourceEmbeddings = this.sources.map(s => s.embedding);
      this.isInitialized = true;
      console.log(`⚡ [PlagiarismEngine] Repository sync completed with ${this.sources.length} indexed final documentation source documents.`);

      return true;
    } catch (err) {
      console.warn("⚠️ [PlagiarismEngine] Auto-sync repository warning:", err.message);
      return false;
    }
  }

  // Initialize and load embeddings from database sources into memory
  async init() {
    try {
      const activeSources = [];

      // 1. Ensure PlagiarismSource collection exists and contains ONLY valid final documentations from project records
      const invalidCount = await PlagiarismSource.countDocuments({
        $or: [
          { docType: "Archived FYP Project" },
          { docType: "FYP Project Repository" },
          { docType: "FYP Source Document" }
        ]
      });
      const totalCount = await PlagiarismSource.countDocuments();

      if (totalCount === 0 || invalidCount > 0) {
        await this.syncRepositorySources(true);
        return true;
      }

      // 2. Load all indexed sources from PlagiarismSource collection
      const storedSources = await PlagiarismSource.find({}).lean();
      for (const src of storedSources) {
        if (!src.title) continue;

        const embedding = (Array.isArray(src.embedding) && src.embedding.length === this.dimension)
          ? src.embedding
          : this.generateEmbedding(src.content || src.title);

        activeSources.push({
          _id: src._id.toString(),
          title: src.title,
          content: src.content || src.title,
          embedding,
          author: src.author || "Final Documentation",
          year: src.year || new Date().getFullYear(),
          docType: src.docType || "FYP Final Documentation",
          projectId: src.projectId?.toString() || null,
          submissionId: src.submissionId?.toString() || null,
          fileUrl: src.fileUrl || null
        });
      }

      this.sources = activeSources;
      this.sourceEmbeddings = activeSources.map(s => s.embedding);
      this.isInitialized = true;
      console.log(`⚡ [PlagiarismEngine] Memory cache ready with ${this.sources.length} indexed final documentation source documents.`);
      return true;
    } catch (err) {
      console.warn("⚠️ [PlagiarismEngine] Initialization notice:", err.message);
      this.sources = [];
      this.sourceEmbeddings = [];
      this.isInitialized = true;
      return true;
    }
  }

  // Add source document
  async addSource(title, content, author = "FYP Portal Upload") {
    const embedding = this.generateEmbedding(content);
    let docId = `local_${Date.now()}`;

    try {
      const created = await PlagiarismSource.create({
        title: title.trim(),
        content: content.trim(),
        embedding,
        dimension: 384,
        author,
        year: new Date().getFullYear()
      });
      docId = created._id.toString();
    } catch (e) {
      console.warn("DB insert error in addSource:", e.message);
    }

    const newSource = {
      _id: docId,
      title: title.trim(),
      content: content.trim(),
      embedding,
      author
    };

    this.sources.push(newSource);
    this.sourceEmbeddings.push(embedding);

    return {
      id: docId,
      title: title.trim(),
      total_sources: this.sources.length
    };
  }

  // Check plagiarism of text against all indexed sources
  evaluate(text, threshold = 0.40) {
    if (!this.isInitialized) {
      this.sources = [];
      this.sourceEmbeddings = [];
      this.isInitialized = true;
    }

    if (this.sources.length === 0) {
      return {
        overall_score: 0.0,
        overall_percentage: 0.0,
        is_plagiarized: false,
        threshold: parseFloat(threshold),
        threshold_percentage: parseFloat((threshold * 100).toFixed(1)),
        breakdown: [],
        total_sources_evaluated: 0
      };
    }

    const similarities = [];

    for (let i = 0; i < this.sources.length; i++) {
      const src = this.sources[i];
      const comparison = this.compareDocuments(text, src.content || src.title);
      similarities.push({
        id: src._id,
        title: src.title,
        similarity: comparison.score,
        content: src.content,
        matchedGrams: comparison.matchedGramsCount,
        matchedSentences: comparison.matchedSentencesCount
      });
    }

    // Sort by similarity descending
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Highest matching source determines primary baseline
    const highestMatch = similarities[0] ? similarities[0].similarity : 0.0;
    const overallScore = Math.min(1.0, Math.max(0.0, highestMatch));

    // Calculate per-source breakdown contributions
    const breakdown = [];
    similarities.forEach(item => {
      if (item.similarity > 0.01) {
        breakdown.push({
          id: item.id,
          title: item.title,
          contribution: item.similarity,
          similarity: item.similarity,
          snippet: item.content ? item.content.substring(0, 180) + "..." : ""
        });
      }
    });

    const isPlagiarized = overallScore >= threshold;

    return {
      overall_score: overallScore,
      overall_percentage: parseFloat((overallScore * 100).toFixed(1)),
      is_plagiarized: isPlagiarized,
      threshold: parseFloat(threshold),
      threshold_percentage: parseFloat((threshold * 100).toFixed(1)),
      breakdown,
      total_sources_evaluated: this.sources.length
    };
  }
}

const plagiarismEngine = new EmbeddingPlagiarismEngine();
export default plagiarismEngine;
