import { Heart, Home, Receipt, User, MessageSquare, PlusCircle, ShieldCheck, Landmark, Search, LayoutDashboard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { hasAdminPanelAccess, hasCrmAccess, roleLabel } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getRolePermissions, getPermissionGroup, PERMISSIONS_SCHEMA } from "@/lib/permissions";

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = session.user.id;
  const permissions = await getRolePermissions();
  const group = getPermissionGroup(session.user);
  const userRole = session.user.role;

  const hasItemPermission = (key: string) => {
    if (userRole === "SUPERADMIN") return true;
    return permissions[group]?.[key]?.view ?? false;
  };

  const hasAnyAdminPermission = () => {
    if (userRole === "SUPERADMIN") return true;
    for (const head of PERMISSIONS_SCHEMA) {
      for (const subhead of head.subheads) {
        if (subhead.key !== "live_markets" && permissions[group]?.[subhead.key]?.view === true) {
          return true;
        }
      }
    }
    return false;
  };

  const getFirstAllowedAdminRoute = () => {
    if (userRole === "SUPERADMIN") return "/admin";
    if (permissions[group]?.["overview_dashboard"]?.view !== false) {
      return "/admin";
    }
    for (const head of PERMISSIONS_SCHEMA) {
      for (const subhead of head.subheads) {
        if (
          subhead.route !== "/admin" &&
          subhead.key !== "live_markets" &&
          permissions[group]?.[subhead.key]?.view === true
        ) {
          return subhead.route;
        }
      }
    }
    return "/admin";
  };

  const getPanelLabel = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return "Open Admin Panel";
      case "EMPLOYEE":
        return "Open Employee Panel";
      case "AGENT":
        return "Open Agent Panel";
      case "SELLER":
        return "Open Seller Panel";
      case "BUYER":
        return "Open Customer Panel";
      default:
        return "Open Management Panel";
    }
  };

  let whereClause: any = {};
  if (userRole === "SUPERADMIN" || userRole === "EMPLOYEE") {
    whereClause = {};
  } else if (userRole === "SELLER") {
    whereClause = {
      OR: [
        { userId },
        { property: { submittedById: userId } }
      ]
    };
  } else if (userRole === "AGENT") {
    whereClause = {
      OR: [
        { userId },
        { property: { agentId: userId } }
      ]
    };
  } else {
    whereClause = { userId };
  }

  const [transactions, favorites, myProperties] = await Promise.all([
    prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { property: { select: { title: true } } },
    }),
    prisma.favorite.count({ where: { userId } }),
    userRole === "AGENT"
      ? prisma.property.count({ where: { agentId: userId } })
      : Promise.resolve(0),
  ]);

  const allLinks = [
    ...(hasItemPermission("send_message") || userRole === "BUYER" || userRole === "SELLER"
      ? [{ href: "/dashboard/messages", label: "Messages & Support", icon: MessageSquare }]
      : []),
    ...(hasItemPermission("properties") || userRole === "SELLER" || userRole === "AGENT"
      ? [{ href: "/dashboard/list-property", label: "List New Property", icon: PlusCircle }]
      : []),
    ...(hasItemPermission("kyc_verification") || userRole === "BUYER" || userRole === "SELLER"
      ? [{ href: "/dashboard/kyc", label: "KYC Verification", icon: ShieldCheck }]
      : []),
    ...(hasItemPermission("loans") || userRole === "BUYER"
      ? [{ href: "/dashboard/loans", label: "Apply for Loan", icon: Landmark }]
      : []),
    ...(hasItemPermission("live_markets") || userRole === "BUYER" || userRole === "SELLER"
      ? [{ href: "/properties", label: "Browse Listings", icon: Search }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Top Welcome Header & Panel Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-slate-900">
            Hello, {session.user.name}
          </h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {roleLabel(userRole)} Dashboard & Customer Control Hub
          </p>
        </div>

        {hasAnyAdminPermission() && (
          <Link
            href={getFirstAllowedAdminRoute()}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-5 py-3 shadow-md transition shrink-0"
          >
            <span>{getPanelLabel(userRole)}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <Receipt className="h-8 w-8 text-gold-dark" />
          <p className="mt-4 text-2xl font-black text-slate-900">{transactions.length}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Recent Transactions</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <Heart className="h-8 w-8 text-gold-dark" />
          <p className="mt-4 text-2xl font-black text-slate-900">{favorites}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Saved Properties</p>
        </div>
        {userRole === "AGENT" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
            <Home className="h-8 w-8 text-gold-dark" />
            <p className="mt-4 text-2xl font-black text-slate-900">{myProperties}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Your Listings</p>
          </div>
        )}
      </div>

      {/* Customer Quick Panel Features Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Customer Quick Panel & Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {allLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-xs font-extrabold text-slate-900 shadow-2xs hover:border-gold hover:bg-amber-50/60 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gold/15 flex items-center justify-center text-gold-dark shrink-0 group-hover:scale-105 transition">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span>{link.label}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-gold-dark transition" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50/50">
          <h2 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Recent Transactions</h2>
          <Link href="/dashboard/transactions" className="text-xs font-bold text-gold-dark hover:underline">
            View all
          </Link>
        </div>
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-100">
            <tr>
              <th className="px-6 py-3">Property</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-bold text-slate-900">{tx.property?.title ?? "—"}</td>
                <td className="px-6 py-4 font-semibold text-slate-600">{tx.type}</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900">{formatCurrency(tx.amount)}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                      tx.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-medium">
                  No transactions yet. Browse{" "}
                  <Link href="/properties" className="text-gold-dark font-bold underline">properties</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
