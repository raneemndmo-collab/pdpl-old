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
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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
        await logAudit(ctx.user.id, "leak.create", `Created leak ${input.leakId}`);
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
        await logAudit(ctx.user.id, "leak.updateStatus", `Updated ${input.leakId} to ${input.status}`);
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
      .query(async ({ input }) => {
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
        await logAudit(ctx.user.id, "report.create", `Created report: ${input.title}`);
        return { id, success: true };
      }),

    exportPdf: publicProcedure
      .input(z.object({ reportId: z.number().optional() }))
      .query(async ({ input }) => {
        // Generate a summary report as structured data for client-side PDF generation
        const allLeaks = await getLeaks();
        const stats = await getDashboardStats();
        const reportsList = await getReports();

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
        await logAudit(ctx.user.id, "user.updateRole", `Updated user ${input.userId} to ${input.ndmoRole}`);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
