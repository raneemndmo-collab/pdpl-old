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
  // Sample leaked data (fake but realistic PII examples)
  sampleData: json("sampleData").$type<Array<Record<string, string>>>(),
  // Source URL where the leak was found
  sourceUrl: text("sourceUrl"),
  // Source platform name
  sourcePlatform: varchar("sourcePlatform", { length: 255 }),
  // Screenshot URLs showing the leak evidence
  screenshotUrls: json("screenshotUrls").$type<string[]>(),
  // Seller/threat actor name
  threatActor: varchar("threatActor", { length: 255 }),
  // Price if sold on dark web
  price: varchar("leakPrice", { length: 100 }),
  // Breach method
  breachMethod: varchar("breachMethod", { length: 255 }),
  breachMethodAr: varchar("breachMethodAr", { length: 255 }),
  // Geographic data for threat map
  region: varchar("region", { length: 100 }),
  regionAr: varchar("regionAr", { length: 100 }),
  city: varchar("city", { length: 100 }),
  cityAr: varchar("cityAr", { length: 100 }),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
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
  category: mysqlEnum("auditCategory", ["auth", "leak", "export", "pii", "user", "report", "system", "monitoring", "enrichment", "alert", "retention", "api", "user_management"])
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

/**
 * API Keys — for external SIEM/SOC integrations
 */
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("apiKeyName", { length: 255 }).notNull(),
  keyHash: varchar("keyHash", { length: 128 }).notNull().unique(),
  keyPrefix: varchar("keyPrefix", { length: 12 }).notNull(),
  permissions: json("permissions").$type<string[]>(),
  rateLimit: int("rateLimit").default(1000).notNull(),
  requestsToday: int("requestsToday").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Scheduled reports — automated compliance report generation
 */
export const scheduledReports = mysqlTable("scheduled_reports", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("scheduledReportName", { length: 255 }).notNull(),
  nameAr: varchar("scheduledReportNameAr", { length: 255 }),
  frequency: mysqlEnum("frequency", ["weekly", "monthly", "quarterly"]).notNull(),
  template: mysqlEnum("reportTemplate", ["executive_summary", "full_detail", "compliance", "sector_analysis"]).default("executive_summary").notNull(),
  recipientIds: json("recipientIds").$type<number[]>(),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  totalRuns: int("totalRuns").default(0),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledReport = typeof scheduledReports.$inferSelect;
export type InsertScheduledReport = typeof scheduledReports.$inferInsert;

/**
 * Threat Hunting Rules — 25 Saudi-specific YARA-like rules
 */
export const threatRules = mysqlTable("threat_rules", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: varchar("ruleId", { length: 32 }).notNull().unique(),
  name: varchar("ruleName", { length: 255 }).notNull(),
  nameAr: varchar("ruleNameAr", { length: 255 }).notNull(),
  description: text("ruleDescription"),
  descriptionAr: text("ruleDescriptionAr"),
  category: mysqlEnum("ruleCategory", [
    "data_leak", "credentials", "sale_ad", "db_dump", "financial",
    "health", "government", "telecom", "education", "infrastructure",
  ]).notNull(),
  severity: mysqlEnum("ruleSeverity", ["critical", "high", "medium", "low"]).notNull(),
  patterns: json("rulePatterns").$type<string[]>().notNull(),
  keywords: json("ruleKeywords").$type<string[]>(),
  isEnabled: boolean("ruleEnabled").default(true).notNull(),
  matchCount: int("ruleMatchCount").default(0),
  lastMatchAt: timestamp("ruleLastMatchAt"),
  createdAt: timestamp("ruleCreatedAt").defaultNow().notNull(),
});

export type ThreatRule = typeof threatRules.$inferSelect;
export type InsertThreatRule = typeof threatRules.$inferInsert;

/**
 * Evidence Chain — SHA-256 blockchain-like integrity verification
 */
export const evidenceChain = mysqlTable("evidence_chain", {
  id: int("id").autoincrement().primaryKey(),
  evidenceId: varchar("evidenceId", { length: 64 }).notNull().unique(),
  leakId: varchar("evidenceLeakId", { length: 32 }).notNull(),
  evidenceType: mysqlEnum("evidenceType", ["text", "screenshot", "file", "metadata"]).notNull(),
  contentHash: varchar("contentHash", { length: 128 }).notNull(),
  previousHash: varchar("previousHash", { length: 128 }),
  blockIndex: int("blockIndex").notNull(),
  capturedBy: varchar("capturedBy", { length: 255 }),
  metadata: json("evidenceMetadata").$type<Record<string, unknown>>(),
  isVerified: boolean("isVerified").default(true).notNull(),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
  createdAt: timestamp("evidenceCreatedAt").defaultNow().notNull(),
});

export type EvidenceChainEntry = typeof evidenceChain.$inferSelect;
export type InsertEvidenceChainEntry = typeof evidenceChain.$inferInsert;

/**
 * Seller Profiles — track and score data sellers across platforms
 */
export const sellerProfiles = mysqlTable("seller_profiles", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: varchar("sellerId", { length: 64 }).notNull().unique(),
  name: varchar("sellerName", { length: 255 }).notNull(),
  aliases: json("sellerAliases").$type<string[]>(),
  platforms: json("sellerPlatforms").$type<string[]>().notNull(),
  totalLeaks: int("totalLeaks").default(0),
  totalRecords: int("sellerTotalRecords").default(0),
  riskScore: int("sellerRiskScore").default(0),
  riskLevel: mysqlEnum("sellerRiskLevel", ["critical", "high", "medium", "low"]).default("medium").notNull(),
  sectors: json("sellerSectors").$type<string[]>(),
  lastActivity: timestamp("sellerLastActivity"),
  firstSeen: timestamp("sellerFirstSeen").defaultNow().notNull(),
  notes: text("sellerNotes"),
  isActive: boolean("sellerIsActive").default(true).notNull(),
  createdAt: timestamp("sellerCreatedAt").defaultNow().notNull(),
  updatedAt: timestamp("sellerUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SellerProfile = typeof sellerProfiles.$inferSelect;
export type InsertSellerProfile = typeof sellerProfiles.$inferInsert;

/**
 * OSINT Queries — Google Dorks, Shodan queries, recon plans
 */
export const osintQueries = mysqlTable("osint_queries", {
  id: int("id").autoincrement().primaryKey(),
  queryId: varchar("queryId", { length: 32 }).notNull().unique(),
  name: varchar("queryName", { length: 255 }).notNull(),
  nameAr: varchar("queryNameAr", { length: 255 }).notNull(),
  queryType: mysqlEnum("queryType", ["google_dork", "shodan", "recon", "spiderfoot"]).notNull(),
  category: varchar("queryCategory", { length: 100 }).notNull(),
  categoryAr: varchar("queryCategoryAr", { length: 100 }),
  query: text("queryText").notNull(),
  description: text("queryDescription"),
  descriptionAr: text("queryDescriptionAr"),
  resultsCount: int("queryResultsCount").default(0),
  lastRunAt: timestamp("queryLastRunAt"),
  isEnabled: boolean("queryEnabled").default(true).notNull(),
  createdAt: timestamp("queryCreatedAt").defaultNow().notNull(),
});

export type OsintQuery = typeof osintQueries.$inferSelect;
export type InsertOsintQuery = typeof osintQueries.$inferInsert;

/**
 * Feedback Entries — analyst feedback for self-learning accuracy metrics
 */
export const feedbackEntries = mysqlTable("feedback_entries", {
  id: int("id").autoincrement().primaryKey(),
  leakId: varchar("feedbackLeakId", { length: 32 }).notNull(),
  userId: int("feedbackUserId"),
  userName: varchar("feedbackUserName", { length: 255 }),
  systemClassification: mysqlEnum("systemClassification", ["personal_data", "cybersecurity", "clean", "unknown"]).notNull(),
  analystClassification: mysqlEnum("analystClassification", ["personal_data", "cybersecurity", "clean", "unknown"]).notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  notes: text("feedbackNotes"),
  createdAt: timestamp("feedbackCreatedAt").defaultNow().notNull(),
});

export type FeedbackEntry = typeof feedbackEntries.$inferSelect;
export type InsertFeedbackEntry = typeof feedbackEntries.$inferInsert;

/**
 * Knowledge Graph Nodes — entities and relationships for threat intelligence
 */
export const knowledgeGraphNodes = mysqlTable("knowledge_graph_nodes", {
  id: int("id").autoincrement().primaryKey(),
  nodeId: varchar("nodeId", { length: 64 }).notNull().unique(),
  nodeType: mysqlEnum("nodeType", ["leak", "seller", "entity", "sector", "pii_type", "platform", "campaign"]).notNull(),
  label: varchar("nodeLabel", { length: 255 }).notNull(),
  labelAr: varchar("nodeLabelAr", { length: 255 }),
  metadata: json("nodeMetadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("nodeCreatedAt").defaultNow().notNull(),
});

export type KnowledgeGraphNode = typeof knowledgeGraphNodes.$inferSelect;

/**
 * Knowledge Graph Edges — relationships between nodes
 */
export const knowledgeGraphEdges = mysqlTable("knowledge_graph_edges", {
  id: int("id").autoincrement().primaryKey(),
  sourceNodeId: varchar("sourceNodeId", { length: 64 }).notNull(),
  targetNodeId: varchar("targetNodeId", { length: 64 }).notNull(),
  relationship: varchar("edgeRelationship", { length: 100 }).notNull(),
  relationshipAr: varchar("edgeRelationshipAr", { length: 100 }),
  weight: int("edgeWeight").default(1),
  metadata: json("edgeMetadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("edgeCreatedAt").defaultNow().notNull(),
});

export type KnowledgeGraphEdge = typeof knowledgeGraphEdges.$inferSelect;


/**
 * Platform Users — Custom authentication (userId + password)
 * Roles: root_admin, director, vice_president, manager, analyst, viewer
 */
export const platformUsers = mysqlTable("platform_users", {
  id: int("id").autoincrement().primaryKey(),
  userId: varchar("userId", { length: 50 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }),
  mobile: varchar("mobile", { length: 20 }),
  displayName: varchar("displayName", { length: 200 }).notNull(),
  platformRole: mysqlEnum("platformRole", [
    "root_admin",
    "director",
    "vice_president",
    "manager",
    "analyst",
    "viewer",
  ])
    .default("viewer")
    .notNull(),
  status: mysqlEnum("status", ["active", "inactive", "suspended"])
    .default("active")
    .notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformUser = typeof platformUsers.$inferSelect;
export type InsertPlatformUser = typeof platformUsers.$inferInsert;
