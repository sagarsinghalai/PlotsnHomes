import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { ADMIN_PANEL_ROLES } from "@/lib/roles";

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
  // Admin-panel access = the canonical ADMIN_PANEL_ROLES (same list the admin API
  // guard uses). This first gate just lets legitimate admin roles in — including
  // the WHITE_LABEL/FRANCHISE/BRANCH/DEPARTMENT/TEAM tiers that were previously
  // missing here and bounced to /dashboard. The per-route permission check in the
  // admin layout then does the fine-grained filtering.
  return requireAuth(ADMIN_PANEL_ROLES);
}

export async function requireSuperAdmin() {
  return requireAuth([Role.SUPERADMIN]);
}
