import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  AreaLineChart,
  DataTable,
  ReportKpiGrid,
  VerticalBarChart,
} from "@/components/admin/reports/charts";
import { groupCountByMonth } from "@/lib/admin-reports";
import { prisma } from "@/lib/prisma";

export default async function InquiriesReportPage() {
  const [inquiries, withLead, showingsPending] = await Promise.all([
    prisma.inquiry.findMany({ select: { createdAt: true, propertyId: true } }),
    prisma.inquiry.count({ where: { lead: { isNot: null } } }),
    prisma.propertyShowing.count({ where: { status: "REQUESTED" } }),
  ]);

  const trend = groupCountByMonth(inquiries.map((i) => i.createdAt));
  const total = inquiries.length;
  const converted = withLead;
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;

  const byProperty = new Map<string, number>();
  for (const i of inquiries) {
    byProperty.set(i.propertyId, (byProperty.get(i.propertyId) ?? 0) + 1);
  }

  const topIds = Array.from(byProperty.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const props = await prisma.property.findMany({
    where: { id: { in: topIds.map(([id]) => id) } },
    select: { id: true, symbol: true },
  });
  const propMap = Object.fromEntries(props.map((p) => [p.id, p.symbol]));

  const propertyChart = topIds.map(([id, value]) => ({
    label: propMap[id] ?? id.slice(0, 8),
    value,
  }));

  return (
    <ReportShell
      title="Inquiry trends"
      description="Lead generation from property pages and CRM conversion"
      slug="inquiries"
    >
      <ReportKpiGrid
        items={[
          { label: "Total inquiries", value: total },
          { label: "Converted to CRM", value: converted, sub: `${conversionRate}% conversion` },
          { label: "Not in CRM yet", value: total - converted },
          { label: "Site visits pending", value: showingsPending },
        ]}
      />

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Inquiries per month</h3>
        <AreaLineChart data={trend} />
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Top properties by inquiries</h3>
        <VerticalBarChart data={propertyChart} />
      </div>

      <div className="mt-8">
        <DataTable
          title="Property inquiry ranking"
          columns={["Symbol", "Inquiries", "% of total"]}
          rows={topIds.map(([id, count]) => [
            propMap[id] ?? "—",
            count,
            total ? `${Math.round((count / total) * 100)}%` : "0%",
          ])}
        />
      </div>
    </ReportShell>
  );
}
