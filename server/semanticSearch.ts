/**
 * Semantic Search Engine — البحث الدلالي لقاعدة المعرفة
 * 
 * Uses OpenAI-compatible embeddings API (via Forge) to generate vector embeddings
 * for knowledge base entries, then performs cosine similarity search for
 * semantically relevant results.
 * 
 * Architecture:
 * 1. generateEmbedding() — Calls the embeddings API to convert text to vectors
 * 2. cosineSimilarity() — Computes similarity between two vectors
 * 3. semanticSearch() — Finds the most relevant knowledge base entries
 * 4. generateAndStoreEmbeddings() — Batch generates embeddings for all entries
 * 5. Caching layer — Avoids redundant API calls for unchanged content
 */

import { ENV } from "./_core/env";

// Use OpenAI API directly for embeddings (Forge API doesn't support embeddings endpoint)
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const EMBEDDING_MODEL = "text-embedding-ada-002";
const EMBEDDING_DIMENSIONS = 1536; // ada-002 output dimensions
const DEFAULT_TOP_K = 5;
const SIMILARITY_THRESHOLD = 0.65; // Minimum similarity score to include

// In-memory cache for embeddings to reduce API calls
const embeddingCache = new Map<string, number[]>();

// ═══════════════════════════════════════════════════════════════
// EMBEDDING GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Get the OpenAI API key for embeddings
 * Uses OPENAI_API_KEY env var directly since Forge doesn't support embeddings
 */
function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured for embeddings");
  }
  return key;
}

/**
 * Generate an embedding vector for the given text using the embeddings API
 * Results are cached in memory to avoid redundant API calls
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty text");
  }

  // Check cache first
  const cacheKey = text.trim().substring(0, 200); // Use first 200 chars as cache key
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const apiKey = getOpenAIKey();

  // Truncate text to avoid token limits (roughly 8191 tokens ≈ 32000 chars)
  const truncatedText = text.substring(0, 30000);

  try {
    const response = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: truncatedText,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Embeddings API failed: ${response.status} ${response.statusText} – ${errorText}`
      );
    }

    const result = await response.json() as {
      data: Array<{ embedding: number[]; index: number }>;
      model: string;
      usage: { prompt_tokens: number; total_tokens: number };
    };

    if (!result.data || result.data.length === 0) {
      throw new Error("Embeddings API returned empty data");
    }

    const embedding = result.data[0].embedding;

    // Cache the result
    embeddingCache.set(cacheKey, embedding);

    return embedding;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Embeddings API")) {
      throw error;
    }
    throw new Error(`Failed to generate embedding: ${(error as Error).message}`);
  }
}

/**
 * Generate embeddings for multiple texts in a single API call (batch)
 */
export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const apiKey = getOpenAIKey();

  // Truncate each text
  const truncatedTexts = texts.map(t => t.substring(0, 30000));

  try {
    const response = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: truncatedTexts,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Embeddings batch API failed: ${response.status} ${response.statusText} – ${errorText}`
      );
    }

    const result = await response.json() as {
      data: Array<{ embedding: number[]; index: number }>;
    };

    // Sort by index to maintain order
    const sorted = result.data.sort((a, b) => a.index - b.index);
    return sorted.map(d => d.embedding);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Embeddings")) {
      throw error;
    }
    throw new Error(`Failed to generate batch embeddings: ${(error as Error).message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// COSINE SIMILARITY
// ═══════════════════════════════════════════════════════════════

/**
 * Compute cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means identical direction
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

// ═══════════════════════════════════════════════════════════════
// SEMANTIC SEARCH
// ═══════════════════════════════════════════════════════════════

export interface KnowledgeEntry {
  entryId: string;
  category: string;
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  tags: string[] | null;
  embedding: number[] | null;
  viewCount: number | null;
  helpfulCount: number | null;
}

export interface SemanticSearchResult {
  entry: KnowledgeEntry;
  similarity: number;
  rank: number;
}

/**
 * Perform semantic search across knowledge base entries
 * 
 * @param query - The search query text
 * @param entries - Knowledge base entries with embeddings
 * @param options - Search configuration
 * @returns Ranked results sorted by semantic similarity
 */
export async function semanticSearch(
  query: string,
  entries: KnowledgeEntry[],
  options: {
    topK?: number;
    threshold?: number;
    category?: string;
  } = {}
): Promise<SemanticSearchResult[]> {
  const topK = options.topK || DEFAULT_TOP_K;
  const threshold = options.threshold || SIMILARITY_THRESHOLD;

  // Filter by category if specified
  let filteredEntries = entries;
  if (options.category) {
    filteredEntries = entries.filter(e => e.category === options.category);
  }

  // Only consider entries with embeddings
  const entriesWithEmbeddings = filteredEntries.filter(e => e.embedding && e.embedding.length > 0);

  if (entriesWithEmbeddings.length === 0) {
    // Fall back to keyword search if no embeddings available
    return keywordFallbackSearch(query, filteredEntries, topK);
  }

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Calculate similarity for each entry
  const results: SemanticSearchResult[] = entriesWithEmbeddings
    .map(entry => ({
      entry,
      similarity: cosineSimilarity(queryEmbedding, entry.embedding!),
      rank: 0,
    }))
    .filter(r => r.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  // Assign ranks
  results.forEach((r, i) => {
    r.rank = i + 1;
  });

  // If semantic search yields too few results, supplement with keyword search
  if (results.length < 2) {
    const keywordResults = keywordFallbackSearch(query, filteredEntries, topK - results.length);
    const existingIds = new Set(results.map(r => r.entry.entryId));
    for (const kr of keywordResults) {
      if (!existingIds.has(kr.entry.entryId)) {
        kr.rank = results.length + 1;
        results.push(kr);
      }
    }
  }

  return results;
}

/**
 * Keyword-based fallback search when embeddings are not available
 */
function keywordFallbackSearch(
  query: string,
  entries: KnowledgeEntry[],
  topK: number
): SemanticSearchResult[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  const scored = entries.map(entry => {
    let score = 0;
    const searchableText = [
      entry.title,
      entry.titleAr,
      entry.content,
      entry.contentAr,
      ...(entry.tags || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // Exact phrase match (highest weight)
    if (searchableText.includes(queryLower)) {
      score += 0.9;
    }

    // Individual word matches
    for (const word of queryWords) {
      if (searchableText.includes(word)) {
        score += 0.3 / queryWords.length;
      }
    }

    // Title match bonus
    const titleText = `${entry.title} ${entry.titleAr}`.toLowerCase();
    if (titleText.includes(queryLower)) {
      score += 0.2;
    }

    // Tag match bonus
    if (entry.tags) {
      for (const tag of entry.tags) {
        if (tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())) {
          score += 0.15;
        }
      }
    }

    return {
      entry,
      similarity: Math.min(score, 1.0),
      rank: 0,
    };
  });

  return scored
    .filter(s => s.similarity > 0.1)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// ═══════════════════════════════════════════════════════════════
// EMBEDDING MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * Prepare the text content for embedding generation
 * Combines title, content, and tags into a single searchable string
 */
export function prepareEmbeddingText(entry: {
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  category: string;
  tags?: string[] | null;
}): string {
  const parts = [
    `[${entry.category}]`,
    entry.titleAr || entry.title,
    entry.contentAr || entry.content,
  ];

  if (entry.tags && entry.tags.length > 0) {
    parts.push(`العلامات: ${entry.tags.join(", ")}`);
  }

  return parts.join("\n");
}

/**
 * Clear the embedding cache (useful after bulk updates)
 */
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}

/**
 * Get cache statistics
 */
export function getEmbeddingCacheStats(): { size: number } {
  return { size: embeddingCache.size };
}
