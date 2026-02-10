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
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
