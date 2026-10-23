import { isTenantAccessAllowed } from "@/lib/tenant-lifecycle";
import { isExpired } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";

/**
 * Stage A — subscription → lifecycle bridge.
 *
 * A tenant (Organization) may access the app only when BOTH hold:
 *  - its lifecycle status permits access (B7: ACTIVE / PAST_DUE), and
 *  - its subscription has not lapsed (`subscriptionEndsAt` in the future, or null
 *    for lifetime / no expiry).
 *
 * So an expired subscription blocks access exactly like a suspension — reusing
 * the B7 enforcement already wired into login + the per-request session check.
 */
export type OrgAccessShape = {
  status?: string | null;
  subscriptionEndsAt?: Date | null;
} | null | undefined;

export function isOrgAccessAllowed(org: OrgAccessShape): boolean {
  if (!org) return true; // platform user with no tenant — allowed (B7 semantics)
  if (!isTenantAccessAllowed(org.status)) return false;
  if (isExpired(org.subscriptionEndsAt)) return false;
  return true;
}

/**
 * Flip tenants whose subscription has lapsed to PAST_DUE (data preserved).
 * Called by the expiry sweep / on-access checks. Returns the ids transitioned.
 * Only touches orgs currently ACTIVE with a past `subscriptionEndsAt`.
 */
export async function markLapsedOrgsPastDue(now: Date = new Date()): Promise<string[]> {
  const lapsed = await prisma.organization.findMany({
    where: { status: "ACTIVE", subscriptionEndsAt: { not: null, lte: now } },
    select: { id: true },
  });
  if (lapsed.length === 0) return [];
  const ids = lapsed.map((o) => o.id);
  await prisma.organization.updateMany({
    where: { id: { in: ids } },
    data: { status: "PAST_DUE" },
  });
  return ids;
}
