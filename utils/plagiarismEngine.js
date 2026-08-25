import fs from "fs";
import path from "path";
import User from "../models/User.js";
import PlagiarismSource from "../models/PlagiarismSource.js";
import Project from "../models/Project.js";
import Submission from "../models/Submission.js";
import { extractTextFromFile } from "./plagiarismChecker.js";

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

    // 2. Sentence-level fuzzy containment
    const querySentences = this.getSentences(queryText);
    const refSentences = this.getSentences(referenceText);
    let matchedSentences = 0;

    if (querySentences.length > 0 && refSentences.length > 0) {
      for (const qSent of querySentences) {
        const qTokens = new Set(this.tokenize(qSent));
        if (qTokens.size < 3) continue;

        let bestOverlap = 0;
        for (const rSent of refSentences) {
          const rTokens = new Set(this.tokenize(rSent));
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

  // Initialize and load embeddings strictly from final documentation submissions into memory
  async init() {
    try {
      const activeSources = [];

      // 1. Fetch only submissions that have been marked as final documentation during creation or phase Final
      const finalSubmissions = await Submission.find({
        $or: [
          { isFinalDocumentation: true },
          { phase: "Final" }
        ],
        fileUrl: { $exists: true, $ne: null }
      })
      .populate("project")
      .populate("submittedBy", "name email")
      .lean();

      if (finalSubmissions && finalSubmissions.length > 0) {
        for (const sub of finalSubmissions) {
          if (!sub.fileUrl) continue;

          let fileUrl = sub.fileUrl;
          if (fileUrl.startsWith("/")) {
            fileUrl = "." + fileUrl;
          }
          let absolutePath = path.resolve(fileUrl);
          
          if (!fs.existsSync(absolutePath)) {
            // Check if file exists in uploads/ directory by base name or suffix
            const baseName = path.basename(fileUrl);
            const uploadsDir = path.resolve("uploads");
            if (fs.existsSync(uploadsDir)) {
              const allUploads = fs.readdirSync(uploadsDir);
              const matched = allUploads.find(f => f === baseName || f.endsWith(baseName) || baseName.endsWith(f));
              if (matched) {
                absolutePath = path.join(uploadsDir, matched);
              }
            }
          }

          let extractedDocText = "";
          if (fs.existsSync(absolutePath)) {
            const ext = path.extname(absolutePath).toLowerCase();
            let mimeType = "text/plain";
            if (ext === ".pdf") mimeType = "application/pdf";
            else if (ext === ".docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            extractedDocText = await extractTextFromFile(absolutePath, mimeType, path.basename(absolutePath));
          }

          const combinedText = [
            sub.title || "",
            sub.description || "",
            extractedDocText || ""
          ].filter(Boolean).join(". ").trim();

          // Only index if there is actual document text extracted or sufficient content
          if (combinedText.length >= 10 && (extractedDocText.length > 0 || (sub.description && sub.description.length > 20))) {
            const projectTitle = sub.project?.title || sub.title || "Final Documentation";
            const authorName = sub.submittedBy?.name || sub.project?.teamName || "Team";
            const embedding = this.generateEmbedding(combinedText);

            activeSources.push({
              _id: sub._id.toString(),
              title: `${projectTitle} (Final Documentation)`,
              content: combinedText,
              embedding,
              author: authorName,
              year: new Date(sub.createdAt || Date.now()).getFullYear(),
              docType: "Final FYP Documentation",
              submissionId: sub._id.toString(),
              projectId: sub.project?._id ? sub.project._id.toString() : null
            });
          }
        }
      }

      this.sources = activeSources;
      this.sourceEmbeddings = activeSources.map(s => s.embedding);
      this.isInitialized = true;
      console.log(`⚡ [PlagiarismEngine] Memory cache ready with ${this.sources.length} indexed final documentation source embeddings.`);
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
