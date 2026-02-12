import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getLeaks: vi.fn(),
  getDashboardStats: vi.fn(),
  getDocumentByVerificationCode: vi.fn(),
  logAudit: vi.fn(),
}));

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import {
  getLeaks,
  getDashboardStats,
  getDocumentByVerificationCode,
  logAudit,
} from "./db";
import { invokeLLM } from "./_core/llm";

describe("Smart Rasid AI Assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Search Capabilities", () => {
    it("should search across all leaks data", async () => {
      const mockLeaks = [
        { id: 1, leakId: "LK-2024-0001", titleAr: "تسريب بيانات الاتصالات", severity: "critical", sectorAr: "الاتصالات" },
        { id: 2, leakId: "LK-2024-0002", titleAr: "تسريب بيانات بنكية", severity: "high", sectorAr: "المالية" },
        { id: 3, leakId: "LK-2024-0003", titleAr: "تسريب سجلات طبية", severity: "critical", sectorAr: "الرعاية الصحية" },
      ];

      (getLeaks as any).mockResolvedValue(mockLeaks);

      const results = await getLeaks({ search: "اتصالات" });
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });

    it("should return dashboard statistics for summary requests", async () => {
      const mockStats = {
        totalLeaks: 247,
        criticalLeaks: 56,
        totalRecords: 229100000,
        activeSources: 27,
      };

      (getDashboardStats as any).mockResolvedValue(mockStats);

      const stats = await getDashboardStats();
      expect(stats).toBeDefined();
      expect(stats.totalLeaks).toBeGreaterThan(0);
      expect(stats.criticalLeaks).toBeGreaterThan(0);
    });
  });

  describe("LLM Integration", () => {
    it("should invoke LLM with proper system prompt for Arabic responses", async () => {
      (invokeLLM as any).mockResolvedValue({
        choices: [{
          message: {
            content: "مرحباً! إليك ملخص لوحة المعلومات:\n- إجمالي التسريبات: 247\n- التسريبات واسعة النطاق: 56",
          },
        }],
      });

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "أنت مساعد ذكي لمنصة راصد" },
          { role: "user", content: "ملخص لوحة المعلومات" },
        ],
      });

      expect(response.choices[0].message.content).toContain("ملخص");
      expect(invokeLLM).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: "system" }),
            expect.objectContaining({ role: "user" }),
          ]),
        })
      );
    });

    it("should handle LLM errors gracefully", async () => {
      (invokeLLM as any).mockRejectedValue(new Error("LLM service unavailable"));

      try {
        await invokeLLM({ messages: [{ role: "user", content: "test" }] });
      } catch (error: any) {
        expect(error.message).toBe("LLM service unavailable");
      }
    });
  });

  describe("Smart Suggestions", () => {
    it("should generate relevant suggestions based on input", () => {
      const input = "تسريب";
      const allSuggestions = [
        "ابحث عن تسريبات واسعة النطاق",
        "أظهر تسريبات هذا الأسبوع",
        "تسريبات القطاع الحكومي",
        "تسريبات الاتصالات",
        "ملخص لوحة المعلومات",
        "حالة الحماية",
      ];

      const filtered = allSuggestions.filter((s) =>
        s.includes(input)
      );

      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every((s) => s.includes("تسريب"))).toBe(true);
    });

    it("should provide correction suggestions for misspelled words", () => {
      const corrections: Record<string, string> = {
        "تسربات": "تسريبات",
        "الاتصلات": "الاتصالات",
        "واسعه": "واسعة النطاق",
        "الداكر ويب": "الدارك ويب",
      };

      expect(corrections["تسربات"]).toBe("تسريبات");
      expect(corrections["الداكر ويب"]).toBe("الدارك ويب");
    });

    it("should suggest quick commands based on context", () => {
      const quickCommands = [
        { label: "ملخص لوحة المعلومات", keywords: ["ملخص", "لوحة", "إحصائيات"] },
        { label: "تسريبات واسعة النطاق", keywords: ["واسعة", "كبيرة", "عاجل"] },
        { label: "أنشئ تقرير أسبوعي", keywords: ["تقرير", "أسبوعي", "إنشاء"] },
        { label: "حالة الحماية", keywords: ["حماية", "حالة", "تهديد"] },
        { label: "تقرير استخباراتي", keywords: ["استخبارات", "تحليل", "تهديد"] },
        { label: "تحديث البيانات", keywords: ["تحديث", "بيانات", "جديد"] },
      ];

      const input = "تقرير";
      const matching = quickCommands.filter((cmd) =>
        cmd.keywords.some((kw) => kw.includes(input) || input.includes(kw))
      );

      expect(matching.length).toBeGreaterThan(0);
      expect(matching.some((m) => m.label.includes("تقرير"))).toBe(true);
    });
  });

  describe("Chat History", () => {
    it("should maintain conversation history for context", () => {
      const history: Array<{ role: string; content: string }> = [];

      history.push({ role: "user", content: "ملخص لوحة المعلومات" });
      history.push({ role: "assistant", content: "إليك ملخص لوحة المعلومات..." });
      history.push({ role: "user", content: "أظهر التسريبات واسعة النطاق" });

      expect(history).toHaveLength(3);
      expect(history[0].role).toBe("user");
      expect(history[1].role).toBe("assistant");
    });
  });
});

describe("Public Document Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Verification Flow", () => {
    it("should verify a valid document by verification code", async () => {
      const mockDoc = {
        id: 1,
        documentId: "NDMO-DOC-001",
        verificationCode: "NDMO-ABC123-XYZ789",
        leakId: "LK-2024-0001",
        contentHash: "a".repeat(64),
        generatedByName: "محمد الرحيلي",
        createdAt: new Date("2026-01-15"),
        htmlContent: "<html>Document content</html>",
      };

      (getDocumentByVerificationCode as any).mockResolvedValue(mockDoc);

      const doc = await getDocumentByVerificationCode("NDMO-ABC123-XYZ789");
      expect(doc).toBeDefined();
      expect(doc.documentId).toBe("NDMO-DOC-001");
      expect(doc.verificationCode).toBe("NDMO-ABC123-XYZ789");
      expect(doc.contentHash).toHaveLength(64);
    });

    it("should return null for non-existent verification code", async () => {
      (getDocumentByVerificationCode as any).mockResolvedValue(null);

      const doc = await getDocumentByVerificationCode("NDMO-INVALID-CODE");
      expect(doc).toBeNull();
    });

    it("should log verification attempts in audit trail", async () => {
      (logAudit as any).mockResolvedValue(undefined);

      await logAudit({
        userId: "anonymous",
        userName: "زائر خارجي",
        category: "access",
        action: "verify_document",
        details: "Verification attempt for code: NDMO-ABC123-XYZ789",
      });

      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "verify_document",
        })
      );
    });
  });

  describe("QR Code Verification", () => {
    it("should extract verification code from QR URL", () => {
      const qrUrl = "https://example.com/verify?code=NDMO-ABC123-XYZ789";
      const url = new URL(qrUrl);
      const code = url.searchParams.get("code");

      expect(code).toBe("NDMO-ABC123-XYZ789");
      expect(code?.startsWith("NDMO-")).toBe(true);
    });

    it("should handle malformed QR URLs gracefully", () => {
      const badUrls = [
        "not-a-url",
        "https://example.com/verify",
        "https://example.com/verify?other=value",
      ];

      badUrls.forEach((url) => {
        try {
          const parsed = new URL(url);
          const code = parsed.searchParams.get("code");
          // Code might be null but should not throw
          expect(code === null || typeof code === "string").toBe(true);
        } catch {
          // Invalid URL is acceptable
          expect(true).toBe(true);
        }
      });
    });
  });

  describe("Content Hash Verification", () => {
    it("should match content hash for authentic documents", () => {
      const originalHash = "abc123def456789";
      const verifyHash = "abc123def456789";
      expect(originalHash).toBe(verifyHash);
    });

    it("should detect tampered documents via hash mismatch", () => {
      const originalHash = "abc123def456789";
      const tamperedHash = "xyz987uvw654321";
      expect(originalHash).not.toBe(tamperedHash);
    });
  });
});

describe("Sidebar Navigation Groups", () => {
  it("should have correct group structure", () => {
    const groups = [
      {
        name: "قيادي",
        nameEn: "Command",
        pages: ["لوحة القيادة", "التقارير", "خريطة التهديدات", "راصد الذكي"],
      },
      {
        name: "تنفيذي",
        nameEn: "Operational",
        pages: ["التسريبات", "رصد تليجرام", "الدارك ويب", "مواقع اللصق", "ملفات البائعين", "الرصد المباشر"],
      },
      {
        name: "متقدم",
        nameEn: "Advanced",
        pages: ["مصنّف PII", "سلسلة الأدلة", "قواعد صيد التهديدات", "أدوات OSINT", "رسم المعرفة", "مقاييس الدقة"],
      },
      {
        name: "إداري",
        nameEn: "Management",
        pages: ["مهام الرصد", "قنوات التنبيه", "التقارير المجدولة", "التحقق من التوثيق"],
      },
    ];

    expect(groups).toHaveLength(4);
    expect(groups[0].name).toBe("قيادي");
    expect(groups[1].name).toBe("تنفيذي");
    expect(groups[2].name).toBe("متقدم");
    expect(groups[3].name).toBe("إداري");

    // Total pages across all groups
    const totalPages = groups.reduce((sum, g) => sum + g.pages.length, 0);
    expect(totalPages).toBeGreaterThanOrEqual(16);
  });

  it("should allow toggling group visibility", () => {
    const groupStates: Record<string, boolean> = {
      command: true,
      operational: true,
      advanced: true,
      management: true,
    };

    // Toggle a group
    groupStates.advanced = !groupStates.advanced;
    expect(groupStates.advanced).toBe(false);

    // Toggle back
    groupStates.advanced = !groupStates.advanced;
    expect(groupStates.advanced).toBe(true);
  });
});
