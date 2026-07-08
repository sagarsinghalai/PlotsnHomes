import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  AreaLineChart,
  DataTable,
  DonutChart,
  ReportKpiGrid,
  VerticalBarChart,
} from "@/components/admin/reports/charts";
import { CHART_COLORS, groupSumByMonth } from "@/lib/admin-reports";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function RevenueReportPage() {
  const [completed, pending, byType, monthly] = await Promise.all([
    prisma.transaction.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true, type: true, createdAt: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { status: "COMPLETED" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalRevenue = completed.reduce((s, t) => s + t.amount, 0);
  const trend = groupSumByMonth(monthly);
  const typeChart = byType.map((r, i) => ({
    label: r.type.replace("_", " "),
    value: Math.round(r._sum.amount ?? 0),
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <ReportShell
      title="Revenue analytics"
      description="Completed payment volume, trends, and transaction type mix"
      slug="revenue"
    >
      <ReportKpiGrid
        items={[
          { label: "Total revenue", value: formatCurrency(totalRevenue) },
          { label: "Completed txns", value: completed.length },
          {
            label: "Pending value",
            value: formatCurrency(pending._sum.amount ?? 0),
            sub: `${pending._count} pending`,
          },
          {
            label: "Avg transaction",
            value: completed.length ? formatCurrency(totalRevenue / completed.length) : "$0",
          },
        ]}
      />

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Monthly revenue trend</h3>
        <AreaLineChart data={trend} valueFormat="currency" />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Revenue by type</h3>
          <VerticalBarChart data={typeChart} valueFormat="currency" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Type mix</h3>
          <DonutChart data={typeChart} />
        </div>
      </div>

      <div className="mt-8">
        <DataTable
          title="Transaction types"
          columns={["Type", "Count", "Revenue", "% of total"]}
          rows={byType.map((r) => [
            r.type,
            r._count,
            formatCurrency(r._sum.amount ?? 0),
            totalRevenue ? `${Math.round(((r._sum.amount ?? 0) / totalRevenue) * 100)}%` : "0%",
          ])}
        />
      </div>
    </ReportShell>
  );
}
