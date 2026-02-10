import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
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

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      if (ctx.user) {
        logAudit(ctx.user.id, "auth.logout", `User ${ctx.user.name} logged out`, "auth", ctx.user.name ?? undefined);
      }
      return { success: true } as const;
    }),
  }),

  // ─── Dashboard ──────────────────────────────────────────────
  dashboard: router({
    stats: publicProcedure.query(async () => {
      const stats = await getDashboardStats();
      if (!stats) {
        return {
          totalLeaks: 0,
          criticalAlerts: 0,
          totalRecords: 0,
          activeMonitors: 0,
          piiDetected: 0,
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
        await logAudit(ctx.user.id, "leak.create", `Created leak ${input.leakId}`, "leak", ctx.user.name ?? undefined);
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
        await logAudit(ctx.user.id, "leak.updateStatus", `Updated ${input.leakId} to ${input.status}`, "leak", ctx.user.name ?? undefined);

        // Broadcast status change notification
        broadcastNotification({
          type: "status_change",
          title: `Leak ${input.leakId} status updated to ${input.status}`,
          titleAr: `تم تحديث حالة التسريب ${input.leakId} إلى ${input.status === "analyzing" ? "قيد التحليل" : input.status === "documented" ? "موثق" : input.status === "reported" ? "تم الإبلاغ" : "جديد"}`,
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
          await logAudit(ctx.user.id, "leak.export", `Exported ${data.length} leaks as CSV`, "export", ctx.user.name ?? undefined);
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
          { type: "National ID", typeAr: "رقم الهوية الوطنية", regex: /\b1\d{9}\b/g },
          { type: "Iqama Number", typeAr: "رقم الإقامة", regex: /\b2\d{9}\b/g },
          { type: "Saudi Phone", typeAr: "رقم جوال سعودي", regex: /\b05\d{8}\b/g },
          { type: "Saudi Email", typeAr: "بريد إلكتروني سعودي", regex: /\b[\w.-]+@[\w.-]+\.sa\b/gi },
          { type: "IBAN", typeAr: "رقم الحساب البنكي", regex: /\bSA\d{22}\b/g },
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
            userId: ctx.user.id,
            inputText: input.text.substring(0, 5000),
            results,
            totalMatches: results.length,
          });
          await logAudit(ctx.user.id, "pii.scan", `PII scan: ${results.length} matches found`, "pii", ctx.user.name ?? undefined);

          // Send notification if matches found
          if (results.length > 0) {
            const notifId = await createNotification({
              userId: ctx.user.id,
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
      return getPiiScans(ctx.user.id);
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
        const id = await createReport({ ...input, generatedBy: ctx.user.id });
        await logAudit(ctx.user.id, "report.create", `Created report: ${input.title}`, "report", ctx.user.name ?? undefined);
        return { id, success: true };
      }),

    exportPdf: publicProcedure
      .input(z.object({ reportId: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const allLeaks = await getLeaks();
        const stats = await getDashboardStats();
        const reportsList = await getReports();

        if (ctx.user) {
          await logAudit(ctx.user.id, "report.export", `Exported PDF report`, "export", ctx.user.name ?? undefined);
        }

        const summary = {
          title: "NDMO — تقرير تسريبات البيانات الشخصية",
          generatedAt: new Date().toISOString(),
          stats: stats ?? { totalLeaks: 0, criticalAlerts: 0, totalRecords: 0, activeMonitors: 0, piiDetected: 0 },
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
        await logAudit(ctx.user.id, "user.updateRole", `Updated user ${input.userId} to ${input.ndmoRole}`, "user", ctx.user.name ?? undefined);
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
      await markAllNotificationsRead(ctx.user.id);
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
        await logAudit(ctx.user.id, "audit.export", "Exported audit logs as CSV", "export", ctx.user.name ?? undefined);
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
        await logAudit(ctx.user.id, "enrichment.run", `AI enriched leak ${input.leakId} (confidence: ${result.aiConfidence}%)`, "system", ctx.user.name ?? undefined);
        return result;
      }),

    enrichAll: adminProcedure.mutation(async ({ ctx }) => {
      const count = await enrichAllPending();
      await logAudit(ctx.user.id, "enrichment.batch", `Batch enriched ${count} leaks`, "system", ctx.user.name ?? undefined);
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
          await logAudit(ctx.user.id, "alert.contact.create", `Created alert contact: ${input.name}`, "system", ctx.user.name ?? undefined);
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
          await logAudit(ctx.user.id, "alert.contact.update", `Updated alert contact #${id}`, "system", ctx.user.name ?? undefined);
          return { success: true };
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          await deleteAlertContact(input.id);
          await logAudit(ctx.user.id, "alert.contact.delete", `Deleted alert contact #${input.id}`, "system", ctx.user.name ?? undefined);
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
          await logAudit(ctx.user.id, "alert.rule.create", `Created alert rule: ${input.name}`, "system", ctx.user.name ?? undefined);
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
          await logAudit(ctx.user.id, "alert.rule.update", `Updated alert rule #${id}`, "system", ctx.user.name ?? undefined);
          return { success: true };
        }),
      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          await deleteAlertRule(input.id);
          await logAudit(ctx.user.id, "alert.rule.delete", `Deleted alert rule #${input.id}`, "system", ctx.user.name ?? undefined);
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
        await logAudit(ctx.user.id, "retention.update", `Updated retention policy #${id}`, "system", ctx.user.name ?? undefined);
        return { success: true };
      }),
    execute: adminProcedure.mutation(async ({ ctx }) => {
      const results = await executeRetentionPolicies();
      await logAudit(ctx.user.id, "retention.execute", `Executed retention policies: ${results.length} processed`, "system", ctx.user.name ?? undefined);
      return results;
    }),
    preview: adminProcedure.query(async () => previewRetention()),
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
        await logAudit(ctx.user.id, "monitoring.trigger", `Manually triggered job ${input.jobId}`, "monitoring", ctx.user.name ?? undefined);
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
          ctx.user.id,
          `monitoring.${input.status === "active" ? "resume" : "pause"}`,
          `${input.status === "active" ? "Resumed" : "Paused"} job ${input.jobId}`,
          "monitoring",
          ctx.user.name ?? undefined,
        );
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
