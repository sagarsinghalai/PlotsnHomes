import { CreateUserForm } from "@/components/admin/create-user-form";
import { UsersDirectory } from "@/components/admin/users-directory";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { hasCrmAccess, isCustomerRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { isUserOnline } from "@/lib/user-activity";
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
      _count: { select: { properties: true, transactions: true } },
    },
  });

  const onlineCount = users.filter((u) => u.active && isUserOnline(u.lastActiveAt)).length;
  const customers = users.filter((u) => isCustomerRole(u.role)).length;
  const staff = users.filter((u) => hasCrmAccess(u.role)).length;

  return (
    <div>
      <AdminPageHeader
        title="Users & accounts"
        description="Manage customers and staff in one place. Click any row to edit profile, address, phone, and KYC details."
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

      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        <Link href="/admin/users" className="rounded-xl border bg-white p-4 hover:border-gold/50 transition">
          <p className="text-xs text-slate-500">Total</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </Link>
        <Link href="/admin/users?segment=customers" className="rounded-xl border bg-white p-4 hover:border-gold/50 transition">
          <p className="text-xs text-slate-500">Customers</p>
          <p className="text-2xl font-bold">{customers}</p>
        </Link>
        <Link href="/admin/users?segment=staff" className="rounded-xl border bg-white p-4 hover:border-gold/50 transition">
          <p className="text-xs text-slate-500">Staff</p>
          <p className="text-2xl font-bold">{staff}</p>
        </Link>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Online now</p>
          <p className="text-2xl font-bold text-emerald-600">{onlineCount}</p>
        </div>
      </div>

      <UsersDirectory
        initialSearch={searchParams.search ?? ""}
        initialTab={
          searchParams.segment === "staff"
            ? "staff"
            : searchParams.segment === "customers"
              ? "customers"
              : "all"
        }
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          city: u.city,
          role: u.role,
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
