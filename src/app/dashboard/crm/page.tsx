export const dynamic = "force-dynamic";

import { CrmManager } from "@/components/admin/crm-manager";
import { CrmKpiStrip } from "@/components/admin/crm/crm-kpi-strip";
import { getCrmSettings } from "@/lib/crm-settings";
import { getPipelineConfig } from "@/lib/pipeline-settings";
import { leadScopeForUser } from "@/lib/crm-access";
import { Role } from "@prisma/client";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";

function CrmManagerFallback() {
  return <div className="h-96 rounded-2xl border bg-slate-50 animate-pulse" />;
}

export default async function AgentCrmPage() {
  const session = await requireAuth([Role.SUPERADMIN, Role.EMPLOYEE, Role.AGENT]);
  const scope = leadScopeForUser(session.user.role, session.user.id, session.user.tenantId);
  const isAdmin =
    session.user.role === Role.SUPERADMIN || session.user.role === Role.EMPLOYEE;
  const now = new Date();

  const [leads, properties, crmSettings, pipelineConfig, inquiriesPending, showingsPending] =
    await Promise.all([
      prisma.lead.findMany({
        where: scope,
        orderBy: [{ score: "desc" }, { createdAt: "desc" }],
        include: {
          property: { select: { title: true, symbol: true } },
          owner: { select: { id: true, name: true } },
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
      prisma.property.findMany({
        where:
          session.user.role === "AGENT"
            ? { agentId: session.user.id, status: "ACTIVE" }
            : { status: "ACTIVE" },
        orderBy: { symbol: "asc" },
        take: 100,
        select: { id: true, title: true, symbol: true },
      }),
      getCrmSettings(),
      getPipelineConfig(),
      isAdmin ? prisma.inquiry.count({ where: { lead: null } }) : Promise.resolve(0),
      isAdmin
        ? prisma.propertyShowing.count({ where: { status: "REQUESTED", lead: null } })
        : Promise.resolve(0),
    ]);

  const won = leads.filter((l) => l.stage === "WON").length;
  const lost = leads.filter((l) => l.stage === "LOST").length;
  const overdue = leads.filter(
    (l) =>
      l.nextFollowUpAt &&
      l.nextFollowUpAt < now &&
      l.stage !== "WON" &&
      l.stage !== "LOST"
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-slate-900">My sales pipeline</h1>
      <p className="mt-1 text-slate-600">Click any metric below to drill into filtered leads</p>

      <div className="mt-8">
        <CrmKpiStrip
          agentMode
          isAdmin={isAdmin}
          total={leads.length}
          active={leads.length - won - lost}
          won={won}
          overdue={overdue}
          newInquiries={inquiriesPending}
          pendingShowings={showingsPending}
        />
        <Suspense fallback={<CrmManagerFallback />}>
          <CrmManager
            agentMode
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
            agents={[]}
            sources={crmSettings.leadSources}
            properties={properties}
          />
        </Suspense>
      </div>
    </div>
  );
}
