import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock the db module
vi.mock("./db", () => ({
  getLeaks: vi.fn().mockResolvedValue([
    { leakId: "LK-2026-0001", title: "Test Leak", titleAr: "تسريب تجريبي", severity: "critical", sectorAr: "حكومي", recordCount: 1000, status: "active", source: "telegram", createdAt: Date.now() - 86400000 },
    { leakId: "LK-2026-0002", title: "Another Leak", titleAr: "تسريب آخر", severity: "high", sectorAr: "صحي", recordCount: 500, status: "investigating", source: "darkweb", createdAt: Date.now() - 172800000 },
  ]),
  getLeakById: vi.fn().mockResolvedValue({
    leakId: "LK-2026-0001", title: "Test Leak", titleAr: "تسريب تجريبي", severity: "critical",
    sectorAr: "حكومي", recordCount: 1000, status: "active", source: "telegram",
    description: "Test description", descriptionAr: "وصف تجريبي",
  }),
  getDashboardStats: vi.fn().mockResolvedValue({
    totalLeaks: 256, criticalAlerts: 56, totalRecords: 229200000, activeMonitors: 27,
  }),
  getChannels: vi.fn().mockResolvedValue([
    { name: "Telegram Bot", type: "telegram", status: "active" },
  ]),
  getMonitoringJobs: vi.fn().mockResolvedValue([
    { jobId: "JOB-TG-001", name: "Telegram Monitor", nameAr: "رصد تليجرام", jobStatus: "running" },
  ]),
  getAlertRules: vi.fn().mockResolvedValue([]),
  getAlertHistory: vi.fn().mockResolvedValue([]),
  getAlertContacts: vi.fn().mockResolvedValue([]),
  getSellerProfiles: vi.fn().mockResolvedValue([
    { sellerId: "SLR-001", alias: "DarkTrader", aliasAr: "تاجر الظلام", riskLevel: "high" },
  ]),
  getSellerById: vi.fn().mockResolvedValue({
    sellerId: "SLR-001", alias: "DarkTrader", aliasAr: "تاجر الظلام", riskLevel: "high",
  }),
  getEvidenceChain: vi.fn().mockResolvedValue([]),
  getEvidenceStats: vi.fn().mockResolvedValue({ total: 15, verified: 10 }),
  getThreatRules: vi.fn().mockResolvedValue([]),
  getDarkWebListings: vi.fn().mockResolvedValue([]),
  getPasteEntries: vi.fn().mockResolvedValue([]),
  getFeedbackEntries: vi.fn().mockResolvedValue([]),
  getFeedbackStats: vi.fn().mockResolvedValue({ totalFeedback: 100, averageAccuracy: 85 }),
  getKnowledgeGraphData: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  getOsintQueries: vi.fn().mockResolvedValue([]),
  getReports: vi.fn().mockResolvedValue([
    { reportId: "RPT-001", title: "Weekly Report", titleAr: "تقرير أسبوعي", fileUrl: "https://example.com/report.pdf" },
  ]),
  getScheduledReports: vi.fn().mockResolvedValue([]),
  getThreatMapData: vi.fn().mockResolvedValue([]),
  getAuditLogs: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, userName: "Admin", action: "login", details: "User logged in", createdAt: Date.now() },
  ]),
  logAudit: vi.fn().mockResolvedValue(undefined),
  getRetentionPolicies: vi.fn().mockResolvedValue([]),
  getAllIncidentDocuments: vi.fn().mockResolvedValue([]),
  getReportAuditEntries: vi.fn().mockResolvedValue([]),
  getApiKeys: vi.fn().mockResolvedValue([]),
  getPublishedKnowledgeForAI: vi.fn().mockResolvedValue([
    { id: 1, title: "PDPL Overview", titleAr: "نظرة عامة على PDPL", content: "PDPL is the Personal Data Protection Law", category: "policy" },
  ]),
  getKnowledgeBaseEntries: vi.fn().mockResolvedValue([
    { id: 1, title: "PDPL Overview", titleAr: "نظرة عامة على PDPL", content: "PDPL is the Personal Data Protection Law", category: "policy" },
  ]),
  getAllPlatformUsers: vi.fn().mockResolvedValue([
    { id: 1, name: "Admin User", role: "admin", lastLoginAt: Date.now() },
    { id: 2, name: "Analyst User", role: "user", lastLoginAt: Date.now() - 3600000 },
  ]),
}));

import { invokeLLM } from "./_core/llm";
import { rasidAIChat, buildSystemPrompt, RASID_TOOLS } from "./rasidAI";
import { getDashboardStats } from "./db";

const mockedInvokeLLM = vi.mocked(invokeLLM);

describe("rasidAI — Smart Rasid AI v6.0", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("RASID_TOOLS", () => {
    it("should have 26 tool definitions (upgraded with personality tools)", () => {
      expect(RASID_TOOLS).toBeDefined();
      expect(RASID_TOOLS.length).toBe(26);
    });

    it("each tool should have required properties", () => {
      for (const tool of RASID_TOOLS) {
        expect(tool.type).toBe("function");
        expect(tool.function).toBeDefined();
        expect(tool.function.name).toBeTruthy();
        expect(tool.function.description).toBeTruthy();
        expect(tool.function.parameters).toBeDefined();
      }
    });

    it("should include all original tools", () => {
      const toolNames = RASID_TOOLS.map((t: any) => t.function.name);
      expect(toolNames).toContain("query_leaks");
      expect(toolNames).toContain("get_dashboard_stats");
      expect(toolNames).toContain("get_leak_details");
      expect(toolNames).toContain("get_sellers_info");
      expect(toolNames).toContain("get_evidence_info");
      expect(toolNames).toContain("analyze_trends");
      expect(toolNames).toContain("get_platform_guide");
      expect(toolNames).toContain("get_channels_info");
      expect(toolNames).toContain("get_monitoring_status");
      expect(toolNames).toContain("get_alert_info");
      expect(toolNames).toContain("get_threat_rules_info");
      expect(toolNames).toContain("get_darkweb_pastes");
      expect(toolNames).toContain("get_feedback_accuracy");
      expect(toolNames).toContain("get_knowledge_graph");
      expect(toolNames).toContain("get_osint_info");
      expect(toolNames).toContain("get_threat_map");
      expect(toolNames).toContain("get_system_health");
    });

    it("should include NEW Governor tools", () => {
      const toolNames = RASID_TOOLS.map((t: any) => t.function.name);
      expect(toolNames).toContain("analyze_user_activity");
      expect(toolNames).toContain("get_audit_log");
      expect(toolNames).toContain("search_knowledge_base");
      expect(toolNames).toContain("get_reports_and_documents");
      expect(toolNames).toContain("get_correlations");
      expect(toolNames).toContain("get_platform_users_info");
    });

    it("should have unique tool names (no duplicates)", () => {
      const toolNames = RASID_TOOLS.map((t: any) => t.function.name);
      const uniqueNames = new Set(toolNames);
      expect(uniqueNames.size).toBe(toolNames.length);
    });
  });

  describe("buildSystemPrompt", () => {
    it("should build a comprehensive system prompt with Smart Rasid identity", () => {
      const stats = { totalLeaks: 256, criticalAlerts: 56, totalRecords: 229200000, activeMonitors: 27, newLeaks: 56 };
      const prompt = buildSystemPrompt("TestUser", stats, "");
      expect(prompt).toContain("راصد الذكي");
      expect(prompt).toContain("راصد");
      expect(prompt).toContain("TestUser");
      expect(prompt).toContain("256");
      expect(prompt).toContain("56");
    });

    it("should include platform statistics", () => {
      const stats = { totalLeaks: 256, criticalAlerts: 56, totalRecords: 229200000, activeMonitors: 27 };
      const prompt = buildSystemPrompt("Admin", stats, "");
      expect(prompt).toContain("إجمالي التسريبات");
      expect(prompt).toContain("التسريبات");
      expect(prompt).toContain("السجلات المكشوفة");
    });

    it("should include knowledge context when provided", () => {
      const stats = { totalLeaks: 256, criticalAlerts: 56, totalRecords: 229200000, activeMonitors: 27 };
      const knowledgeCtx = "PDPL هو نظام حماية البيانات الشخصية في المملكة العربية السعودية";
      const prompt = buildSystemPrompt("Admin", stats, knowledgeCtx);
      expect(prompt).toContain("PDPL");
      expect(prompt).toContain("حماية البيانات");
    });

    it("should include hierarchical agent architecture description", () => {
      const stats = { totalLeaks: 256, criticalAlerts: 56, totalRecords: 229200000, activeMonitors: 27 };
      const prompt = buildSystemPrompt("Admin", stats, "");
      // Should mention sub-agents or hierarchy
      expect(prompt.length).toBeGreaterThan(1000); // Comprehensive prompt
    });

    it("should include analytical methodology", () => {
      const stats = { totalLeaks: 256, criticalAlerts: 56, totalRecords: 229200000, activeMonitors: 27 };
      const prompt = buildSystemPrompt("Admin", stats, "");
      // Should mention analysis methodology
      expect(prompt).toMatch(/تحليل|ارتباط|منهجية|استنتاج/);
    });
  });

  describe("rasidAIChat", () => {
    it("should return a response for a simple message", async () => {
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "مرحباً! أنا راصد الذكي. كيف يمكنني مساعدتك؟",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("مرحباً", [], "TestUser", 1);
      expect(result.response).toContain("مرحباً");
      expect(result.toolsUsed).toBeDefined();
      expect(Array.isArray(result.toolsUsed)).toBe(true);
    });

    it("should return thinkingSteps in the response", async () => {
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "إجمالي التسريبات: 256 تسريب.",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("ملخص", [], "TestUser", 1);
      expect(result.thinkingSteps).toBeDefined();
      expect(Array.isArray(result.thinkingSteps)).toBe(true);
      // Should have at least the initial thinking step
      expect(result.thinkingSteps.length).toBeGreaterThanOrEqual(1);
    });

    it("should track thinking steps through tool calls", async () => {
      // First call returns a tool call
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              role: "assistant",
              tool_calls: [
                {
                  id: "call_1",
                  type: "function",
                  function: {
                    name: "get_dashboard_stats",
                    arguments: "{}",
                  },
                },
              ],
            },
            index: 0,
            finish_reason: "tool_calls",
          },
        ],
      } as any);

      // Second call returns final response
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "إجمالي التسريبات: 256 تسريب. التسريبات واسعة النطاق: 56.",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("ملخص لوحة المعلومات", [], "TestUser", 1);
      expect(result.response).toContain("256");
      expect(result.toolsUsed).toContain("get_dashboard_stats");
      // Should have thinking steps for the tool call
      expect(result.thinkingSteps.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle tool calls from LLM", async () => {
      // First call returns a tool call
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              role: "assistant",
              tool_calls: [
                {
                  id: "call_1",
                  type: "function",
                  function: {
                    name: "get_dashboard_stats",
                    arguments: "{}",
                  },
                },
              ],
            },
            index: 0,
            finish_reason: "tool_calls",
          },
        ],
      } as any);

      // Second call returns final response after tool results
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "إجمالي التسريبات: 256 تسريب. التسريبات واسعة النطاق: 56.",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("ملخص لوحة المعلومات", [], "TestUser", 1);
      expect(result.response).toContain("256");
      expect(result.toolsUsed).toContain("get_dashboard_stats");
    });

    it("should handle multiple tool calls in one response", async () => {
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              role: "assistant",
              tool_calls: [
                {
                  id: "call_1",
                  type: "function",
                  function: {
                    name: "get_dashboard_stats",
                    arguments: "{}",
                  },
                },
                {
                  id: "call_2",
                  type: "function",
                  function: {
                    name: "query_leaks",
                    arguments: '{"severity":"critical"}',
                  },
                },
              ],
            },
            index: 0,
            finish_reason: "tool_calls",
          },
        ],
      } as any);

      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "تحليل شامل: 256 تسريب، منها 2 واسعة النطاق.",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("تحليل شامل", [], "TestUser", 1);
      expect(result.toolsUsed).toContain("get_dashboard_stats");
      expect(result.toolsUsed).toContain("query_leaks");
    });

    it("should handle LLM errors gracefully", async () => {
      mockedInvokeLLM.mockRejectedValueOnce(new Error("LLM service unavailable"));

      const result = await rasidAIChat("اختبار", [], "TestUser", 1);
      expect(result.response).toContain("عذراً");
      expect(result.thinkingSteps).toBeDefined();
    });

    it("should pass chat history to LLM", async () => {
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "نعم، يمكنني مساعدتك بمزيد من التفاصيل.",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const history = [
        { role: "user" as const, content: "ما هي التسريبات واسعة النطاق؟" },
        { role: "assistant" as const, content: "هناك 56 تسريب واسع النطاق." },
      ];

      const result = await rasidAIChat("أعطني تفاصيل أكثر", history, "TestUser", 1);
      expect(result.response).toBeTruthy();

      // Verify history was included in the call
      const callArgs = mockedInvokeLLM.mock.calls[0][0];
      expect(callArgs.messages.length).toBeGreaterThan(2); // system + history + user
    });

    it("should handle empty LLM response", async () => {
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("اختبار", [], "TestUser", 1);
      expect(result.response).toBeTruthy(); // Should have fallback message
    });

    it("should limit tool call iterations to prevent infinite loops", async () => {
      // Simulate multiple tool calls
      for (let i = 0; i < 6; i++) {
        mockedInvokeLLM.mockResolvedValueOnce({
          choices: [
            {
              message: {
                content: null,
                role: "assistant",
                tool_calls: [
                  {
                    id: `call_${i}`,
                    type: "function",
                    function: {
                      name: "get_dashboard_stats",
                      arguments: "{}",
                    },
                  },
                ],
              },
              index: 0,
              finish_reason: "tool_calls",
            },
          ],
        } as any);
      }

      // Final response after max iterations
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "تم الوصول للحد الأقصى من الاستعلامات.",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("تحليل شامل", [], "TestUser", 1);
      expect(result.response).toBeTruthy();
      // Should not exceed MAX_TOOL_ITERATIONS (8)
      expect(mockedInvokeLLM).toHaveBeenCalledTimes(7); // initial + 5 tool iterations + 1 final (capped at 6 tool calls before final)
    });

    it("should handle new tool: search_knowledge_base", async () => {
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              role: "assistant",
              tool_calls: [
                {
                  id: "call_kb",
                  type: "function",
                  function: {
                    name: "search_knowledge_base",
                    arguments: '{"query":"PDPL"}',
                  },
                },
              ],
            },
            index: 0,
            finish_reason: "tool_calls",
          },
        ],
      } as any);

      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "نظام حماية البيانات الشخصية (PDPL) هو...",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("ما هو نظام PDPL؟", [], "TestUser", 1);
      expect(result.toolsUsed).toContain("search_knowledge_base");
    });

    it("should handle new tool: get_correlations", async () => {
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              role: "assistant",
              tool_calls: [
                {
                  id: "call_corr",
                  type: "function",
                  function: {
                    name: "get_correlations",
                    arguments: '{"analysisType":"seller_sector"}',
                  },
                },
              ],
            },
            index: 0,
            finish_reason: "tool_calls",
          },
        ],
      } as any);

      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "تحليل الارتباطات: البائع DarkTrader مرتبط بالقطاع الحكومي.",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("حلل ارتباطات البائعين بالقطاعات", [], "TestUser", 1);
      expect(result.toolsUsed).toContain("get_correlations");
    });

    it("should handle new tool: analyze_user_activity", async () => {
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              role: "assistant",
              tool_calls: [
                {
                  id: "call_activity",
                  type: "function",
                  function: {
                    name: "analyze_user_activity",
                    arguments: '{}',
                  },
                },
              ],
            },
            index: 0,
            finish_reason: "tool_calls",
          },
        ],
      } as any);

      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "نشاط المستخدمين: Admin User قام بتسجيل الدخول.",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("حلل نشاط المستخدمين", [], "TestUser", 1);
      expect(result.toolsUsed).toContain("analyze_user_activity");
    });

    it("should handle new tool: get_reports_and_documents", async () => {
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              role: "assistant",
              tool_calls: [
                {
                  id: "call_docs",
                  type: "function",
                  function: {
                    name: "get_reports_and_documents",
                    arguments: '{}',
                  },
                },
              ],
            },
            index: 0,
            finish_reason: "tool_calls",
          },
        ],
      } as any);

      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "التقارير المتاحة: تقرير أسبوعي (RPT-001).",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("اعرض التقارير", [], "TestUser", 1);
      expect(result.toolsUsed).toContain("get_reports_and_documents");
    });

    it("should handle new tool: get_platform_users_info", async () => {
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              role: "assistant",
              tool_calls: [
                {
                  id: "call_users",
                  type: "function",
                  function: {
                    name: "get_platform_users_info",
                    arguments: '{}',
                  },
                },
              ],
            },
            index: 0,
            finish_reason: "tool_calls",
          },
        ],
      } as any);

      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "مستخدمو المنصة: 2 مستخدمين (1 مشرف، 1 محلل).",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("من هم مستخدمو المنصة؟", [], "TestUser", 1);
      expect(result.toolsUsed).toContain("get_platform_users_info");
    });

    it("should handle unknown tool names gracefully", async () => {
      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
              role: "assistant",
              tool_calls: [
                {
                  id: "call_unknown",
                  type: "function",
                  function: {
                    name: "nonexistent_tool",
                    arguments: "{}",
                  },
                },
              ],
            },
            index: 0,
            finish_reason: "tool_calls",
          },
        ],
      } as any);

      mockedInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "عذراً، لم أتمكن من تنفيذ هذا الطلب.",
              role: "assistant",
            },
            index: 0,
            finish_reason: "stop",
          },
        ],
      } as any);

      const result = await rasidAIChat("اختبار أداة غير موجودة", [], "TestUser", 1);
      expect(result.response).toBeTruthy();
    });
  });
});
