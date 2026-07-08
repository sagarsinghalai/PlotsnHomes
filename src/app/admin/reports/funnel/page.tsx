import { ReportShell } from "@/components/admin/reports/report-shell";
import { FunnelChart, ReportKpiGrid } from "@/components/admin/reports/charts";
import { getPipelineConfig } from "@/lib/pipeline-settings";
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/admin-reports";
import { prisma } from "@/lib/prisma";

export default async function LeadFunnelReportPage() {
  const [config, byStage, total, won, lost] = await Promise.all([
    getPipelineConfig(),
    prisma.lead.groupBy({ by: ["stage"], _count: { id: true } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { stage: "WON" } }),
    prisma.lead.count({ where: { stage: "LOST" } }),
  ]);

  const countMap = Object.fromEntries(byStage.map((r) => [r.stage, r._count.id]));
  const order = ["NEW", "CONTACTED", "QUALIFIED", "SITE_VISIT", "NEGOTIATION", "WON"] as const;

  const stages = order.map((key) => ({
    label: config.stageLabels[key] ?? STAGE_LABELS[key] ?? key,
    value: countMap[key] ?? 0,
    color: STAGE_COLORS[key],
  }));

  const conversion = total > 0 ? Math.round((won / total) * 100) : 0;

  return (
    <ReportShell
      title="Lead funnel"
      description="Visual pipeline from first touch to closed won — one stage per row"
      slug="funnel"
    >
      <ReportKpiGrid
        items={[
          { label: "Total leads", value: total },
          { label: "Won", value: won, sub: `${conversion}% win rate` },
          { label: "Lost", value: lost },
          { label: "In pipeline", value: total - won - lost },
        ]}
      />
      <div className="mt-8">
        <FunnelChart stages={stages} />
      </div>
    </ReportShell>
  );
}
