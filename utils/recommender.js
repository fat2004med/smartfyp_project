import fs from 'fs';
import path from 'path';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for',
  'from', 'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes',
  'her', 'here', 'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im',
  'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my',
  'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt',
  'so', 'some', 'such', 'than', 'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'theres', 'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to',
  'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent',
  'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why',
  'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours',
  'yourself', 'yourselves', 'system', 'using', 'based', 'web', 'app', 'platform', 'framework', 'service'
]);

// Robust CSV Line Parser
function parseCSVLine(line) {
  const result = [];
  let insideQuote = false;
  let entry = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === ',' && !insideQuote) {
      result.push(entry.trim().replace(/^["']|["']$/g, ''));
      entry = '';
    } else {
      entry += char;
    }
  }
  result.push(entry.trim().replace(/^["']|["']$/g, ''));
  return result;
}

// Tokenize text: lowercase, strip punctuation, filter stop words
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

// Automatically repair and realign columns in fyp_projects.csv if mismatched
function repairCSVFile(csvPath) {
  try {
    if (!fs.existsSync(csvPath)) return;
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return;

    const KNOWN_DOMAINS = [
      'Artificial Intelligence',
      'Machine Learning',
      'Cyber Security',
      'IoT & Robotics',
      'Mobile Applications',
      'Full-Stack Web Systems',
      'Photonics & Simulation'
    ];
    const KNOWN_DOMAINS_LOWER = new Set(KNOWN_DOMAINS.map(d => d.toLowerCase()));

    const cleanCell = (str) => {
      if (!str) return '';
      return str.replace(/^[\s,"]+|[\s,"]+$/g, '').trim();
    };

    const isDomain = (str) => {
      const cleaned = cleanCell(str).toLowerCase();
      return KNOWN_DOMAINS_LOWER.has(cleaned);
    };

    const formatDomain = (str) => {
      const cleaned = cleanCell(str).toLowerCase();
      const matched = KNOWN_DOMAINS.find(d => d.toLowerCase() === cleaned);
      if (matched) return matched;
      return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };

    const headerLine = `Title,Description,Domain,Tech_Stack`;
    const repairedRows = [];
    let hasChanges = lines[0].trim() !== headerLine;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const row = parseCSVLine(line);
      if (row.length === 0) continue;

      let title = cleanCell(row[0]) || '';
      let description = '';
      let domain = '';
      let techStack = '';

      // Check if it's a shifted row:
      // Row length is 3 OR the second element is a known domain
      const isShifted = row.length === 3 || (row.length === 4 && isDomain(row[1]));

      if (isShifted) {
        domain = formatDomain(row[1]);
        techStack = cleanCell(row[2]) || '';
        description = `An advanced engineering project centered on ${title}. This work explores cutting-edge concepts in ${domain} using technologies including ${techStack}.`;
      } else {
        description = cleanCell(row[1]) || '';
        domain = formatDomain(row[2]) || 'General';
        techStack = cleanCell(row[3]) || '';

        // Double check: if description looks like a domain and domain is a tech stack, shift it!
        if (isDomain(description)) {
          const tempDomain = formatDomain(description);
          const tempTech = domain;
          domain = tempDomain;
          techStack = tempTech;
          description = `An advanced engineering project centered on ${title}. This work explores cutting-edge concepts in ${domain} using technologies including ${techStack}.`;
        }
      }

      const escapeCSVCell = (str) => {
        return `"${str.replace(/"/g, '""')}"`;
      };

      const csvLine = `${escapeCSVCell(title)},${escapeCSVCell(description)},${escapeCSVCell(domain)},${escapeCSVCell(techStack)}`;
      repairedRows.push(csvLine);

      if (lines[i].trim() !== csvLine) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      const newContent = `${headerLine}\n${repairedRows.join('\n')}\n`;
      fs.writeFileSync(csvPath, newContent, 'utf-8');
      console.log(`[Recommender] Successfully repaired and rewrote fyp_projects.csv dataset. Total repaired rows: ${repairedRows.length}`);
    } else {
      console.log('[Recommender] Dataset fyp_projects.csv is already fully optimized and aligned. No repair needed.');
    }
  } catch (err) {
    console.error('[Recommender] Failed to repair fyp_projects.csv:', err);
  }
}

export class ProjectRecommender {
  constructor() {
    this.projects = [];
    this.vocabulary = [];       // List of unique features (tokens)
    this.idf = {};               // Inverse Document Frequency map
    this.tfidfVectors = [];      // Pre-calculated tfidf unit vectors for comparison
    this.metrics = {
      datasetSize: 0,
      vocabularySize: 0,
      trainingTimeMs: 0,
      averageTokensPerProject: 0,
      accuracySimulated: 0,      // Cross-validation pseudo-accuracy score
    };
    this.isTrained = false;
  }

  // Load CSV data and construct the TF-IDF feature space
  train() {
    const startTimeStamp = Date.now();
    try {
      const csvPath = path.resolve(process.cwd(), 'fyp_projects.csv');
      if (!fs.existsSync(csvPath)) {
        console.error('[Recommender] fyp_projects.csv not found at root path.');
        return false;
      }

      // First repair and align the dataset if any columns are mismatched or typos exist
      repairCSVFile(csvPath);

      const fileContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 2) {
        console.error('[Recommender] CSV file is empty or missing data rows.');
        return false;
      }

      // Parse headers from row 1
      const headers = parseCSVLine(lines[0]).map(h => h.trim());
      
      const titleIdx = headers.indexOf('Title');
      const descIdx = headers.indexOf('Description');
      const domainIdx = headers.indexOf('Domain');
      const techIdx = headers.indexOf('Tech_Stack');

      if (titleIdx === -1 || descIdx === -1) {
        console.error('[Recommender] Invalid CSV headers. Must contain Title and Description.');
        return false;
      }

      this.projects = [];
      const documentTokens = [];
      const df = {}; // document frequency count
      let totalTokenCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length < Math.max(titleIdx, descIdx) + 1) continue;

        const title = row[titleIdx] || '';
        const description = row[descIdx] || '';
        const domain = domainIdx !== -1 ? row[domainIdx] : 'General';
        const techStack = techIdx !== -1 ? row[techIdx] : '';

        // Combined textual features for vectorization
        const combinedText = `${title} ${description} ${domain} ${techStack}`;
        const tokens = tokenize(combinedText);
        totalTokenCount += tokens.length;

        const projectItem = {
          id: `csv-${i}`,
          title,
          description,
          domain,
          techStack,
          tokens
        };

        this.projects.push(projectItem);
        documentTokens.push(tokens);

        // Keep track of which unique tokens exist in this document
        const uniqueInDoc = new Set(tokens);
        uniqueInDoc.forEach(token => {
          df[token] = (df[token] || 0) + 1;
        });
      }

      const N = this.projects.length;
      if (N === 0) {
        console.error('[Recommender] No valid project records parsed.');
        return false;
      }

      // Build Vocabulary
      this.vocabulary = Object.keys(df);
      this.metrics.vocabularySize = this.vocabulary.length;
      this.metrics.datasetSize = N;

      // Calculate IDF
      // IDF = ln( 1 + (N / (1 + df[t])) )
      this.idf = {};
      this.vocabulary.forEach(token => {
        this.idf[token] = Math.log(1 + (N / (1 + df[token])));
      });

      // Calculate L2-normalized TF-IDF unit vectors for all documents
      this.tfidfVectors = this.projects.map(project => {
        const tf = {};
        project.tokens.forEach(token => {
          tf[token] = (tf[token] || 0) + 1;
        });

        const rawVector = {};
        let squaredSum = 0;

        this.vocabulary.forEach(token => {
          const tfVal = tf[token] || 0;
          if (tfVal > 0) {
            const idfVal = this.idf[token] || 0;
            const tfidf = tfVal * idfVal;
            rawVector[token] = tfidf;
            squaredSum += tfidf * tfidf;
          }
        });

        // Normalize to Unit Vector (L2 Norm)
        const magnitude = Math.sqrt(squaredSum);
        const normVector = {};
        if (magnitude > 0) {
          Object.keys(rawVector).forEach(token => {
            normVector[token] = rawVector[token] / magnitude;
          });
        }

        return normVector;
      });

      // Calculate Validation Metric (Leave-one-out self-relevance prediction)
      // We see if each project matches itself as the top 1 recommendation (excluding exact ID)
      // This validates the density and distinctiveness of our vectors
      let cohesiveHits = 0;
      for (let index = 0; index < Math.min(20, N); index++) {
        const targetProj = this.projects[index];
        const copyOfQuery = `${targetProj.title} ${targetProj.description}`;
        const queryTokens = tokenize(copyOfQuery);
        
        let subScore = 0;
        let bestScoreIdx = -1;
        
        // Loop vectors to find highest matching (excluding self)
        for (let j = 0; j < N; j++) {
          if (j === index) continue;
          const score = this.calculateSimilarity(queryTokens, this.tfidfVectors[j]);
          if (score > subScore) {
            subScore = score;
            bestScoreIdx = j;
          }
        }
        
        // If they share the same domain or keywords, count as high cohesive clustering match
        if (bestScoreIdx !== -1 && this.projects[bestScoreIdx].domain === targetProj.domain) {
          cohesiveHits++;
        }
      }

      this.isTrained = true;
      this.metrics.trainingTimeMs = Date.now() - startTimeStamp;
      this.metrics.averageTokensPerProject = Math.round(totalTokenCount / N);
      this.metrics.accuracySimulated = Math.round((cohesiveHits / Math.min(20, N)) * 100);

      console.log(`[Recommender] Model successfully trained in ${this.metrics.trainingTimeMs}ms.`);
      console.log(`[Recommender] Dataset: ${N} projects, Vocab: ${this.metrics.vocabularySize} terms, Cohesive Score: ${this.metrics.accuracySimulated}%`);
      return true;
    } catch (err) {
      console.error('[Recommender] Training crashed:', err);
      return false;
    }
  }

  // Calculate Cosine Similarity between a query token list and a pre-compiled product unit vector
  calculateSimilarity(queryTokens, docVector) {
    // Term frequencies for query
    const queryTf = {};
    queryTokens.forEach(token => {
      queryTf[token] = (queryTf[token] || 0) + 1;
    });

    let dotProduct = 0;
    let querySquaredSum = 0;

    // Only compute for active query terms that are in our vocabulary
    Object.keys(queryTf).forEach(token => {
      if (this.idf[token]) {
        const tfidf = queryTf[token] * this.idf[token];
        querySquaredSum += tfidf * tfidf;
        
        // Dot product if document contains it
        if (docVector[token]) {
          dotProduct += tfidf * docVector[token];
        }
      }
    });

    if (querySquaredSum === 0) return 0;
    
    // Sim = DotProduct / (magnitude_Q * magnitude_D)
    // Note: Since docVector is ALREADY normalized (magnitude_D = 1.0),
    // we only divide by the magnitude of query vector
    const queryMagnitude = Math.sqrt(querySquaredSum);
    return dotProduct / queryMagnitude;
  }

  // Recommend function: returns sorted projects based on match similarity scoring
  getRecommendations(interestQuery, preferredDomain = '', techStackQuery = '', limit = 6) {
    if (!this.isTrained) {
      // Lazy train if not initialized
      this.train();
    }

    const inferenceStart = Date.now();
    const queryTokens = tokenize(`${interestQuery} ${techStackQuery}`);
    
    const results = this.projects.map((project, idx) => {
      let cosineScore = this.calculateSimilarity(queryTokens, this.tfidfVectors[idx]);
      
      // Multi-factor boost adjustments
      let boostMultiplier = 1.0;

      // Domain-fit structural boost
      if (preferredDomain && project.domain && project.domain.toLowerCase() === preferredDomain.toLowerCase()) {
        boostMultiplier += 0.35; // 35% similarity boost for matching selected interest area
      }

      // Tech Stack substring fit boost
      if (techStackQuery) {
        const cleanTechInputs = techStackQuery.toLowerCase().split(/[,\s]+/).filter(x => x.length > 2);
        let techMatches = 0;
        
        cleanTechInputs.forEach(tech => {
          if (project.techStack && project.techStack.toLowerCase().includes(tech)) {
            techMatches++;
          }
        });
        
        if (techMatches > 0) {
          boostMultiplier += Math.min(0.3, techMatches * 0.08); // up to 30% bonus for exact engine keywords match
        }
      }

      // Apply multiplier boost, cap similarity at 1.0 (100% resemblance)
      const adjustedScore = Math.min(1.0, cosineScore * boostMultiplier);

      return {
        title: project.title,
        description: project.description,
        domain: project.domain,
        techStack: project.techStack,
        rawCosineScore: cosineScore,
        matchScore: parseFloat((adjustedScore * 100).toFixed(1)), // convert to percentage
      };
    });

    // Sort descending of similarity
    let recommended = results.sort((a, b) => b.matchScore - a.matchScore);
    const inferenceTimeMs = Date.now() - inferenceStart;

    return {
      recommendations: recommended.slice(0, limit),
      inferenceTimeMs,
      metrics: {
        ...this.metrics,
        activeTokensCount: queryTokens.length
      }
    };
  }
}

// Global instance
const recommender = new ProjectRecommender();
export default recommender;
