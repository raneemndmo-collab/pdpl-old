import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  bigint,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table — extended with NDMO roles
 * Roles: admin (full access), manager (reports + leaks), analyst (read + classify), viewer (dashboard only)
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  ndmoRole: mysqlEnum("ndmoRole", ["executive", "manager", "analyst", "viewer"])
    .default("viewer")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Leak records — core entity for detected data leaks
 * Includes AI enrichment fields for LLM-powered threat intelligence
 */
export const leaks = mysqlTable("leaks", {
  id: int("id").autoincrement().primaryKey(),
  leakId: varchar("leakId", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  titleAr: varchar("titleAr", { length: 500 }).notNull(),
  source: mysqlEnum("source", ["telegram", "darkweb", "paste"]).notNull(),
  severity: mysqlEnum("severity", ["critical", "high", "medium", "low"]).notNull(),
  sector: varchar("sector", { length: 100 }).notNull(),
  sectorAr: varchar("sectorAr", { length: 100 }).notNull(),
  piiTypes: json("piiTypes").$type<string[]>().notNull(),
  recordCount: int("recordCount").notNull().default(0),
  status: mysqlEnum("status", ["new", "analyzing", "documented", "reported"])
    .default("new")
    .notNull(),
  description: text("description"),
  descriptionAr: text("descriptionAr"),
  // AI Enrichment fields
  aiSeverity: mysqlEnum("aiSeverity", ["critical", "high", "medium", "low"]),
  aiSummary: text("aiSummary"),
  aiSummaryAr: text("aiSummaryAr"),
  aiRecommendations: json("aiRecommendations").$type<string[]>(),
  aiRecommendationsAr: json("aiRecommendationsAr").$type<string[]>(),
  aiConfidence: int("aiConfidence"),
  enrichedAt: timestamp("enrichedAt"),
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Leak = typeof leaks.$inferSelect;
export type InsertLeak = typeof leaks.$inferInsert;

/**
 * Monitoring channels — Telegram, Dark Web, Paste Sites sources
 */
export const channels = mysqlTable("channels", {
  id: int("id").autoincrement().primaryKey(),
  channelId: varchar("channelId", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  platform: mysqlEnum("platform", ["telegram", "darkweb", "paste"]).notNull(),
  subscribers: int("subscribers").default(0),
  status: mysqlEnum("status", ["active", "paused", "flagged"])
    .default("active")
    .notNull(),
  lastActivity: timestamp("lastActivity"),
  leaksDetected: int("leaksDetected").default(0),
  riskLevel: mysqlEnum("riskLevel", ["high", "medium", "low"])
    .default("medium")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert;

/**
 * PII scan results — records of PII classification runs
 */
export const piiScans = mysqlTable("pii_scans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  inputText: text("inputText").notNull(),
  results: json("results")
    .$type<
      Array<{
        type: string;
        typeAr: string;
        value: string;
        line: number;
      }>
    >()
    .notNull(),
  totalMatches: int("totalMatches").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PiiScan = typeof piiScans.$inferSelect;
export type InsertPiiScan = typeof piiScans.$inferInsert;

/**
 * Reports — generated reports for stakeholders
 */
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  titleAr: varchar("titleAr", { length: 500 }),
  type: mysqlEnum("type", ["monthly", "quarterly", "special"]).notNull(),
  status: mysqlEnum("reportStatus", ["draft", "published"])
    .default("draft")
    .notNull(),
  pageCount: int("pageCount").default(0),
  generatedBy: int("generatedBy"),
  fileUrl: text("fileUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Dark web listings — items for sale on dark web
 */
export const darkWebListings = mysqlTable("dark_web_listings", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  titleAr: varchar("titleAr", { length: 500 }),
  severity: mysqlEnum("listingSeverity", ["critical", "high", "medium", "low"]).notNull(),
  sourceChannelId: int("sourceChannelId"),
  sourceName: varchar("sourceName", { length: 255 }),
  price: varchar("price", { length: 50 }),
  recordCount: int("recordCount").default(0),
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DarkWebListing = typeof darkWebListings.$inferSelect;
export type InsertDarkWebListing = typeof darkWebListings.$inferInsert;

/**
 * Paste entries — detected pastes with PII
 */
export const pasteEntries = mysqlTable("paste_entries", {
  id: int("id").autoincrement().primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  sourceName: varchar("sourceName", { length: 255 }).notNull(),
  fileSize: varchar("fileSize", { length: 50 }),
  piiTypes: json("pastePiiTypes").$type<string[]>(),
  preview: text("preview"),
  status: mysqlEnum("pasteStatus", ["flagged", "analyzing", "documented", "reported"])
    .default("flagged")
    .notNull(),
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasteEntry = typeof pasteEntries.$inferSelect;
export type InsertPasteEntry = typeof pasteEntries.$inferInsert;

/**
 * Audit log — tracks user actions for compliance
 */
export const auditLog = mysqlTable("audit_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  userName: varchar("userName", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(),
  category: mysqlEnum("auditCategory", ["auth", "leak", "export", "pii", "user", "report", "system", "monitoring"])
    .default("system")
    .notNull(),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLogEntry = typeof auditLog.$inferInsert;

/**
 * Notifications — real-time alerts for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  type: mysqlEnum("notificationType", ["new_leak", "status_change", "scan_complete", "job_complete", "system"])
    .default("system")
    .notNull(),
  title: varchar("notifTitle", { length: 255 }).notNull(),
  titleAr: varchar("notifTitleAr", { length: 255 }).notNull(),
  message: text("notifMessage"),
  messageAr: text("notifMessageAr"),
  severity: mysqlEnum("notifSeverity", ["critical", "high", "medium", "low", "info"])
    .default("info")
    .notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedId: varchar("relatedId", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Monitoring jobs — scheduled background tasks
 */
export const monitoringJobs = mysqlTable("monitoring_jobs", {
  id: int("id").autoincrement().primaryKey(),
  jobId: varchar("jobId", { length: 64 }).notNull().unique(),
  name: varchar("jobName", { length: 255 }).notNull(),
  nameAr: varchar("jobNameAr", { length: 255 }).notNull(),
  platform: mysqlEnum("jobPlatform", ["telegram", "darkweb", "paste", "all"]).notNull(),
  cronExpression: varchar("cronExpression", { length: 50 }).notNull(),
  status: mysqlEnum("jobStatus", ["active", "paused", "running", "error"])
    .default("active")
    .notNull(),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  lastResult: text("lastResult"),
  leaksFound: int("leaksFound").default(0),
  totalRuns: int("totalRuns").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonitoringJob = typeof monitoringJobs.$inferSelect;
export type InsertMonitoringJob = typeof monitoringJobs.$inferInsert;

/**
 * Alert contacts — people who receive email/SMS alerts
 */
export const alertContacts = mysqlTable("alert_contacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("contactName", { length: 255 }).notNull(),
  nameAr: varchar("contactNameAr", { length: 255 }),
  email: varchar("contactEmail", { length: 320 }),
  phone: varchar("contactPhone", { length: 20 }),
  role: varchar("contactRole", { length: 100 }),
  roleAr: varchar("contactRoleAr", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  channels: json("alertChannels").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertContact = typeof alertContacts.$inferSelect;
export type InsertAlertContact = typeof alertContacts.$inferInsert;

/**
 * Alert rules — configurable rules for when to send alerts
 */
export const alertRules = mysqlTable("alert_rules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("ruleName", { length: 255 }).notNull(),
  nameAr: varchar("ruleNameAr", { length: 255 }),
  severityThreshold: mysqlEnum("severityThreshold", ["critical", "high", "medium", "low"]).notNull(),
  channel: mysqlEnum("alertChannel", ["email", "sms", "both"]).default("email").notNull(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  recipients: json("ruleRecipients").$type<number[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;

/**
 * Alert history — log of sent alerts
 */
export const alertHistory = mysqlTable("alert_history", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: int("ruleId"),
  contactId: int("contactId"),
  contactName: varchar("alertContactName", { length: 255 }),
  channel: mysqlEnum("deliveryChannel", ["email", "sms"]).notNull(),
  subject: varchar("alertSubject", { length: 500 }).notNull(),
  body: text("alertBody"),
  status: mysqlEnum("deliveryStatus", ["sent", "failed", "pending"]).default("pending").notNull(),
  leakId: varchar("alertLeakId", { length: 32 }),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export type AlertHistoryEntry = typeof alertHistory.$inferSelect;
export type InsertAlertHistoryEntry = typeof alertHistory.$inferInsert;

/**
 * Retention policies — configurable data lifecycle rules
 */
export const retentionPolicies = mysqlTable("retention_policies", {
  id: int("id").autoincrement().primaryKey(),
  entity: mysqlEnum("retentionEntity", ["leaks", "audit_logs", "notifications", "pii_scans", "paste_entries"]).notNull().unique(),
  entityLabel: varchar("entityLabel", { length: 100 }).notNull(),
  entityLabelAr: varchar("entityLabelAr", { length: 100 }).notNull(),
  retentionDays: int("retentionDays").notNull().default(365),
  archiveAction: mysqlEnum("archiveAction", ["delete", "archive"]).default("archive").notNull(),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  recordsArchived: int("recordsArchived").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RetentionPolicy = typeof retentionPolicies.$inferSelect;
export type InsertRetentionPolicy = typeof retentionPolicies.$inferInsert;
