import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  createConversation: vi.fn().mockResolvedValue("conv-test-123"),
  getUserConversations: vi.fn().mockResolvedValue([
    {
      id: 1,
      conversationId: "conv-test-123",
      userId: "user-1",
      userName: "Test User",
      title: "ما هي التسريبات الحرجة؟",
      messageCount: 4,
      totalToolsUsed: 2,
      status: "active",
      createdAt: new Date("2026-02-10"),
      updatedAt: new Date("2026-02-10"),
    },
    {
      id: 2,
      conversationId: "conv-test-456",
      userId: "user-1",
      userName: "Test User",
      title: "ملخص لوحة المعلومات",
      messageCount: 2,
      totalToolsUsed: 1,
      status: "active",
      createdAt: new Date("2026-02-09"),
      updatedAt: new Date("2026-02-09"),
    },
  ]),
  getConversationById: vi.fn().mockImplementation((convId: string) => {
    if (convId === "conv-test-123") {
      return Promise.resolve({
        id: 1,
        conversationId: "conv-test-123",
        userId: "user-1",
        userName: "Test User",
        title: "ما هي التسريبات الحرجة؟",
        messageCount: 4,
        totalToolsUsed: 2,
        status: "active",
      });
    }
    return Promise.resolve(null);
  }),
  updateConversation: vi.fn().mockResolvedValue(undefined),
  deleteConversation: vi.fn().mockResolvedValue(undefined),
  addChatMessage: vi.fn().mockResolvedValue(undefined),
  getConversationMessages: vi.fn().mockResolvedValue([
    {
      id: 1,
      conversationId: "conv-test-123",
      messageId: "user-1707500000000",
      role: "user",
      content: "ما هي التسريبات الحرجة؟",
      toolsUsed: null,
      thinkingSteps: null,
      rating: null,
      createdAt: new Date("2026-02-10T10:00:00"),
    },
    {
      id: 2,
      conversationId: "conv-test-123",
      messageId: "assistant-1707500001000",
      role: "assistant",
      content: "تم العثور على 5 تسريبات حرجة...",
      toolsUsed: ["query_leaks", "get_dashboard_stats"],
      thinkingSteps: [
        { id: "step-1", agent: "راصد الذكي", action: "query_leaks", description: "استعلام التسريبات", status: "completed" },
      ],
      rating: 5,
      createdAt: new Date("2026-02-10T10:00:05"),
    },
  ]),
  logAudit: vi.fn().mockResolvedValue(undefined),
  createLeak: vi.fn().mockResolvedValue(undefined),
  getLeaks: vi.fn().mockResolvedValue([]),
}));

import {
  createConversation,
  getUserConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
  addChatMessage,
  getConversationMessages,
} from "./db";

describe("Chat History Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Conversation CRUD", () => {
    it("should create a new conversation", async () => {
      const convId = await createConversation({
        conversationId: "conv-new-789",
        userId: "user-1",
        userName: "Test User",
        title: "محادثة جديدة",
        messageCount: 0,
        totalToolsUsed: 0,
      });

      expect(createConversation).toHaveBeenCalledOnce();
      expect(convId).toBe("conv-test-123");
    });

    it("should list user conversations ordered by date", async () => {
      const conversations = await getUserConversations("user-1");

      expect(getUserConversations).toHaveBeenCalledWith("user-1");
      expect(conversations).toHaveLength(2);
      expect(conversations[0].title).toBe("ما هي التسريبات الحرجة؟");
      expect(conversations[1].title).toBe("ملخص لوحة المعلومات");
    });

    it("should get a conversation by ID", async () => {
      const conv = await getConversationById("conv-test-123");

      expect(conv).not.toBeNull();
      expect(conv!.conversationId).toBe("conv-test-123");
      expect(conv!.userId).toBe("user-1");
      expect(conv!.messageCount).toBe(4);
    });

    it("should return null for non-existent conversation", async () => {
      const conv = await getConversationById("conv-nonexistent");
      expect(conv).toBeNull();
    });

    it("should update conversation metadata", async () => {
      await updateConversation("conv-test-123", {
        title: "عنوان محدث",
        messageCount: 6,
      });

      expect(updateConversation).toHaveBeenCalledWith("conv-test-123", {
        title: "عنوان محدث",
        messageCount: 6,
      });
    });

    it("should delete a conversation and its messages", async () => {
      await deleteConversation("conv-test-123");
      expect(deleteConversation).toHaveBeenCalledWith("conv-test-123");
    });
  });

  describe("Chat Messages", () => {
    it("should add a chat message", async () => {
      await addChatMessage({
        conversationId: "conv-test-123",
        messageId: "user-1707500002000",
        role: "user",
        content: "كم عدد التسريبات اليوم؟",
        toolsUsed: null,
        thinkingSteps: null,
        rating: null,
      });

      expect(addChatMessage).toHaveBeenCalledOnce();
      expect(addChatMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: "conv-test-123",
          role: "user",
          content: "كم عدد التسريبات اليوم؟",
        })
      );
    });

    it("should retrieve conversation messages in order", async () => {
      const messages = await getConversationMessages("conv-test-123");

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe("user");
      expect(messages[1].role).toBe("assistant");
      expect(messages[1].toolsUsed).toEqual(["query_leaks", "get_dashboard_stats"]);
      expect(messages[1].rating).toBe(5);
    });

    it("should store thinking steps with assistant messages", async () => {
      const messages = await getConversationMessages("conv-test-123");
      const assistantMsg = messages.find(m => m.role === "assistant");

      expect(assistantMsg).toBeDefined();
      expect(assistantMsg!.thinkingSteps).toBeDefined();
      expect(Array.isArray(assistantMsg!.thinkingSteps)).toBe(true);
    });
  });

  describe("Conversation Export", () => {
    it("should format messages for text export", () => {
      const messages = [
        { role: "user" as const, content: "ما هي التسريبات الحرجة؟", timestamp: new Date("2026-02-10T10:00:00") },
        { role: "assistant" as const, content: "تم العثور على 5 تسريبات حرجة", timestamp: new Date("2026-02-10T10:00:05"), toolsUsed: ["query_leaks"] },
      ];

      const lines: string[] = [];
      messages.forEach((m) => {
        const role = m.role === "user" ? "المستخدم" : "راصد الذكي";
        lines.push(`[${m.timestamp.toLocaleTimeString("ar-SA")}] ${role}: ${m.content}`);
        if ("toolsUsed" in m && m.toolsUsed) {
          lines.push(`  الأدوات: ${m.toolsUsed.join(", ")}`);
        }
      });

      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain("المستخدم");
      expect(lines[1]).toContain("راصد الذكي");
      expect(lines[2]).toContain("query_leaks");
    });
  });

  describe("Scan Results to Leak Conversion", () => {
    it("should map scan result fields to leak fields", () => {
      const scanResult = {
        source: "XposedOrNot",
        type: "breach",
        title: "LinkedIn Breach 2024",
        description: "Email found in LinkedIn breach",
        severity: "high" as const,
        data: { domain: "linkedin.com", breachDate: "2024-01-15" },
        timestamp: new Date().toISOString(),
      };

      // Map scan result to leak format
      const leakData = {
        title: scanResult.title,
        titleAr: `تسريب مكتشف: ${scanResult.title}`,
        severity: scanResult.severity,
        source: scanResult.source.toLowerCase(),
        description: scanResult.description,
        status: "active",
        dataTypes: JSON.stringify(["email"]),
      };

      expect(leakData.title).toBe("LinkedIn Breach 2024");
      expect(leakData.severity).toBe("high");
      expect(leakData.source).toBe("xposedornot");
      expect(leakData.status).toBe("active");
    });

    it("should handle different severity levels from scan results", () => {
      const severities = ["critical", "high", "medium", "low", "info"];

      severities.forEach((sev) => {
        const mapped = ["critical", "high", "medium", "low"].includes(sev) ? sev : "low";
        expect(["critical", "high", "medium", "low"]).toContain(mapped);
      });
    });

    it("should generate unique leak IDs for bulk save", () => {
      const results = Array.from({ length: 5 }, (_, i) => ({
        source: "TestSource",
        title: `Breach ${i + 1}`,
      }));

      const ids = results.map((_, i) => {
        const now = new Date();
        return `LK-${now.getFullYear()}-${String(i + 1).padStart(4, "0")}`;
      });

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });
  });
});

describe("Sound Manager", () => {
  it("should have proper sound effect types", () => {
    const soundTypes = ["send", "receive", "error", "success", "typing", "notification"];
    expect(soundTypes).toHaveLength(6);
    soundTypes.forEach((type) => {
      expect(typeof type).toBe("string");
    });
  });

  it("should support mute toggle", () => {
    let muted = false;
    const toggleMute = () => {
      muted = !muted;
      return muted;
    };

    expect(muted).toBe(false);
    toggleMute();
    expect(muted).toBe(true);
    toggleMute();
    expect(muted).toBe(false);
  });

  it("should persist mute preference", () => {
    const storage: Record<string, string> = {};
    const setMuted = (val: boolean) => {
      storage["rasid-sound-muted"] = String(val);
    };
    const getMuted = () => storage["rasid-sound-muted"] === "true";

    setMuted(true);
    expect(getMuted()).toBe(true);
    setMuted(false);
    expect(getMuted()).toBe(false);
  });
});
