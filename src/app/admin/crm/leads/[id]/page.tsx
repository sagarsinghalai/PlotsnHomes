import { CrmLeadDetail } from "@/components/admin/crm-lead-detail";
import { getCrmSettings } from "@/lib/crm-settings";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getBhkConfigurations } from "@/lib/system-settings";
import { getPipelines } from "@/lib/pipeline-store";

export default async function AdminLeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, agents, crmSettings, properties, bhkOptions, pipelines] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: params.id },
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
      select: { id: true, name: true, email: true, userId: true },
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
    <CrmLeadDetail
      lead={{
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        stage: lead.stage,
        score: lead.score,
        budgetMin: lead.budgetMin,
        budgetMax: lead.budgetMax,
        notes: lead.notes,
        nextFollowUpAt: lead.nextFollowUpAt?.toISOString() ?? null,
        lifecycleStage: (lead as any).lifecycleStage,
        leadStatus: (lead as any).leadStatus,
        requirements: (lead as any).requirements,
        suggestedPropertyIds: (lead as any).suggestedPropertyIds,
        property: lead.property,
        owner: lead.owner,
        tasks: lead.tasks.map((t) => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
          dueAt: t.dueAt?.toISOString() ?? null,
          createdAt: t.createdAt.toISOString(),
        })),
        activities: lead.activities.map((a) => ({
          id: a.id,
          type: a.type,
          message: a.message,
          createdAt: a.createdAt.toISOString(),
          user: a.user,
        })),
      }}
      agents={agents}
      sources={crmSettings.leadSources}
      templates={crmSettings.messageTemplates}
      properties={properties as any}
      bhkOptions={bhkOptions}
      pipelines={pipelines}
    />
  );
}
