export const dynamic = "force-dynamic";

import { LeadsTableView } from "@/components/admin/leads-table-view";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SMART_LISTS, countSmartList, smartListWhere, type SmartListId } from "@/lib/smart-lists";
import { getPipelineConfig } from "@/lib/pipeline-settings";
import { prisma } from "@/lib/prisma";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: { list?: string };
}) {
  const listId = (searchParams.list ?? "all") as SmartListId;
  const where = await smartListWhere(listId);

  const [leads, pipelineConfig, totalAll, ...counts] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        property: { select: { symbol: true } },
        owner: { select: { name: true } },
      },
    }),
    getPipelineConfig(),
    prisma.lead.count(),
    ...SMART_LISTS.map((s) => countSmartList(s.id)),
  ]);

  const listCounts = Object.fromEntries(SMART_LISTS.map((s, i) => [s.id, counts[i]]));

  return (
    <div>
      <AdminPageHeader
        title="All leads"
        description="Smart lists, filters, export — full lead database in table view"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "All leads" },
        ]}
      />

      <LeadsTableView
        activeList={listId}
        listCounts={listCounts}
        totalAll={totalAll}
        stageLabels={pipelineConfig.stageLabels}
        leads={leads.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
          nextFollowUpAt: l.nextFollowUpAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
