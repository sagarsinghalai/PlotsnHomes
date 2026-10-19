import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BillingSubNav } from "@/components/admin/billing/billing-sub-nav";
import { prisma } from "@/lib/prisma";
import { INTERVAL_LABELS, STATUS_LABELS } from "@/lib/subscription";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export default async function BillingOverviewPage() {
  const [plans, subscriptions, activeSubs, byInterval, byStatus] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { subscriptions: true } } },
    }),
    prisma.userSubscription.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { name: true, interval: true } },
      },
    }),
    prisma.userSubscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
      include: { plan: { select: { interval: true } } },
    }),
    prisma.userSubscription.groupBy({
      by: ["planId"],
      _count: true,
      where: { status: { in: ["ACTIVE", "TRIALING"] } },
    }),
    prisma.userSubscription.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const planMap = new Map(plans.map((p) => [p.id, p]));
  const intervalCounts: Record<string, number> = {};
  for (const row of byInterval) {
    const plan = planMap.get(row.planId);
    if (!plan) continue;
    const key = plan.interval;
    intervalCounts[key] = (intervalCounts[key] ?? 0) + row._count;
  }

  const activeCount = byStatus
    .filter((s) => s.status === "ACTIVE" || s.status === "TRIALING")
    .reduce((n, s) => n + s._count, 0);

  const mrr = activeSubs.reduce((sum, s) => {
    const interval = s.plan.interval;
    if (interval === "MONTHLY") return sum + s.amount;
    if (interval === "QUARTERLY") return sum + s.amount / 3;
    if (interval === "YEARLY") return sum + s.amount / 12;
    return sum;
  }, 0);

  return (
    <div>
      <AdminPageHeader
        title="Billing & subscriptions"
        description="Manage subscription plans, billing cycles (monthly, quarterly, annual), and view who is subscribed"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Finance" },
          { label: "Billing" },
        ]}
      />
      <BillingSubNav active="overview" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Active subscribers</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{activeCount}</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Live plans</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{plans.length}</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Est. MRR</p>
          <p className="mt-1 text-3xl font-bold text-emerald-700">{formatCurrency(mrr)}</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Past due</p>
          <p className="mt-1 text-3xl font-bold text-red-600">
            {byStatus.find((s) => s.status === "PAST_DUE")?._count ?? 0}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Subscribers by billing cycle</h2>
            <Link
              href="/admin/billing/subscriptions"
              className="text-xs text-brand-hover hover:underline inline-flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="space-y-3">
            {(["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"] as const).map((interval) => (
              <li key={interval} className="flex justify-between items-center text-sm">
                <span className="text-slate-600">{INTERVAL_LABELS[interval]}</span>
                <span className="font-semibold rounded-lg bg-slate-100 px-3 py-1">
                  {intervalCounts[interval] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Plans catalog</h2>
            <Link
              href="/admin/billing/plans"
              className="text-xs text-brand-hover hover:underline inline-flex items-center gap-1"
            >
              Manage plans <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="space-y-3">
            {plans.map((p) => (
              <li key={p.id} className="flex justify-between items-start text-sm border-b border-slate-50 pb-3 last:border-0">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    {INTERVAL_LABELS[p.interval]} · {formatCurrency(p.price)}
                  </p>
                </div>
                <span className="text-xs text-slate-500">{p._count.subscriptions} subs</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Recent subscriptions</h2>
          <Link href="/admin/billing/subscriptions" className="text-sm text-brand-hover hover:underline">
            All subscribers
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">User</th>
                <th className="px-6 py-3 text-left">Plan</th>
                <th className="px-6 py-3 text-left">Cycle</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-6 py-3">
                    <Link href={`/admin/users/${s.user.id}`} className="font-medium hover:text-brand-hover">
                      {s.user.name}
                    </Link>
                    <p className="text-xs text-slate-500">{s.user.email}</p>
                  </td>
                  <td className="px-6 py-3">{s.plan.name}</td>
                  <td className="px-6 py-3">{INTERVAL_LABELS[s.plan.interval]}</td>
                  <td className="px-6 py-3">{STATUS_LABELS[s.status]}</td>
                  <td className="px-6 py-3 text-right font-medium">{formatCurrency(s.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {subscriptions.length === 0 && (
            <p className="p-8 text-center text-slate-500">No subscriptions yet. Assign one from Subscribers.</p>
          )}
        </div>
      </div>
    </div>
  );
}
