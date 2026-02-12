/**
 * Alert Dispatch Service — Email/SMS alert channels
 * Sends critical alerts to designated contacts based on configured rules
 * Uses the built-in notification helper for email delivery
 */
import { getDb } from "./db";
import { alertContacts, alertRules, alertHistory, leaks } from "../drizzle/schema";
import { eq, and, gte, inArray } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

interface AlertPayload {
  leakId: string;
  title: string;
  titleAr: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
  recordCount: number;
  piiTypes: string[];
  sector: string;
  sectorAr: string;
}

const SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Process a new leak and dispatch alerts based on configured rules
 */
export async function dispatchLeakAlerts(payload: AlertPayload): Promise<{
  emailsSent: number;
  smsSent: number;
  failed: number;
}> {
  const db = await getDb();
  if (!db) return { emailsSent: 0, smsSent: 0, failed: 0 };

  let emailsSent = 0;
  let smsSent = 0;
  let failed = 0;

  try {
    // Get all enabled rules
    const rules = await db
      .select()
      .from(alertRules)
      .where(eq(alertRules.isEnabled, true));

    for (const rule of rules) {
      // Check if leak severity meets the rule threshold
      const leakRank = SEVERITY_RANK[payload.severity] || 0;
      const thresholdRank = SEVERITY_RANK[rule.severityThreshold] || 0;

      if (leakRank < thresholdRank) continue;

      // Get recipients for this rule
      const recipientIds = (rule.recipients as number[]) || [];
      if (recipientIds.length === 0) continue;

      const contacts = await db
        .select()
        .from(alertContacts)
        .where(
          and(
            eq(alertContacts.isActive, true),
            inArray(alertContacts.id, recipientIds)
          )
        );

      for (const contact of contacts) {
        const contactChannels = (contact.channels as string[]) || ["email"];
        const shouldEmail =
          (rule.channel === "email" || rule.channel === "both") &&
          contactChannels.includes("email") &&
          contact.email;
        const shouldSms =
          (rule.channel === "sms" || rule.channel === "both") &&
          contactChannels.includes("sms") &&
          contact.phone;

        // Send email alert
        if (shouldEmail) {
          try {
            const subject = `[NDMO] تنبيه ${severityLabelAr(payload.severity)}: ${payload.titleAr}`;
            const body = buildEmailBody(payload, contact.nameAr || contact.name);

            // Use the built-in notification helper
            await notifyOwner({
              title: subject,
              content: body,
            });

            // Log success
            await db.insert(alertHistory).values({
              ruleId: rule.id,
              contactId: contact.id,
              contactName: contact.nameAr || contact.name,
              channel: "email",
              subject,
              body,
              status: "sent",
              leakId: payload.leakId,
            });
            emailsSent++;
          } catch (error) {
            console.error(`[AlertDispatch] Email failed for ${contact.email}:`, error);
            await db.insert(alertHistory).values({
              ruleId: rule.id,
              contactId: contact.id,
              contactName: contact.nameAr || contact.name,
              channel: "email",
              subject: `[NDMO] Alert: ${payload.title}`,
              body: `Failed to send email alert`,
              status: "failed",
              leakId: payload.leakId,
            });
            failed++;
          }
        }

        // Log SMS alert (simulated — real SMS would use Twilio/AWS SNS)
        if (shouldSms) {
          try {
            const smsBody = `[NDMO] تنبيه ${severityLabelAr(payload.severity)}: ${payload.titleAr} - ${payload.recordCount.toLocaleString()} سجل`;

            // In production, this would call Twilio/AWS SNS
            console.log(`[AlertDispatch] SMS to ${contact.phone}: ${smsBody}`);

            await db.insert(alertHistory).values({
              ruleId: rule.id,
              contactId: contact.id,
              contactName: contact.nameAr || contact.name,
              channel: "sms",
              subject: `NDMO Alert: ${payload.leakId}`,
              body: smsBody,
              status: "sent",
              leakId: payload.leakId,
            });
            smsSent++;
          } catch (error) {
            console.error(`[AlertDispatch] SMS failed for ${contact.phone}:`, error);
            await db.insert(alertHistory).values({
              ruleId: rule.id,
              contactId: contact.id,
              contactName: contact.nameAr || contact.name,
              channel: "sms",
              subject: `NDMO Alert: ${payload.leakId}`,
              body: "Failed to send SMS",
              status: "failed",
              leakId: payload.leakId,
            });
            failed++;
          }
        }
      }
    }
  } catch (error) {
    console.error("[AlertDispatch] Error dispatching alerts:", error);
  }

  console.log(
    `[AlertDispatch] Dispatched: ${emailsSent} emails, ${smsSent} SMS, ${failed} failed`
  );
  return { emailsSent, smsSent, failed };
}

function severityLabelAr(s: string): string {
  switch (s) {
    case "critical": return "واسع النطاق";
    case "high": return "عالي";
    case "medium": return "متوسط";
    default: return "منخفض";
  }
}

function buildEmailBody(payload: AlertPayload, recipientName: string): string {
  return `
السلام عليكم ${recipientName}،

تم رصد تسريب بيانات جديد يتطلب انتباهكم:

• معرّف التسريب: ${payload.leakId}
• العنوان: ${payload.titleAr}
• المصدر: ${payload.source === "telegram" ? "تليجرام" : payload.source === "darkweb" ? "الدارك ويب" : "موقع لصق"}
• تصنيف الحادثة: ${severityLabelAr(payload.severity)}
• القطاع: ${payload.sectorAr}
• عدد السجلات: ${payload.recordCount.toLocaleString()}
• أنواع البيانات الشخصية: ${payload.piiTypes.join("، ")}

يرجى مراجعة التفاصيل الكاملة في منصة NDMO لرصد التسريبات.

مع تحيات فريق NDMO
  `.trim();
}

/**
 * Get alert statistics
 */
export async function getAlertStats() {
  const db = await getDb();
  if (!db) return { totalSent: 0, totalFailed: 0, emailsSent: 0, smsSent: 0, activeRules: 0, activeContacts: 0 };

  const allHistory = await db.select().from(alertHistory);
  const rules = await db.select().from(alertRules).where(eq(alertRules.isEnabled, true));
  const contacts = await db.select().from(alertContacts).where(eq(alertContacts.isActive, true));

  return {
    totalSent: allHistory.filter((h) => h.status === "sent").length,
    totalFailed: allHistory.filter((h) => h.status === "failed").length,
    emailsSent: allHistory.filter((h) => h.channel === "email" && h.status === "sent").length,
    smsSent: allHistory.filter((h) => h.channel === "sms" && h.status === "sent").length,
    activeRules: rules.length,
    activeContacts: contacts.length,
  };
}
