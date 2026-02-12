/**
 * Scheduler — cron-based background monitoring jobs
 * Simulates checking Telegram, Dark Web, and Paste Sites for new data leaks
 * Creates leak records and notifications when new threats are detected
 */
import cron from "node-cron";
import { nanoid } from "nanoid";
import {
  getMonitoringJobs,
  updateMonitoringJobStatus,
  createLeak,
  createNotification,
  logAudit,
  createMonitoringJob,
  getDb,
} from "./db";
import { monitoringJobs } from "../drizzle/schema";
import { broadcastNotification, broadcastJobUpdate } from "./websocket";
import { sql } from "drizzle-orm";
import { checkAndRunScheduledReports } from "./reportScheduler";

// Store active cron tasks
type CronTask = ReturnType<typeof cron.schedule>;
const activeTasks = new Map<string, CronTask>();

// Simulated threat data for realistic monitoring
type Severity = "critical" | "high" | "medium" | "low";
interface ThreatTemplate {
  title: string;
  titleAr: string;
  sector: string;
  sectorAr: string;
  severity: Severity;
  piiTypes: string[];
  records: number;
}

const telegramThreats: ThreatTemplate[] = [
  { title: "Saudi Banking Credentials Dump", titleAr: "تسريب بيانات اعتماد مصرفية سعودية", sector: "Banking", sectorAr: "القطاع المصرفي", severity: "critical" as const, piiTypes: ["National ID", "IBAN", "Phone"], records: 15000 },
  { title: "Healthcare Patient Records", titleAr: "سجلات مرضى قطاع الصحة", sector: "Healthcare", sectorAr: "القطاع الصحي", severity: "high" as const, piiTypes: ["National ID", "Phone", "Email"], records: 8500 },
  { title: "Telecom Subscriber Data", titleAr: "بيانات مشتركي الاتصالات", sector: "Telecom", sectorAr: "قطاع الاتصالات", severity: "high" as const, piiTypes: ["Phone", "National ID", "Iqama"], records: 22000 },
  { title: "Government Employee Directory", titleAr: "دليل موظفي القطاع الحكومي", sector: "Government", sectorAr: "القطاع الحكومي", severity: "critical" as const, piiTypes: ["National ID", "Email", "Phone"], records: 5200 },
  { title: "E-commerce Customer Database", titleAr: "قاعدة بيانات عملاء التجارة الإلكترونية", sector: "Retail", sectorAr: "قطاع التجزئة", severity: "medium" as const, piiTypes: ["Email", "Phone", "IBAN"], records: 31000 },
];

const darkwebThreats: ThreatTemplate[] = [
  { title: "Saudi National ID Bulk Sale", titleAr: "بيع جملة لأرقام هوية وطنية سعودية", sector: "Government", sectorAr: "القطاع الحكومي", severity: "critical" as const, piiTypes: ["National ID"], records: 50000 },
  { title: "Corporate VPN Credentials", titleAr: "بيانات اعتماد VPN للشركات", sector: "Technology", sectorAr: "قطاع التقنية", severity: "high" as const, piiTypes: ["Email", "Phone"], records: 3200 },
  { title: "Insurance Policy Holder Data", titleAr: "بيانات حاملي وثائق التأمين", sector: "Insurance", sectorAr: "قطاع التأمين", severity: "high" as const, piiTypes: ["National ID", "IBAN", "Phone"], records: 12000 },
];

const pasteThreats: ThreatTemplate[] = [
  { title: "Leaked Employee Credentials", titleAr: "تسريب بيانات اعتماد الموظفين", sector: "Technology", sectorAr: "قطاع التقنية", severity: "medium" as const, piiTypes: ["Email", "Phone"], records: 1500 },
  { title: "Student Records Paste", titleAr: "لصق سجلات الطلاب", sector: "Education", sectorAr: "قطاع التعليم", severity: "medium" as const, piiTypes: ["National ID", "Email"], records: 4800 },
  { title: "Utility Customer Data", titleAr: "بيانات عملاء المرافق", sector: "Utilities", sectorAr: "قطاع المرافق", severity: "low" as const, piiTypes: ["Phone", "IBAN"], records: 7200 },
];

function getRandomThreat(platform: "telegram" | "darkweb" | "paste"): ThreatTemplate {
  const threats = platform === "telegram" ? telegramThreats : platform === "darkweb" ? darkwebThreats : pasteThreats;
  return threats[Math.floor(Math.random() * threats.length)];
}

/**
 * Simulate a monitoring scan for a given platform
 * Returns whether a new leak was detected
 */
async function runMonitoringScan(platform: "telegram" | "darkweb" | "paste"): Promise<{
  detected: boolean;
  leakId?: string;
  threat?: ThreatTemplate;
}> {
  // 30% chance of detecting a new leak per scan
  const detected = Math.random() < 0.3;

  if (!detected) {
    return { detected: false };
  }

  const threat = getRandomThreat(platform);
  const leakId = `LK-${Date.now().toString(36).toUpperCase()}`;

  try {
    await createLeak({
      leakId,
      title: threat.title,
      titleAr: threat.titleAr,
      source: platform,
      severity: threat.severity,
      sector: threat.sector,
      sectorAr: threat.sectorAr,
      piiTypes: threat.piiTypes,
      recordCount: threat.records + Math.floor(Math.random() * 5000),
      status: "new",
      description: `Automatically detected by scheduled monitoring job on ${platform}`,
      descriptionAr: `تم الكشف تلقائياً بواسطة مهمة الرصد المجدولة على ${platform === "telegram" ? "تليجرام" : platform === "darkweb" ? "الدارك ويب" : "مواقع اللصق"}`,
    });

    // Create notification
    const notifId = await createNotification({
      userId: null, // broadcast to all
      type: "new_leak",
      title: `New Leak Detected: ${threat.title}`,
      titleAr: `تسريب جديد: ${threat.titleAr}`,
      message: `${threat.severity.toUpperCase()} severity leak detected on ${platform} with ${threat.records}+ records`,
      messageAr: `تم رصد تسريب بتصنيف ${threat.severity === "critical" ? "واسع النطاق" : threat.severity === "high" ? "مرتفع" : threat.severity === "medium" ? "متوسط" : "محدود"} على ${platform === "telegram" ? "تليجرام" : platform === "darkweb" ? "الدارك ويب" : "مواقع اللصق"}`,
      severity: threat.severity,
      relatedId: leakId,
    });

    // Broadcast real-time notification
    broadcastNotification({
      id: notifId,
      type: "new_leak",
      title: `New Leak Detected: ${threat.title}`,
      titleAr: `تسريب جديد: ${threat.titleAr}`,
      message: `${threat.severity.toUpperCase()} severity leak detected on ${platform}`,
      messageAr: `تم اكتشاف تسريب جديد على ${platform === "telegram" ? "تليجرام" : platform === "darkweb" ? "الدارك ويب" : "مواقع اللصق"}`,
      severity: threat.severity,
      relatedId: leakId,
      createdAt: new Date().toISOString(),
    });

    await logAudit(null, "monitoring.leak_detected", `Auto-detected leak ${leakId} on ${platform}: ${threat.title}`, "monitoring");

    return { detected: true, leakId, threat };
  } catch (error) {
    console.error(`[Scheduler] Error creating leak for ${platform}:`, error);
    return { detected: false };
  }
}

/**
 * Execute a monitoring job
 */
async function executeJob(jobId: string, platform: "telegram" | "darkweb" | "paste" | "all") {
  console.log(`[Scheduler] Running job ${jobId} for platform: ${platform}`);

  try {
    await updateMonitoringJobStatus(jobId, "running");
    broadcastJobUpdate({ jobId, status: "running" });

    let totalLeaksFound = 0;
    const platforms: Array<"telegram" | "darkweb" | "paste"> =
      platform === "all" ? ["telegram", "darkweb", "paste"] : [platform];

    for (const p of platforms) {
      const result = await runMonitoringScan(p);
      if (result.detected) {
        totalLeaksFound++;
      }
    }

    const now = new Date();
    const resultMsg = totalLeaksFound > 0
      ? `Found ${totalLeaksFound} new leak(s)`
      : "No new leaks detected";

    await updateMonitoringJobStatus(jobId, "active", {
      lastRunAt: now,
      lastResult: resultMsg,
      leaksFound: totalLeaksFound,
      totalRuns: 1,
    });

    broadcastJobUpdate({
      jobId,
      status: "active",
      lastResult: resultMsg,
      leaksFound: totalLeaksFound,
    });

    if (totalLeaksFound > 0) {
      await createNotification({
        userId: null,
        type: "job_complete",
        title: `Monitoring Job Complete: ${totalLeaksFound} leak(s) found`,
        titleAr: `اكتمال مهمة الرصد: تم العثور على ${totalLeaksFound} تسريب(ات)`,
        message: `Job ${jobId} completed scan of ${platform} sources`,
        messageAr: `اكتملت المهمة ${jobId} من فحص مصادر ${platform === "all" ? "جميع المنصات" : platform}`,
        severity: "high",
        relatedId: jobId,
      });
    }

    await logAudit(null, "monitoring.job_complete", `Job ${jobId} completed: ${resultMsg}`, "monitoring");

  } catch (error) {
    console.error(`[Scheduler] Job ${jobId} failed:`, error);
    await updateMonitoringJobStatus(jobId, "error", {
      lastRunAt: new Date(),
      lastResult: `Error: ${(error as Error).message}`,
    });
    broadcastJobUpdate({ jobId, status: "error", lastResult: `Error: ${(error as Error).message}` });
  }
}

/**
 * Schedule a cron job
 */
function scheduleJob(jobId: string, cronExpr: string, platform: "telegram" | "darkweb" | "paste" | "all") {
  // Stop existing task if any
  const existing = activeTasks.get(jobId);
  if (existing) {
    existing.stop();
  }

  const task = cron.schedule(cronExpr, () => {
    executeJob(jobId, platform);
  });

  activeTasks.set(jobId, task);
  console.log(`[Scheduler] Job ${jobId} scheduled with cron: ${cronExpr}`);
}

/**
 * Initialize default monitoring jobs and start scheduler
 */
export async function initScheduler() {
  console.log("[Scheduler] Initializing monitoring jobs...");

  const db = await getDb();
  if (!db) {
    console.warn("[Scheduler] Database not available, skipping initialization");
    return;
  }

  // Check if jobs already exist
  const existingJobs = await getMonitoringJobs();

  if (existingJobs.length === 0) {
    // Create default monitoring jobs
    const defaultJobs = [
      {
        jobId: "job-telegram-monitor",
        name: "Telegram Channel Scanner",
        nameAr: "ماسح قنوات تليجرام",
        platform: "telegram" as const,
        cronExpression: "*/15 * * * *", // Every 15 minutes
        status: "active" as const,
      },
      {
        jobId: "job-darkweb-crawler",
        name: "Dark Web Marketplace Crawler",
        nameAr: "زاحف أسواق الدارك ويب",
        platform: "darkweb" as const,
        cronExpression: "*/30 * * * *", // Every 30 minutes
        status: "active" as const,
      },
      {
        jobId: "job-paste-scanner",
        name: "Paste Sites PII Scanner",
        nameAr: "ماسح PII لمواقع اللصق",
        platform: "paste" as const,
        cronExpression: "*/20 * * * *", // Every 20 minutes
        status: "active" as const,
      },
      {
        jobId: "job-full-sweep",
        name: "Full Platform Sweep",
        nameAr: "مسح شامل لجميع المنصات",
        platform: "all" as const,
        cronExpression: "0 */2 * * *", // Every 2 hours
        status: "active" as const,
      },
    ];

    for (const job of defaultJobs) {
      try {
        await createMonitoringJob(job);
        console.log(`[Scheduler] Created default job: ${job.name}`);
      } catch (error) {
        console.warn(`[Scheduler] Job ${job.jobId} may already exist:`, error);
      }
    }
  }

  // Schedule all active jobs
  const jobs = await getMonitoringJobs();
  for (const job of jobs) {
    if (job.status === "active" || job.status === "running") {
      try {
        scheduleJob(job.jobId, job.cronExpression, job.platform as any);
      } catch (error) {
        console.error(`[Scheduler] Failed to schedule job ${job.jobId}:`, error);
      }
    }
  }

  console.log(`[Scheduler] ${jobs.filter(j => j.status === "active").length} jobs scheduled`);

  // Schedule automated report generation check every hour
  cron.schedule("0 * * * *", async () => {
    try {
      const count = await checkAndRunScheduledReports();
      if (count > 0) {
        console.log(`[Scheduler] Generated ${count} scheduled report(s)`);
      }
    } catch (error) {
      console.error("[Scheduler] Report generation failed:", error);
    }
  });
  console.log("[Scheduler] Report scheduler initialized (hourly check)");
}

/**
 * Manually trigger a monitoring job
 */
export async function triggerJob(jobId: string) {
  const job = await getDb().then(async (db) => {
    if (!db) return undefined;
    const result = await db.select().from(monitoringJobs).where(sql`${monitoringJobs.jobId} = ${jobId}`).limit(1);
    return result[0];
  });

  if (!job) throw new Error(`Job ${jobId} not found`);
  await executeJob(jobId, job.platform as any);
}

/**
 * Pause or resume a monitoring job
 */
export async function toggleJobStatus(jobId: string, newStatus: "active" | "paused") {
  if (newStatus === "paused") {
    const task = activeTasks.get(jobId);
    if (task) {
      task.stop();
      activeTasks.delete(jobId);
    }
  } else {
    const job = await getDb().then(async (db) => {
      if (!db) return undefined;
      const result = await db.select().from(monitoringJobs).where(sql`${monitoringJobs.jobId} = ${jobId}`).limit(1);
      return result[0];
    });
    if (job) {
      scheduleJob(jobId, job.cronExpression, job.platform as any);
    }
  }
  await updateMonitoringJobStatus(jobId, newStatus);
}
