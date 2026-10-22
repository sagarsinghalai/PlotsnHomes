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

/** Prisma filter for leads based on Enterprise Role Data Scopes */
export function leadScopeForUser(role: Role, userId: string) {
  if (isSuperAdmin(role)) return {};

  const dataScope = roleDataScope(role);

  switch (dataScope) {
    case "GLB":
    case "ORG":
    case "WL":
    case "FR":
    case "BR":
    case "DEPT":
    case "TEAM":
      // Leaders can access org/department/team wide records
      return {};
    case "OWN":
    case "SANDBOX":
    default:
      return { ownerId: userId };
  }
}
