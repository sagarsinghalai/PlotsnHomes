export const dynamic = "force-dynamic";

import { LeadsTableView } from "@/components/admin/leads-table-view";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SMART_LISTS, countSmartList, smartListWhere, type SmartListId } from "@/lib/smart-lists";
import { getPipelineConfig } from "@/lib/pipeline-settings";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

import { getPipelines } from "@/lib/pipeline-store";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: { list?: string };
}) {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId || "__no_tenant__";
  const listId = (searchParams.list ?? "all") as SmartListId;
  const where = await smartListWhere(listId, undefined, tenantId);

  const [leads, pipelineConfig, totalAll, agents, properties, pipelines, ...counts] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        property: { select: { symbol: true } },
        owner: { select: { name: true, userId: true } },
      },
    }),
    getPipelineConfig(),
    prisma.lead.count({ where: { tenantId } }),
    prisma.user.findMany({
      where: { tenantId },
      select: { id: true, name: true, email: true, userId: true },
      orderBy: { name: "asc" },
    }),
    prisma.property.findMany({
      where: { tenantId },
      select: { id: true, title: true, symbol: true },
      orderBy: { title: "asc" },
    }),
    getPipelines(),
    ...SMART_LISTS.map((s) => countSmartList(s.id, undefined, tenantId)),
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
        agents={agents}
        properties={properties}
        pipelines={pipelines}
        leads={leads.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
          nextFollowUpAt: l.nextFollowUpAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
