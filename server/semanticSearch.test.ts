import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  cosineSimilarity,
  prepareEmbeddingText,
  clearEmbeddingCache,
  getEmbeddingCacheStats,
  type KnowledgeEntry,
} from "./semanticSearch";

// ═══════════════════════════════════════════════════════════════
// UNIT TESTS — Semantic Search Engine
// ═══════════════════════════════════════════════════════════════

describe("Semantic Search Engine", () => {
  beforeEach(() => {
    clearEmbeddingCache();
  });

  // ─── Cosine Similarity ──────────────────────────────────────
  describe("cosineSimilarity", () => {
    it("should return 1.0 for identical vectors", () => {
      const vec = [1, 2, 3, 4, 5];
      expect(cosineSimilarity(vec, vec)).toBeCloseTo(1.0, 5);
    });

    it("should return 0.0 for orthogonal vectors", () => {
      const a = [1, 0, 0];
      const b = [0, 1, 0];
      expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 5);
    });

    it("should return -1.0 for opposite vectors", () => {
      const a = [1, 2, 3];
      const b = [-1, -2, -3];
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
    });

    it("should return a value between -1 and 1", () => {
      const a = [0.5, 0.3, 0.8, 0.1];
      const b = [0.2, 0.9, 0.4, 0.7];
      const result = cosineSimilarity(a, b);
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
    });

    it("should handle zero vectors", () => {
      const a = [0, 0, 0];
      const b = [1, 2, 3];
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it("should throw for mismatched dimensions", () => {
      const a = [1, 2, 3];
      const b = [1, 2];
      expect(() => cosineSimilarity(a, b)).toThrow("dimension mismatch");
    });

    it("should be symmetric (a,b) = (b,a)", () => {
      const a = [0.1, 0.5, 0.9, 0.3];
      const b = [0.4, 0.2, 0.7, 0.8];
      expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
    });

    it("should handle large vectors (1536 dimensions like ada-002)", () => {
      const a = Array.from({ length: 1536 }, (_, i) => Math.sin(i * 0.01));
      const b = Array.from({ length: 1536 }, (_, i) => Math.cos(i * 0.01));
      const result = cosineSimilarity(a, b);
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
    });

    it("should correctly rank similar vs dissimilar vectors", () => {
      const query = [1, 0, 0, 0];
      const similar = [0.9, 0.1, 0, 0]; // Close to query
      const dissimilar = [0, 0, 1, 0]; // Orthogonal to query

      const simScore = cosineSimilarity(query, similar);
      const dissimScore = cosineSimilarity(query, dissimilar);
      expect(simScore).toBeGreaterThan(dissimScore);
    });
  });

  // ─── Prepare Embedding Text ─────────────────────────────────
  describe("prepareEmbeddingText", () => {
    it("should combine category, title, and content", () => {
      const result = prepareEmbeddingText({
        title: "PDPL Overview",
        titleAr: "نظرة عامة على PDPL",
        content: "The Personal Data Protection Law",
        contentAr: "نظام حماية البيانات الشخصية",
        category: "policy",
        tags: null,
      });

      expect(result).toContain("[policy]");
      expect(result).toContain("نظرة عامة على PDPL");
      expect(result).toContain("نظام حماية البيانات الشخصية");
    });

    it("should prefer Arabic content when available", () => {
      const result = prepareEmbeddingText({
        title: "English Title",
        titleAr: "عنوان عربي",
        content: "English content",
        contentAr: "محتوى عربي",
        category: "article",
        tags: null,
      });

      expect(result).toContain("عنوان عربي");
      expect(result).toContain("محتوى عربي");
    });

    it("should include tags when present", () => {
      const result = prepareEmbeddingText({
        title: "Test",
        titleAr: "اختبار",
        content: "Test content",
        contentAr: "محتوى اختبار",
        category: "faq",
        tags: ["PDPL", "حماية البيانات", "خصوصية"],
      });

      expect(result).toContain("العلامات:");
      expect(result).toContain("PDPL");
      expect(result).toContain("حماية البيانات");
      expect(result).toContain("خصوصية");
    });

    it("should handle empty tags array", () => {
      const result = prepareEmbeddingText({
        title: "Test",
        titleAr: "اختبار",
        content: "Content",
        contentAr: "محتوى",
        category: "glossary",
        tags: [],
      });

      expect(result).not.toContain("العلامات:");
    });

    it("should fall back to English when Arabic is empty", () => {
      const result = prepareEmbeddingText({
        title: "English Title",
        titleAr: "",
        content: "English content",
        contentAr: "",
        category: "instruction",
        tags: null,
      });

      expect(result).toContain("English Title");
    });
  });

  // ─── Embedding Cache ────────────────────────────────────────
  describe("Embedding Cache", () => {
    it("should start with empty cache", () => {
      const stats = getEmbeddingCacheStats();
      expect(stats.size).toBe(0);
    });

    it("should clear cache", () => {
      clearEmbeddingCache();
      const stats = getEmbeddingCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  // ─── Knowledge Entry Type ───────────────────────────────────
  describe("KnowledgeEntry type", () => {
    it("should accept valid knowledge entry objects", () => {
      const entry: KnowledgeEntry = {
        entryId: "KB-001",
        category: "policy",
        title: "PDPL Overview",
        titleAr: "نظرة عامة على PDPL",
        content: "The Personal Data Protection Law",
        contentAr: "نظام حماية البيانات الشخصية",
        tags: ["PDPL", "privacy"],
        embedding: [0.1, 0.2, 0.3],
        viewCount: 10,
        helpfulCount: 5,
      };

      expect(entry.entryId).toBe("KB-001");
      expect(entry.embedding).toHaveLength(3);
    });

    it("should accept entries with null embedding", () => {
      const entry: KnowledgeEntry = {
        entryId: "KB-002",
        category: "faq",
        title: "FAQ",
        titleAr: "سؤال شائع",
        content: "Answer",
        contentAr: "إجابة",
        tags: null,
        embedding: null,
        viewCount: 0,
        helpfulCount: 0,
      };

      expect(entry.embedding).toBeNull();
    });
  });

  // ─── Similarity Ranking ─────────────────────────────────────
  describe("Similarity Ranking Logic", () => {
    it("should rank entries correctly by cosine similarity", () => {
      // Simulate a query embedding and entry embeddings
      const queryEmb = [1, 0, 0, 0, 0];
      
      const entries = [
        { emb: [0.9, 0.1, 0, 0, 0], expected: "most similar" },
        { emb: [0.5, 0.5, 0, 0, 0], expected: "somewhat similar" },
        { emb: [0, 0, 1, 0, 0], expected: "not similar" },
      ];

      const scores = entries.map(e => ({
        ...e,
        score: cosineSimilarity(queryEmb, e.emb),
      }));

      // Sort by score descending
      scores.sort((a, b) => b.score - a.score);

      expect(scores[0].expected).toBe("most similar");
      expect(scores[1].expected).toBe("somewhat similar");
      expect(scores[2].expected).toBe("not similar");
    });

    it("should correctly identify near-duplicate content", () => {
      // Two very similar vectors should have high similarity
      const a = Array.from({ length: 10 }, (_, i) => Math.sin(i * 0.5));
      const b = Array.from({ length: 10 }, (_, i) => Math.sin(i * 0.5) + 0.01);
      
      const similarity = cosineSimilarity(a, b);
      expect(similarity).toBeGreaterThan(0.99);
    });
  });
});
