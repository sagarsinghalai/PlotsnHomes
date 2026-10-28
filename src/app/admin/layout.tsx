import { requireAdmin, getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { getRolePermissions, getPermissionGroup, hasPermission, getFirstAllowedAdminRoute } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminPermissionsProvider } from "@/components/admin/admin-permissions-context";
import { AdminCurrencyProvider } from "@/components/admin/admin-currency-context";
import { AdminMainContainer } from "@/components/admin/admin-main-container";

import "./admin-theme.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  
  const session = await getSession();
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "/admin";
  
  // Verify specific module permission
  const allowed = await hasPermission(session?.user, pathname);
  if (!allowed) {
    if (pathname === "/admin") {
      const fallback = await getFirstAllowedAdminRoute(session?.user);
      if (fallback) {
        redirect(fallback);
      }
    }
    redirect("/dashboard?error=Access+Denied");
  }

  const permissions = await getRolePermissions(session?.user?.tenantId);
  const group = session?.user ? getPermissionGroup(session.user) : "BUYER";
  const userRole = session?.user?.role || "";

  // Logged-in user's identity + current plan for the sidebar account card.
  let userImage: string | null = session?.user?.image ?? null;
  let planLabel = userRole ? roleLabel(userRole as any) : "";
  if (session?.user?.id) {
    const [dbUser, sub] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { image: true } }),
      prisma.userSubscription.findFirst({
        where: { userId: session.user.id, status: "ACTIVE" },
        orderBy: { currentPeriodStart: "desc" },
        select: { plan: { select: { name: true } } },
      }),
    ]);
    userImage = dbUser?.image ?? userImage;
    if (sub?.plan?.name) planLabel = sub.plan.name;
  }

  return (
    <AdminPermissionsProvider
      permissions={permissions}
      userGroup={group}
      userRole={userRole}
    >
      <AdminCurrencyProvider>
        <div className="admin-shell flex min-h-screen items-stretch w-full">
          <AdminSidebar
            permissions={permissions}
            userGroup={group}
            userRole={userRole}
            userName={session?.user?.name ?? ""}
            userEmail={session?.user?.email ?? ""}
            userImage={userImage}
            planLabel={planLabel}
          />
          <AdminMainContainer>{children}</AdminMainContainer>
        </div>
      </AdminCurrencyProvider>
    </AdminPermissionsProvider>
  );
}
