import { CreateUserForm } from "@/components/admin/create-user-form";
import { UsersDirectory } from "@/components/admin/users-directory";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { segment?: string; search?: string };
}) {
  const users = await prisma.user.findMany({
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
          _count: u._count,
        }))}
      />
    </div>
  );
}
