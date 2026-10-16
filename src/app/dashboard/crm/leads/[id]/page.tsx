import { CrmLeadDetail } from "@/components/admin/crm-lead-detail";
import { getCrmSettings } from "@/lib/crm-settings";
import { leadScopeForUser } from "@/lib/crm-access";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { notFound } from "next/navigation";
import { getBhkConfigurations } from "@/lib/system-settings";
import { getPipelines } from "@/lib/pipeline-store";

export default async function AgentLeadDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAuth([Role.SUPERADMIN, Role.EMPLOYEE, Role.AGENT]);
  const scope = leadScopeForUser(session.user.role, session.user.id);

  const [lead, agents, crmSettings, properties, bhkOptions, pipelines] = await Promise.all([
    prisma.lead.findFirst({
      where: { id: params.id, ...scope },
      include: {
        property: { select: { id: true, title: true, symbol: true, slug: true, category: true, type: true } },
        owner: { select: { id: true, name: true } },
        tasks: { orderBy: [{ completed: "asc" }, { dueAt: "asc" }] },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: { user: { select: { name: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "EMPLOYEE", "AGENT"] }, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getCrmSettings(),
    prisma.property.findMany({
      where: { status: "ACTIVE" },
      orderBy: { symbol: "asc" },
      select: {
        id: true,
        title: true,
        symbol: true,
        slug: true,
        price: true,
        bedrooms: true,
        bathrooms: true,
        city: true,
        area: true,
        type: true,
        category: true,
        listingType: true,
        images: true,
        bhk: true,
      },
    }),
    getBhkConfigurations(),
    getPipelines(),
  ]);

  if (!lead) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <CrmLeadDetail
        agentMode
        lead={{
          ...lead,
          requirements: (lead as any).requirements,
          suggestedPropertyIds: (lead as any).suggestedPropertyIds,
          nextFollowUpAt: lead.nextFollowUpAt?.toISOString() ?? null,
          tasks: lead.tasks.map((t) => ({
            ...t,
            dueAt: t.dueAt?.toISOString() ?? null,
            createdAt: t.createdAt.toISOString(),
          })),
          activities: lead.activities.map((a) => ({
            ...a,
            createdAt: a.createdAt.toISOString(),
          })),
        }}
        agents={agents}
        sources={crmSettings.leadSources}
        templates={crmSettings.messageTemplates}
        properties={properties as any}
        bhkOptions={bhkOptions}
        pipelines={pipelines}
      />
    </div>
  );
}
