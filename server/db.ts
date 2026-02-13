import { eq, desc, sql, and, like, inArray, or, gte, lte, type SQL } from "drizzle-orm";
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
  platformUsers,
  type InsertPlatformUser,
  type PlatformUser,
  chatConversations,
  chatMessages,
  type InsertChatConversation,
  type InsertChatMessage,
  customActions,
  type InsertCustomAction,
  type CustomAction,
  trainingDocuments,
  type InsertTrainingDocument,
  type TrainingDocument,
  aiResponseRatings,
  type InsertAiResponseRating,
  type AiResponseRating,
  knowledgeBase,
  type InsertKnowledgeBaseEntry,
  type KnowledgeBaseEntry,
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

  // Core counts
  const [leakRows] = await db.select({
    total: sql<number>`COUNT(*)`,
    totalRecords: sql<number>`COALESCE(SUM(recordCount), 0)`,
    newCount: sql<number>`SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)`,
    analyzingCount: sql<number>`SUM(CASE WHEN status = 'analyzing' THEN 1 ELSE 0 END)`,
    documentedCount: sql<number>`SUM(CASE WHEN status = 'documented' THEN 1 ELSE 0 END)`,
    completedCount: sql<number>`SUM(CASE WHEN status = 'reported' THEN 1 ELSE 0 END)`,
    telegramCount: sql<number>`SUM(CASE WHEN source = 'telegram' THEN 1 ELSE 0 END)`,
    darkwebCount: sql<number>`SUM(CASE WHEN source = 'darkweb' THEN 1 ELSE 0 END)`,
    pasteCount: sql<number>`SUM(CASE WHEN source = 'paste' THEN 1 ELSE 0 END)`,
    enrichedCount: sql<number>`SUM(CASE WHEN enrichedAt IS NOT NULL THEN 1 ELSE 0 END)`,
  }).from(leaks);

  const [channelRows] = await db.select({
    activeMonitors: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
    totalChannels: sql<number>`COUNT(*)`,
  }).from(channels);

  const [piiRows] = await db.select({
    totalPii: sql<number>`COALESCE(SUM(totalMatches), 0)`,
  }).from(piiScans);

  // Sector distribution from DB
  const sectorRows = await db.select({
    sector: leaks.sectorAr,
    count: sql<number>`COUNT(*)`,
    records: sql<number>`COALESCE(SUM(recordCount), 0)`,
  }).from(leaks).groupBy(leaks.sectorAr).orderBy(sql`COUNT(*) DESC`);

  // Source distribution from DB
  const sourceRows = await db.select({
    source: leaks.source,
    count: sql<number>`COUNT(*)`,
    records: sql<number>`COALESCE(SUM(recordCount), 0)`,
  }).from(leaks).groupBy(leaks.source).orderBy(sql`COUNT(*) DESC`);

  // Monthly trend (last 12 months)
  const monthlyRows = await db.select({
    yearMonth: sql<string>`DATE_FORMAT(detectedAt, '%Y-%m')`,
    count: sql<number>`COUNT(*)`,
    records: sql<number>`COALESCE(SUM(recordCount), 0)`,
  }).from(leaks).groupBy(sql`DATE_FORMAT(detectedAt, '%Y-%m')`).orderBy(sql`DATE_FORMAT(detectedAt, '%Y-%m') DESC`).limit(12);

  // Recent leaks (last 10)
  const recentLeaks = await db.select({
    id: leaks.id,
    leakId: leaks.leakId,
    titleAr: leaks.titleAr,
    source: leaks.source,
    status: leaks.status,
    recordCount: leaks.recordCount,
    sectorAr: leaks.sectorAr,
    piiTypes: leaks.piiTypes,
    detectedAt: leaks.detectedAt,
  }).from(leaks).orderBy(desc(leaks.detectedAt)).limit(10);

  // PII types aggregation (done in JS since piiTypes is JSON)
  const allLeaksForPii = await db.select({
    piiTypes: leaks.piiTypes,
  }).from(leaks);
  
  const piiMap = new Map<string, number>();
  allLeaksForPii.forEach(l => {
    const types = (l.piiTypes as string[]) || [];
    types.forEach(t => piiMap.set(t, (piiMap.get(t) || 0) + 1));
  });
  const piiDistribution = Array.from(piiMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  // Distinct sectors count
  const distinctSectors = sectorRows.length;
  // Distinct PII types count
  const distinctPiiTypes = piiDistribution.length;

  return {
    totalLeaks: Number(leakRows?.total ?? 0),
    totalRecords: Number(leakRows?.totalRecords ?? 0),
    newLeaks: Number(leakRows?.newCount ?? 0),
    analyzingLeaks: Number(leakRows?.analyzingCount ?? 0),
    documentedLeaks: Number(leakRows?.documentedCount ?? 0),
    completedLeaks: Number(leakRows?.completedCount ?? 0),
    telegramLeaks: Number(leakRows?.telegramCount ?? 0),
    darkwebLeaks: Number(leakRows?.darkwebCount ?? 0),
    pasteLeaks: Number(leakRows?.pasteCount ?? 0),
    enrichedLeaks: Number(leakRows?.enrichedCount ?? 0),
    activeMonitors: Number(channelRows?.activeMonitors ?? 0),
    totalChannels: Number(channelRows?.totalChannels ?? 0),
    piiDetected: Number(piiRows?.totalPii ?? 0),
    distinctSectors,
    distinctPiiTypes,
    sectorDistribution: sectorRows.map(r => ({ sector: r.sector, count: Number(r.count), records: Number(r.records) })),
    sourceDistribution: sourceRows.map(r => ({ source: r.source, count: Number(r.count), records: Number(r.records) })),
    monthlyTrend: monthlyRows.reverse().map(r => ({ yearMonth: r.yearMonth, count: Number(r.count), records: Number(r.records) })),
    piiDistribution,
    recentLeaks,
  };
}

// ─── Monthly Comparison (MoM) ──────────────────────────────────

export async function getMonthlyComparison() {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Current month stats
  const [currentStats] = await db.select({
    totalLeaks: sql<number>`COUNT(*)`,
    totalRecords: sql<number>`COALESCE(SUM(recordCount), 0)`,
    criticalCount: sql<number>`SUM(CASE WHEN recordCount >= 10000 THEN 1 ELSE 0 END)`,
    newCount: sql<number>`SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)`,
    resolvedCount: sql<number>`SUM(CASE WHEN status = 'reported' THEN 1 ELSE 0 END)`,
    telegramCount: sql<number>`SUM(CASE WHEN source = 'telegram' THEN 1 ELSE 0 END)`,
    darkwebCount: sql<number>`SUM(CASE WHEN source = 'darkweb' THEN 1 ELSE 0 END)`,
    pasteCount: sql<number>`SUM(CASE WHEN source = 'paste' THEN 1 ELSE 0 END)`,
  }).from(leaks).where(sql`detectedAt >= ${currentMonthStart.toISOString()} AND detectedAt <= ${currentMonthEnd.toISOString()}`);

  // Previous month stats
  const [prevStats] = await db.select({
    totalLeaks: sql<number>`COUNT(*)`,
    totalRecords: sql<number>`COALESCE(SUM(recordCount), 0)`,
    criticalCount: sql<number>`SUM(CASE WHEN recordCount >= 10000 THEN 1 ELSE 0 END)`,
    newCount: sql<number>`SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)`,
    resolvedCount: sql<number>`SUM(CASE WHEN status = 'reported' THEN 1 ELSE 0 END)`,
    telegramCount: sql<number>`SUM(CASE WHEN source = 'telegram' THEN 1 ELSE 0 END)`,
    darkwebCount: sql<number>`SUM(CASE WHEN source = 'darkweb' THEN 1 ELSE 0 END)`,
    pasteCount: sql<number>`SUM(CASE WHEN source = 'paste' THEN 1 ELSE 0 END)`,
  }).from(leaks).where(sql`detectedAt >= ${prevMonthStart.toISOString()} AND detectedAt <= ${prevMonthEnd.toISOString()}`);

  // Current month sector distribution
  const currentSectors = await db.select({
    sector: leaks.sectorAr,
    count: sql<number>`COUNT(*)`,
  }).from(leaks)
    .where(sql`detectedAt >= ${currentMonthStart.toISOString()} AND detectedAt <= ${currentMonthEnd.toISOString()}`)
    .groupBy(leaks.sectorAr).orderBy(sql`COUNT(*) DESC`).limit(8);

  // Previous month sector distribution
  const prevSectors = await db.select({
    sector: leaks.sectorAr,
    count: sql<number>`COUNT(*)`,
  }).from(leaks)
    .where(sql`detectedAt >= ${prevMonthStart.toISOString()} AND detectedAt <= ${prevMonthEnd.toISOString()}`)
    .groupBy(leaks.sectorAr).orderBy(sql`COUNT(*) DESC`).limit(8);

  // Daily trend for current and previous month
  const currentDaily = await db.select({
    day: sql<string>`DATE_FORMAT(detectedAt, '%Y-%m-%d')`,
    count: sql<number>`COUNT(*)`,
  }).from(leaks)
    .where(sql`detectedAt >= ${currentMonthStart.toISOString()} AND detectedAt <= ${currentMonthEnd.toISOString()}`)
    .groupBy(sql`DATE_FORMAT(detectedAt, '%Y-%m-%d')`).orderBy(sql`DATE_FORMAT(detectedAt, '%Y-%m-%d')`);

  const prevDaily = await db.select({
    day: sql<string>`DATE_FORMAT(detectedAt, '%Y-%m-%d')`,
    count: sql<number>`COUNT(*)`,
  }).from(leaks)
    .where(sql`detectedAt >= ${prevMonthStart.toISOString()} AND detectedAt <= ${prevMonthEnd.toISOString()}`)
    .groupBy(sql`DATE_FORMAT(detectedAt, '%Y-%m-%d')`).orderBy(sql`DATE_FORMAT(detectedAt, '%Y-%m-%d')`);

  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  return {
    currentMonth: {
      name: monthNames[now.getMonth()],
      nameEn: now.toLocaleString("en", { month: "long" }),
      year: now.getFullYear(),
      totalLeaks: Number(currentStats?.totalLeaks ?? 0),
      totalRecords: Number(currentStats?.totalRecords ?? 0),
      criticalCount: Number(currentStats?.criticalCount ?? 0),
      newCount: Number(currentStats?.newCount ?? 0),
      resolvedCount: Number(currentStats?.resolvedCount ?? 0),
      telegramCount: Number(currentStats?.telegramCount ?? 0),
      darkwebCount: Number(currentStats?.darkwebCount ?? 0),
      pasteCount: Number(currentStats?.pasteCount ?? 0),
      sectors: currentSectors.map(r => ({ sector: r.sector, count: Number(r.count) })),
      daily: currentDaily.map(r => ({ day: r.day, count: Number(r.count) })),
    },
    previousMonth: {
      name: monthNames[now.getMonth() === 0 ? 11 : now.getMonth() - 1],
      nameEn: new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString("en", { month: "long" }),
      year: now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
      totalLeaks: Number(prevStats?.totalLeaks ?? 0),
      totalRecords: Number(prevStats?.totalRecords ?? 0),
      criticalCount: Number(prevStats?.criticalCount ?? 0),
      newCount: Number(prevStats?.newCount ?? 0),
      resolvedCount: Number(prevStats?.resolvedCount ?? 0),
      telegramCount: Number(prevStats?.telegramCount ?? 0),
      darkwebCount: Number(prevStats?.darkwebCount ?? 0),
      pasteCount: Number(prevStats?.pasteCount ?? 0),
      sectors: prevSectors.map(r => ({ sector: r.sector, count: Number(r.count) })),
      daily: prevDaily.map(r => ({ day: r.day, count: Number(r.count) })),
    },
  };
}

// ─── Audit Log ──────────────────────────────────────────────────

export async function logAudit(
  userId: number | null,
  action: string,
  details?: string,
  category?: "auth" | "leak" | "export" | "pii" | "user" | "report" | "system" | "monitoring" | "user_management",
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

// ─── API Keys ─────────────────────────────────────────────────

import {
  apiKeys,
  scheduledReports,
  type InsertApiKey,
  type InsertScheduledReport,
} from "../drizzle/schema";

export async function getApiKeys() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: apiKeys.id,
    name: apiKeys.name,
    keyPrefix: apiKeys.keyPrefix,
    permissions: apiKeys.permissions,
    rateLimit: apiKeys.rateLimit,
    requestsToday: apiKeys.requestsToday,
    lastUsedAt: apiKeys.lastUsedAt,
    expiresAt: apiKeys.expiresAt,
    isActive: apiKeys.isActive,
    createdBy: apiKeys.createdBy,
    createdAt: apiKeys.createdAt,
  }).from(apiKeys).orderBy(desc(apiKeys.createdAt));
}

export async function createApiKey(data: InsertApiKey) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(apiKeys).values(data);
  return result[0].insertId;
}

export async function updateApiKey(id: number, data: Partial<{ name: string; permissions: string[]; rateLimit: number; isActive: boolean; expiresAt: Date | null }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(apiKeys).set(data).where(eq(apiKeys.id, id));
}

export async function deleteApiKey(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(apiKeys).where(eq(apiKeys.id, id));
}

export async function getApiKeyByHash(keyHash: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ─── Scheduled Reports ────────────────────────────────────────

export async function getScheduledReports() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(scheduledReports).orderBy(desc(scheduledReports.createdAt));
}

export async function createScheduledReport(data: InsertScheduledReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(scheduledReports).values(data);
  return result[0].insertId;
}

export async function updateScheduledReport(id: number, data: Partial<InsertScheduledReport>) {
  const db = await getDb();
  if (!db) return;
  await db.update(scheduledReports).set(data).where(eq(scheduledReports.id, id));
}

export async function deleteScheduledReport(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(scheduledReports).where(eq(scheduledReports.id, id));
}

// ─── Threat Map Data ──────────────────────────────────────────

export async function getThreatMapData() {
  const db = await getDb();
  if (!db) return { regions: [], leaks: [] };
  
  const allLeaks = await db.select({
    leakId: leaks.leakId,
    title: leaks.title,
    titleAr: leaks.titleAr,
    source: leaks.source,
    severity: leaks.severity,
    sector: leaks.sector,
    sectorAr: leaks.sectorAr,
    recordCount: leaks.recordCount,
    status: leaks.status,
    region: leaks.region,
    regionAr: leaks.regionAr,
    city: leaks.city,
    cityAr: leaks.cityAr,
    latitude: leaks.latitude,
    longitude: leaks.longitude,
    detectedAt: leaks.detectedAt,
  }).from(leaks).where(
    sql`${leaks.latitude} IS NOT NULL AND ${leaks.longitude} IS NOT NULL`
  );
  
  // Aggregate by region
  const regionMap = new Map<string, { region: string; regionAr: string; count: number; critical: number; high: number; medium: number; low: number; records: number }>();
  for (const leak of allLeaks) {
    const key = leak.region || "Unknown";
    const existing = regionMap.get(key) || { region: key, regionAr: leak.regionAr || key, count: 0, critical: 0, high: 0, medium: 0, low: 0, records: 0 };
    existing.count++;
    existing[leak.severity as "critical" | "high" | "medium" | "low"]++;
    existing.records += leak.recordCount;
    regionMap.set(key, existing);
  }
  
  return {
    regions: Array.from(regionMap.values()),
    leaks: allLeaks,
  };
}

// ─── New v5 Tables ──────────────────────────────────────────

import {
  threatRules,
  evidenceChain,
  sellerProfiles,
  osintQueries,
  feedbackEntries,
  knowledgeGraphNodes,
  knowledgeGraphEdges,
  type InsertThreatRule,
  type InsertEvidenceChainEntry,
  type InsertSellerProfile,
  type InsertOsintQuery,
  type InsertFeedbackEntry,
} from "../drizzle/schema";

// ─── Threat Rules ────────────────────────────────────────────

export async function getThreatRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(threatRules).orderBy(desc(threatRules.createdAt));
}

export async function getThreatRuleById(ruleId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(threatRules).where(eq(threatRules.ruleId, ruleId)).limit(1);
  return result[0];
}

export async function createThreatRule(rule: InsertThreatRule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(threatRules).values(rule);
  return result[0].insertId;
}

export async function updateThreatRule(id: number, data: Partial<InsertThreatRule>) {
  const db = await getDb();
  if (!db) return;
  await db.update(threatRules).set(data).where(eq(threatRules.id, id));
}

export async function toggleThreatRule(id: number, isEnabled: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(threatRules).set({ isEnabled }).where(eq(threatRules.id, id));
}

// ─── Evidence Chain ──────────────────────────────────────────

export async function getEvidenceChain(leakId?: string) {
  const db = await getDb();
  if (!db) return [];
  if (leakId) {
    return db.select().from(evidenceChain).where(eq(evidenceChain.leakId, leakId)).orderBy(evidenceChain.blockIndex);
  }
  return db.select().from(evidenceChain).orderBy(desc(evidenceChain.createdAt));
}

export async function createEvidenceEntry(entry: InsertEvidenceChainEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(evidenceChain).values(entry);
  return result[0].insertId;
}

export async function getEvidenceStats() {
  const db = await getDb();
  if (!db) return { total: 0, verified: 0, types: {} };
  const all = await db.select().from(evidenceChain);
  const verified = all.filter(e => e.isVerified).length;
  const types: Record<string, number> = {};
  all.forEach(e => { types[e.evidenceType] = (types[e.evidenceType] || 0) + 1; });
  return { total: all.length, verified, types };
}

// ─── Seller Profiles ─────────────────────────────────────────

export async function getSellerProfiles(filters?: { riskLevel?: string }) {
  const db = await getDb();
  if (!db) return [];
  if (filters?.riskLevel && filters.riskLevel !== "all") {
    return db.select().from(sellerProfiles).where(eq(sellerProfiles.riskLevel, filters.riskLevel as any)).orderBy(desc(sellerProfiles.riskScore));
  }
  return db.select().from(sellerProfiles).orderBy(desc(sellerProfiles.riskScore));
}

export async function getSellerById(sellerId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(sellerProfiles).where(eq(sellerProfiles.sellerId, sellerId)).limit(1);
  return result[0];
}

export async function createSellerProfile(seller: InsertSellerProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sellerProfiles).values(seller);
  return result[0].insertId;
}

export async function updateSellerProfile(id: number, data: Partial<InsertSellerProfile>) {
  const db = await getDb();
  if (!db) return;
  await db.update(sellerProfiles).set(data).where(eq(sellerProfiles.id, id));
}

// ─── OSINT Queries ───────────────────────────────────────────

export async function getOsintQueries(filters?: { queryType?: string; category?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.queryType && filters.queryType !== "all") {
    conditions.push(eq(osintQueries.queryType, filters.queryType as any));
  }
  if (filters?.category && filters.category !== "all") {
    conditions.push(eq(osintQueries.category, filters.category));
  }
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(osintQueries).where(where).orderBy(desc(osintQueries.createdAt));
}

export async function createOsintQuery(query: InsertOsintQuery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(osintQueries).values(query);
  return result[0].insertId;
}

export async function updateOsintQuery(id: number, data: Partial<InsertOsintQuery>) {
  const db = await getDb();
  if (!db) return;
  await db.update(osintQueries).set(data).where(eq(osintQueries.id, id));
}

// ─── Feedback Entries ────────────────────────────────────────

export async function getFeedbackEntries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(feedbackEntries).orderBy(desc(feedbackEntries.createdAt));
}

export async function createFeedbackEntry(entry: InsertFeedbackEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(feedbackEntries).values(entry);
  return result[0].insertId;
}

export async function getFeedbackStats() {
  const db = await getDb();
  if (!db) return { total: 0, correct: 0, precision: 0, recall: 0, f1: 0 };
  const all = await db.select().from(feedbackEntries);
  const total = all.length;
  const correct = all.filter(e => e.isCorrect).length;
  
  // Calculate precision, recall, F1
  const truePositives = all.filter(e => e.systemClassification === "personal_data" && e.analystClassification === "personal_data").length;
  const falsePositives = all.filter(e => e.systemClassification === "personal_data" && e.analystClassification !== "personal_data").length;
  const falseNegatives = all.filter(e => e.systemClassification !== "personal_data" && e.analystClassification === "personal_data").length;
  
  const precision = truePositives + falsePositives > 0 ? Math.round((truePositives / (truePositives + falsePositives)) * 100) : 0;
  const recall = truePositives + falseNegatives > 0 ? Math.round((truePositives / (truePositives + falseNegatives)) * 100) : 0;
  const f1 = precision + recall > 0 ? Math.round((2 * precision * recall) / (precision + recall)) : 0;
  
  return { total, correct, precision, recall, f1 };
}

// ─── Knowledge Graph ─────────────────────────────────────────

export async function getKnowledgeGraphData() {
  const db = await getDb();
  if (!db) return { nodes: [], edges: [] };
  const nodes = await db.select().from(knowledgeGraphNodes);
  const edges = await db.select().from(knowledgeGraphEdges);
  return { nodes, edges };
}


// ─── Platform Users (Custom Auth) ──────────────────────────────

export async function getPlatformUserByUserId(userId: string): Promise<PlatformUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(platformUsers).where(eq(platformUsers.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getPlatformUserById(id: number): Promise<PlatformUser | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(platformUsers).where(eq(platformUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllPlatformUsers(): Promise<PlatformUser[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(platformUsers).orderBy(desc(platformUsers.createdAt));
}

export async function createPlatformUser(user: InsertPlatformUser): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(platformUsers).values(user);
}

export async function updatePlatformUser(
  id: number,
  updates: Partial<Pick<PlatformUser, "name" | "email" | "mobile" | "displayName" | "platformRole" | "status" | "passwordHash" | "lastLoginAt">>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(platformUsers).set(updates).where(eq(platformUsers.id, id));
}

export async function deletePlatformUser(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(platformUsers).where(eq(platformUsers.id, id));
}


// ─── Incident Documentation Helpers ──────────────────────────────

import {
  incidentDocuments,
  type InsertIncidentDocument,
  type IncidentDocument,
  reportAudit,
  type InsertReportAudit,
  type ReportAudit,
} from "../drizzle/schema";

export async function createIncidentDocument(doc: InsertIncidentDocument): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(incidentDocuments).values(doc).$returningId();
  return result.id;
}

export async function getIncidentDocumentByVerificationCode(code: string): Promise<IncidentDocument | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(incidentDocuments).where(eq(incidentDocuments.verificationCode, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getIncidentDocumentByDocumentId(documentId: string): Promise<IncidentDocument | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(incidentDocuments).where(eq(incidentDocuments.documentId, documentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getIncidentDocumentsByLeakId(leakId: string): Promise<IncidentDocument[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(incidentDocuments).where(eq(incidentDocuments.leakId, leakId)).orderBy(desc(incidentDocuments.createdAt));
}

export async function getAllIncidentDocuments(): Promise<IncidentDocument[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(incidentDocuments).orderBy(desc(incidentDocuments.createdAt));
}

export async function getFilteredIncidentDocuments(filters: {
  search?: string;
  employeeName?: string;
  leakId?: string;
  documentType?: string;
  dateFrom?: Date;
  dateTo?: Date;
}): Promise<IncidentDocument[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions: SQL[] = [];
  if (filters.search) {
    conditions.push(
      or(
        like(incidentDocuments.documentId, `%${filters.search}%`),
        like(incidentDocuments.verificationCode, `%${filters.search}%`),
        like(incidentDocuments.title, `%${filters.search}%`),
        like(incidentDocuments.titleAr, `%${filters.search}%`)
      )!
    );
  }
  if (filters.employeeName) {
    conditions.push(like(incidentDocuments.generatedByName, `%${filters.employeeName}%`));
  }
  if (filters.leakId) {
    conditions.push(eq(incidentDocuments.leakId, filters.leakId));
  }
  if (filters.documentType) {
    conditions.push(eq(incidentDocuments.documentType, filters.documentType as any));
  }
  if (filters.dateFrom) {
    conditions.push(gte(incidentDocuments.createdAt, filters.dateFrom));
  }
  if (filters.dateTo) {
    conditions.push(lte(incidentDocuments.createdAt, filters.dateTo));
  }
  const query = db.select().from(incidentDocuments);
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(incidentDocuments.createdAt));
  }
  return query.orderBy(desc(incidentDocuments.createdAt));
}

// ─── Report Audit Helpers ────────────────────────────────────────

export async function createReportAudit(entry: InsertReportAudit): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(reportAudit).values(entry).$returningId();
  return result.id;
}

export async function getReportAuditEntries(limit = 100): Promise<ReportAudit[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reportAudit).orderBy(desc(reportAudit.createdAt)).limit(limit);
}


// ─── AI Response Ratings Helpers ────────────────────────────────

export async function createAiRating(rating: InsertAiResponseRating): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(aiResponseRatings).values(rating);
  return result[0].insertId;
}

export async function getAiRatings(filters?: {
  limit?: number;
  minRating?: number;
  maxRating?: number;
}): Promise<AiResponseRating[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions: SQL[] = [];
  if (filters?.minRating) conditions.push(gte(aiResponseRatings.rating, filters.minRating));
  if (filters?.maxRating) conditions.push(lte(aiResponseRatings.rating, filters.maxRating));
  const query = db.select().from(aiResponseRatings);
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(aiResponseRatings.createdAt)).limit(filters?.limit || 100);
  }
  return query.orderBy(desc(aiResponseRatings.createdAt)).limit(filters?.limit || 100);
}

export async function getAiRatingStats(): Promise<{
  totalRatings: number;
  averageRating: number;
  ratingDistribution: Record<number, number>;
}> {
  const db = await getDb();
  if (!db) return { totalRatings: 0, averageRating: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  const result = await db.select({
    totalRatings: sql<number>`COUNT(*)`,
    averageRating: sql<number>`COALESCE(AVG(rating), 0)`,
    r1: sql<number>`SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)`,
    r2: sql<number>`SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)`,
    r3: sql<number>`SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)`,
    r4: sql<number>`SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)`,
    r5: sql<number>`SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)`,
  }).from(aiResponseRatings);
  const row = result[0];
  return {
    totalRatings: Number(row?.totalRatings || 0),
    averageRating: Math.round(Number(row?.averageRating || 0) * 10) / 10,
    ratingDistribution: {
      1: Number(row?.r1 || 0),
      2: Number(row?.r2 || 0),
      3: Number(row?.r3 || 0),
      4: Number(row?.r4 || 0),
      5: Number(row?.r5 || 0),
    },
  };
}

// ─── Knowledge Base Helpers ─────────────────────────────────────

export async function getKnowledgeBaseEntries(filters?: {
  category?: string;
  search?: string;
  isPublished?: boolean;
  limit?: number;
}): Promise<KnowledgeBaseEntry[]> {
  const db = await getDb();
  if (!db) return [];
  const conditions: SQL[] = [];
  if (filters?.category) conditions.push(eq(knowledgeBase.category, filters.category as any));
  if (filters?.isPublished !== undefined) conditions.push(eq(knowledgeBase.isPublished, filters.isPublished));
  if (filters?.search) {
    conditions.push(
      or(
        like(knowledgeBase.title, `%${filters.search}%`),
        like(knowledgeBase.titleAr, `%${filters.search}%`),
        like(knowledgeBase.content, `%${filters.search}%`),
        like(knowledgeBase.contentAr, `%${filters.search}%`)
      )!
    );
  }
  const query = db.select().from(knowledgeBase);
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(knowledgeBase.createdAt)).limit(filters?.limit || 100);
  }
  return query.orderBy(desc(knowledgeBase.createdAt)).limit(filters?.limit || 100);
}

export async function getKnowledgeBaseEntryById(entryId: string): Promise<KnowledgeBaseEntry | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(knowledgeBase).where(eq(knowledgeBase.entryId, entryId)).limit(1);
  return result[0];
}

export async function createKnowledgeBaseEntry(entry: InsertKnowledgeBaseEntry): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(knowledgeBase).values(entry);
  return result[0].insertId;
}

export async function updateKnowledgeBaseEntry(
  entryId: string,
  data: Partial<InsertKnowledgeBaseEntry>
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(knowledgeBase).set(data).where(eq(knowledgeBase.entryId, entryId));
}

export async function deleteKnowledgeBaseEntry(entryId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(knowledgeBase).where(eq(knowledgeBase.entryId, entryId));
}

export async function getKnowledgeBaseStats(): Promise<{
  total: number;
  published: number;
  byCategory: Record<string, number>;
}> {
  const db = await getDb();
  if (!db) return { total: 0, published: 0, byCategory: {} };
  const result = await db.select({
    total: sql<number>`COUNT(*)`,
    published: sql<number>`SUM(CASE WHEN ${knowledgeBase.isPublished} = true THEN 1 ELSE 0 END)`,
  }).from(knowledgeBase);
  const catResult = await db.select({
    category: knowledgeBase.category,
    count: sql<number>`COUNT(*)`,
  }).from(knowledgeBase).groupBy(knowledgeBase.category);
  const byCategory: Record<string, number> = {};
  for (const row of catResult) {
    byCategory[row.category] = Number(row.count);
  }
  return {
    total: Number(result[0]?.total || 0),
    published: Number(result[0]?.published || 0),
    byCategory,
  };
}

export async function incrementKnowledgeBaseViewCount(entryId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(knowledgeBase)
    .set({ viewCount: sql`${knowledgeBase.viewCount} + 1` })
    .where(eq(knowledgeBase.entryId, entryId));
}

export async function getPublishedKnowledgeForAI(): Promise<string> {
  const db = await getDb();
  if (!db) return "";
  const entries = await db.select({
    category: knowledgeBase.category,
    title: knowledgeBase.title,
    titleAr: knowledgeBase.titleAr,
    content: knowledgeBase.content,
    contentAr: knowledgeBase.contentAr,
    tags: knowledgeBase.tags,
  }).from(knowledgeBase).where(eq(knowledgeBase.isPublished, true)).limit(50);
  
  if (entries.length === 0) return "";
  
  return entries.map(e => 
    `[${e.category}] ${e.titleAr || e.title}\n${e.contentAr || e.content}${e.tags?.length ? `\nالعلامات: ${e.tags.join(', ')}` : ''}`
  ).join('\n\n---\n\n');
}


// ═══════════════════════════════════════════════════════════════
// PERSONALITY SCENARIOS & USER SESSIONS
// ═══════════════════════════════════════════════════════════════
import {
  personalityScenarios,
  userSessions,
  type InsertPersonalityScenario,
} from "../drizzle/schema";

export async function getPersonalityScenarios(type?: string) {
  const db = await getDb();
  if (!db) return [];
  if (type) {
    return db.select().from(personalityScenarios)
      .where(and(eq(personalityScenarios.scenarioType, type as any), eq(personalityScenarios.isActive, true)))
      .orderBy(desc(personalityScenarios.createdAt));
  }
  return db.select().from(personalityScenarios).orderBy(desc(personalityScenarios.createdAt));
}

export async function getAllPersonalityScenarios() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(personalityScenarios).orderBy(desc(personalityScenarios.createdAt));
}

export async function createPersonalityScenario(data: Omit<InsertPersonalityScenario, "id">) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(personalityScenarios).values(data);
  return result[0].insertId;
}

export async function updatePersonalityScenario(id: number, data: Partial<InsertPersonalityScenario>) {
  const db = await getDb();
  if (!db) return;
  await db.update(personalityScenarios).set(data).where(eq(personalityScenarios.id, id));
}

export async function deletePersonalityScenario(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(personalityScenarios).where(eq(personalityScenarios.id, id));
}

export async function getGreetingForUser(userId: string, userName: string): Promise<{ greeting: string; isFirstVisit: boolean }> {
  const db = await getDb();
  if (!db) return { greeting: `مرحباً ${userName}! كيف يمكنني مساعدتك اليوم؟`, isFirstVisit: true };

  const today = new Date().toISOString().split("T")[0];

  // Check if user visited today
  const existing = await db.select().from(userSessions)
    .where(and(eq(userSessions.userId, userId), eq(userSessions.sessionDate, today)))
    .limit(1);

  let isFirstVisit = existing.length === 0;

  if (isFirstVisit) {
    // Check if user has ANY previous sessions
    const anyPrevious = await db.select({ id: userSessions.id }).from(userSessions)
      .where(eq(userSessions.userId, userId)).limit(1);
    const isFirstEver = anyPrevious.length === 0;

    // Create today's session
    await db.insert(userSessions).values({
      userId,
      userName,
      sessionDate: today,
      visitCount: 1,
    });

    // Get appropriate greeting
    const scenarioType = isFirstEver ? "greeting_first" : "greeting_return";
    const scenarios = await db.select().from(personalityScenarios)
      .where(and(eq(personalityScenarios.scenarioType, scenarioType), eq(personalityScenarios.isActive, true)));

    if (scenarios.length > 0) {
      const chosen = scenarios[Math.floor(Math.random() * scenarios.length)];
      const greeting = chosen.responseTemplate
        .replace(/\{userName\}/g, userName)
        .replace(/\{name\}/g, userName);
      return { greeting, isFirstVisit: isFirstEver };
    }

    return {
      greeting: isFirstEver
        ? `أهلاً وسهلاً ${userName}! أنا راصد الذكي، مساعدك في منصة رصد تسريبات البيانات الشخصية. كيف يمكنني مساعدتك؟`
        : `مرحباً بعودتك ${userName}! كيف يمكنني مساعدتك اليوم؟`,
      isFirstVisit: isFirstEver,
    };
  } else {
    // Update visit count
    await db.update(userSessions)
      .set({ visitCount: sql`${userSessions.visitCount} + 1` })
      .where(and(eq(userSessions.userId, userId), eq(userSessions.sessionDate, today)));

    return {
      greeting: `مرحباً مجدداً ${userName}! هل تحتاج مساعدة إضافية؟`,
      isFirstVisit: false,
    };
  }
}

export async function checkLeaderMention(message: string): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const leaderScenarios = await db.select().from(personalityScenarios)
    .where(and(eq(personalityScenarios.scenarioType, "leader_respect"), eq(personalityScenarios.isActive, true)));

  for (const scenario of leaderScenarios) {
    if (scenario.triggerKeyword) {
      const keywords = scenario.triggerKeyword.split(",").map(k => k.trim());
      for (const keyword of keywords) {
        if (keyword && message.includes(keyword)) {
          return scenario.responseTemplate;
        }
      }
    }
  }

  return null;
}


// ═══════════════════════════════════════════════════════════════
// Chat Conversations & Messages
// ═══════════════════════════════════════════════════════════════

export async function createConversation(data: InsertChatConversation) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(chatConversations).values(data);
  return data.conversationId;
}

export async function getUserConversations(userId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.userId, userId))
    .orderBy(desc(chatConversations.updatedAt))
    .limit(limit);
}

export async function getConversationById(conversationId: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(chatConversations)
    .where(eq(chatConversations.conversationId, conversationId))
    .limit(1);
  return rows[0] || null;
}

export async function updateConversation(
  conversationId: string,
  data: Partial<Pick<InsertChatConversation, "title" | "summary" | "messageCount" | "totalToolsUsed" | "status">>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(chatConversations)
    .set(data)
    .where(eq(chatConversations.conversationId, conversationId));
}

export async function deleteConversation(conversationId: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(chatMessages).where(eq(chatMessages.conversationId, conversationId));
  await db.delete(chatConversations).where(eq(chatConversations.conversationId, conversationId));
}

export async function addChatMessage(data: InsertChatMessage) {
  const db = await getDb();
  if (!db) return;
  await db.insert(chatMessages).values(data);
  // Update conversation message count
  const conv = await getConversationById(data.conversationId);
  if (conv) {
    const toolCount = Array.isArray(data.toolsUsed) ? (data.toolsUsed as string[]).length : 0;
    await updateConversation(data.conversationId, {
      messageCount: conv.messageCount + 1,
      totalToolsUsed: conv.totalToolsUsed + toolCount,
    });
  }
}

export async function getConversationMessages(conversationId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);
}


// ─── Custom Actions Helpers ─────────────────────────────────────

export async function getCustomActions(filters?: { isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: SQL[] = [];
  if (filters?.isActive !== undefined) conditions.push(eq(customActions.isActive, filters.isActive));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(customActions).where(where).orderBy(desc(customActions.createdAt));
}

export async function getCustomActionById(actionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customActions).where(eq(customActions.actionId, actionId)).limit(1);
  return result[0];
}

export async function createCustomAction(action: InsertCustomAction): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(customActions).values(action);
  return result[0].insertId;
}

export async function updateCustomAction(actionId: string, data: Partial<InsertCustomAction>) {
  const db = await getDb();
  if (!db) return;
  await db.update(customActions).set(data).where(eq(customActions.actionId, actionId));
}

export async function deleteCustomAction(actionId: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(customActions).where(eq(customActions.actionId, actionId));
}

export async function findMatchingAction(input: string): Promise<CustomAction | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const actions = await db.select().from(customActions).where(eq(customActions.isActive, true));
  const inputLower = input.toLowerCase().trim();
  // Check trigger phrase and aliases
  for (const action of actions) {
    if (inputLower.includes(action.triggerPhrase.toLowerCase())) return action;
    const aliases = action.triggerAliases as string[] | null;
    if (aliases) {
      for (const alias of aliases) {
        if (inputLower.includes(alias.toLowerCase())) return action;
      }
    }
  }
  return undefined;
}

// ─── Training Documents Helpers ─────────────────────────────────

export async function getTrainingDocuments(filters?: { status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: SQL[] = [];
  if (filters?.status) conditions.push(eq(trainingDocuments.status, filters.status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(trainingDocuments).where(where).orderBy(desc(trainingDocuments.createdAt));
}

export async function getTrainingDocumentById(docId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(trainingDocuments).where(eq(trainingDocuments.docId, docId)).limit(1);
  return result[0];
}

export async function createTrainingDocument(doc: InsertTrainingDocument): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(trainingDocuments).values(doc);
  return result[0].insertId;
}

export async function updateTrainingDocument(docId: string, data: Partial<InsertTrainingDocument>) {
  const db = await getDb();
  if (!db) return;
  await db.update(trainingDocuments).set(data).where(eq(trainingDocuments.docId, docId));
}

export async function deleteTrainingDocument(docId: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(trainingDocuments).where(eq(trainingDocuments.docId, docId));
}

// ─── AI Feedback Stats ─────────────────────────────────────────

export async function getAiFeedbackStats() {
  const db = await getDb();
  if (!db) return { total: 0, avgRating: 0, distribution: {} as Record<string, number> };
  const [stats] = await db.select({
    total: sql<number>`COUNT(*)`,
    avgRating: sql<number>`COALESCE(AVG(rating), 0)`,
    stars1: sql<number>`SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)`,
    stars2: sql<number>`SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)`,
    stars3: sql<number>`SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)`,
    stars4: sql<number>`SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)`,
    stars5: sql<number>`SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)`,
  }).from(aiResponseRatings);
  return {
    total: Number(stats?.total ?? 0),
    avgRating: Number(Number(stats?.avgRating ?? 0).toFixed(1)),
    distribution: {
      "1": Number(stats?.stars1 ?? 0),
      "2": Number(stats?.stars2 ?? 0),
      "3": Number(stats?.stars3 ?? 0),
      "4": Number(stats?.stars4 ?? 0),
      "5": Number(stats?.stars5 ?? 0),
    },
  };
}

export async function getTrainingDocumentContent(): Promise<string> {
  const db = await getDb();
  if (!db) return "";
  const docs = await db.select({
    fileName: trainingDocuments.fileName,
    content: trainingDocuments.extractedContent,
  }).from(trainingDocuments).where(eq(trainingDocuments.status, "completed"));
  return docs.map(d => `[مستند: ${d.fileName}]\n${d.content || ""}`).join("\n\n---\n\n");
}
