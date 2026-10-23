import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  DataTable,
  HorizontalBarChart,
  ReportKpiGrid,
  VerticalBarChart,
} from "@/components/admin/reports/charts";
import { CHART_COLORS } from "@/lib/admin-reports";
import { prisma } from "@/lib/prisma";
import { getServerTenantId } from "@/lib/tenant";

export default async function TeamPerformanceReportPage() {
  const tenantId = await getServerTenantId();
  const leads = await prisma.lead.findMany({
    where: { tenantId },
    select: { ownerId: true, stage: true, owner: { select: { name: true } } },
  });

  const owners = new Map<
    string,
    { name: string; total: number; won: number; lost: number; active: number }
  >();

  for (const l of leads) {
    const key = l.ownerId ?? "unassigned";
    const name = l.owner?.name ?? "Unassigned";
    const row = owners.get(key) ?? { name, total: 0, won: 0, lost: 0, active: 0 };
    row.total++;
    if (l.stage === "WON") row.won++;
    else if (l.stage === "LOST") row.lost++;
    else row.active++;
    owners.set(key, row);
  }

  const sorted = Array.from(owners.values()).sort((a, b) => b.total - a.total);
  const chartData = sorted.map((o, i) => ({
    label: o.name,
    value: o.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const wonData = sorted.map((o) => ({
    label: o.name,
    value: o.won,
    color: "#10B981",
  }));

  return (
    <ReportShell
      title="Team performance"
      description="Workload and win rates by sales owner / agent"
      slug="team"
    >
      <ReportKpiGrid
        items={[
          { label: "Team members", value: sorted.filter((o) => o.name !== "Unassigned").length },
          { label: "Unassigned leads", value: owners.get("unassigned")?.total ?? 0, highlight: (owners.get("unassigned")?.total ?? 0) > 0 },
          { label: "Total won", value: sorted.reduce((s, o) => s + o.won, 0) },
          { label: "Active pipeline", value: sorted.reduce((s, o) => s + o.active, 0) },
        ]}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Leads per owner</h3>
          <VerticalBarChart data={chartData} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Won deals by owner</h3>
          <VerticalBarChart data={wonData} />
        </div>
      </div>

      <div className="mt-8">
        <HorizontalBarChart data={chartData} />
      </div>

      <div className="mt-8">
        <DataTable
          title="Agent scorecard"
          columns={["Agent", "Total leads", "Active", "Won", "Lost", "Win rate"]}
          rows={sorted.map((o) => [
            o.name,
            o.total,
            o.active,
            o.won,
            o.lost,
            o.total > 0 ? `${Math.round((o.won / o.total) * 100)}%` : "0%",
          ])}
        />
      </div>
    </ReportShell>
  );
}
