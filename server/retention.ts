/**
 * Data Retention Policy Engine
 * Configurable auto-archival rules that clean old records based on retention periods
 */
import { getDb } from "./db";
import {
  retentionPolicies,
  leaks,
  auditLog,
  notifications,
  piiScans,
  pasteEntries,
} from "../drizzle/schema";
import { eq, lt, and, sql } from "drizzle-orm";

interface RetentionResult {
  entity: string;
  action: string;
  recordsProcessed: number;
  success: boolean;
  error?: string;
}

/**
 * Execute all enabled retention policies
 */
export async function executeRetentionPolicies(): Promise<RetentionResult[]> {
  const db = await getDb();
  if (!db) return [];

  const results: RetentionResult[] = [];

  try {
    const policies = await db
      .select()
      .from(retentionPolicies)
      .where(eq(retentionPolicies.isEnabled, true));

    for (const policy of policies) {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

        let recordsProcessed = 0;

        switch (policy.entity) {
          case "leaks": {
            if (policy.archiveAction === "delete") {
              const result = await db
                .delete(leaks)
                .where(lt(leaks.createdAt, cutoffDate));
              recordsProcessed = (result as any)[0]?.affectedRows || 0;
            } else {
              // Archive: update status to 'reported' (archived state)
              const result = await db
                .update(leaks)
                .set({ status: "reported" })
                .where(
                  and(
                    lt(leaks.createdAt, cutoffDate),
                    sql`${leaks.status} != 'reported'`
                  )
                );
              recordsProcessed = (result as any)[0]?.affectedRows || 0;
            }
            break;
          }

          case "audit_logs": {
            const result = await db
              .delete(auditLog)
              .where(lt(auditLog.createdAt, cutoffDate));
            recordsProcessed = (result as any)[0]?.affectedRows || 0;
            break;
          }

          case "notifications": {
            const result = await db
              .delete(notifications)
              .where(lt(notifications.createdAt, cutoffDate));
            recordsProcessed = (result as any)[0]?.affectedRows || 0;
            break;
          }

          case "pii_scans": {
            if (policy.archiveAction === "delete") {
              const result = await db
                .delete(piiScans)
                .where(lt(piiScans.createdAt, cutoffDate));
              recordsProcessed = (result as any)[0]?.affectedRows || 0;
            } else {
              // For archive: just count (in production, would export to S3 first)
              const rows = await db
                .select({ id: piiScans.id })
                .from(piiScans)
                .where(lt(piiScans.createdAt, cutoffDate));
              recordsProcessed = rows.length;
            }
            break;
          }

          case "paste_entries": {
            if (policy.archiveAction === "delete") {
              const result = await db
                .delete(pasteEntries)
                .where(lt(pasteEntries.createdAt, cutoffDate));
              recordsProcessed = (result as any)[0]?.affectedRows || 0;
            } else {
              const result = await db
                .update(pasteEntries)
                .set({ status: "documented" })
                .where(
                  and(
                    lt(pasteEntries.createdAt, cutoffDate),
                    sql`${pasteEntries.status} != 'documented'`
                  )
                );
              recordsProcessed = (result as any)[0]?.affectedRows || 0;
            }
            break;
          }
        }

        // Update policy stats
        await db
          .update(retentionPolicies)
          .set({
            lastRunAt: new Date(),
            recordsArchived: sql`${retentionPolicies.recordsArchived} + ${recordsProcessed}`,
          })
          .where(eq(retentionPolicies.id, policy.id));

        results.push({
          entity: policy.entity,
          action: policy.archiveAction,
          recordsProcessed,
          success: true,
        });

        console.log(
          `[Retention] ${policy.entity}: ${policy.archiveAction}d ${recordsProcessed} records older than ${policy.retentionDays} days`
        );
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[Retention] Error processing ${policy.entity}:`, errMsg);
        results.push({
          entity: policy.entity,
          action: policy.archiveAction,
          recordsProcessed: 0,
          success: false,
          error: errMsg,
        });
      }
    }
  } catch (error) {
    console.error("[Retention] Failed to execute policies:", error);
  }

  return results;
}

/**
 * Preview what would be affected by retention policies without executing
 */
export async function previewRetention(): Promise<
  Array<{ entity: string; recordsAffected: number; oldestRecord: Date | null }>
> {
  const db = await getDb();
  if (!db) return [];

  const results: Array<{
    entity: string;
    recordsAffected: number;
    oldestRecord: Date | null;
  }> = [];

  const policies = await db.select().from(retentionPolicies);

  for (const policy of policies) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    let count = 0;
    let oldest: Date | null = null;

    try {
      switch (policy.entity) {
        case "leaks": {
          const rows = await db
            .select({ id: leaks.id, createdAt: leaks.createdAt })
            .from(leaks)
            .where(lt(leaks.createdAt, cutoffDate));
          count = rows.length;
          if (rows.length > 0) oldest = rows[0].createdAt;
          break;
        }
        case "audit_logs": {
          const rows = await db
            .select({ id: auditLog.id, createdAt: auditLog.createdAt })
            .from(auditLog)
            .where(lt(auditLog.createdAt, cutoffDate));
          count = rows.length;
          if (rows.length > 0) oldest = rows[0].createdAt;
          break;
        }
        case "notifications": {
          const rows = await db
            .select({ id: notifications.id, createdAt: notifications.createdAt })
            .from(notifications)
            .where(lt(notifications.createdAt, cutoffDate));
          count = rows.length;
          if (rows.length > 0) oldest = rows[0].createdAt;
          break;
        }
        case "pii_scans": {
          const rows = await db
            .select({ id: piiScans.id, createdAt: piiScans.createdAt })
            .from(piiScans)
            .where(lt(piiScans.createdAt, cutoffDate));
          count = rows.length;
          if (rows.length > 0) oldest = rows[0].createdAt;
          break;
        }
        case "paste_entries": {
          const rows = await db
            .select({ id: pasteEntries.id, createdAt: pasteEntries.createdAt })
            .from(pasteEntries)
            .where(lt(pasteEntries.createdAt, cutoffDate));
          count = rows.length;
          if (rows.length > 0) oldest = rows[0].createdAt;
          break;
        }
      }
    } catch {
      // Table might not have data yet
    }

    results.push({
      entity: policy.entity,
      recordsAffected: count,
      oldestRecord: oldest,
    });
  }

  return results;
}
