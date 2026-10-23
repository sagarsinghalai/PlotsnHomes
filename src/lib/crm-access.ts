import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { hasCrmAccess, isSuperAdmin, roleDataScope } from "@/lib/roles";

export async function requireCrmApi() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasCrmAccess(session.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return {
    session,
    isAdmin: isSuperAdmin(session.user.role),
    userId: session.user.id,
    tenantId: session.user.tenantId ?? null,
  };
}

/**
 * Prisma `where` for leads: TENANT-FIRST. The tenant filter is ALWAYS applied
 * (fail-closed to an impossible match when there is no tenant), and the role's
 * data scope only narrows *within* that tenant. A manager can see the whole
 * tenant's leads — never another tenant's.
 */
export function leadScopeForUser(
  role: Role,
  userId: string,
  tenantId: string | null | undefined
): { tenantId: string; ownerId?: string } {
  const base = { tenantId: tenantId || "__no_tenant__" };
  if (isSuperAdmin(role)) return base;

  const dataScope = roleDataScope(role);

  switch (dataScope) {
    case "GLB":
    case "ORG":
    case "WL":
    case "FR":
    case "BR":
    case "DEPT":
    case "TEAM":
      // Leaders can access tenant-wide records (within their tenant only).
      return base;
    case "OWN":
    case "SANDBOX":
    default:
      return { ...base, ownerId: userId };
  }
}
