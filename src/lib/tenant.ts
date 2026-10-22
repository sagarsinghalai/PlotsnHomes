import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
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
