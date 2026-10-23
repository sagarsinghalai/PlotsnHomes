import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  DataTable,
  DonutChart,
  HorizontalBarChart,
  ReportKpiGrid,
  VerticalBarChart,
} from "@/components/admin/reports/charts";
import { CHART_COLORS } from "@/lib/admin-reports";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getServerTenantId } from "@/lib/tenant";

export default async function ListingsReportPage() {
  const tenantId = await getServerTenantId();
  const [byStatus, topYield, topInquiries, aggregates] = await Promise.all([
    prisma.property.groupBy({ by: ["status"], where: { tenantId }, _count: { id: true } }),
    prisma.property.findMany({
      where: { status: "ACTIVE", tenantId },
      orderBy: { yieldRate: "desc" },
      take: 10,
      select: { symbol: true, title: true, yieldRate: true, price: true, city: true },
    }),
    prisma.inquiry.groupBy({
      by: ["propertyId"],
      where: { tenantId },
      _count: { id: true },
    }),
    prisma.property.aggregate({
      where: { tenantId },
      _avg: { yieldRate: true, price: true, changeYtd: true },
      _count: true,
    }),
  ]);

  const topInquiriesSorted = [...topInquiries]
    .sort((a, b) => b._count.id - a._count.id)
    .slice(0, 10);
  const propertyIds = topInquiriesSorted.map((i) => i.propertyId);
  const props =
    propertyIds.length > 0
      ? await prisma.property.findMany({
          where: { id: { in: propertyIds }, tenantId },
          select: { id: true, symbol: true, title: true },
        })
      : [];
  const propMap = Object.fromEntries(props.map((p) => [p.id, p]));

  const statusData = byStatus.map((r, i) => ({
    label: r.status,
    value: r._count.id,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const yieldChart = topYield.map((p, i) => ({
    label: p.symbol,
    value: Math.round(p.yieldRate * 100) / 100,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <ReportShell
      title="Listings performance"
      description="Property status mix, top yields, and most inquired listings"
      slug="properties"
    >
      <ReportKpiGrid
        items={[
          { label: "Total listings", value: aggregates._count },
          { label: "Avg yield", value: `${(aggregates._avg.yieldRate ?? 0).toFixed(2)}%` },
          { label: "Avg price", value: formatCurrency(aggregates._avg.price ?? 0) },
          { label: "Avg YTD change", value: `${(aggregates._avg.changeYtd ?? 0).toFixed(2)}%` },
        ]}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Listings by status</h3>
          <DonutChart data={statusData} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Top yield (active)</h3>
          <HorizontalBarChart data={yieldChart} />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Status volume</h3>
        <VerticalBarChart data={statusData} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <DataTable
          title="Top yield properties"
          columns={["Symbol", "City", "Price", "Yield %"]}
          rows={topYield.map((p) => [p.symbol, p.city, formatCurrency(p.price), `${p.yieldRate.toFixed(2)}%`])}
        />
        <DataTable
          title="Most inquiries"
          columns={["Property", "Inquiries"]}
          rows={topInquiriesSorted.map((i) => {
            const p = propMap[i.propertyId];
            return [p ? `${p.symbol} — ${p.title.slice(0, 40)}` : i.propertyId, i._count.id];
          })}
        />
      </div>
    </ReportShell>
  );
}
