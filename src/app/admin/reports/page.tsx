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
    { label: "Total leads", value: leads, color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
    { label: "Completed revenue", value: formatCurrency(revenue._sum.amount ?? 0), color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    { label: "Users", value: users, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    { label: "Inquiries", value: inquiries, color: "text-pink-700", bg: "bg-pink-50 border-pink-200" },
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
          <div key={k.label} className={`rounded-2xl border p-5 ${k.bg}`}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{k.label}</p>
            <p className={`text-2xl font-bold mt-2 ${k.color}`}>{k.value}</p>
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
