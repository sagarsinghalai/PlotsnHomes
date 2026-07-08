import { Heart, Home, Receipt } from "lucide-react";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { hasAdminPanelAccess, hasCrmAccess, roleLabel } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  let whereClause: any = {};
  if (session.user.role === "SUPERADMIN" || session.user.role === "EMPLOYEE") {
    whereClause = {};
  } else if (session.user.role === "SELLER") {
    whereClause = {
      OR: [
        { userId },
        { property: { submittedById: userId } }
      ]
    };
  } else if (session.user.role === "AGENT") {
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
    session.user.role === "AGENT"
      ? prisma.property.count({ where: { agentId: userId } })
      : Promise.resolve(0),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-slate-900">
        Hello, {session.user.name}
      </h1>
      <p className="mt-1 text-slate-600">{roleLabel(session.user.role)} dashboard</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <Receipt className="h-8 w-8 text-gold-dark" />
          <p className="mt-4 text-2xl font-bold">{transactions.length}</p>
          <p className="text-sm text-slate-500">Recent transactions</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <Heart className="h-8 w-8 text-gold-dark" />
          <p className="mt-4 text-2xl font-bold">{favorites}</p>
          <p className="text-sm text-slate-500">Saved properties</p>
        </div>
        {session.user.role === "AGENT" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <Home className="h-8 w-8 text-gold-dark" />
            <p className="mt-4 text-2xl font-bold">{myProperties}</p>
            <p className="text-sm text-slate-500">Your listings</p>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ...(hasCrmAccess(session.user.role)
            ? [{ href: "/dashboard/crm", label: "Sales CRM pipeline" }]
            : []),
          { href: "/dashboard/profile", label: "Edit profile" },
          { href: "/dashboard/messages", label: "Messages & Support" },
          { href: "/dashboard/list-property", label: "List property" },
          { href: "/dashboard/kyc", label: "KYC verification" },
          { href: "/dashboard/loans", label: "Apply for loan" },
          { href: "/properties", label: "Browse listings" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium hover:border-gold hover:bg-amber-50"
          >
            {link.label} →
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">Recent transactions</h2>
          <Link href="/dashboard/transactions" className="text-sm text-gold-dark hover:underline">
            View all
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-6 py-3">Property</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-slate-100">
                <td className="px-6 py-4">{tx.property?.title ?? "—"}</td>
                <td className="px-6 py-4">{tx.type}</td>
                <td className="px-6 py-4 font-medium">{formatCurrency(tx.amount)}</td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
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
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No transactions yet. Browse{" "}
                  <Link href="/properties" className="text-gold-dark underline">properties</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasAdminPanelAccess(session.user.role) && (
        <Link
          href="/admin"
          className="mt-8 inline-block rounded-xl bg-slate-900 px-6 py-3 text-white font-medium hover:bg-slate-800"
        >
          Open admin panel →
        </Link>
      )}
    </div>
  );
}
