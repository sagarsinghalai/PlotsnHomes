import { CreateUserForm } from "@/components/admin/create-user-form";
import { UsersDirectory } from "@/components/admin/users-directory";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isSuperAdmin } from "@/lib/roles";
import { canManageUser } from "@/lib/user-management";
import { userDirectoryScopeForUser } from "@/lib/crm-access";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { segment?: string; search?: string };
}) {
  const session = await getServerSession(authOptions);
  const superAdmin = session?.user?.role ? isSuperAdmin(session.user.role) : false;
  const tenantId = session?.user?.tenantId || "__no_tenant__";

  // Platform owner sees everyone; a tenant/parent admin sees only their own tenant.
  const actor = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true, tenantId: true, franchiseId: true, branchId: true, departmentId: true, teamId: true },
      })
    : null;

  // Platform owner sees everyone; otherwise scope to the viewer's org-unit
  // subtree (a franchise admin sees their franchise's people, an agent only
  // themselves), never the whole tenant above them.
  const userWhere = superAdmin
    ? {}
    : session?.user
      ? await userDirectoryScopeForUser(session.user.role, session.user.id, session.user.tenantId)
      : { tenantId: "__no_tenant__" };

  const users = await prisma.user.findMany({
    where: userWhere,
    orderBy: { createdAt: "desc" },
    include: {
      kycProfile: { select: { status: true } },
      manager: { select: { name: true } },
      departmentRel: { select: { name: true } },
      _count: { select: { properties: true, transactions: true } },
    },
  });

  return (
    <div>
      <AdminPageHeader
        title="Users & accounts"
        description="Manage customers, staff, and agents in one place. Click any row to edit profile, address, phone, and KYC details."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Users" }]}
        actions={
          <>
            <CreateUserForm />
            <Link
              href="/admin/kyc"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              KYC queue
            </Link>
          </>
        }
      />

      <UsersDirectory
        initialSearch={searchParams.search ?? ""}
        initialTab={searchParams.segment === "agents" ? "AGENT" : "all"}
        users={users.map((u) => ({
          id: u.id,
          userId: u.userId,
          name: u.name,
          email: u.email,
          phone: u.phone,
          dob: u.dob ? u.dob.toISOString().split("T")[0] : null,
          address: u.address,
          city: u.city,
          state: u.state,
          zip: u.zip,
          country: u.country,
          role: u.role,
          managerName: (u as any).manager?.name ?? null,
          department: (u as any).departmentRel?.name ?? null,
          active: u.active,
          lastActiveAt: u.lastActiveAt?.toISOString() ?? null,
          createdAt: u.createdAt.toISOString(),
          kycStatus: u.kycProfile?.status ?? null,
          canManage: actor ? canManageUser(actor, u) : false,
          _count: u._count,
        }))}
      />
    </div>
  );
}
