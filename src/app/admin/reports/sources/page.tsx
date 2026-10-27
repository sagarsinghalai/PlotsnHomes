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
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { leadScopeForUser } from "@/lib/crm-access";

export default async function LeadSourcesReportPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId || "__no_tenant__";
  // OWN-scope roles see only their own leads' sources; leaders see the tenant.
  const leadWhere = session?.user
    ? leadScopeForUser(session.user.role, session.user.id, session.user.tenantId)
    : { tenantId, ownerId: "__no_tenant__" as string | undefined };
  const [bySource, wonBySource] = await Promise.all([
    prisma.lead.groupBy({ by: ["source"], where: leadWhere, _count: { id: true }, orderBy: { _count: { id: "desc" } } }),
    prisma.lead.groupBy({
      by: ["source"],
      where: { ...leadWhere, stage: "WON" },
      _count: { id: true },
    }),
  ]);

  const wonMap = Object.fromEntries(wonBySource.map((r) => [r.source, r._count.id]));
  const total = bySource.reduce((s, r) => s + r._count.id, 0);

  const sourceData = bySource.map((r, i) => ({
    label: r.source || "Unknown",
    value: r._count.id,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const tableRows = bySource.map((r) => {
    const count = r._count.id;
    const won = wonMap[r.source] ?? 0;
    const winRate = count > 0 ? Math.round((won / count) * 100) : 0;
    return [r.source, count, won, `${winRate}%`, total ? `${Math.round((count / total) * 100)}%` : "0%"];
  });

  return (
    <ReportShell
      title="Lead sources"
      description="Channel attribution — volume and win rate per source"
      slug="sources"
    >
      <ReportKpiGrid
        items={[
          { label: "Total leads", value: total },
          { label: "Sources tracked", value: bySource.length },
          { label: "Top source", value: sourceData[0]?.label ?? "—" },
          { label: "Top source volume", value: sourceData[0]?.value ?? 0 },
        ]}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Leads by source</h3>
          <VerticalBarChart data={sourceData} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Source distribution</h3>
          <DonutChart data={sourceData} />
        </div>
      </div>

      <div className="mt-8">
        <HorizontalBarChart data={sourceData} />
      </div>

      <div className="mt-8">
        <DataTable
          title="Source performance"
          columns={["Source", "Leads", "Won", "Win rate", "Share"]}
          rows={tableRows}
        />
      </div>
    </ReportShell>
  );
}
