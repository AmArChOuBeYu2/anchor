// ---------------------------------------------------------------------------
// Document chunking & search utilities for RAG
// ---------------------------------------------------------------------------

/**
 * Split text into overlapping chunks, breaking at sentence boundaries
 * when possible.
 *
 * @param {string} text — Full document text.
 * @param {number} chunkSize — Target chunk size in characters.
 * @param {number} overlap — Number of characters to overlap between chunks.
 * @returns {string[]} Array of chunk strings.
 */
export function chunkDocument(text, chunkSize = 500, overlap = 100) {
  if (!text || typeof text !== 'string') return [];

  // Normalise whitespace
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  if (cleaned.length === 0) return [];

  // If the entire text fits in one chunk, return it as-is
  if (cleaned.length <= chunkSize) return [cleaned];

  const chunks = [];
  let start = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    // If we're not at the very end, try to break at a sentence boundary
    if (end < cleaned.length) {
      // Look backward from `end` for a sentence-ending character followed by
      // whitespace (or end of string). We search within the last 30% of the
      // chunk to avoid creating very short chunks.
      const searchStart = Math.max(start, end - Math.floor(chunkSize * 0.3));
      const window = cleaned.slice(searchStart, end);

      // Find the last sentence break in the window
      const sentenceBreakRegex = /[.!?]\s+/g;
      let lastBreak = -1;
      let match;
      while ((match = sentenceBreakRegex.exec(window)) !== null) {
        lastBreak = match.index + match[0].length;
      }

      if (lastBreak !== -1) {
        end = searchStart + lastBreak;
      }
    }

    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Advance by (end - overlap) but never go backwards
    const next = end - overlap;
    start = next <= start ? end : next;
  }

  return chunks;
}

// ---------------------------------------------------------------------------
// Vector similarity
// ---------------------------------------------------------------------------

/**
 * Compute cosine similarity between two vectors.
 *
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} Similarity in [-1, 1], or 0 on invalid input.
 */
export function cosineSimilarity(vecA, vecB) {
  if (!Array.isArray(vecA) || !Array.isArray(vecB)) return 0;
  if (vecA.length === 0 || vecB.length === 0) return 0;

  // If lengths differ, use the shorter length
  const len = Math.min(vecA.length, vecB.length);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    const a = vecA[i] || 0;
    const b = vecB[i] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ---------------------------------------------------------------------------
// Semantic search over chunks
// ---------------------------------------------------------------------------

/**
 * Find the top-K most relevant chunks by cosine similarity.
 *
 * @param {number[]} queryEmbedding — Embedding of the query.
 * @param {Array<{embedding: number[]|null, chunk_text: string}>} chunks
 * @param {number} topK
 * @returns {Array<{chunk_text: string, score: number}>}
 */
export function findRelevantChunks(queryEmbedding, chunks, topK = 5) {
  if (!queryEmbedding || !Array.isArray(chunks) || chunks.length === 0) {
    return [];
  }

  const scored = chunks
    .filter((c) => c.embedding && Array.isArray(c.embedding) && c.embedding.length > 0)
    .map((c) => ({
      chunk_text: c.chunk_text,
      score: cosineSimilarity(queryEmbedding, c.embedding),
    }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

// ---------------------------------------------------------------------------
// Keyword-based fallback (TF-IDF-lite)
// ---------------------------------------------------------------------------

// Common English stop words to ignore during keyword matching
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
  'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
  'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'and', 'but', 'or', 'if', 'it', 'its', 'i', 'me', 'my', 'we', 'our',
  'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them',
  'their', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
  'those', 'am', 'about', 'up', 'just', 'also',
]);

/**
 * Tokenise text into lowercase words, stripping punctuation and stop words.
 * @param {string} text
 * @returns {string[]}
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s₹]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

/**
 * Keyword-based fallback search. Scores chunks by word-overlap with the query.
 * Used when the Gemini embedding API is unavailable.
 *
 * @param {string} query — User query.
 * @param {Array<{chunk_text: string}>} chunks
 * @param {number} topK
 * @returns {Array<{chunk_text: string, score: number}>}
 */
export function keywordFallback(query, chunks, topK = 3) {
  if (!query || !Array.isArray(chunks) || chunks.length === 0) return [];

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  // Build a simple IDF-like weight: tokens that appear in fewer chunks get higher weight
  const chunkCount = chunks.length;
  const tokenDocFreq = {};

  for (const token of queryTokens) {
    if (tokenDocFreq[token] !== undefined) continue;
    let df = 0;
    for (const chunk of chunks) {
      if (chunk.chunk_text.toLowerCase().includes(token)) {
        df++;
      }
    }
    tokenDocFreq[token] = df;
  }

  const scored = chunks.map((c) => {
    const chunkLower = c.chunk_text.toLowerCase();
    let score = 0;

    for (const token of queryTokens) {
      if (chunkLower.includes(token)) {
        // IDF-like weight: rarer terms get higher score
        const df = tokenDocFreq[token] || 1;
        const idf = Math.log((chunkCount + 1) / (df + 1)) + 1;
        score += idf;
      }
    }

    return { chunk_text: c.chunk_text, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).filter((s) => s.score > 0);
}
