import { prisma } from "@/lib/prisma";

/**
 * Append a sensitive-action record to the audit trail. Never stores secrets or
 * plaintext passwords. Failures are swallowed (auditing must never break the
 * action it records, but we log a warning server-side).
 */
export async function writeAudit(e: {
  actorId: string;
  actorEmail?: string | null;
  action: string;
  targetUserId?: string | null;
  targetEmail?: string | null;
  detail?: string | null;
}): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        actorId: e.actorId,
        actorEmail: e.actorEmail ?? null,
        action: e.action,
        targetUserId: e.targetUserId ?? null,
        targetEmail: e.targetEmail ?? null,
        detail: e.detail ?? null,
      },
    });
  } catch (err) {
    console.warn("[audit] failed to write audit event:", (err as Error)?.message);
  }
}
