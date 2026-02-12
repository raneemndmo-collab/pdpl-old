/**
 * Scheduled Report Generation Service
 * Handles automated compliance report generation and delivery
 */
import { getScheduledReports, updateScheduledReport, getLeaks, getDashboardStats, getAlertContacts } from "./db";
import { notifyOwner } from "./_core/notification";
import { logAudit } from "./db";

/**
 * Check and run any scheduled reports that are due
 */
export async function checkAndRunScheduledReports(): Promise<number> {
  const reports = await getScheduledReports();
  const now = new Date();
  let ran = 0;

  for (const report of reports) {
    if (!report.isEnabled) continue;
    if (report.nextRunAt && new Date(report.nextRunAt) > now) continue;

    try {
      // Generate the report content
      const content = await generateReportContent(report.template, report.name);

      // Send to owner via notification
      await notifyOwner({
        title: `📊 ${report.name} — Automated Report`,
        content: content.substring(0, 2000),
      });

      // Calculate next run
      const nextRun = calculateNextRun(report.frequency);

      await updateScheduledReport(report.id, {
        lastRunAt: now,
        nextRunAt: nextRun,
        totalRuns: (report.totalRuns ?? 0) + 1,
      });

      await logAudit(
        report.createdBy ?? 0,
        "report.scheduled.run",
        `Scheduled report "${report.name}" generated and sent`,
        "report",
        "System"
      );

      ran++;
    } catch (error) {
      console.error(`[ReportScheduler] Failed to run report ${report.id}:`, error);
    }
  }

  return ran;
}

/**
 * Generate report content based on template type
 */
async function generateReportContent(
  template: string,
  reportName: string
): Promise<string> {
  const stats = await getDashboardStats();
  const leaks = await getLeaks();
  const contacts = await getAlertContacts();

  const now = new Date().toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  switch (template) {
    case "executive_summary":
      return [
        `# ${reportName}`,
        `📅 التاريخ: ${now}`,
        "",
        "## ملخص تنفيذي",
        `- إجمالي التسريبات: ${stats?.totalLeaks ?? 0}`,
        `- التسريبات الجديدة: ${stats?.newLeaks ?? 0}`,
        `- السجلات المتأثرة: ${(stats?.totalRecords ?? 0).toLocaleString()}`,
        `- أجهزة الرصد النشطة: ${stats?.activeMonitors ?? 0}`,
        "",
        "## التسريبات الأخيرة",
        ...leaks.slice(0, 5).map(
          (l) => `- **${l.titleAr}** (${l.severity}) — ${l.sectorAr} — ${l.recordCount.toLocaleString()} سجل`
        ),
        "",
        `## جهات الاتصال المسجلة: ${contacts.length}`,
      ].join("\n");

    case "full_detail":
      return [
        `# ${reportName} — تقرير مفصل`,
        `📅 ${now}`,
        "",
        "## جميع التسريبات",
        ...leaks.map(
          (l) =>
            `### ${l.leakId}: ${l.titleAr}\n- المصدر: ${l.source}\n- التصنيف: ${l.severity}\n- القطاع: ${l.sectorAr}\n- السجلات: ${l.recordCount.toLocaleString()}\n- الحالة: ${l.status}`
        ),
      ].join("\n");

    case "compliance":
      const documented = leaks.filter((l) => l.status === "documented" || l.status === "reported").length;
      const complianceRate = leaks.length > 0 ? Math.round((documented / leaks.length) * 100) : 100;
      return [
        `# ${reportName}`,
        `📅 ${now}`,
        "",
        "## حالة الامتثال",
        `- نسبة الامتثال: ${complianceRate}%`,
        `- التسريبات الموثقة: ${documented}/${leaks.length}`,
        `- التسريبات المعلقة: ${leaks.filter((l) => l.status === "new").length}`,
        `- قيد التحليل: ${leaks.filter((l) => l.status === "analyzing").length}`,
        "",
        "## التوصيات",
        complianceRate < 80
          ? "⚠️ نسبة الامتثال أقل من 80%. يُوصى بمراجعة التسريبات المعلقة فوراً."
          : "✅ نسبة الامتثال جيدة. يُوصى بالاستمرار في المراقبة الدورية.",
      ].join("\n");

    case "sector_analysis":
      const sectorMap = new Map<string, { count: number; records: number; critical: number }>();
      for (const l of leaks) {
        const key = l.sectorAr;
        const existing = sectorMap.get(key) || { count: 0, records: 0, critical: 0 };
        existing.count++;
        existing.records += l.recordCount;
        if (l.severity === "critical") existing.critical++;
        sectorMap.set(key, existing);
      }
      return [
        `# ${reportName}`,
        `📅 ${now}`,
        "",
        "## تحليل القطاعات",
        ...Array.from(sectorMap.entries()).map(
          ([sector, data]) =>
            `### ${sector}\n- عدد التسريبات: ${data.count}\n- السجلات المتأثرة: ${data.records.toLocaleString()}\n- التسريبات واسعة النطاق: ${data.critical}`
        ),
      ].join("\n");

    default:
      return `# ${reportName}\n📅 ${now}\n\nNo template matched.`;
  }
}

/**
 * Calculate the next run date based on frequency
 */
function calculateNextRun(frequency: string): Date {
  const now = new Date();
  switch (frequency) {
    case "weekly":
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "monthly":
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case "quarterly":
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}
