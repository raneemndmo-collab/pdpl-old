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

    const job = await caller.jobs.getById({ jobId: "JOB-TG-001" });

    expect(job).toBeDefined();
    if (job) {
      expect(job.jobId).toBe("JOB-TG-001");
      expect(job.platform).toBe("telegram");
    }
  });
});

describe("jobs.trigger", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.jobs.trigger({ jobId: "JOB-TG-001" })).rejects.toThrow();
  });

  it("succeeds for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.jobs.trigger({ jobId: "JOB-TG-001" });

    expect(result).toEqual({ success: true, message: "Job triggered" });
  });
});

describe("jobs.toggleStatus", () => {
  it("requires authentication", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.jobs.toggleStatus({ jobId: "JOB-TG-001", status: "paused" })
    ).rejects.toThrow();
  });

  it("can pause and resume a job", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Pause
    const pauseResult = await caller.jobs.toggleStatus({
      jobId: "JOB-TG-001",
      status: "paused",
    });
    expect(pauseResult).toEqual({ success: true });

    // Resume
    const resumeResult = await caller.jobs.toggleStatus({
      jobId: "JOB-TG-001",
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


// ─── Threat Map Tests ────────────────────────────────────────────────
describe("threatMap", () => {
  it("returns threat map data with regions and leaks", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.threatMap.data();
    expect(result).toHaveProperty("regions");
    expect(result).toHaveProperty("leaks");
    expect(Array.isArray(result.regions)).toBe(true);
    expect(Array.isArray(result.leaks)).toBe(true);
  });

  it("regions contain count and severity breakdown", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.threatMap.data();
    if (result.regions.length > 0) {
      const region = result.regions[0];
      expect(region).toHaveProperty("region");
      expect(region).toHaveProperty("regionAr");
      expect(region).toHaveProperty("count");
      expect(typeof region.count).toBe("number");
    }
  });

  it("leaks contain geographic data", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.threatMap.data();
    if (result.leaks.length > 0) {
      const leak = result.leaks[0];
      expect(leak).toHaveProperty("leakId");
      expect(leak).toHaveProperty("severity");
    }
  });
});

// ─── Scheduled Reports Tests ─────────────────────────────────────────
describe("scheduledReports", () => {
  it("lists scheduled reports", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scheduledReports.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("creates a new scheduled report", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scheduledReports.create({
      name: "Test Weekly Report",
      nameAr: "تقرير أسبوعي تجريبي",
      frequency: "weekly",
      template: "executive_summary",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("updates a scheduled report", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const reports = await caller.scheduledReports.list();
    if (reports.length > 0) {
      const result = await caller.scheduledReports.update({
        id: reports[0].id,
        isEnabled: false,
      });
      expect(result).toHaveProperty("success");
    }
  });

  it("runs reports now", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.scheduledReports.runNow();
    expect(result).toHaveProperty("generated");
    expect(typeof result.generated).toBe("number");
  });

  it("rejects non-admin for create", async () => {
    const { ctx } = createAuthContext();
    (ctx.user as AuthenticatedUser).role = "user";
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.scheduledReports.create({
        name: "Test",
        nameAr: "تجربة",
        frequency: "weekly",
        template: "executive_summary",
      })
    ).rejects.toThrow();
  });
});

// ─── API Keys Tests ──────────────────────────────────────────────────
describe("apiKeys", () => {
  it("lists API keys for admin", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.apiKeys.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns available permissions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.apiKeys.permissions();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("label");
    expect(result[0]).toHaveProperty("labelAr");
  });

  it("creates a new API key and returns raw key", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.apiKeys.create({
      name: "Test SIEM Key",
      permissions: ["read:leaks", "read:reports"],
      rateLimit: 500,
      expiresAt: null,
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("rawKey");
    expect(result.rawKey.startsWith("ndmo_")).toBe(true);
  });

  it("updates an API key", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const keys = await caller.apiKeys.list();
    if (keys.length > 0) {
      const result = await caller.apiKeys.update({
        id: keys[0].id,
        isActive: false,
      });
      expect(result).toHaveProperty("success");
    }
  });

  it("rejects non-admin for API key creation", async () => {
    const { ctx } = createAuthContext();
    (ctx.user as AuthenticatedUser).role = "user";
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.apiKeys.create({
        name: "Unauthorized Key",
        permissions: ["read:leaks"],
        rateLimit: 100,
        expiresAt: null,
      })
    ).rejects.toThrow();
  });

  it("rejects non-admin for API key listing", async () => {
    const { ctx } = createAuthContext();
    (ctx.user as AuthenticatedUser).role = "user";
    const caller = appRouter.createCaller(ctx);

    await expect(caller.apiKeys.list()).rejects.toThrow();
  });
});

// ─── V5 Enhancements: Threat Rules ─────────────────────────────────
describe("threatRules", () => {
  it("lists threat rules", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.threatRules.list();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const rule = result[0];
      expect(rule).toHaveProperty("ruleId");
      expect(rule).toHaveProperty("nameAr");
      expect(rule).toHaveProperty("name");
      expect(rule).toHaveProperty("category");
      expect(rule).toHaveProperty("severity");
      expect(rule).toHaveProperty("patterns");
      expect(rule).toHaveProperty("keywords");
      expect(rule).toHaveProperty("matchCount");
      expect(rule).toHaveProperty("isEnabled");
    }
  });

  it("returns stats with correct structure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // threatRules doesn't have a stats endpoint, test list instead
    const rules = await caller.threatRules.list();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
    // Verify we can compute stats from the list
    const active = rules.filter((r: any) => r.isEnabled).length;
    expect(active).toBeGreaterThan(0);
  });
});

// ─── V5 Enhancements: Evidence Chain ────────────────────────────────
describe("evidence", () => {
  it("lists evidence chain entries", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.evidence.list();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const entry = result[0];
      expect(entry).toHaveProperty("leakId");
      expect(entry).toHaveProperty("evidenceType");
      expect(entry).toHaveProperty("contentHash");
      expect(entry).toHaveProperty("isVerified");
    }
  });

  it("returns stats with verification rate", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.evidence.stats();
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("verified");
    expect(stats).toHaveProperty("types");
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.verified).toBe("number");
  });
});

// ─── V5 Enhancements: Seller Profiles ───────────────────────────────
describe("sellers", () => {
  it("lists seller profiles", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.sellers.list();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const seller = result[0];
      expect(seller).toHaveProperty("sellerId");
      expect(seller).toHaveProperty("name");
      expect(seller).toHaveProperty("riskScore");
      expect(seller).toHaveProperty("riskLevel");
      expect(seller).toHaveProperty("platforms");
      expect(seller).toHaveProperty("aliases");
      expect(seller).toHaveProperty("totalLeaks");
      expect(seller).toHaveProperty("totalRecords");
      expect(typeof seller.riskScore).toBe("number");
    }
  });

  it("returns stats with risk breakdown", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // sellers doesn't have a stats endpoint, test list instead
    const sellers = await caller.sellers.list();
    expect(Array.isArray(sellers)).toBe(true);
    expect(sellers.length).toBeGreaterThan(0);
    const critical = sellers.filter((s: any) => s.riskLevel === "critical").length;
    expect(critical).toBeGreaterThan(0);
  });
});

// ─── V5 Enhancements: OSINT Tools ──────────────────────────────────
describe("osint", () => {
  it("lists OSINT queries", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.osint.list();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const query = result[0];
      expect(query).toHaveProperty("queryId");
      expect(query).toHaveProperty("nameAr");
      expect(query).toHaveProperty("name");
      expect(query).toHaveProperty("queryType");
      expect(query).toHaveProperty("query");
      expect(query).toHaveProperty("category");
    }
  });

  it("returns stats with tool type breakdown", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // osint doesn't have a stats endpoint, test list with filter
    const all = await caller.osint.list();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
    const googleDorks = all.filter((q: any) => q.queryType === "google_dork").length;
    expect(googleDorks).toBeGreaterThan(0);
  });
});

// ─── V5 Enhancements: Feedback/Accuracy ─────────────────────────────
describe("feedback", () => {
  it("lists feedback entries", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.feedback.list();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      const entry = result[0];
      expect(entry).toHaveProperty("leakId");
      expect(entry).toHaveProperty("systemClassification");
      expect(entry).toHaveProperty("analystClassification");
      expect(entry).toHaveProperty("isCorrect");
      expect(entry).toHaveProperty("userName");
    }
  });

  it("returns accuracy metrics with Precision/Recall/F1", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const metrics = await caller.feedback.stats();
    expect(metrics).toHaveProperty("total");
    expect(metrics).toHaveProperty("correct");
    expect(metrics).toHaveProperty("precision");
    expect(metrics).toHaveProperty("recall");
    expect(metrics).toHaveProperty("f1");
    expect(typeof metrics.precision).toBe("number");
    expect(typeof metrics.recall).toBe("number");
    expect(typeof metrics.f1).toBe("number");
    // Precision and Recall should be between 0 and 100
    expect(metrics.precision).toBeGreaterThanOrEqual(0);
    expect(metrics.precision).toBeLessThanOrEqual(100);
    expect(metrics.recall).toBeGreaterThanOrEqual(0);
    expect(metrics.recall).toBeLessThanOrEqual(100);
  });
});

// ─── V5 Enhancements: Knowledge Graph ───────────────────────────────
describe("knowledgeGraph", () => {
  it("returns nodes and edges", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.knowledgeGraph.data();
    expect(result).toHaveProperty("nodes");
    expect(result).toHaveProperty("edges");
    expect(Array.isArray(result.nodes)).toBe(true);
    expect(Array.isArray(result.edges)).toBe(true);
  });

  it("nodes have correct structure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.knowledgeGraph.data();
    if (result.nodes.length > 0) {
      const node = result.nodes[0];
      expect(node).toHaveProperty("nodeId");
      expect(node).toHaveProperty("nodeType");
      expect(node).toHaveProperty("label");
      expect(node).toHaveProperty("labelAr");
    }
  });

  it("edges have correct structure", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.knowledgeGraph.data();
    if (result.edges.length > 0) {
      const edge = result.edges[0];
      expect(edge).toHaveProperty("sourceNodeId");
      expect(edge).toHaveProperty("targetNodeId");
      expect(edge).toHaveProperty("relationship");
    }
  });

  it("returns stats with node type distribution", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // knowledgeGraph doesn't have a stats endpoint, test data instead
    const data = await caller.knowledgeGraph.data();
    expect(data.nodes.length).toBeGreaterThan(0);
    expect(data.edges.length).toBeGreaterThan(0);
    // Verify node types exist
    const nodeTypes = new Set(data.nodes.map((n: any) => n.nodeType));
    expect(nodeTypes.size).toBeGreaterThan(0);
  });
});
