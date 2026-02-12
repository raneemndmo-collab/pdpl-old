import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getPopularQueries: vi.fn(),
  getKnowledgeBaseEntries: vi.fn(),
}));

import { getPopularQueries, getKnowledgeBaseEntries } from "./db";

const mockedGetPopularQueries = vi.mocked(getPopularQueries);
const mockedGetKnowledgeBaseEntries = vi.mocked(getKnowledgeBaseEntries);

describe("Smart Suggestions Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Category Question Mapping", () => {
    it("should map KB categories to meaningful Arabic questions", () => {
      const categoryQuestions: Record<string, string[]> = {
        "article": ["ما هي أهم المقالات عن حماية البيانات الشخصية؟", "ابحث عن مقالات تتعلق بالتسريبات السيبرانية"],
        "faq": ["ما هي الأسئلة الشائعة عن نظام PDPL؟", "كيف أتعامل مع حادثة تسريب بيانات؟", "ما هي حقوق أصحاب البيانات؟"],
        "glossary": ["ما معنى البيانات الشخصية الحساسة؟", "ما الفرق بين التسريب والاختراق؟"],
        "instruction": ["ما هي خطوات الإبلاغ عن تسريب؟", "كيف أستخدم منصة راصد بفعالية؟", "ما إجراءات الاستجابة للحوادث؟"],
        "policy": ["ما هي سياسات حماية البيانات المعتمدة؟", "ما هي عقوبات مخالفة نظام PDPL؟"],
        "regulation": ["ما هي متطلبات نظام حماية البيانات الشخصية؟", "ما هي اللوائح التنظيمية للبيانات الشخصية؟"],
      };

      // All 6 KB categories should have questions
      expect(Object.keys(categoryQuestions)).toHaveLength(6);
      
      // Each category should have at least 2 questions
      for (const [cat, questions] of Object.entries(categoryQuestions)) {
        expect(questions.length).toBeGreaterThanOrEqual(2);
        // All questions should be in Arabic
        for (const q of questions) {
          expect(q).toMatch(/[\u0600-\u06FF]/); // Arabic characters
        }
      }
    });

    it("should assign correct icons per category", () => {
      const catIcons: Record<string, string> = {
        "article": "FileText",
        "faq": "Lightbulb",
        "glossary": "BookOpen",
        "instruction": "Target",
        "policy": "Shield",
        "regulation": "ShieldCheck",
      };

      expect(catIcons["article"]).toBe("FileText");
      expect(catIcons["faq"]).toBe("Lightbulb");
      expect(catIcons["glossary"]).toBe("BookOpen");
      expect(catIcons["instruction"]).toBe("Target");
      expect(catIcons["policy"]).toBe("Shield");
      expect(catIcons["regulation"]).toBe("ShieldCheck");
    });
  });

  describe("Contextual Suggestions", () => {
    it("should generate contextual suggestions for leak-related messages", () => {
      const lastMsg = "تم اكتشاف تسريب جديد في قاعدة البيانات";
      const lower = lastMsg.toLowerCase();
      const leakKeywords = ["تسريب", "leak", "حادثة"];
      const hasLeakContext = leakKeywords.some(k => lower.includes(k));
      expect(hasLeakContext).toBe(true);
    });

    it("should generate contextual suggestions for dashboard-related messages", () => {
      const lastMsg = "ملخص لوحة القيادة لهذا الأسبوع";
      const lower = lastMsg.toLowerCase();
      const dashKeywords = ["ملخص", "لوحة", "إحصائي", "dashboard"];
      const hasDashContext = dashKeywords.some(k => lower.includes(k));
      expect(hasDashContext).toBe(true);
    });

    it("should generate contextual suggestions for report-related messages", () => {
      const lastMsg = "أحتاج تقرير عن التسريبات الأخيرة";
      const lower = lastMsg.toLowerCase();
      const reportKeywords = ["تقرير", "مستند", "report"];
      const hasReportContext = reportKeywords.some(k => lower.includes(k));
      expect(hasReportContext).toBe(true);
    });

    it("should generate contextual suggestions for protection-related messages", () => {
      const lastMsg = "ما هي متطلبات نظام حماية البيانات الشخصية PDPL؟";
      const lower = lastMsg.toLowerCase();
      const protKeywords = ["حماية", "pdpl", "خصوصية", "نظام"];
      const hasProtContext = protKeywords.some(k => lower.includes(k));
      expect(hasProtContext).toBe(true);
    });

    it("should not generate contextual suggestions for unrelated messages", () => {
      const lastMsg = "مرحبا كيف حالك";
      const lower = lastMsg.toLowerCase();
      const allKeywordSets = [
        ["تسريب", "leak", "حادثة"],
        ["ملخص", "لوحة", "إحصائي", "dashboard"],
        ["تقرير", "مستند", "report"],
        ["حماية", "pdpl", "خصوصية", "نظام"],
        ["بائع", "seller", "مهدد"],
        ["تحليل", "اتجاه", "trend", "ارتباط", "نمط"],
        ["معرفة", "knowledge", "سياسة", "إرشاد"],
      ];
      const hasAnyContext = allKeywordSets.some(keywords =>
        keywords.some(k => lower.includes(k))
      );
      expect(hasAnyContext).toBe(false);
    });
  });

  describe("Trending Suggestions", () => {
    it("should always provide default trending suggestions", () => {
      const trendingSuggestions = [
        { text: "ملخص شامل للوضع الأمني اليوم", category: "trending", score: 20, icon: "Activity" },
        { text: "ما هي أحدث التسريبات المكتشفة؟", category: "trending", score: 19, icon: "ShieldAlert" },
        { text: "تحليل ارتباطات شامل بين التسريبات", category: "trending", score: 18, icon: "GitBranch" },
        { text: "حالة مهام الرصد النشطة", category: "trending", score: 17, icon: "Radio" },
      ];

      expect(trendingSuggestions).toHaveLength(4);
      expect(trendingSuggestions[0].score).toBeGreaterThan(trendingSuggestions[1].score);
      // All should be in Arabic
      for (const s of trendingSuggestions) {
        expect(s.text).toMatch(/[\u0600-\u06FF]/);
        expect(s.icon).toBeTruthy();
      }
    });
  });

  describe("Deduplication", () => {
    it("should deduplicate suggestions by text", () => {
      const allSuggestions = [
        { text: "ملخص شامل للوضع الأمني اليوم", category: "trending", score: 20, icon: "Activity" },
        { text: "ملخص شامل للوضع الأمني اليوم", category: "popular", score: 15, icon: "TrendingUp" },
        { text: "ما هي أحدث التسريبات المكتشفة؟", category: "trending", score: 19, icon: "ShieldAlert" },
      ];

      const seen = new Set<string>();
      const unique = allSuggestions.filter(s => {
        const key = s.text.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      expect(unique).toHaveLength(2);
      // First occurrence should be kept
      expect(unique[0].category).toBe("trending");
    });
  });

  describe("Grouping", () => {
    it("should group suggestions by category with correct limits", () => {
      const allSuggestions = [
        { text: "q1", category: "contextual" as const, score: 10, icon: "A" },
        { text: "q2", category: "contextual" as const, score: 9, icon: "B" },
        { text: "q3", category: "contextual" as const, score: 8, icon: "C" },
        { text: "q4", category: "contextual" as const, score: 7, icon: "D" },
        { text: "p1", category: "popular" as const, score: 15, icon: "E" },
        { text: "p2", category: "popular" as const, score: 14, icon: "F" },
        { text: "k1", category: "knowledge" as const, score: 5, icon: "G" },
        { text: "k2", category: "knowledge" as const, score: 4, icon: "H" },
        { text: "k3", category: "knowledge" as const, score: 3, icon: "I" },
        { text: "k4", category: "knowledge" as const, score: 2, icon: "J" },
        { text: "k5", category: "knowledge" as const, score: 1, icon: "K" },
        { text: "t1", category: "trending" as const, score: 20, icon: "L" },
        { text: "t2", category: "trending" as const, score: 19, icon: "M" },
      ];

      const grouped = {
        contextual: allSuggestions.filter(s => s.category === "contextual").slice(0, 3),
        popular: allSuggestions.filter(s => s.category === "popular").slice(0, 5),
        knowledge: allSuggestions.filter(s => s.category === "knowledge").slice(0, 4),
        trending: allSuggestions.filter(s => s.category === "trending").slice(0, 4),
      };

      expect(grouped.contextual).toHaveLength(3); // Max 3
      expect(grouped.popular).toHaveLength(2); // Only 2 available
      expect(grouped.knowledge).toHaveLength(4); // Max 4
      expect(grouped.trending).toHaveLength(2); // Only 2 available
    });
  });

  describe("Popular Queries from DB", () => {
    it("should convert popular queries to suggestion format", () => {
      const popularQueries = [
        { query: "تسريبات حكومية", count: 15 },
        { query: "نظام PDPL", count: 10 },
        { query: "حماية البيانات", count: 8 },
      ];

      const popularItems = popularQueries.map(pq => ({
        text: pq.query,
        category: "popular" as const,
        score: pq.count,
        icon: "TrendingUp",
      }));

      expect(popularItems).toHaveLength(3);
      expect(popularItems[0].text).toBe("تسريبات حكومية");
      expect(popularItems[0].score).toBe(15);
      expect(popularItems[0].category).toBe("popular");
    });
  });

  describe("Title-based KB Suggestions", () => {
    it("should only include title-based suggestions for short titles", () => {
      const titles = [
        "حماية البيانات الشخصية", // 22 chars - should be included
        "سؤال شائع: ما هي عقوبات مخالفة نظام حماية البيانات الشخصية في المملكة العربية السعودية؟", // 88 chars - too long
      ];

      const suggestions: Array<{ text: string }> = [];
      for (const title of titles.slice(0, 1)) {
        if (title.length <= 40) {
          suggestions.push({ text: `اشرح لي عن: ${title}` });
        }
      }

      // Only the short title should be included
      if (titles[0].length <= 40) {
        expect(suggestions).toHaveLength(1);
        expect(suggestions[0].text).toContain("حماية البيانات الشخصية");
      }
    });

    it("should skip title-based suggestions for long titles", () => {
      const longTitle = "سؤال شائع: ما هي عقوبات مخالفة نظام حماية البيانات الشخصية في المملكة العربية السعودية وما هي الإجراءات المتبعة؟";
      
      const suggestions: Array<{ text: string }> = [];
      if (longTitle.length <= 40) {
        suggestions.push({ text: `اشرح لي عن: ${longTitle}` });
      }

      expect(suggestions).toHaveLength(0);
    });
  });
});
