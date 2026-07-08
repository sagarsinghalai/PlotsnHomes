export const dynamic = "force-dynamic";

import { Banknote, Building2, MessageSquare, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { StatCard } from "@/components/admin/stat-card";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

  const [userCount, onlineUsers, propertyCount, txAgg, inquiryCount, marketAvg, recentInquiries, topMovers] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: { active: true, lastActiveAt: { gte: fifteenMinAgo } },
      }),
      prisma.property.count({ where: { status: "ACTIVE" } }),
      prisma.transaction.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.inquiry.count(),
      prisma.property.aggregate({
        where: { status: "ACTIVE" },
        _avg: { yieldRate: true, changeYtd: true },
      }),
      prisma.inquiry.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: { property: { select: { title: true, symbol: true } } },
      }),
      prisma.property.findMany({
        where: { status: "ACTIVE" },
        orderBy: { changeYtd: "desc" },
        take: 5,
        select: { id: true, symbol: true, title: true, changeYtd: true, price: true },
      }),
    ]);

  const revenue = txAgg._sum.amount ?? 0;

  const quickLinks = [
    { href: "/admin/users", label: "Manage users", desc: "Customers & staff profiles" },
    { href: "/admin/properties", label: "Properties", desc: "Listings & edit" },
    { href: "/admin/crm", label: "Sales pipeline", desc: "Leads & kanban" },
    { href: "/admin/reports", label: "Reports", desc: "Analytics & charts" },
    { href: "/admin/platform", label: "Platform settings", desc: "Import, export, company" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description={`${propertyCount} active listings · ${userCount} registered users · Click any metric to drill down`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Total users"
          value={String(userCount)}
          sub={`${onlineUsers} online`}
          icon={Users}
          href="/admin/users"
        />
        <StatCard
          label="Active listings"
          value={String(propertyCount)}
          icon={Building2}
          href="/admin/properties"
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(revenue)}
          sub="Completed payments"
          icon={Banknote}
          href="/admin/transactions"
        />
        <StatCard
          label="Inquiries"
          value={String(inquiryCount)}
          icon={MessageSquare}
          href="/admin/inquiries"
        />
        <StatCard
          label="Avg market yield"
          value={`${(marketAvg._avg.yieldRate ?? 0).toFixed(2)}%`}
          sub={`YTD ${(marketAvg._avg.changeYtd ?? 0).toFixed(2)}%`}
          icon={TrendingUp}
          href="/markets"
        />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 rounded-2xl border bg-white p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Quick actions</h2>
          <ul className="space-y-3">
            {quickLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block rounded-xl border border-slate-100 p-4 hover:border-gold hover:bg-amber-50/50 transition">
                  <p className="font-medium text-slate-900">{l.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{l.desc}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/properties/new"
            className="mt-4 flex w-full items-center justify-center rounded-xl bg-gold py-2.5 text-sm font-semibold text-slate-900 hover:bg-gold-dark"
          >
            + Add property
          </Link>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h2 className="font-semibold text-slate-900">Top YTD movers</h2>
              <Link href="/admin/properties" className="text-sm text-gold-dark hover:underline">
                All properties →
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-3">Symbol</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">YTD</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {topMovers.map((p) => (
                  <tr key={p.symbol} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-mono font-bold text-gold-dark">{p.symbol}</td>
                    <td className="px-6 py-4">{formatCurrency(p.price)}</td>
                    <td className="px-6 py-4 text-emerald-600 font-mono">+{p.changeYtd.toFixed(2)}%</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/properties/${p.id}/edit`} className="text-xs text-gold-dark hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h2 className="font-semibold text-slate-900">Recent inquiries</h2>
              <Link href="/admin/inquiries" className="text-sm text-gold-dark hover:underline">
                View all →
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {recentInquiries.map((q) => (
                  <tr key={q.id} className="border-t border-slate-100">
                    <td className="px-6 py-4 font-mono text-xs">{q.property.symbol}</td>
                    <td className="px-6 py-4">
                      <Link href={`/admin/users?search=${encodeURIComponent(q.email)}`} className="hover:underline">
                        {q.name}
                      </Link>
                      <br />
                      <span className="text-slate-400 text-xs">{q.email}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href="/admin/inquiries" className="text-xs text-gold-dark">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
