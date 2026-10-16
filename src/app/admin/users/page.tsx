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
      manager: { select: { name: true } },
      _count: { select: { properties: true, transactions: true } },
    },
  });

  const onlineCount = users.filter((u) => u.active && isUserOnline(u.lastActiveAt)).length;
  const customers = users.filter((u) => isCustomerRole(u.role)).length;
  const staff = users.filter((u) => u.role === "EMPLOYEE" || u.role === "SUPERADMIN").length;
  const agents = users.filter((u) => u.role === "AGENT").length;

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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <Link
          href="/admin/users"
          className="group p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate">
              TOTAL USERS
            </span>
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-700 dark:group-hover:bg-blue-900/60 dark:group-hover:text-blue-300 transition-colors">
              {users.length} Active
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{users.length}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            All registered platform accounts
          </p>
        </Link>

        <Link
          href="/admin/users?segment=customers"
          className="group p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-400 dark:hover:border-sky-700 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors truncate">
              CUSTOMERS
            </span>
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-sky-100 group-hover:text-sky-700 dark:group-hover:bg-sky-900/60 dark:group-hover:text-sky-300 transition-colors">
              {customers} Accounts
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{customers}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            End-user portal & buyer accounts
          </p>
        </Link>

        <Link
          href="/admin/users?segment=staff"
          className="group p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-700 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors truncate">
              STAFF & EMPLOYEES
            </span>
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-purple-100 group-hover:text-purple-700 dark:group-hover:bg-purple-900/60 dark:group-hover:text-purple-300 transition-colors">
              {staff} Staff
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{staff}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            Internal team members & admins
          </p>
        </Link>

        <Link
          href="/admin/users?segment=agents"
          className="group p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 dark:hover:border-amber-700 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors truncate">
              REAL ESTATE AGENTS
            </span>
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-amber-100 group-hover:text-amber-800 dark:group-hover:bg-amber-900/60 dark:group-hover:text-amber-300 transition-colors">
              {agents} Agents
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white my-1">{agents}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            Verified brokers & sales team
          </p>
        </Link>

        <div className="group p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-400 dark:hover:border-emerald-700 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 shadow-2xs hover:shadow-md transition-all duration-200 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">
              ONLINE NOW
            </span>
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors">
              {onlineCount} Active
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 my-1">{onlineCount}</div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-normal line-clamp-1 mt-0.5">
            Active sessions in last 15 min
          </p>
        </div>
      </div>

      <UsersDirectory
        initialSearch={searchParams.search ?? ""}
        initialTab={
          searchParams.segment === "staff"
            ? "staff"
            : searchParams.segment === "agents"
              ? "agents"
              : searchParams.segment === "customers"
                ? "customers"
                : "all"
        }
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
