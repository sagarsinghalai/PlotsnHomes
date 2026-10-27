export const dynamic = "force-dynamic";

import { LeadsTableView } from "@/components/admin/leads-table-view";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SMART_LISTS, countSmartList, smartListWhere, type SmartListId } from "@/lib/smart-lists";
import { getPipelineConfig } from "@/lib/pipeline-settings";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { leadScopeForUser } from "@/lib/crm-access";

import { getPipelines } from "@/lib/pipeline-store";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: { list?: string };
}) {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId || "__no_tenant__";
  // Tenant-first, then narrow by the role's data scope: OWN-scope roles
  // (agents/employees) only see leads they own; leaders see the whole tenant.
  // Mirrors the API (leadScopeForUser) so the page can't leak more than the API.
  const scope = session?.user
    ? leadScopeForUser(session.user.role, session.user.id, session.user.tenantId)
    : { tenantId, ownerId: "__no_tenant__" as string | undefined };
  const ownerId = scope.ownerId;
  const listId = (searchParams.list ?? "all") as SmartListId;
  const where = await smartListWhere(listId, ownerId, tenantId);

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
    prisma.lead.count({ where: { tenantId, ...(ownerId ? { ownerId } : {}) } }),
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
    ...SMART_LISTS.map((s) => countSmartList(s.id, ownerId, tenantId)),
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
