import { eq, desc, sql, and, like, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  leaks,
  channels,
  piiScans,
  reports,
  darkWebListings,
  pasteEntries,
  auditLog,
  type InsertLeak,
  type InsertChannel,
  type InsertPiiScan,
  type InsertReport,
  type InsertDarkWebListing,
  type InsertPasteEntry,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Helpers ───────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, ndmoRole: "executive" | "manager" | "analyst" | "viewer") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ ndmoRole }).where(eq(users.id, userId));
}

// ─── Leak Helpers ───────────────────────────────────────────────

export async function getLeaks(filters?: {
  source?: string;
  severity?: string;
  status?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.source && filters.source !== "all") {
    conditions.push(eq(leaks.source, filters.source as any));
  }
  if (filters?.severity && filters.severity !== "all") {
    conditions.push(eq(leaks.severity, filters.severity as any));
  }
  if (filters?.status && filters.status !== "all") {
    conditions.push(eq(leaks.status, filters.status as any));
  }
  if (filters?.search) {
    conditions.push(
      sql`(${leaks.title} LIKE ${`%${filters.search}%`} OR ${leaks.titleAr} LIKE ${`%${filters.search}%`})`
    );
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(leaks).where(where).orderBy(desc(leaks.detectedAt));
}

export async function getLeakById(leakId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leaks).where(eq(leaks.leakId, leakId)).limit(1);
  return result[0];
}

export async function createLeak(leak: InsertLeak) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(leaks).values(leak);
}

export async function updateLeakStatus(leakId: string, status: "new" | "analyzing" | "documented" | "reported") {
  const db = await getDb();
  if (!db) return;
  await db.update(leaks).set({ status }).where(eq(leaks.leakId, leakId));
}

// ─── Channel Helpers ────────────────────────────────────────────

export async function getChannels(platform?: string) {
  const db = await getDb();
  if (!db) return [];
  if (platform && platform !== "all") {
    return db.select().from(channels).where(eq(channels.platform, platform as any)).orderBy(desc(channels.lastActivity));
  }
  return db.select().from(channels).orderBy(desc(channels.lastActivity));
}

export async function createChannel(channel: InsertChannel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(channels).values(channel);
}

// ─── PII Scan Helpers ───────────────────────────────────────────

export async function savePiiScan(scan: InsertPiiScan) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(piiScans).values(scan);
  return result[0].insertId;
}

export async function getPiiScans(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(piiScans).where(eq(piiScans.userId, userId)).orderBy(desc(piiScans.createdAt)).limit(50);
}

// ─── Report Helpers ─────────────────────────────────────────────

export async function getReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reports).orderBy(desc(reports.createdAt));
}

export async function createReport(report: InsertReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reports).values(report);
  return result[0].insertId;
}

// ─── Dark Web Listing Helpers ───────────────────────────────────

export async function getDarkWebListings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(darkWebListings).orderBy(desc(darkWebListings.detectedAt));
}

export async function createDarkWebListing(listing: InsertDarkWebListing) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(darkWebListings).values(listing);
}

// ─── Paste Entry Helpers ────────────────────────────────────────

export async function getPasteEntries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pasteEntries).orderBy(desc(pasteEntries.detectedAt));
}

export async function createPasteEntry(entry: InsertPasteEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(pasteEntries).values(entry);
}

// ─── Dashboard Stats ────────────────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [leakRows] = await db.select({
    total: sql<number>`COUNT(*)`,
    critical: sql<number>`SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END)`,
    totalRecords: sql<number>`COALESCE(SUM(recordCount), 0)`,
  }).from(leaks);

  const [channelRows] = await db.select({
    activeMonitors: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
  }).from(channels);

  const [piiRows] = await db.select({
    totalPii: sql<number>`COALESCE(SUM(totalMatches), 0)`,
  }).from(piiScans);

  return {
    totalLeaks: Number(leakRows?.total ?? 0),
    criticalAlerts: Number(leakRows?.critical ?? 0),
    totalRecords: Number(leakRows?.totalRecords ?? 0),
    activeMonitors: Number(channelRows?.activeMonitors ?? 0),
    piiDetected: Number(piiRows?.totalPii ?? 0),
  };
}

// ─── Audit Log ──────────────────────────────────────────────────

export async function logAudit(userId: number | null, action: string, details?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values({ userId, action, details });
}
