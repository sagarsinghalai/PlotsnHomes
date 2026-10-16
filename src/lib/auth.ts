import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth(allowedRoles?: Role[]) {
  const session = await getSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }
  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }
  return session;
}

export async function requireAdmin() {
  return requireAuth([Role.SUPERADMIN, Role.EMPLOYEE, Role.AGENT, Role.SELLER, Role.BUYER]);
}

export async function requireSuperAdmin() {
  return requireAuth([Role.SUPERADMIN]);
}
