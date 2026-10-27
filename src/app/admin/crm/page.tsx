export const dynamic = "force-dynamic";

import { CrmManager } from "@/components/admin/crm-manager";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getCrmSettings } from "@/lib/crm-settings";
import { getPipelineConfig } from "@/lib/pipeline-settings";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { leadScopeForUser } from "@/lib/crm-access";

export default async function AdminCrmPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId || "__no_tenant__";
  // OWN-scope roles (agents/employees) only see leads they own; leaders see the
  // whole tenant. Mirrors /admin/leads and the leads API (leadScopeForUser).
  const leadWhere = session?.user
    ? leadScopeForUser(session.user.role, session.user.id, session.user.tenantId)
    : { tenantId, ownerId: "__no_tenant__" as string | undefined };
  const [leads, agents, properties, crmSettings, pipelineConfig] =
    await Promise.all([
      prisma.lead.findMany({
        where: leadWhere,
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
        include: {
          property: { select: { title: true, symbol: true } },
          owner: { select: { id: true, name: true, userId: true } },
          tasks: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, title: true, completed: true, dueAt: true },
          },
          activities: {
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, type: true, message: true, createdAt: true },
          },
        },
        take: 500,
      }),
      prisma.user.findMany({
        where: { role: { in: ["SUPERADMIN", "EMPLOYEE", "AGENT"] }, active: true, tenantId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true, userId: true },
      }),
      prisma.property.findMany({
        where: { status: "ACTIVE", tenantId },
        orderBy: { symbol: "asc" },
        take: 100,
        select: { id: true, title: true, symbol: true },
      }),
      getCrmSettings(tenantId),
      getPipelineConfig(),
    ]);

  return (
    <div>
      <AdminPageHeader
        title="Pipeline"
        description="Manage opportunities, sales stages, and pipeline progress"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Pipeline" },
        ]}
      />

      <Suspense fallback={<div className="h-96 rounded-2xl border bg-slate-50 animate-pulse" />}>
        <CrmManager
          stageLabels={pipelineConfig.stageLabels}
          leads={leads.map((l) => ({
            ...l,
            nextFollowUpAt: l.nextFollowUpAt?.toISOString() ?? null,
            activities: l.activities.map((a) => ({
              ...a,
              createdAt: a.createdAt.toISOString(),
            })),
            tasks: l.tasks.map((t) => ({
              ...t,
              dueAt: t.dueAt?.toISOString() ?? null,
            })),
          }))}
          agents={agents}
          sources={crmSettings.leadSources}
          properties={properties}
        />
      </Suspense>
    </div>
  );
}
