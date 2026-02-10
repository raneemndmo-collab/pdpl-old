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

// ─── Dashboard ────────────────────────────────────────────────
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

// ─── Leaks ────────────────────────────────────────────────────
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

// ─── Channels ─────────────────────────────────────────────────
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

// ─── PII Scanner ──────────────────────────────────────────────
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

// ─── Dark Web ─────────────────────────────────────────────────
describe("darkweb.listings", () => {
  it("returns an array of dark web listings", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const listings = await caller.darkweb.listings();

    expect(Array.isArray(listings)).toBe(true);
  });
});

// ─── Paste Sites ──────────────────────────────────────────────
describe("pastes.list", () => {
  it("returns an array of paste entries", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const pastes = await caller.pastes.list();

    expect(Array.isArray(pastes)).toBe(true);
  });
});

// ─── Reports ──────────────────────────────────────────────────
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

// ─── Users (admin only) ──────────────────────────────────────
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

// ─── Notifications ────────────────────────────────────────────
describe("notifications.list", () => {
  it("returns an array of notifications for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const notifications = await caller.notifications.list({ limit: 10 });

    expect(Array.isArray(notifications)).toBe(true);
  });

  it("supports limit parameter", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const notifications = await caller.notifications.list({ limit: 5 });

    expect(Array.isArray(notifications)).toBe(true);
    expect(notifications.length).toBeLessThanOrEqual(5);
  });
});

describe("notifications.unreadCount", () => {
  it("returns a number for unread count", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const count = await caller.notifications.unreadCount();

    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe("notifications.markRead", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.notifications.markRead({ notificationId: 1 })).rejects.toThrow();
  });
});

describe("notifications.markAllRead", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.notifications.markAllRead()).rejects.toThrow();
  });

  it("succeeds for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.notifications.markAllRead();

    expect(result).toEqual({ success: true });
  });
});

// ─── Audit Log (admin only) ──────────────────────────────────
describe("audit.list (admin only)", () => {
  it("returns audit logs for admin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.audit.list({ limit: 20 });

    expect(Array.isArray(logs)).toBe(true);
  });

  it("supports category filtering", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const logs = await caller.audit.list({ category: "auth" });

    expect(Array.isArray(logs)).toBe(true);
    for (const log of logs) {
      expect(log.category).toBe("auth");
    }
  });

  it("rejects non-admin users", async () => {
    const { ctx } = createAuthContext();
    (ctx.user as AuthenticatedUser).role = "user";
    const caller = appRouter.createCaller(ctx);

    await expect(caller.audit.list()).rejects.toThrow();
  });

  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.audit.list()).rejects.toThrow();
  });
});

describe("audit.exportCsv (admin only)", () => {
  it("returns CSV for admin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.audit.exportCsv();

    expect(result).toBeDefined();
    expect(typeof result.csv).toBe("string");
    expect(typeof result.filename).toBe("string");
    expect(result.csv).toContain("Timestamp");
    expect(result.filename).toMatch(/ndmo-audit-log-\d+\.csv/);
  });

  it("rejects non-admin users", async () => {
    const { ctx } = createAuthContext();
    (ctx.user as AuthenticatedUser).role = "user";
    const caller = appRouter.createCaller(ctx);

    await expect(caller.audit.exportCsv()).rejects.toThrow();
  });
});

// ─── Monitoring Jobs ──────────────────────────────────────────
describe("jobs.list", () => {
  it("returns an array of monitoring jobs", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const jobs = await caller.jobs.list();

    expect(Array.isArray(jobs)).toBe(true);
    expect(jobs.length).toBeGreaterThan(0);
  });

  it("each job has required fields", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const jobs = await caller.jobs.list();

    for (const job of jobs) {
      expect(job.jobId).toBeDefined();
      expect(job.name).toBeDefined();
      expect(job.nameAr).toBeDefined();
      expect(job.platform).toBeDefined();
      expect(job.cronExpression).toBeDefined();
      expect(job.status).toBeDefined();
    }
  });
});

describe("jobs.getById", () => {
  it("returns a specific job", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const job = await caller.jobs.getById({ jobId: "job-telegram-monitor" });

    expect(job).toBeDefined();
    if (job) {
      expect(job.jobId).toBe("job-telegram-monitor");
      expect(job.platform).toBe("telegram");
    }
  });
});

describe("jobs.trigger", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.jobs.trigger({ jobId: "job-telegram-monitor" })).rejects.toThrow();
  });

  it("succeeds for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.jobs.trigger({ jobId: "job-telegram-monitor" });

    expect(result).toEqual({ success: true, message: "Job triggered" });
  });
});

describe("jobs.toggleStatus", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.jobs.toggleStatus({ jobId: "job-telegram-monitor", status: "paused" })
    ).rejects.toThrow();
  });

  it("can pause and resume a job", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Pause
    const pauseResult = await caller.jobs.toggleStatus({
      jobId: "job-telegram-monitor",
      status: "paused",
    });
    expect(pauseResult).toEqual({ success: true });

    // Resume
    const resumeResult = await caller.jobs.toggleStatus({
      jobId: "job-telegram-monitor",
      status: "active",
    });
    expect(resumeResult).toEqual({ success: true });
  });
});

// ─── Alert Contacts ──────────────────────────────────────────
describe("alerts.contacts.list", () => {
  it("returns an array of alert contacts", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const contacts = await caller.alerts.contacts.list();

    expect(Array.isArray(contacts)).toBe(true);
  });
});

describe("alerts.contacts.create (admin only)", () => {
  it("requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.alerts.contacts.create({ name: "Test Contact" })
    ).rejects.toThrow();
  });

  it("creates a contact for admin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.alerts.contacts.create({
      name: "Test Contact",
      email: "test@example.com",
      channels: ["email"],
    });

    expect(result.success).toBe(true);
    expect(typeof result.id).toBe("number");
  });
});

// ─── Alert Rules ─────────────────────────────────────────────
describe("alerts.rules.list", () => {
  it("returns an array of alert rules", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const rules = await caller.alerts.rules.list();

    expect(Array.isArray(rules)).toBe(true);
  });
});

describe("alerts.rules.create (admin only)", () => {
  it("requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.alerts.rules.create({
        name: "Test Rule",
        severityThreshold: "critical",
        channel: "email",
      })
    ).rejects.toThrow();
  });

  it("creates a rule for admin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.alerts.rules.create({
      name: "Test Rule",
      severityThreshold: "critical",
      channel: "email",
    });

    expect(result.success).toBe(true);
    expect(typeof result.id).toBe("number");
  });
});

// ─── Alert History ───────────────────────────────────────────
describe("alerts.history", () => {
  it("returns an array of alert history entries", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.alerts.history();

    expect(Array.isArray(history)).toBe(true);
  });
});

// ─── Alert Stats ─────────────────────────────────────────────
describe("alerts.stats", () => {
  it("returns alert statistics", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.alerts.stats();

    expect(stats).toBeDefined();
    expect(typeof stats.totalSent).toBe("number");
    expect(typeof stats.totalFailed).toBe("number");
    expect(typeof stats.activeRules).toBe("number");
    expect(typeof stats.activeContacts).toBe("number");
  });
});

// ─── Retention Policies ──────────────────────────────────────
describe("retention.list", () => {
  it("returns an array of retention policies", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const policies = await caller.retention.list();

    expect(Array.isArray(policies)).toBe(true);
  });
});

describe("retention.update (admin only)", () => {
  it("requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.retention.update({ id: 1, retentionDays: 90 })
    ).rejects.toThrow();
  });
});

describe("retention.execute (admin only)", () => {
  it("requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.retention.execute()).rejects.toThrow();
  });

  it("executes for admin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.retention.execute();

    expect(Array.isArray(results)).toBe(true);
  });
});

describe("retention.preview (admin only)", () => {
  it("requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.retention.preview()).rejects.toThrow();
  });

  it("returns preview for admin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const preview = await caller.retention.preview();

    expect(Array.isArray(preview)).toBe(true);
  });
});

// ─── Enrichment ──────────────────────────────────────────────
describe("enrichment.enrichLeak", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.enrichment.enrichLeak({ leakId: "LK-001" })
    ).rejects.toThrow();
  });
});

describe("enrichment.enrichAll (admin only)", () => {
  it("requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.enrichment.enrichAll()).rejects.toThrow();
  });

  it("rejects non-admin users", async () => {
    const { ctx } = createAuthContext();
    (ctx.user as AuthenticatedUser).role = "user";
    const caller = appRouter.createCaller(ctx);

    await expect(caller.enrichment.enrichAll()).rejects.toThrow();
  });
});
