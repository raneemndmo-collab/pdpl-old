import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@ndmo.gov.sa",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("dashboard.stats", () => {
  it("returns dashboard statistics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.dashboard.stats();

    expect(stats).toBeDefined();
    expect(typeof stats.totalLeaks).toBe("number");
    expect(typeof stats.criticalAlerts).toBe("number");
    expect(typeof stats.totalRecords).toBe("number");
    expect(typeof stats.activeMonitors).toBe("number");
    expect(typeof stats.piiDetected).toBe("number");
  });
});

describe("leaks.list", () => {
  it("returns an array of leaks", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const leaks = await caller.leaks.list();

    expect(Array.isArray(leaks)).toBe(true);
  });

  it("supports filtering by source", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const leaks = await caller.leaks.list({ source: "telegram" });

    expect(Array.isArray(leaks)).toBe(true);
    for (const leak of leaks) {
      expect(leak.source).toBe("telegram");
    }
  });

  it("supports filtering by severity", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const leaks = await caller.leaks.list({ severity: "critical" });

    expect(Array.isArray(leaks)).toBe(true);
    for (const leak of leaks) {
      expect(leak.severity).toBe("critical");
    }
  });
});

describe("leaks.exportCsv", () => {
  it("returns CSV string with headers", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.leaks.exportCsv();

    expect(result).toBeDefined();
    expect(typeof result.csv).toBe("string");
    expect(typeof result.filename).toBe("string");
    expect(result.csv).toContain("Leak ID");
    expect(result.csv).toContain("Source");
    expect(result.filename).toMatch(/ndmo-leaks-export-\d+\.csv/);
  });
});

describe("channels.list", () => {
  it("returns an array of channels", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const channels = await caller.channels.list();

    expect(Array.isArray(channels)).toBe(true);
  });

  it("supports filtering by platform", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const channels = await caller.channels.list({ platform: "telegram" });

    expect(Array.isArray(channels)).toBe(true);
    for (const ch of channels) {
      expect(ch.platform).toBe("telegram");
    }
  });
});

describe("pii.scan", () => {
  it("detects Saudi national IDs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pii.scan({
      text: "رقم الهوية: 1098765432",
    });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].type).toBe("National ID");
    expect(result.results[0].value).toBe("1098765432");
    expect(result.totalMatches).toBe(result.results.length);
  });

  it("detects Iqama numbers", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pii.scan({
      text: "رقم الإقامة: 2098765432",
    });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].type).toBe("Iqama Number");
  });

  it("detects Saudi phone numbers", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pii.scan({
      text: "الجوال: 0512345678",
    });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].type).toBe("Saudi Phone");
  });

  it("detects IBAN numbers", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pii.scan({
      text: "IBAN: SA0380000000608010167519",
    });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].type).toBe("IBAN");
  });

  it("detects Saudi email addresses", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pii.scan({
      text: "البريد: user@example.sa",
    });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].type).toBe("Saudi Email");
  });

  it("detects multiple PII types in one text", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pii.scan({
      text: "الهوية: 1098765432\nالجوال: 0512345678\nIBAN: SA0380000000608010167519",
    });

    expect(result.totalMatches).toBe(3);
    const types = result.results.map((r) => r.type);
    expect(types).toContain("National ID");
    expect(types).toContain("Saudi Phone");
    expect(types).toContain("IBAN");
  });

  it("returns empty results for clean text", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.pii.scan({
      text: "هذا نص عادي بدون بيانات شخصية",
    });

    expect(result.totalMatches).toBe(0);
    expect(result.results).toHaveLength(0);
  });
});

describe("darkweb.listings", () => {
  it("returns an array of dark web listings", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const listings = await caller.darkweb.listings();

    expect(Array.isArray(listings)).toBe(true);
  });
});

describe("pastes.list", () => {
  it("returns an array of paste entries", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const pastes = await caller.pastes.list();

    expect(Array.isArray(pastes)).toBe(true);
  });
});

describe("reports.list", () => {
  it("returns an array of reports", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const reports = await caller.reports.list();

    expect(Array.isArray(reports)).toBe(true);
  });
});

describe("reports.exportPdf", () => {
  it("returns a structured report summary", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const summary = await caller.reports.exportPdf({});

    expect(summary).toBeDefined();
    expect(summary.title).toContain("NDMO");
    expect(typeof summary.generatedAt).toBe("string");
    expect(summary.stats).toBeDefined();
    expect(typeof summary.stats.totalLeaks).toBe("number");
    expect(Array.isArray(summary.leaksSummary)).toBe(true);
    expect(typeof summary.totalReports).toBe("number");
  });
});

describe("users.list (admin only)", () => {
  it("returns users list for admin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const users = await caller.users.list();

    expect(Array.isArray(users)).toBe(true);
  });

  it("rejects non-admin users", async () => {
    const { ctx } = createAuthContext();
    // Override role to non-admin
    (ctx.user as AuthenticatedUser).role = "user";

    const caller = appRouter.createCaller(ctx);

    await expect(caller.users.list()).rejects.toThrow();
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.users.list()).rejects.toThrow();
  });
});
