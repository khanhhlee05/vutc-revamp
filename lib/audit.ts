import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

type AuditInput = {
  action: string;
  userId?: string | null;
  entityType?: string;
  entityId?: string | number;
  detail?: string;
};

/**
 * Single write path for the audit trail (replaces the legacy logAdmin()).
 * Never throws; a failed audit write must not break the user's action.
 */
export async function audit(input: AuditInput): Promise<void> {
  try {
    let ip: string | null = null;
    try {
      const h = await headers();
      ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    } catch {
      // Not in a request context (cron, scripts).
    }
    await db.insert(auditLog).values({
      action: input.action,
      userId: input.userId ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId == null ? null : String(input.entityId),
      detail: input.detail ?? null,
      ipAddress: ip,
    });
  } catch (err) {
    console.error("audit write failed", err);
  }
}
