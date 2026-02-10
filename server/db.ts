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
  notifications,
  monitoringJobs,
  type InsertLeak,
  type InsertChannel,
  type InsertPiiScan,
  type InsertReport,
  type InsertDarkWebListing,
  type InsertPasteEntry,
  type InsertNotification,
  type InsertMonitoringJob,
  type InsertAuditLogEntry,
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

export async function logAudit(
  userId: number | null,
  action: string,
  details?: string,
  category?: "auth" | "leak" | "export" | "pii" | "user" | "report" | "system" | "monitoring",
  userName?: string,
  ipAddress?: string,
) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLog).values({
    userId,
    userName: userName ?? null,
    action,
    category: category ?? "system",
    details,
    ipAddress: ipAddress ?? null,
  });
}

export async function getAuditLogs(filters?: {
  category?: string;
  userId?: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.category && filters.category !== "all") {
    conditions.push(eq(auditLog.category, filters.category as any));
  }
  if (filters?.userId) {
    conditions.push(eq(auditLog.userId, filters.userId));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = filters?.limit ?? 200;
  return db.select().from(auditLog).where(where).orderBy(desc(auditLog.createdAt)).limit(limit);
}

export async function exportAuditLogsCsv(filters?: { category?: string }) {
  const logs = await getAuditLogs({ ...filters, limit: 5000 });
  const headers = ["ID", "User ID", "User Name", "Action", "Category", "Details", "IP Address", "Timestamp"];
  const rows = logs.map((log) => [
    log.id,
    log.userId ?? "",
    `"${log.userName ?? ""}"`,
    log.action,
    log.category,
    `"${(log.details ?? "").replace(/"/g, '""')}"`,
    log.ipAddress ?? "",
    log.createdAt?.toISOString() ?? "",
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// ─── Notifications ──────────────────────────────────────────────

export async function createNotification(notif: InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(notifications).values(notif);
  return result[0].insertId;
}

export async function getNotifications(userId?: number | null, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  // Get notifications for the user or global (userId = null)
  if (userId) {
    return db.select().from(notifications)
      .where(sql`${notifications.userId} = ${userId} OR ${notifications.userId} IS NULL`)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }
  return db.select().from(notifications)
    .where(sql`${notifications.userId} IS NULL`)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationRead(notifId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notifId));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true })
    .where(sql`(${notifications.userId} = ${userId} OR ${notifications.userId} IS NULL) AND ${notifications.isRead} = false`);
}

export async function getUnreadNotificationCount(userId?: number | null) {
  const db = await getDb();
  if (!db) return 0;
  if (userId) {
    const [row] = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(notifications)
      .where(sql`(${notifications.userId} = ${userId} OR ${notifications.userId} IS NULL) AND ${notifications.isRead} = false`);
    return Number(row?.count ?? 0);
  }
  const [row] = await db.select({
    count: sql<number>`COUNT(*)`,
  }).from(notifications)
    .where(sql`${notifications.userId} IS NULL AND ${notifications.isRead} = false`);
  return Number(row?.count ?? 0);
}

// ─── Monitoring Jobs ────────────────────────────────────────────

export async function getMonitoringJobs() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(monitoringJobs).orderBy(desc(monitoringJobs.updatedAt));
}

export async function getMonitoringJobById(jobId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(monitoringJobs).where(eq(monitoringJobs.jobId, jobId)).limit(1);
  return result[0];
}

export async function createMonitoringJob(job: InsertMonitoringJob) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(monitoringJobs).values(job);
}

export async function updateMonitoringJobStatus(
  jobId: string,
  status: "active" | "paused" | "running" | "error",
  extra?: { lastRunAt?: Date; nextRunAt?: Date; lastResult?: string; leaksFound?: number; totalRuns?: number }
) {
  const db = await getDb();
  if (!db) return;
  const updateData: Record<string, unknown> = { status };
  if (extra?.lastRunAt) updateData.lastRunAt = extra.lastRunAt;
  if (extra?.nextRunAt) updateData.nextRunAt = extra.nextRunAt;
  if (extra?.lastResult !== undefined) updateData.lastResult = extra.lastResult;
  if (extra?.leaksFound !== undefined) updateData.leaksFound = sql`${monitoringJobs.leaksFound} + ${extra.leaksFound}`;
  if (extra?.totalRuns !== undefined) updateData.totalRuns = sql`${monitoringJobs.totalRuns} + 1`;
  await db.update(monitoringJobs).set(updateData).where(eq(monitoringJobs.jobId, jobId));
}

// ─── Alert Contacts ────────────────────────────────────────────

import {
  alertContacts,
  alertRules,
  alertHistory,
  retentionPolicies,
  type InsertAlertContact,
  type InsertAlertRule,
} from "../drizzle/schema";

export async function getAlertContacts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alertContacts).orderBy(desc(alertContacts.createdAt));
}

export async function createAlertContact(contact: InsertAlertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(alertContacts).values(contact);
  return result[0].insertId;
}

export async function updateAlertContact(id: number, data: Partial<InsertAlertContact>) {
  const db = await getDb();
  if (!db) return;
  await db.update(alertContacts).set(data).where(eq(alertContacts.id, id));
}

export async function deleteAlertContact(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(alertContacts).where(eq(alertContacts.id, id));
}

// ─── Alert Rules ───────────────────────────────────────────────

export async function getAlertRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alertRules).orderBy(desc(alertRules.createdAt));
}

export async function createAlertRule(rule: InsertAlertRule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(alertRules).values(rule);
  return result[0].insertId;
}

export async function updateAlertRule(id: number, data: Partial<InsertAlertRule>) {
  const db = await getDb();
  if (!db) return;
  await db.update(alertRules).set(data).where(eq(alertRules.id, id));
}

export async function deleteAlertRule(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(alertRules).where(eq(alertRules.id, id));
}

// ─── Alert History ─────────────────────────────────────────────

export async function getAlertHistory(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alertHistory).orderBy(desc(alertHistory.sentAt)).limit(limit);
}

// ─── Retention Policies ────────────────────────────────────────

export async function getRetentionPolicies() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(retentionPolicies).orderBy(retentionPolicies.entity);
}

export async function updateRetentionPolicy(
  id: number,
  data: { retentionDays?: number; archiveAction?: "delete" | "archive"; isEnabled?: boolean }
) {
  const db = await getDb();
  if (!db) return;
  await db.update(retentionPolicies).set(data).where(eq(retentionPolicies.id, id));
}
