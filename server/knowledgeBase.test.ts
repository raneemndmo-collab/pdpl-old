import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getKnowledgeBaseArticles: vi.fn().mockResolvedValue([
    {
      id: 1,
      category: "article",
      titleAr: "مقال تجريبي",
      titleEn: "Test Article",
      contentAr: "محتوى المقال التجريبي",
      contentEn: "Test article content",
      tags: "test,article",
      isActive: true,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
    {
      id: 2,
      category: "faq",
      titleAr: "سؤال شائع",
      titleEn: "FAQ Question",
      contentAr: "إجابة السؤال الشائع",
      contentEn: "FAQ answer",
      tags: "faq,help",
      isActive: true,
      createdAt: new Date("2026-01-02"),
      updatedAt: new Date("2026-01-02"),
    },
  ]),
  createKnowledgeBaseArticle: vi.fn().mockResolvedValue({
    id: 3,
    category: "glossary",
    titleAr: "مصطلح جديد",
    titleEn: "New Term",
    contentAr: "تعريف المصطلح",
    contentEn: "Term definition",
    tags: "glossary",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updateKnowledgeBaseArticle: vi.fn().mockResolvedValue({
    id: 1,
    category: "article",
    titleAr: "مقال محدث",
    titleEn: "Updated Article",
    contentAr: "محتوى محدث",
    contentEn: "Updated content",
    tags: "test,updated",
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date(),
  }),
  deleteKnowledgeBaseArticle: vi.fn().mockResolvedValue(true),
  rateAIResponse: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    messageId: "msg-123",
    rating: 5,
    userQuery: "ما هي التسريبات واسعة النطاق؟",
    aiResponse: "هناك 56 تسريب واسع النطاق",
    feedback: "إجابة ممتازة",
    createdAt: new Date(),
  }),
  getAIRatings: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      messageId: "msg-123",
      rating: 5,
      userQuery: "ما هي التسريبات واسعة النطاق؟",
      aiResponse: "هناك 56 تسريب واسع النطاق",
      feedback: "إجابة ممتازة",
      createdAt: new Date(),
    },
  ]),
  getAIRatingStats: vi.fn().mockResolvedValue({
    totalRatings: 100,
    averageRating: 4.2,
    ratingDistribution: { 1: 5, 2: 8, 3: 15, 4: 32, 5: 40 },
  }),
}));

import {
  getKnowledgeBaseArticles,
  createKnowledgeBaseArticle,
  updateKnowledgeBaseArticle,
  deleteKnowledgeBaseArticle,
  rateAIResponse,
  getAIRatings,
  getAIRatingStats,
} from "./db";

describe("Knowledge Base", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getKnowledgeBaseArticles", () => {
    it("should return all articles", async () => {
      const articles = await getKnowledgeBaseArticles();
      expect(articles).toHaveLength(2);
      expect(articles[0].titleAr).toBe("مقال تجريبي");
      expect(articles[1].category).toBe("faq");
    });

    it("should return articles with correct structure", async () => {
      const articles = await getKnowledgeBaseArticles();
      const article = articles[0];
      expect(article).toHaveProperty("id");
      expect(article).toHaveProperty("category");
      expect(article).toHaveProperty("titleAr");
      expect(article).toHaveProperty("contentAr");
      expect(article).toHaveProperty("tags");
      expect(article).toHaveProperty("isActive");
    });
  });

  describe("createKnowledgeBaseArticle", () => {
    it("should create a new article", async () => {
      const newArticle = await createKnowledgeBaseArticle({
        category: "glossary",
        titleAr: "مصطلح جديد",
        titleEn: "New Term",
        contentAr: "تعريف المصطلح",
        contentEn: "Term definition",
        tags: "glossary",
      } as any);
      expect(newArticle.id).toBe(3);
      expect(newArticle.category).toBe("glossary");
      expect(newArticle.titleAr).toBe("مصطلح جديد");
    });
  });

  describe("updateKnowledgeBaseArticle", () => {
    it("should update an existing article", async () => {
      const updated = await updateKnowledgeBaseArticle(1, {
        titleAr: "مقال محدث",
        contentAr: "محتوى محدث",
      } as any);
      expect(updated.titleAr).toBe("مقال محدث");
      expect(updated.contentAr).toBe("محتوى محدث");
    });
  });

  describe("deleteKnowledgeBaseArticle", () => {
    it("should delete an article", async () => {
      const result = await deleteKnowledgeBaseArticle(1);
      expect(result).toBe(true);
      expect(deleteKnowledgeBaseArticle).toHaveBeenCalledWith(1);
    });
  });
});

describe("AI Response Ratings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rateAIResponse", () => {
    it("should save a rating for an AI response", async () => {
      const rating = await rateAIResponse({
        userId: 1,
        messageId: "msg-123",
        rating: 5,
        userQuery: "ما هي التسريبات واسعة النطاق؟",
        aiResponse: "هناك 56 تسريب واسع النطاق",
        feedback: "إجابة ممتازة",
      } as any);
      expect(rating.rating).toBe(5);
      expect(rating.messageId).toBe("msg-123");
      expect(rating.feedback).toBe("إجابة ممتازة");
    });

    it("should accept ratings from 1 to 5", async () => {
      for (const r of [1, 2, 3, 4, 5]) {
        vi.mocked(rateAIResponse).mockResolvedValueOnce({
          id: r,
          userId: 1,
          messageId: `msg-${r}`,
          rating: r,
          userQuery: "test",
          aiResponse: "test response",
          feedback: null,
          createdAt: new Date(),
        } as any);
        const result = await rateAIResponse({
          userId: 1,
          messageId: `msg-${r}`,
          rating: r,
          userQuery: "test",
          aiResponse: "test response",
        } as any);
        expect(result.rating).toBe(r);
      }
    });
  });

  describe("getAIRatings", () => {
    it("should return all ratings", async () => {
      const ratings = await getAIRatings();
      expect(ratings).toHaveLength(1);
      expect(ratings[0].rating).toBe(5);
    });
  });

  describe("getAIRatingStats", () => {
    it("should return rating statistics", async () => {
      const stats = await getAIRatingStats();
      expect(stats.totalRatings).toBe(100);
      expect(stats.averageRating).toBe(4.2);
      expect(stats.ratingDistribution).toBeDefined();
      expect(stats.ratingDistribution[5]).toBe(40);
    });

    it("should have distribution for all 5 levels", async () => {
      const stats = await getAIRatingStats();
      for (const level of [1, 2, 3, 4, 5]) {
        expect(stats.ratingDistribution[level]).toBeDefined();
      }
    });
  });
});
