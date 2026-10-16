import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ReportsCatalog } from "@/components/admin/reports/reports-catalog";
import { OverviewPerformanceChart } from "@/components/admin/reports/overview-performance-chart";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function ReportsHubPage() {
  const [leads, revenue, users, inquiries] = await Promise.all([
    prisma.lead.count(),
    prisma.transaction.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.user.count(),
    prisma.inquiry.count(),
  ]);

  const kpis = [
    { label: "Total leads", value: leads, color: "text-indigo-950 dark:text-indigo-100", labelColor: "text-indigo-800 dark:text-indigo-300", bg: "bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-200/80 dark:border-indigo-800/60" },
    { label: "Completed revenue", value: formatCurrency(revenue._sum.amount ?? 0), color: "text-amber-950 dark:text-amber-100", labelColor: "text-amber-900 dark:text-amber-300", bg: "bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60" },
    { label: "Users", value: users, color: "text-emerald-950 dark:text-emerald-100", labelColor: "text-emerald-800 dark:text-emerald-300", bg: "bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60" },
    { label: "Inquiries", value: inquiries, color: "text-rose-950 dark:text-rose-100", labelColor: "text-rose-900 dark:text-rose-300", bg: "bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Reports & analytics"
        description="Each report opens on its own page with charts and tables — HubSpot / Sell.Do style"
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Reports" }]}
      />

      {/* KPI summary row */}
      <div className="grid gap-4 sm:grid-cols-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-2xl border p-5 shadow-xs hover:shadow-md transition ${k.bg}`}>
            <p className={`text-xs font-bold uppercase tracking-wider ${k.labelColor}`}>{k.label}</p>
            <p className={`text-2xl font-black mt-2 tabular-nums ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Interactive overview performance chart */}
      <div className="mb-10">
        <OverviewPerformanceChart />
      </div>

      <ReportsCatalog />
    </div>
  );
}
