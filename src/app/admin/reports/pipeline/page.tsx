import { ReportShell } from "@/components/admin/reports/report-shell";
import {
  DataTable,
  DonutChart,
  HorizontalBarChart,
  ReportKpiGrid,
  VerticalBarChart,
} from "@/components/admin/reports/charts";
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/admin-reports";
import { prisma } from "@/lib/prisma";
import { getServerTenantId } from "@/lib/tenant";

export default async function PipelineReportPage() {
  const now = new Date();
  const tenantId = await getServerTenantId();
  const leads = await prisma.lead.findMany({
    where: { tenantId },
    select: { stage: true, nextFollowUpAt: true, score: true },
  });

  const byStage = new Map<string, number>();
  let overdue = 0;
  let active = 0;
  let won = 0;
  let lost = 0;
  let avgScore = 0;

  for (const l of leads) {
    byStage.set(l.stage, (byStage.get(l.stage) ?? 0) + 1);
    avgScore += l.score;
    if (l.stage === "WON") won++;
    else if (l.stage === "LOST") lost++;
    else {
      active++;
      if (l.nextFollowUpAt && l.nextFollowUpAt < now) overdue++;
    }
  }

  const stageData = Array.from(byStage.entries())
    .map(([stage, value]) => ({
      label: STAGE_LABELS[stage] ?? stage,
      value,
      color: STAGE_COLORS[stage],
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <ReportShell
      title="Pipeline health"
      description="Stage distribution, overdue tasks, and deal velocity"
      slug="pipeline"
    >
      <ReportKpiGrid
        items={[
          { label: "Active deals", value: active },
          { label: "Won", value: won },
          { label: "Lost", value: lost },
          { label: "Overdue follow-ups", value: overdue, highlight: overdue > 0 },
          { label: "Avg lead score", value: leads.length ? Math.round(avgScore / leads.length) : 0 },
        ]}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Deals by stage</h3>
          <VerticalBarChart data={stageData} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Stage mix</h3>
          <DonutChart data={stageData} />
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Stage breakdown</h3>
        <HorizontalBarChart data={stageData} />
      </div>

      <div className="mt-8">
        <DataTable
          title="Summary table"
          columns={["Stage", "Count", "% of total"]}
          rows={stageData.map((r) => [
            r.label,
            r.value,
            leads.length ? `${Math.round((r.value / leads.length) * 100)}%` : "0%",
          ])}
        />
      </div>
    </ReportShell>
  );
}
