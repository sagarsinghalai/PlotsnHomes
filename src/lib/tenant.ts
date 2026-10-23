import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getSetting, setSetting } from "@/lib/system-settings";
import type { Session } from "next-auth";

/**
 * Tenant resolution (Phase B foundation). The tenant is the user's Organization,
 * read from the authenticated session — NEVER from a client-supplied value.
 *
 * In Phase B1 this exposes the current tenant; isolation enforcement (always
 * filtering queries by tenantId) is layered on in later sub-phases once the
 * tenantId columns exist and the central data-access layer is in place.
 */

/** Current tenant id from a resolved session object (sync helper). */
export function tenantIdFromSession(session: Session | null | undefined): string | null {
  return session?.user?.tenantId ?? null;
}

/** Current tenant id from the request's session, or null if none/not assigned. */
export async function getCurrentTenantId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return tenantIdFromSession(session);
}

/**
 * The platform's PRIMARY tenant — the home org for data that arrives with no
 * session (public website leads, inquiries, checkout, telephony webhooks) and
 * cannot be attributed to a white-label tenant by a parent row.
 *
 * Resolved once and cached: a stored `primary_tenant_id` setting wins; otherwise
 * the most-populated Organization is chosen and persisted so it stays stable.
 */
let primaryTenantCache: string | null = null;
export async function getPrimaryTenantId(): Promise<string> {
  if (primaryTenantCache) return primaryTenantCache;

  const stored = await getSetting("primary_tenant_id");
  if (stored) {
    primaryTenantCache = stored;
    return stored;
  }

  const orgs = await prisma.organization.findMany({
    select: { id: true, _count: { select: { users: true } }, createdAt: true },
  });
  if (orgs.length === 0) {
    throw new Error("Cannot resolve a primary tenant: no Organization exists.");
  }
  orgs.sort((a, b) =>
    b._count.users - a._count.users || a.createdAt.getTime() - b.createdAt.getTime()
  );
  const chosen = orgs[0].id;
  await setSetting("primary_tenant_id", chosen);
  primaryTenantCache = chosen;
  return chosen;
}

/**
 * Resolve the tenant for a row that has no session, preferring a parent row's
 * tenant (the enquired property, then the assigned/owning user), and falling
 * back to the primary tenant so attribution never comes back null.
 */
export async function resolveTenantForOwnerOrProperty(
  ownerId?: string | null,
  propertyId?: string | null
): Promise<string> {
  if (propertyId) {
    const p = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { tenantId: true },
    });
    if (p?.tenantId) return p.tenantId;
  }
  if (ownerId) {
    const u = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { tenantId: true },
    });
    if (u?.tenantId) return u.tenantId;
  }
  return getPrimaryTenantId();
}
