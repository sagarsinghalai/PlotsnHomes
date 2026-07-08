import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { hasCrmAccess, isSuperAdmin } from "@/lib/roles";

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
    isAdmin: isSuperAdmin(session.user.role) || session.user.role === Role.EMPLOYEE,
    userId: session.user.id,
  };
}

/** Prisma filter: agents see only their leads; superadmin/employee see all. */
export function leadScopeForUser(role: Role, userId: string) {
  if (role === Role.SUPERADMIN || role === Role.EMPLOYEE) return {};
  return { ownerId: userId };
}
