import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { ENV } from "./_core/env";
import {
  getLeaks,
  getLeakById,
  createLeak,
  updateLeakStatus,
  getChannels,
  savePiiScan,
  getPiiScans,
  getReports,
  createReport,
  getDarkWebListings,
  getPasteEntries,
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  logAudit,
  getAuditLogs,
  exportAuditLogsCsv,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
  createNotification,
  getMonitoringJobs,
  getMonitoringJobById,
  getAlertContacts,
  createAlertContact,
  updateAlertContact,
  deleteAlertContact,
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  getAlertHistory,
  getRetentionPolicies,
  updateRetentionPolicy,
} from "./db";
import { triggerJob, toggleJobStatus } from "./scheduler";
import { broadcastNotification } from "./websocket";
import { enrichLeak, enrichAllPending } from "./enrichment";
import { getAlertStats } from "./alertDispatch";
import { executeRetentionPolicies, previewRetention } from "./retention";
import { issueApiKey, API_PERMISSIONS } from "./apiKeyService";
import {
  getApiKeys,
  updateApiKey,
  deleteApiKey,
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
  getThreatMapData,
} from "./db";
import { checkAndRunScheduledReports } from "./reportScheduler";
import {
  getThreatRules,
  getThreatRuleById,
  createThreatRule,
  updateThreatRule,
  toggleThreatRule,
  getEvidenceChain,
  createEvidenceEntry,
  getEvidenceStats,
  getSellerProfiles,
  getSellerById,
  createSellerProfile,
  updateSellerProfile,
  getOsintQueries,
  createOsintQuery,
  updateOsintQuery,
  getFeedbackEntries,
  createFeedbackEntry,
  getFeedbackStats,
  getKnowledgeGraphData,
  getPlatformUserByUserId,
  getAllPlatformUsers,
  createPlatformUser,
  updatePlatformUser,
  deletePlatformUser,
  getPlatformUserById,
  createIncidentDocument,
  getIncidentDocumentByVerificationCode,
  getIncidentDocumentByDocumentId,
  getIncidentDocumentsByLeakId,
  getAllIncidentDocuments,
  getFilteredIncidentDocuments,
  createReportAudit,
  getReportAuditEntries,
} from "./db";
import { generateIncidentDocumentation } from "./pdfService";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { rasidAIChat } from "./rasidAI";
import { executeScan, quickScan } from "./scanEngine";
import {
  createAiRating,
  getAiRatings,
  getAiRatingStats,
  getKnowledgeBaseEntries,
  getKnowledgeBaseEntryById,
  createKnowledgeBaseEntry,
  updateKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
  getKnowledgeBaseStats,
  incrementKnowledgeBaseViewCount,
  getAllPersonalityScenarios,
  createPersonalityScenario,
  updatePersonalityScenario,
  deletePersonalityScenario,
  getGreetingForUser,
  checkLeaderMention,
  createConversation,
  getUserConversations,
  getConversationById,
  updateConversation,
  deleteConversation,
  addChatMessage,
  getConversationMessages,
  getCustomActions,
  getCustomActionById,
  createCustomAction,
  updateCustomAction,
  deleteCustomAction,
  getTrainingDocuments,
  getTrainingDocumentById,
  createTrainingDocument,
  updateTrainingDocument,
  deleteTrainingDocument,
  getAiFeedbackStats,
  getTrainingDocumentContent,
} from "./db";

// Helper to get current user info from either auth source
function getAuthUser(ctx: { user: any; platformUser: any }) {
  if (ctx.platformUser) {
    return {
      id: ctx.platformUser.id as number,
      name: (ctx.platformUser.displayName ?? ctx.platformUser.name) as string,
    };
  }
  return {
    id: (ctx.user?.id ?? 0) as number,
    name: (ctx.user?.name ?? "System") as string,
  };
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => {
      // Return platform user if available, otherwise OAuth user
      if (opts.ctx.platformUser) {
        return {
          id: opts.ctx.platformUser.id,
          openId: `platform_${opts.ctx.platformUser.userId}`,
          name: opts.ctx.platformUser.name,
          email: opts.ctx.platformUser.email,
          loginMethod: "platform",
          role: opts.ctx.platformUser.platformRole === "root_admin" ? "admin" as const : "admin" as const,
          ndmoRole: opts.ctx.platformUser.platformRole === "root_admin" ? "executive" as const
            : opts.ctx.platformUser.platformRole === "director" ? "executive" as const
            : opts.ctx.platformUser.platformRole === "vice_president" ? "manager" as const
            : opts.ctx.platformUser.platformRole === "manager" ? "manager" as const
            : "analyst" as const,
          createdAt: opts.ctx.platformUser.createdAt,
          updatedAt: opts.ctx.platformUser.updatedAt,
          lastSignedIn: opts.ctx.platformUser.lastLoginAt ?? opts.ctx.platformUser.createdAt,
          displayName: opts.ctx.platformUser.displayName,
          platformRole: opts.ctx.platformUser.platformRole,
          userId: opts.ctx.platformUser.userId,
          mobile: opts.ctx.platformUser.mobile,
          status: opts.ctx.platformUser.status,
        };
      }
      return opts.ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie("platform_session", { ...cookieOptions, maxAge: -1 });
      if (ctx.platformUser) {
        logAudit(ctx.platformUser.id, "auth.logout", `Platform user ${ctx.platformUser.displayName} logged out`, "auth", ctx.platformUser.displayName);
      } else if (ctx.user) {
        logAudit(getAuthUser(ctx).id, "auth.logout", `User ${ctx.user.name} logged out`, "auth", getAuthUser(ctx).name);
      }
      return { success: true } as const;
    }),
  }),

  // ─── Platform Auth (Custom Login) ──────────────────────────────
  platformAuth: router({
    login: publicProcedure
      .input(z.object({
        userId: z.string().min(1),
        password: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await getPlatformUserByUserId(input.userId.toUpperCase());
        if (!user) {
          // Also try lowercase
          const userLower = await getPlatformUserByUserId(input.userId);
          if (!userLower) {
            throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
          }
          const valid = await bcrypt.compare(input.password, userLower.passwordHash);
          if (!valid) throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
          if (userLower.status !== "active") throw new Error("الحساب معطل. تواصل مع المسؤول.");

          // Create JWT
          const secret = new TextEncoder().encode(ENV.cookieSecret);
          const token = await new SignJWT({ platformUserId: userLower.id, userId: userLower.userId })
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setExpirationTime(Math.floor((Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000))
            .sign(secret);

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie("platform_session", token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });

          await updatePlatformUser(userLower.id, { lastLoginAt: new Date() });
          await logAudit(userLower.id, "auth.platform_login", `Platform user ${userLower.displayName} logged in`, "auth", userLower.displayName);

          return { success: true, displayName: userLower.displayName, role: userLower.platformRole };
        }

        const valid = await bcrypt.compare(input.password, user.passwordHash);
        if (!valid) throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
        if (user.status !== "active") throw new Error("الحساب معطل. تواصل مع المسؤول.");

        // Create JWT
        const secret = new TextEncoder().encode(ENV.cookieSecret);
        const token = await new SignJWT({ platformUserId: user.id, userId: user.userId })
          .setProtectedHeader({ alg: "HS256", typ: "JWT" })
          .setExpirationTime(Math.floor((Date.now() + 365 * 24 * 60 * 60 * 1000) / 1000))
          .sign(secret);

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie("platform_session", token, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });

        await updatePlatformUser(user.id, { lastLoginAt: new Date() });
        await logAudit(user.id, "auth.platform_login", `Platform user ${user.displayName} logged in`, "auth", user.displayName);

        return { success: true, displayName: user.displayName, role: user.platformRole };
      }),
  }),

  // ─── User Management (Admin Only) ──────────────────────────────
  userManagement: router({
    list: protectedProcedure.query(async () => {
      const users = await getAllPlatformUsers();
      // Return without password hashes
      return users.map(u => ({
        id: u.id,
        userId: u.userId,
        name: u.name,
        email: u.email,
        mobile: u.mobile,
        displayName: u.displayName,
        platformRole: u.platformRole,
        status: u.status,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const user = await getPlatformUserById(input.id);
        if (!user) throw new Error("المستخدم غير موجود");
        return {
          id: user.id,
          userId: user.userId,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          displayName: user.displayName,
          platformRole: user.platformRole,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      }),
    create: adminProcedure
      .input(z.object({
        userId: z.string().min(1),
        password: z.string().min(6),
        name: z.string().min(1),
        email: z.string().email().optional(),
        mobile: z.string().optional(),
        displayName: z.string().min(1),
        platformRole: z.enum(["root_admin", "director", "vice_president", "manager", "analyst", "viewer"]),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getPlatformUserByUserId(input.userId);
        if (existing) throw new Error("اسم المستخدم مستخدم بالفعل");
        const hash = await bcrypt.hash(input.password, 12);
        await createPlatformUser({
          userId: input.userId,
          passwordHash: hash,
          name: input.name,
          email: input.email ?? null,
          mobile: input.mobile ?? null,
          displayName: input.displayName,
          platformRole: input.platformRole,
        });
        const who = ctx.platformUser?.displayName ?? ctx.user?.name ?? "System";
        await logAudit(ctx.platformUser?.id ?? ctx.user?.id ?? 0, "user.create", `Created platform user ${input.userId}`, "user_management", who);
        return { success: true };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().optional(),
        mobile: z.string().optional(),
        displayName: z.string().optional(),
        platformRole: z.enum(["root_admin", "director", "vice_president", "manager", "analyst", "viewer"]).optional(),
        status: z.enum(["active", "inactive", "suspended"]).optional(),
        password: z.string().min(6).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const updates: Record<string, unknown> = {};
        if (input.name) updates.name = input.name;
        if (input.email !== undefined) updates.email = input.email;
        if (input.mobile !== undefined) updates.mobile = input.mobile;
        if (input.displayName) updates.displayName = input.displayName;
        if (input.platformRole) updates.platformRole = input.platformRole;
        if (input.status) updates.status = input.status;
        if (input.password) updates.passwordHash = await bcrypt.hash(input.password, 12);
        await updatePlatformUser(input.id, updates as any);
        const who = ctx.platformUser?.displayName ?? ctx.user?.name ?? "System";
        await logAudit(ctx.platformUser?.id ?? ctx.user?.id ?? 0, "user.update", `Updated platform user #${input.id}`, "user_management", who);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deletePlatformUser(input.id);
        const who = ctx.platformUser?.displayName ?? ctx.user?.name ?? "System";
        await logAudit(ctx.platformUser?.id ?? ctx.user?.id ?? 0, "user.delete", `Deleted platform user #${input.id}`, "user_management", who);
        return { success: true };
      }),
    resetPassword: adminProcedure
      .input(z.object({
        id: z.number(),
        newPassword: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const hash = await bcrypt.hash(input.newPassword, 12);
        await updatePlatformUser(input.id, { passwordHash: hash });
        const who = ctx.platformUser?.displayName ?? ctx.user?.name ?? "System";
        await logAudit(ctx.platformUser?.id ?? ctx.user?.id ?? 0, "user.reset_password", `Reset password for platform user #${input.id}`, "user_management", who);
        return { success: true };
      }),
  }),

  // ─── Dashboard ──────────────────────────────────────────────
  dashboard: router({
    stats: publicProcedure.query(async () => {
      const stats = await getDashboardStats();
      if (!stats) {
        return {
          totalLeaks: 0,
          totalRecords: 0,
          newLeaks: 0,
          analyzingLeaks: 0,
          documentedLeaks: 0,
          completedLeaks: 0,
          telegramLeaks: 0,
          darkwebLeaks: 0,
          pasteLeaks: 0,
          enrichedLeaks: 0,
          activeMonitors: 0,
          totalChannels: 0,
          piiDetected: 0,
          distinctSectors: 0,
          distinctPiiTypes: 0,
          sectorDistribution: [] as { sector: string | null; count: number; records: number }[],
          sourceDistribution: [] as { source: string | null; count: number; records: number }[],
          monthlyTrend: [] as { yearMonth: string; count: number; records: number }[],
          piiDistribution: [] as { type: string; count: number }[],
          recentLeaks: [] as any[],
        };
      }
      return stats;
    }),
  }),

  // ─── Leaks ──────────────────────────────────────────────────
  leaks: router({
    list: publicProcedure
      .input(
        z
          .object({
            source: z.string().optional(),
            severity: z.string().optional(),
            status: z.string().optional(),
            search: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return getLeaks(input);
      }),

    getById: publicProcedure
      .input(z.object({ leakId: z.string() }))
      .query(async ({ input }) => {
        return getLeakById(input.leakId);
      }),

    // Full detail with evidence chain for modal
    detail: publicProcedure
      .input(z.object({ leakId: z.string() }))
      .query(async ({ input }) => {
        const leak = await getLeakById(input.leakId);
        if (!leak) return null;
        const evidence = await getEvidenceChain(input.leakId);
        return { ...leak, evidence };
      }),

    create: protectedProcedure
      .input(
        z.object({
          leakId: z.string(),
          title: z.string(),
          titleAr: z.string(),
          source: z.enum(["telegram", "darkweb", "paste"]),
          severity: z.enum(["critical", "high", "medium", "low"]),
          sector: z.string(),
          sectorAr: z.string(),
          piiTypes: z.array(z.string()),
          recordCount: z.number(),
          description: z.string().optional(),
          descriptionAr: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await createLeak(input);
        await logAudit(getAuthUser(ctx).id, "leak.create", `Created leak ${input.leakId}`, "leak", getAuthUser(ctx).name);
        return { success: true };
      }),

    updateStatus: protectedProcedure
      .input(
        z.object({
          leakId: z.string(),
          status: z.enum(["new", "analyzing", "documented", "reported"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await updateLeakStatus(input.leakId, input.status);
        await logAudit(getAuthUser(ctx).id, "leak.updateStatus", `Updated ${input.leakId} to ${input.status}`, "leak", getAuthUser(ctx).name);

        // Broadcast status change notification
        broadcastNotification({
          type: "status_change",
          title: `Leak ${input.leakId} status updated to ${input.status}`,
          titleAr: `تم تحديث حالة التسريب ${input.leakId} إلى ${input.status === "analyzing" ? "قيد التحليل" : input.status === "documented" ? "موثق" : input.status === "reported" ? "تم التوثيق" : "جديد"}`,
          severity: "info",
          relatedId: input.leakId,
          createdAt: new Date().toISOString(),
        });

        return { success: true };
      }),

    exportCsv: publicProcedure
      .input(
        z
          .object({
            source: z.string().optional(),
            severity: z.string().optional(),
            status: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input, ctx }) => {
        const data = await getLeaks(input);
        const headers = [
          "Leak ID",
          "Title",
          "Title (AR)",
          "Source",
          "Severity",
          "Sector",
          "PII Types",
          "Record Count",
          "Status",
          "Detected At",
        ];
        const rows = data.map((leak) => [
          leak.leakId,
          `"${leak.title}"`,
          `"${leak.titleAr}"`,
          leak.source,
          leak.severity,
          leak.sector,
          `"${(leak.piiTypes as string[]).join(", ")}"`,
          leak.recordCount,
          leak.status,
          leak.detectedAt?.toISOString() ?? "",
        ]);
        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        if (ctx.user) {
          await logAudit(getAuthUser(ctx).id, "leak.export", `Exported ${data.length} leaks as CSV`, "export", getAuthUser(ctx).name);
        }
        return { csv, filename: `ndmo-leaks-export-${Date.now()}.csv` };
      }),
  }),

  // ─── Channels ───────────────────────────────────────────────
  channels: router({
    list: publicProcedure
      .input(z.object({ platform: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getChannels(input?.platform);
      }),
  }),

  // ─── PII Scanner ────────────────────────────────────────────
  pii: router({
    scan: publicProcedure
      .input(z.object({ text: z.string().min(1).max(50000) }))
      .mutation(async ({ input, ctx }) => {
        const patterns = [
          // Identity Data
          { type: "National ID", typeAr: "رقم الهوية الوطنية", regex: /\b1\d{9}\b/g },
          { type: "Iqama Number", typeAr: "رقم الإقامة", regex: /\b2\d{9}\b/g },
          { type: "Passport", typeAr: "رقم جواز السفر", regex: /\b[A-Z]\d{8}\b/g },
          { type: "Driving License", typeAr: "رقم رخصة القيادة", regex: /\bDL[-]?\d{10}\b/gi },
          // Contact Data
          { type: "Saudi Phone", typeAr: "رقم جوال سعودي", regex: /\b05\d{8}\b/g },
          { type: "Saudi Email", typeAr: "بريد إلكتروني سعودي", regex: /\b[\w.-]+@[\w.-]+\.sa\b/gi },
          { type: "National Address", typeAr: "العنوان الوطني", regex: /\b[A-Z]{4}\d{4}\b/g },
          // Financial Data
          { type: "IBAN", typeAr: "رقم الحساب البنكي", regex: /\bSA\d{22}\b/g },
          { type: "Credit Card", typeAr: "بطاقة ائتمان", regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g },
          { type: "Tax Number", typeAr: "الرقم الضريبي", regex: /\b3\d{14}\b/g },
          { type: "Salary", typeAr: "الراتب", regex: /(?:راتب|salary|أجر)[:\s]*[\d,]+(?:\s*(?:ريال|SAR|SR))?/gi },
          // Sensitive Data
          { type: "Date of Birth", typeAr: "تاريخ الميلاد", regex: /\b(?:19|20)\d{2}[\/\-]\d{2}[\/\-]\d{2}\b/g },
          { type: "Medical Record", typeAr: "السجل الطبي", regex: /\bMRN[-]?\d{4}[-]?\d{5}\b/gi },
          { type: "IP Address", typeAr: "عنوان IP", regex: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g },
          // InfoStealer Detection
          { type: "Credentials", typeAr: "بيانات تسجيل الدخول", regex: /(?:password|passwd|pass|كلمة.?(?:المرور|السر))[:\s]+\S+/gi },
          { type: "InfoStealer URL", typeAr: "رابط InfoStealer", regex: /(?:URL|Host)[:\s]+https?:\/\/[^\s]+(?:login|auth|bank|pay)/gi },
          // Smart Detection
          { type: "SQL Pattern", typeAr: "نمط SQL", regex: /\b(?:SELECT|INSERT|UPDATE|DELETE|DROP)\b.*(?:national_id|phone|email|iqama|salary|password)/gi },
          { type: "Masked Data", typeAr: "بيانات مقنّعة", regex: /\b(?:05|10|20)\d*X{3,}\d*\b/g },
          { type: "Base64 Encoded", typeAr: "بيانات مشفرة Base64", regex: /\b[A-Za-z0-9+/]{20,}={1,2}\b/g },
        ];

        const lines = input.text.split("\n");
        const results: Array<{ type: string; typeAr: string; value: string; line: number }> = [];

        lines.forEach((line, lineIdx) => {
          for (const pattern of patterns) {
            const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
            let match;
            while ((match = regex.exec(line)) !== null) {
              results.push({
                type: pattern.type,
                typeAr: pattern.typeAr,
                value: match[0],
                line: lineIdx + 1,
              });
            }
          }
        });

        // Save scan if user is authenticated
        if (ctx.user) {
          await savePiiScan({
            userId: getAuthUser(ctx).id,
            inputText: input.text.substring(0, 5000),
            results,
            totalMatches: results.length,
          });
          await logAudit(getAuthUser(ctx).id, "pii.scan", `PII scan: ${results.length} matches found`, "pii", getAuthUser(ctx).name);

          // Send notification if matches found
          if (results.length > 0) {
            const notifId = await createNotification({
              userId: getAuthUser(ctx).id,
              type: "scan_complete",
              title: `PII Scan Complete: ${results.length} matches`,
              titleAr: `اكتمل فحص PII: ${results.length} تطابق`,
              message: `Found ${results.length} PII items across ${new Set(results.map(r => r.type)).size} categories`,
              messageAr: `تم العثور على ${results.length} عنصر PII في ${new Set(results.map(r => r.type)).size} فئات`,
              severity: results.length > 10 ? "high" : results.length > 5 ? "medium" : "low",
            });

            broadcastNotification({
              id: notifId,
              type: "scan_complete",
              title: `PII Scan Complete: ${results.length} matches`,
              titleAr: `اكتمل فحص PII: ${results.length} تطابق`,
              severity: results.length > 10 ? "high" : results.length > 5 ? "medium" : "low",
              createdAt: new Date().toISOString(),
            });
          }
        }

        return { results, totalMatches: results.length };
      }),

    history: protectedProcedure.query(async ({ ctx }) => {
      return getPiiScans(getAuthUser(ctx).id);
    }),
  }),

  // ─── Dark Web ───────────────────────────────────────────────
  darkweb: router({
    listings: publicProcedure.query(async () => {
      return getDarkWebListings();
    }),
  }),

  // ─── Paste Sites ────────────────────────────────────────────
  pastes: router({
    list: publicProcedure.query(async () => {
      return getPasteEntries();
    }),
  }),

  // ─── Reports ────────────────────────────────────────────────
  reports: router({
    list: publicProcedure.query(async () => {
      return getReports();
    }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          titleAr: z.string().optional(),
          type: z.enum(["monthly", "quarterly", "special"]),
          pageCount: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const id = await createReport({ ...input, generatedBy: getAuthUser(ctx).id });
        await logAudit(getAuthUser(ctx).id, "report.create", `Created report: ${input.title}`, "report", getAuthUser(ctx).name);
        return { id, success: true };
      }),

    exportPdf: publicProcedure
      .input(z.object({ reportId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const allLeaks = await getLeaks();
        const stats = await getDashboardStats();
        const reportsList = await getReports();

        if (ctx.user) {
          await logAudit(getAuthUser(ctx).id, "report.export", `Exported PDF report`, "export", getAuthUser(ctx).name);
        }

        const summary = {
          title: "NDMO — تقرير تسريبات البيانات الشخصية",
          generatedAt: new Date().toISOString(),
          stats: stats ?? { totalLeaks: 0, newLeaks: 0, totalRecords: 0, activeMonitors: 0, piiDetected: 0, analyzingLeaks: 0, documentedLeaks: 0, completedLeaks: 0, telegramLeaks: 0, darkwebLeaks: 0, pasteLeaks: 0, enrichedLeaks: 0, totalChannels: 0, distinctSectors: 0, distinctPiiTypes: 0, sectorDistribution: [], sourceDistribution: [], monthlyTrend: [], piiDistribution: [], recentLeaks: [] },
          leaksSummary: allLeaks.map((l) => ({
            id: l.leakId,
            title: l.titleAr,
            source: l.source,
            severity: l.severity,
            sector: l.sectorAr,
            records: l.recordCount,
            status: l.status,
            date: l.detectedAt?.toISOString() ?? "",
          })),
          totalReports: reportsList.length,
        };

        return summary;
      }),
  }),

  // ─── User Management (admin only) ──────────────────────────
  users: router({
    list: adminProcedure.query(async () => {
      return getAllUsers();
    }),

    updateRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          ndmoRole: z.enum(["executive", "manager", "analyst", "viewer"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await updateUserRole(input.userId, input.ndmoRole);
        await logAudit(getAuthUser(ctx).id, "user.updateRole", `Updated user ${input.userId} to ${input.ndmoRole}`, "user", getAuthUser(ctx).name);
        return { success: true };
      }),
  }),

  // ─── Notifications ──────────────────────────────────────────
  notifications: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ ctx, input }) => {
        const userId = ctx.user?.id ?? null;
        return getNotifications(userId, input?.limit ?? 50);
      }),

    unreadCount: publicProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id ?? null;
      return getUnreadNotificationCount(userId);
    }),

    markRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationRead(input.notificationId);
        return { success: true };
      }),

    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(getAuthUser(ctx).id);
      return { success: true };
    }),
  }),

  // ─── Audit Log (admin only) ─────────────────────────────────
  audit: router({
    list: adminProcedure
      .input(
        z
          .object({
            category: z.string().optional(),
            limit: z.number().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return getAuditLogs(input);
      }),

    exportCsv: adminProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ input, ctx }) => {
        const csv = await exportAuditLogsCsv(input);
        await logAudit(getAuthUser(ctx).id, "audit.export", "Exported audit logs as CSV", "export", getAuthUser(ctx).name);
        return { csv, filename: `ndmo-audit-log-${Date.now()}.csv` };
      }),
  }),

  // ─── Enrichment (LLM Threat Intelligence) ───────────────────
  enrichment: router({
    enrichLeak: protectedProcedure
      .input(z.object({ leakId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const leak = await getLeakById(input.leakId);
        if (!leak) throw new Error("Leak not found");
        const result = await enrichLeak({
          ...leak,
          piiTypes: (leak.piiTypes as string[]) || [],
        });
        await logAudit(getAuthUser(ctx).id, "enrichment.run", `AI enriched leak ${input.leakId} (confidence: ${result.aiConfidence}%)`, "system", getAuthUser(ctx).name);
        return result;
      }),

    enrichAll: adminProcedure.mutation(async ({ ctx }) => {
      const count = await enrichAllPending();
      await logAudit(getAuthUser(ctx).id, "enrichment.batch", `Batch enriched ${count} leaks`, "system", getAuthUser(ctx).name);
      return { enriched: count };
    }),
  }),

  // ─── Alert Channels ─────────────────────────────────────────
  alerts: router({
    contacts: router({
      list: publicProcedure.query(async () => getAlertContacts()),
      create: adminProcedure
        .input(z.object({
          name: z.string(),
          nameAr: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          role: z.string().optional(),
          roleAr: z.string().optional(),
          channels: z.array(z.string()).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const id = await createAlertContact(input);
          await logAudit(getAuthUser(ctx).id, "alert.contact.create", `Created alert contact: ${input.name}`, "system", getAuthUser(ctx).name);
          return { id, success: true };
        }),
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          nameAr: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          isActive: z.boolean().optional(),
          channels: z.array(z.string()).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const { id, ...data } = input;
          await updateAlertContact(id, data);
          await logAudit(getAuthUser(ctx).id, "alert.contact.update", `Updated alert contact #${id}`, "system", getAuthUser(ctx).name);
          return { success: true };
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          await deleteAlertContact(input.id);
          await logAudit(getAuthUser(ctx).id, "alert.contact.delete", `Deleted alert contact #${input.id}`, "system", getAuthUser(ctx).name);
          return { success: true };
        }),
    }),
    rules: router({
      list: publicProcedure.query(async () => getAlertRules()),
      create: adminProcedure
        .input(z.object({
          name: z.string(),
          nameAr: z.string().optional(),
          severityThreshold: z.enum(["critical", "high", "medium", "low"]),
          channel: z.enum(["email", "sms", "both"]),
          recipients: z.array(z.number()).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const id = await createAlertRule(input);
          await logAudit(getAuthUser(ctx).id, "alert.rule.create", `Created alert rule: ${input.name}`, "system", getAuthUser(ctx).name);
          return { id, success: true };
        }),
      update: adminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          nameAr: z.string().optional(),
          severityThreshold: z.enum(["critical", "high", "medium", "low"]).optional(),
          channel: z.enum(["email", "sms", "both"]).optional(),
          isEnabled: z.boolean().optional(),
          recipients: z.array(z.number()).optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const { id, ...data } = input;
          await updateAlertRule(id, data);
          await logAudit(getAuthUser(ctx).id, "alert.rule.update", `Updated alert rule #${id}`, "system", getAuthUser(ctx).name);
          return { success: true };
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          await deleteAlertRule(input.id);
          await logAudit(getAuthUser(ctx).id, "alert.rule.delete", `Deleted alert rule #${input.id}`, "system", getAuthUser(ctx).name);
          return { success: true };
        }),
    }),
    history: publicProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => getAlertHistory(input?.limit ?? 100)),
    stats: publicProcedure.query(async () => getAlertStats()),
  }),

  // ─── Retention Policies ─────────────────────────────────────
  retention: router({
    list: publicProcedure.query(async () => getRetentionPolicies()),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        retentionDays: z.number().optional(),
        archiveAction: z.enum(["delete", "archive"]).optional(),
        isEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await updateRetentionPolicy(id, data);
        await logAudit(getAuthUser(ctx).id, "retention.update", `Updated retention policy #${id}`, "system", getAuthUser(ctx).name);
        return { success: true };
      }),
    execute: adminProcedure.mutation(async ({ ctx }) => {
      const results = await executeRetentionPolicies();
      await logAudit(getAuthUser(ctx).id, "retention.execute", `Executed retention policies: ${results.length} processed`, "system", getAuthUser(ctx).name);
      return results;
    }),
    preview: adminProcedure.query(async () => previewRetention()),
  }),

  // ─── Threat Map ─────────────────────────────────────────────
  threatMap: router({
    data: publicProcedure.query(async () => {
      return getThreatMapData();
    }),
  }),

  // ─── API Keys (admin only) ──────────────────────────────────
  apiKeys: router({
    list: adminProcedure.query(async () => {
      return getApiKeys();
    }),
    permissions: publicProcedure.query(() => {
      return API_PERMISSIONS;
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        permissions: z.array(z.string()),
        rateLimit: z.number().optional(),
        expiresAt: z.string().nullable().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await issueApiKey({
          name: input.name,
          permissions: input.permissions,
          rateLimit: input.rateLimit,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
          createdBy: getAuthUser(ctx).id,
        });
        await logAudit(getAuthUser(ctx).id, "apikey.create", `Created API key: ${input.name} (${result.keyPrefix}...)`, "system", getAuthUser(ctx).name);
        return result;
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        permissions: z.array(z.string()).optional(),
        rateLimit: z.number().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await updateApiKey(id, data);
        await logAudit(getAuthUser(ctx).id, "apikey.update", `Updated API key #${id}`, "system", getAuthUser(ctx).name);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteApiKey(input.id);
        await logAudit(getAuthUser(ctx).id, "apikey.delete", `Deleted API key #${input.id}`, "system", getAuthUser(ctx).name);
        return { success: true };
      }),
  }),

  // ─── Scheduled Reports ──────────────────────────────────────
  scheduledReports: router({
    list: publicProcedure.query(async () => {
      return getScheduledReports();
    }),
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        nameAr: z.string().optional(),
        frequency: z.enum(["weekly", "monthly", "quarterly"]),
        template: z.enum(["executive_summary", "full_detail", "compliance", "sector_analysis"]),
        recipientIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const nextRunAt = input.frequency === "weekly"
          ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          : input.frequency === "monthly"
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        const id = await createScheduledReport({
          name: input.name,
          nameAr: input.nameAr,
          frequency: input.frequency,
          template: input.template,
          recipientIds: input.recipientIds,
          nextRunAt,
          createdBy: getAuthUser(ctx).id,
        });
        await logAudit(getAuthUser(ctx).id, "scheduledReport.create", `Created scheduled report: ${input.name}`, "report", getAuthUser(ctx).name);
        return { id, success: true };
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        nameAr: z.string().optional(),
        frequency: z.enum(["weekly", "monthly", "quarterly"]).optional(),
        template: z.enum(["executive_summary", "full_detail", "compliance", "sector_analysis"]).optional(),
        isEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await updateScheduledReport(id, data);
        await logAudit(getAuthUser(ctx).id, "scheduledReport.update", `Updated scheduled report #${id}`, "report", getAuthUser(ctx).name);
        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await deleteScheduledReport(input.id);
        await logAudit(getAuthUser(ctx).id, "scheduledReport.delete", `Deleted scheduled report #${input.id}`, "report", getAuthUser(ctx).name);
        return { success: true };
      }),
    runNow: adminProcedure.mutation(async ({ ctx }) => {
      const count = await checkAndRunScheduledReports();
      await logAudit(getAuthUser(ctx).id, "scheduledReport.runNow", `Manually triggered scheduled reports: ${count} generated`, "report", getAuthUser(ctx).name);
      return { generated: count };
    }),
  }),

  // ─── Monitoring Jobs ────────────────────────────────────────
  jobs: router({
    list: publicProcedure.query(async () => {
      return getMonitoringJobs();
    }),

    getById: publicProcedure
      .input(z.object({ jobId: z.string() }))
      .query(async ({ input }) => {
        return getMonitoringJobById(input.jobId);
      }),

    trigger: protectedProcedure
      .input(z.object({ jobId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await logAudit(getAuthUser(ctx).id, "monitoring.trigger", `Manually triggered job ${input.jobId}`, "monitoring", getAuthUser(ctx).name);
        // Run asynchronously so we don't block the response
        triggerJob(input.jobId).catch((err) => {
          console.error(`[Jobs] Failed to trigger ${input.jobId}:`, err);
        });
        return { success: true, message: "Job triggered" };
      }),

    toggleStatus: protectedProcedure
      .input(
        z.object({
          jobId: z.string(),
          status: z.enum(["active", "paused"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await toggleJobStatus(input.jobId, input.status);
        await logAudit(
          getAuthUser(ctx).id,
          `monitoring.${input.status === "active" ? "resume" : "pause"}`,
          `${input.status === "active" ? "Resumed" : "Paused"} job ${input.jobId}`,
          "monitoring",
          getAuthUser(ctx).name,
        );
        return { success: true };
      }),
  }),

  // ─── Threat Rules ──────────────────────────────────────────
  threatRules: router({
    list: publicProcedure.query(async () => {
      return getThreatRules();
    }),

    getById: publicProcedure
      .input(z.object({ ruleId: z.string() }))
      .query(async ({ input }) => {
        return getThreatRuleById(input.ruleId);
      }),

    create: protectedProcedure
      .input(z.object({
        ruleId: z.string(),
        name: z.string(),
        nameAr: z.string(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
        category: z.enum(["data_leak", "credentials", "sale_ad", "db_dump", "financial", "health", "government", "telecom", "education", "infrastructure"]),
        severity: z.enum(["critical", "high", "medium", "low"]),
        patterns: z.array(z.string()),
        keywords: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await createThreatRule(input);
        await logAudit(getAuthUser(ctx).id, "threatRule.create", `Created threat rule ${input.ruleId}`, "system", getAuthUser(ctx).name);
        return { id };
      }),

    toggle: protectedProcedure
      .input(z.object({ id: z.number(), isEnabled: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        await toggleThreatRule(input.id, input.isEnabled);
        await logAudit(getAuthUser(ctx).id, "threatRule.toggle", `${input.isEnabled ? "Enabled" : "Disabled"} threat rule #${input.id}`, "system", getAuthUser(ctx).name);
        return { success: true };
      }),
  }),

  // ─── Evidence Chain ────────────────────────────────────────
  evidence: router({
    list: publicProcedure
      .input(z.object({ leakId: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getEvidenceChain(input?.leakId);
      }),

    stats: publicProcedure.query(async () => {
      return getEvidenceStats();
    }),

    create: protectedProcedure
      .input(z.object({
        evidenceId: z.string(),
        leakId: z.string(),
        evidenceType: z.enum(["text", "screenshot", "file", "metadata"]),
        contentHash: z.string(),
        previousHash: z.string().optional(),
        blockIndex: z.number(),
        capturedBy: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await createEvidenceEntry(input);
        await logAudit(getAuthUser(ctx).id, "evidence.create", `Added evidence ${input.evidenceId} for leak ${input.leakId}`, "leak", getAuthUser(ctx).name);
        return { id };
      }),
  }),

  // ─── Seller Profiles ───────────────────────────────────────
  sellers: router({
    list: publicProcedure
      .input(z.object({ riskLevel: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getSellerProfiles(input);
      }),

    getById: publicProcedure
      .input(z.object({ sellerId: z.string() }))
      .query(async ({ input }) => {
        return getSellerById(input.sellerId);
      }),

    create: protectedProcedure
      .input(z.object({
        sellerId: z.string(),
        name: z.string(),
        aliases: z.array(z.string()).optional(),
        platforms: z.array(z.string()),
        totalLeaks: z.number().optional(),
        totalRecords: z.number().optional(),
        riskScore: z.number().optional(),
        riskLevel: z.enum(["critical", "high", "medium", "low"]).optional(),
        sectors: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await createSellerProfile(input);
        await logAudit(getAuthUser(ctx).id, "seller.create", `Created seller profile ${input.sellerId}`, "system", getAuthUser(ctx).name);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          aliases: z.array(z.string()).optional(),
          riskScore: z.number().optional(),
          riskLevel: z.enum(["critical", "high", "medium", "low"]).optional(),
          notes: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateSellerProfile(input.id, input.data);
        await logAudit(getAuthUser(ctx).id, "seller.update", `Updated seller profile #${input.id}`, "system", getAuthUser(ctx).name);
        return { success: true };
      }),
  }),

  // ─── OSINT Queries ─────────────────────────────────────────
  osint: router({
    list: publicProcedure
      .input(z.object({ queryType: z.string().optional(), category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getOsintQueries(input);
      }),

    create: protectedProcedure
      .input(z.object({
        queryId: z.string(),
        name: z.string(),
        nameAr: z.string(),
        queryType: z.enum(["google_dork", "shodan", "recon", "spiderfoot"]),
        category: z.string(),
        categoryAr: z.string().optional(),
        query: z.string(),
        description: z.string().optional(),
        descriptionAr: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await createOsintQuery(input);
        await logAudit(getAuthUser(ctx).id, "osint.create", `Created OSINT query ${input.queryId}`, "system", getAuthUser(ctx).name);
        return { id };
      }),
  }),

  // ─── Feedback / Accuracy ───────────────────────────────────
  feedback: router({
    list: publicProcedure.query(async () => {
      return getFeedbackEntries();
    }),

    stats: publicProcedure.query(async () => {
      return getFeedbackStats();
    }),

    create: protectedProcedure
      .input(z.object({
        leakId: z.string(),
        systemClassification: z.enum(["personal_data", "cybersecurity", "clean", "unknown"]),
        analystClassification: z.enum(["personal_data", "cybersecurity", "clean", "unknown"]),
        isCorrect: z.boolean(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await createFeedbackEntry({
          ...input,
          userId: getAuthUser(ctx).id,
          userName: getAuthUser(ctx).name,
        });
        await logAudit(getAuthUser(ctx).id, "feedback.create", `Submitted feedback for leak ${input.leakId}`, "system", getAuthUser(ctx).name);
        return { id };
      }),
  }),

  // ─── Knowledge Graph ───────────────────────────────────────
  knowledgeGraph: router({
    data: publicProcedure.query(async () => {
      return getKnowledgeGraphData();
    }),
  }),

  // ─── Incident Documentation ────────────────────────────────
  documentation: router({
    generate: protectedProcedure
      .input(z.object({
        leakId: z.string(),
        origin: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const leak = await getLeakById(input.leakId);
        if (!leak) throw new Error("التسريب غير موجود");
        const evidence = await getEvidenceChain(input.leakId);
        const leakWithEvidence = { ...leak, evidence, piiTypes: (leak.piiTypes as string[]) || [] };
        const who = getAuthUser(ctx);
        const result = await generateIncidentDocumentation(leakWithEvidence, who.name, input.origin);

        // Save to database
        await createIncidentDocument({
          documentId: result.documentId,
          leakId: input.leakId,
          verificationCode: result.verificationCode,
          contentHash: result.contentHash,
          documentType: "incident_report",
          title: result.title,
          titleAr: result.titleAr,
          generatedBy: who.id,
          generatedByName: who.name,
          metadata: {
            severity: leak.severity,
            sector: leak.sectorAr,
            recordCount: leak.recordCount,
            source: leak.source,
          },
        });

        // Log audit
        await logAudit(who.id, "documentation.generate", `Generated incident documentation ${result.documentId} for leak ${input.leakId}`, "report", who.name);

        // Notify supervisor
        await notifyOwner({
          title: `📋 توثيق حادثة جديد — ${result.documentId}`,
          content: `قام ${who.name} بإصدار توثيق حادثة تسرب\nالحادثة: ${input.leakId}\nالقطاع: ${leak.sectorAr || leak.sector}\nالتصنيف: ${leak.severity}\nكود التحقق: ${result.verificationCode}\nالتاريخ: ${new Date().toLocaleString("ar-SA")}`,
        }).catch(() => {/* notification failure should not block */});

        // Log report audit with compliance
        await createReportAudit({
          reportId: result.documentId,
          documentId: result.documentId,
          reportType: "incident_report",
          generatedBy: who.id,
          generatedByName: who.name,
          complianceAcknowledged: true,
          acknowledgedAt: new Date(),
          metadata: {
            leakId: input.leakId,
            verificationCode: result.verificationCode,
          },
        });

        return {
          documentId: result.documentId,
          verificationCode: result.verificationCode,
          contentHash: result.contentHash,
          htmlContent: result.htmlContent,
          pdfBase64: result.pdfBuffer ? result.pdfBuffer.toString("base64") : null,
          generatedAt: result.generatedAt,
        };
      }),

    verify: publicProcedure
      .input(z.object({ code: z.string() }))
      .query(async ({ input }) => {
        const doc = await getIncidentDocumentByVerificationCode(input.code);
        if (!doc) {
          return { valid: false, message: "رمز التحقق غير صالح أو غير موجود" };
        }
        const leak = await getLeakById(doc.leakId);
        return {
          valid: true,
          document: {
            documentId: doc.documentId,
            leakId: doc.leakId,
            verificationCode: doc.verificationCode,
            contentHash: doc.contentHash,
            title: doc.title,
            titleAr: doc.titleAr,
            documentType: doc.documentType,
            generatedByName: doc.generatedByName,
            createdAt: doc.createdAt,
            isVerified: doc.isVerified,
            leakSeverity: leak?.severity,
            leakSector: leak?.sectorAr,
            leakRecordCount: leak?.recordCount,
            leakStatus: leak?.status,
          },
          message: "الوثيقة صحيحة ومطابقة للنسخة المحفوظة",
        };
      }),

    byLeak: publicProcedure
      .input(z.object({ leakId: z.string() }))
      .query(async ({ input }) => {
        return getIncidentDocumentsByLeakId(input.leakId);
      }),

    list: protectedProcedure.query(async () => {
      return getAllIncidentDocuments();
    }),

    listFiltered: protectedProcedure
      .input(z.object({
        search: z.string().optional(),
        employeeName: z.string().optional(),
        leakId: z.string().optional(),
        documentType: z.string().optional(),
        dateFrom: z.date().optional(),
        dateTo: z.date().optional(),
      }))
      .query(async ({ input }) => {
        return getFilteredIncidentDocuments(input);
      }),

    getById: publicProcedure
      .input(z.object({ documentId: z.string() }))
      .query(async ({ input }) => {
        return getIncidentDocumentByDocumentId(input.documentId);
      }),
  }),

  // ─── Report Audit ──────────────────────────────────────────
  reportAudit: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getReportAuditEntries(input?.limit ?? 100);
      }),

    create: protectedProcedure
      .input(z.object({
        reportType: z.string(),
        filters: z.record(z.string(), z.unknown()).optional(),
        complianceAcknowledged: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        const who = getAuthUser(ctx);
        const reportId = `RPT-${Date.now().toString(36).toUpperCase()}`;
        const id = await createReportAudit({
          reportId,
          reportType: input.reportType,
          generatedBy: who.id,
          generatedByName: who.name,
          complianceAcknowledged: input.complianceAcknowledged,
          acknowledgedAt: input.complianceAcknowledged ? new Date() : undefined,
          filters: input.filters as Record<string, unknown>,
        });
        await logAudit(who.id, "report.generate", `Generated ${input.reportType} report (${reportId})`, "report", who.name);

        // Notify supervisor
        const reportTypeLabels: Record<string, string> = {
          executive_summary: "ملخص تنفيذي",
          sector_analysis: "تحليل قطاعي",
          severity_report: "تقرير التصنيف",
          compliance_report: "تقرير الامتثال",
          custom_report: "تقرير مخصص",
        };
        await notifyOwner({
          title: `📊 تقرير جديد — ${reportId}`,
          content: `قام ${who.name} بإصدار ${reportTypeLabels[input.reportType] || input.reportType}\nرقم التقرير: ${reportId}\nالتاريخ: ${new Date().toLocaleString("ar-SA")}`,
        }).catch(() => {/* notification failure should not block */});

        return { id, reportId };
      }),
   }),

  // ─── Smart Rasid AI Assistant (v5.5 — Full Platform Access) ──────────────
  smartRasid: router({
    search: publicProcedure
      .input(z.object({ query: z.string().min(1) }))
      .query(async ({ input }) => {
        const q = input.query.toLowerCase();
        const results: Array<{ type: string; items: any[] }> = [];
        const allLeaks = await getLeaks({ search: input.query });
        if (allLeaks.length > 0) results.push({ type: "leaks", items: allLeaks.slice(0, 10) });
        const sellers = await getSellerProfiles();
        const matchedSellers = sellers.filter((s: any) =>
          s.alias?.toLowerCase().includes(q) || s.aliasAr?.toLowerCase().includes(q) || s.sellerId?.toLowerCase().includes(q)
        );
        if (matchedSellers.length > 0) results.push({ type: "sellers", items: matchedSellers.slice(0, 5) });
        const darkweb = await getDarkWebListings();
        const matchedDW = darkweb.filter((d: any) => d.title?.toLowerCase().includes(q) || d.titleAr?.toLowerCase().includes(q));
        if (matchedDW.length > 0) results.push({ type: "darkweb", items: matchedDW.slice(0, 5) });
        const pastes = await getPasteEntries();
        const matchedPastes = pastes.filter((p: any) => p.title?.toLowerCase().includes(q) || p.titleAr?.toLowerCase().includes(q));
        if (matchedPastes.length > 0) results.push({ type: "pastes", items: matchedPastes.slice(0, 5) });
        const jobs = await getMonitoringJobs();
        const matchedJobs = jobs.filter((j: any) => j.name?.toLowerCase().includes(q) || j.nameAr?.toLowerCase().includes(q));
        if (matchedJobs.length > 0) results.push({ type: "jobs", items: matchedJobs.slice(0, 5) });
        return { results, totalResults: results.reduce((s, r) => s + r.items.length, 0) };
      }),

    suggestions: publicProcedure
      .input(z.object({ partial: z.string() }))
      .query(async ({ input }) => {
        if (input.partial.length < 2) return { suggestions: [] };
        const q = input.partial.toLowerCase();
        const suggestions: string[] = [];
        const allLeaks = await getLeaks();
        for (const leak of allLeaks) {
          if (leak.titleAr?.toLowerCase().includes(q)) suggestions.push(leak.titleAr);
          if (leak.title?.toLowerCase().includes(q)) suggestions.push(leak.title);
          if (leak.sectorAr?.toLowerCase().includes(q)) suggestions.push(leak.sectorAr);
          if (suggestions.length >= 8) break;
        }
        const commonTerms = [
          "تسريبات واسعة النطاق", "القطاع الحكومي", "القطاع الصحي", "القطاع المالي",
          "تليجرام", "دارك ويب", "مواقع لصق", "بيانات شخصية",
          "هوية وطنية", "أرقام هواتف", "بريد إلكتروني", "سجلات طبية",
          "ملخص لوحة المعلومات", "تقرير أسبوعي", "حالة الحماية",
          "تحليل شامل", "البائعون", "الأدلة الرقمية", "خريطة التهديدات",
        ];
        for (const term of commonTerms) {
          if (term.includes(q) && !suggestions.includes(term)) suggestions.push(term);
        }
        return { suggestions: Array.from(new Set(suggestions)).slice(0, 8) };
      }),

    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const who = getAuthUser(ctx);
        const result = await rasidAIChat(
          input.message,
          input.history ?? [],
          who.name,
          who.id,
        );
        return { response: result.response, toolsUsed: result.toolsUsed, thinkingSteps: result.thinkingSteps };
      }),

    dashboardSummary: publicProcedure.query(async () => {
      const stats = await getDashboardStats();
      const recentLeaks = await getLeaks();
      const criticalLeaks = recentLeaks.filter((l: any) => l.severity === "critical");
      const highLeaks = recentLeaks.filter((l: any) => l.severity === "high");
      return {
        stats,
        criticalCount: criticalLeaks.length,
        highCount: highLeaks.length,
        recentLeaks: recentLeaks.slice(0, 5),
        totalLeaks: recentLeaks.length,
      };
    }),
  }),

  // ─── AI Response Ratings ──────────────────────────────────
  aiRatings: router({
    rate: protectedProcedure
      .input(z.object({
        messageId: z.string(),
        rating: z.number().min(1).max(5),
        userMessage: z.string().optional(),
        aiResponse: z.string().optional(),
        toolsUsed: z.array(z.string()).optional(),
        feedback: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const who = getAuthUser(ctx);
        const id = await createAiRating({
          messageId: input.messageId,
          userId: who.id,
          userName: who.name,
          rating: input.rating,
          userMessage: input.userMessage,
          aiResponse: input.aiResponse,
          toolsUsed: input.toolsUsed,
          feedback: input.feedback,
        });
        return { id };
      }),
    list: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        minRating: z.number().optional(),
        maxRating: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getAiRatings(input);
      }),
    stats: protectedProcedure.query(async () => {
      return getAiRatingStats();
    }),
  }),

  // ─── Knowledge Base Management ──────────────────────────────
  knowledgeBaseAdmin: router({
    list: protectedProcedure
      .input(z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        isPublished: z.boolean().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getKnowledgeBaseEntries(input);
      }),
    getById: protectedProcedure
      .input(z.object({ entryId: z.string() }))
      .query(async ({ input }) => {
        return getKnowledgeBaseEntryById(input.entryId);
      }),
    create: protectedProcedure
      .input(z.object({
        category: z.enum(["article", "faq", "glossary", "instruction", "policy", "regulation"]),
        title: z.string().min(1),
        titleAr: z.string().min(1),
        content: z.string().min(1),
        contentAr: z.string().min(1),
        tags: z.array(z.string()).optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const who = getAuthUser(ctx);
        const entryId = `KB-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        const id = await createKnowledgeBaseEntry({
          entryId,
          category: input.category,
          title: input.title,
          titleAr: input.titleAr,
          content: input.content,
          contentAr: input.contentAr,
          tags: input.tags || [],
          isPublished: input.isPublished ?? true,
          createdBy: who.id,
          createdByName: who.name,
        });
        await logAudit(who.id, "knowledgeBase.create", `Created knowledge base entry: ${input.titleAr}`, "system", who.name);
        return { id, entryId };
      }),
    update: protectedProcedure
      .input(z.object({
        entryId: z.string(),
        category: z.enum(["article", "faq", "glossary", "instruction", "policy", "regulation"]).optional(),
        title: z.string().optional(),
        titleAr: z.string().optional(),
        content: z.string().optional(),
        contentAr: z.string().optional(),
        tags: z.array(z.string()).optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const who = getAuthUser(ctx);
        const { entryId, ...data } = input;
        await updateKnowledgeBaseEntry(entryId, { ...data, updatedBy: who.id } as any);
        await logAudit(who.id, "knowledgeBase.update", `Updated knowledge base entry: ${entryId}`, "system", who.name);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ entryId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const who = getAuthUser(ctx);
        await deleteKnowledgeBaseEntry(input.entryId);
        await logAudit(who.id, "knowledgeBase.delete", `Deleted knowledge base entry: ${input.entryId}`, "system", who.name);
        return { success: true };
      }),
    stats: protectedProcedure.query(async () => {
      return getKnowledgeBaseStats();
    }),
    incrementView: publicProcedure
      .input(z.object({ entryId: z.string() }))
      .mutation(async ({ input }) => {
        await incrementKnowledgeBaseViewCount(input.entryId);
        return { success: true };
      }),
  }),

  // ─── Live Scan (Real Scanning Engine) ───────────────────────
  liveScan: router({
    execute: protectedProcedure
      .input(z.object({
        targets: z.array(z.object({
          type: z.enum(["email", "domain", "keyword", "phone", "national_id"]),
          value: z.string().min(1),
        })),
        sources: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const who = getAuthUser(ctx);
        const sources = input.sources ?? ["xposedornot", "crtsh", "psbdmp", "googledork", "breachdirectory"];
        const session = await executeScan(input.targets, sources);
        await logAudit(
          who.id,
          "liveScan.execute",
          `Executed scan on ${input.targets.map(t => `${t.type}:${t.value}`).join(", ")} — ${session.totalFindings} findings`,
          "monitoring",
          who.name
        );
        return session;
      }),
    quick: protectedProcedure
      .input(z.object({
        value: z.string().min(1),
        type: z.enum(["email", "domain", "keyword", "phone", "national_id"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const who = getAuthUser(ctx);
        const session = await quickScan(input.value, input.type ?? "email");
        await logAudit(
          who.id,
          "liveScan.quick",
          `Quick scan: ${input.value} — ${session.totalFindings} findings`,
          "monitoring",
          who.name
        );
        return session;
      }),
    saveAsLeak: protectedProcedure
      .input(z.object({
        scanResult: z.object({
          id: z.string(),
          source: z.string(),
          type: z.string(),
          severity: z.string(),
          title: z.string(),
          description: z.string(),
          details: z.any().optional(),
          url: z.string().optional(),
          affectedRecords: z.number().optional(),
          dataTypes: z.array(z.string()).optional(),
        }),
        targetValue: z.string(),
        targetType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const who = getAuthUser(ctx);
        const { scanResult, targetValue, targetType } = input;
        
        // Map scan source to leak source
        const sourceMap: Record<string, "telegram" | "darkweb" | "paste"> = {
          xposedornot: "darkweb",
          breachdirectory: "darkweb",
          crtsh: "paste",
          psbdmp: "paste",
          googledork: "paste",
        };
        const leakSource = sourceMap[scanResult.source.toLowerCase()] || "darkweb";
        
        // Map severity
        const sevMap: Record<string, "critical" | "high" | "medium" | "low"> = {
          critical: "critical",
          high: "high",
          medium: "medium",
          low: "low",
          info: "low",
        };
        const leakSeverity = sevMap[scanResult.severity] || "medium";
        
        // Generate unique leakId
        const leakId = `SCAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        await createLeak({
          leakId,
          title: scanResult.title,
          titleAr: scanResult.title,
          source: leakSource,
          severity: leakSeverity,
          sector: "عام",
          sectorAr: "عام",
          piiTypes: scanResult.dataTypes || ["بيانات شخصية"],
          recordCount: scanResult.affectedRecords || 0,
          status: "new",
          description: `${scanResult.description}\n\nTarget: ${targetType}:${targetValue}\nSource: ${scanResult.source}`,
          descriptionAr: scanResult.description,
          sourceUrl: scanResult.url || null,
          sourcePlatform: scanResult.source,
          breachMethod: scanResult.type,
          breachMethodAr: scanResult.type === "breach" ? "اختراق" : scanResult.type === "paste" ? "تسريب لصق" : scanResult.type === "certificate" ? "شهادة مكشوفة" : scanResult.type === "exposure" ? "تعرض" : "دارك ويب",
        });
        
        await logAudit(
          who.id,
          "liveScan.saveAsLeak",
          `Saved scan result as leak incident: ${leakId} — ${scanResult.title}`,
          "leak",
          who.name
        );
        
        return { leakId, success: true };
      }),

    saveAllAsLeaks: protectedProcedure
      .input(z.object({
        scanResults: z.array(z.object({
          id: z.string(),
          source: z.string(),
          type: z.string(),
          severity: z.string(),
          title: z.string(),
          description: z.string(),
          details: z.any().optional(),
          url: z.string().optional(),
          affectedRecords: z.number().optional(),
          dataTypes: z.array(z.string()).optional(),
        })),
        targetValue: z.string(),
        targetType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const who = getAuthUser(ctx);
        const saved: string[] = [];
        
        const sourceMap: Record<string, "telegram" | "darkweb" | "paste"> = {
          xposedornot: "darkweb",
          breachdirectory: "darkweb",
          crtsh: "paste",
          psbdmp: "paste",
          googledork: "paste",
        };
        const sevMap: Record<string, "critical" | "high" | "medium" | "low"> = {
          critical: "critical",
          high: "high",
          medium: "medium",
          low: "low",
          info: "low",
        };
        
        for (const sr of input.scanResults) {
          const leakId = `SCAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          try {
            await createLeak({
              leakId,
              title: sr.title,
              titleAr: sr.title,
              source: sourceMap[sr.source.toLowerCase()] || "darkweb",
              severity: sevMap[sr.severity] || "medium",
              sector: "عام",
              sectorAr: "عام",
              piiTypes: sr.dataTypes || ["بيانات شخصية"],
              recordCount: sr.affectedRecords || 0,
              status: "new",
              description: `${sr.description}\n\nTarget: ${input.targetType}:${input.targetValue}\nSource: ${sr.source}`,
              descriptionAr: sr.description,
              sourceUrl: sr.url || null,
              sourcePlatform: sr.source,
              breachMethod: sr.type,
              breachMethodAr: sr.type === "breach" ? "اختراق" : sr.type === "paste" ? "تسريب لصق" : sr.type === "certificate" ? "شهادة مكشوفة" : sr.type === "exposure" ? "تعرض" : "دارك ويب",
            });
            saved.push(leakId);
          } catch (e) {
            // skip duplicates
          }
        }
        
        await logAudit(
          who.id,
          "liveScan.saveAllAsLeaks",
          `Bulk saved ${saved.length} scan results as leak incidents`,
          "leak",
          who.name
        );
        
        return { savedCount: saved.length, leakIds: saved };
      }),
  }),

  // ─── Personality Scenarios Management ────────────────────
  personality: router({
    getGreeting: protectedProcedure.query(async ({ ctx }) => {
      const who = getAuthUser(ctx);
      return getGreetingForUser(String(who.id), who.name);
    }),

    checkLeader: protectedProcedure
      .input(z.object({ message: z.string() }))
      .query(async ({ input }) => {
        const result = await checkLeaderMention(input.message);
        return { found: !!result, respectPhrase: result };
      }),

    scenarios: router({
      list: protectedProcedure.query(async () => {
        return getAllPersonalityScenarios();
      }),

      create: adminProcedure
        .input(z.object({
          scenarioType: z.enum(["greeting_first", "greeting_return", "leader_respect", "custom"]),
          triggerKeyword: z.string().optional(),
          responseTemplate: z.string().min(1),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const who = getAuthUser(ctx);
          const id = await createPersonalityScenario({
            scenarioType: input.scenarioType,
            triggerKeyword: input.triggerKeyword ?? null,
            responseTemplate: input.responseTemplate,
            isActive: input.isActive !== false,
          });
          await logAudit(who.id, "personality.create", `Created scenario: ${input.scenarioType}`, "system", who.name);
          return { id };
        }),

      update: adminProcedure
        .input(z.object({
          id: z.number(),
          scenarioType: z.enum(["greeting_first", "greeting_return", "leader_respect", "custom"]).optional(),
          triggerKeyword: z.string().optional(),
          responseTemplate: z.string().optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const who = getAuthUser(ctx);
          const { id, ...data } = input;
          await updatePersonalityScenario(id, data);
          await logAudit(who.id, "personality.update", `Updated scenario #${id}`, "system", who.name);
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
          const who = getAuthUser(ctx);
          await deletePersonalityScenario(input.id);
          await logAudit(who.id, "personality.delete", `Deleted scenario #${input.id}`, "system", who.name);
          return { success: true };
        }),
    }),
  }),

  // ─── Chat History ─────────────────────────────────────────
  chatHistory: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const who = getAuthUser(ctx);
      return getUserConversations(String(who.id));
    }),

    get: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .query(async ({ ctx, input }) => {
        const who = getAuthUser(ctx);
        const conv = await getConversationById(input.conversationId);
        if (!conv || conv.userId !== String(who.id)) return null;
        const messages = await getConversationMessages(input.conversationId);
        return { conversation: conv, messages };
      }),

    save: protectedProcedure
      .input(z.object({
        conversationId: z.string(),
        title: z.string(),
        messages: z.array(z.object({
          messageId: z.string(),
          role: z.enum(["user", "assistant"]),
          content: z.string(),
          toolsUsed: z.any().optional(),
          thinkingSteps: z.any().optional(),
          rating: z.number().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const who = getAuthUser(ctx);
        const existing = await getConversationById(input.conversationId);
        
        if (!existing) {
          await createConversation({
            conversationId: input.conversationId,
            userId: String(who.id),
            userName: who.name,
            title: input.title,
            messageCount: input.messages.length,
            totalToolsUsed: input.messages.reduce((sum, m) => sum + (Array.isArray(m.toolsUsed) ? m.toolsUsed.length : 0), 0),
          });
        } else {
          await updateConversation(input.conversationId, {
            title: input.title,
            messageCount: input.messages.length,
          });
        }

        // Save each message
        for (const msg of input.messages) {
          await addChatMessage({
            conversationId: input.conversationId,
            messageId: msg.messageId,
            role: msg.role,
            content: msg.content,
            toolsUsed: msg.toolsUsed || null,
            thinkingSteps: msg.thinkingSteps || null,
            rating: msg.rating || null,
          });
        }

        await logAudit(who.id, "chatHistory.save", `Saved conversation: ${input.title}`, "system", who.name);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const who = getAuthUser(ctx);
        const conv = await getConversationById(input.conversationId);
        if (!conv || conv.userId !== String(who.id)) {
          throw new Error("Conversation not found or access denied");
        }
        await deleteConversation(input.conversationId);
        await logAudit(who.id, "chatHistory.delete", `Deleted conversation: ${conv.title}`, "system", who.name);
        return { success: true };
      }),

    updateTitle: protectedProcedure
      .input(z.object({ conversationId: z.string(), title: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const who = getAuthUser(ctx);
        await updateConversation(input.conversationId, { title: input.title });
        return { success: true };
      }),
  }),

  // ═══ TRAINING CENTER ROUTER ═══════════════════════════════════
  trainingCenter: router({
    // --- Custom Actions CRUD ---
    customActions: router({
      list: protectedProcedure
        .input(z.object({ isActive: z.boolean().optional() }).optional())
        .query(async ({ input }) => {
          return getCustomActions(input ?? undefined);
        }),
      get: protectedProcedure
        .input(z.object({ actionId: z.string() }))
        .query(async ({ input }) => {
          return getCustomActionById(input.actionId);
        }),
      create: protectedProcedure
        .input(z.object({
          triggerPhrase: z.string().min(1),
          triggerAliases: z.array(z.string()).optional(),
          actionType: z.enum(["call_function", "custom_response", "redirect", "api_call"]),
          actionTarget: z.string().optional(),
          actionParams: z.record(z.string(), z.any()).optional(),
          description: z.string().optional(),
          descriptionAr: z.string().optional(),
          priority: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const who = getAuthUser(ctx);
          const actionId = `CA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const id = await createCustomAction({
            actionId,
            triggerPhrase: input.triggerPhrase,
            triggerAliases: input.triggerAliases ?? [],
            actionType: input.actionType,
            actionTarget: input.actionTarget ?? null,
            actionParams: input.actionParams ?? {},
            description: input.description ?? null,
            descriptionAr: input.descriptionAr ?? null,
            priority: input.priority ?? 0,
            createdBy: who.id,
          });
          await logAudit(who.id, "trainingCenter.customAction.create", `Created custom action: ${input.triggerPhrase}`, "system", who.name);
          return { id, actionId };
        }),
      update: protectedProcedure
        .input(z.object({
          actionId: z.string(),
          triggerPhrase: z.string().optional(),
          triggerAliases: z.array(z.string()).optional(),
          actionType: z.enum(["call_function", "custom_response", "redirect", "api_call"]).optional(),
          actionTarget: z.string().optional(),
          actionParams: z.record(z.string(), z.any()).optional(),
          description: z.string().optional(),
          descriptionAr: z.string().optional(),
          priority: z.number().optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const who = getAuthUser(ctx);
          const { actionId, ...data } = input;
          await updateCustomAction(actionId, data as any);
          await logAudit(who.id, "trainingCenter.customAction.update", `Updated custom action: ${actionId}`, "system", who.name);
          return { success: true };
        }),
      delete: protectedProcedure
        .input(z.object({ actionId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          const who = getAuthUser(ctx);
          await deleteCustomAction(input.actionId);
          await logAudit(who.id, "trainingCenter.customAction.delete", `Deleted custom action: ${input.actionId}`, "system", who.name);
          return { success: true };
        }),
    }),

    // --- Training Documents CRUD ---
    documents: router({
      list: protectedProcedure
        .input(z.object({ status: z.string().optional() }).optional())
        .query(async ({ input }) => {
          return getTrainingDocuments(input ?? undefined);
        }),
      get: protectedProcedure
        .input(z.object({ docId: z.string() }))
        .query(async ({ input }) => {
          return getTrainingDocumentById(input.docId);
        }),
      upload: protectedProcedure
        .input(z.object({
          fileName: z.string(),
          fileUrl: z.string(),
          fileSize: z.number().optional(),
          fileType: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          const who = getAuthUser(ctx);
          const docId = `DOC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const id = await createTrainingDocument({
            docId,
            fileName: input.fileName,
            fileUrl: input.fileUrl,
            fileSize: input.fileSize ?? null,
            fileType: input.fileType ?? null,
            uploadedBy: who.id,
            uploadedByName: who.name,
          });
          await logAudit(who.id, "trainingCenter.document.upload", `Uploaded training document: ${input.fileName}`, "system", who.name);
          return { id, docId };
        }),
      process: protectedProcedure
        .input(z.object({ docId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          const who = getAuthUser(ctx);
          const doc = await getTrainingDocumentById(input.docId);
          if (!doc) throw new Error("Document not found");
          await updateTrainingDocument(input.docId, { status: "processing" });
          // Simulate processing - in production this would extract text from the document
          try {
            const { invokeLLM } = await import("./_core/llm");
            const response = await invokeLLM({
              messages: [
                { role: "system", content: "You are a document content extractor. Extract and summarize the key information from the document description. Respond in Arabic." },
                { role: "user", content: `Extract key information from this training document: ${doc.fileName}. URL: ${doc.fileUrl}` },
              ],
            });
            const rawContent = response.choices?.[0]?.message?.content;
            const extractedContent = typeof rawContent === "string" ? rawContent : "تم معالجة المستند بنجاح";
            await updateTrainingDocument(input.docId, {
              status: "completed",
              extractedContent,
              chunkCount: Math.ceil(extractedContent.length / 500),
              processedAt: new Date(),
            });
          } catch (err: any) {
            await updateTrainingDocument(input.docId, {
              status: "failed",
              errorMessage: err.message || "Processing failed",
            });
          }
          await logAudit(who.id, "trainingCenter.document.process", `Processed document: ${doc.fileName}`, "system", who.name);
          return { success: true };
        }),
      delete: protectedProcedure
        .input(z.object({ docId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          const who = getAuthUser(ctx);
          await deleteTrainingDocument(input.docId);
          await logAudit(who.id, "trainingCenter.document.delete", `Deleted training document: ${input.docId}`, "system", who.name);
          return { success: true };
        }),
    }),

    // --- AI Feedback & Ratings ---
    feedback: router({
      list: protectedProcedure
        .input(z.object({
          minRating: z.number().optional(),
          maxRating: z.number().optional(),
          limit: z.number().optional(),
        }).optional())
        .query(async ({ input }) => {
          return getAiRatings(input ?? undefined);
        }),
      stats: protectedProcedure.query(async () => {
        return getAiFeedbackStats();
      }),
    }),

    // --- Training Content for AI ---
    getTrainingContent: protectedProcedure.query(async () => {
      return getTrainingDocumentContent();
    }),
  }),
});
export type AppRouter = typeof appRouter;
