export const dynamic = "force-dynamic";

import { CrmManager } from "@/components/admin/crm-manager";
import { CrmKpiStrip } from "@/components/admin/crm/crm-kpi-strip";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getCrmSettings } from "@/lib/crm-settings";
import { getPipelineConfig } from "@/lib/pipeline-settings";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Suspense } from "react";

export default async function AdminCrmPage() {
  const now = new Date();
  const [leads, agents, properties, crmSettings, pipelineConfig, inquiriesPending, showingsPending] =
    await Promise.all([
      prisma.lead.findMany({
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
      prisma.user.findMany({
        where: { role: { in: ["SUPERADMIN", "EMPLOYEE", "AGENT"] }, active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.property.findMany({
        where: { status: "ACTIVE" },
        orderBy: { symbol: "asc" },
        take: 100,
        select: { id: true, title: true, symbol: true },
      }),
      getCrmSettings(),
      getPipelineConfig(),
      prisma.inquiry.count({ where: { lead: null } }),
      prisma.propertyShowing.count({ where: { status: "REQUESTED", lead: null } }),
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
    <div>
      <AdminPageHeader
        title="Sales pipeline"
        description="Drag deals across stages · HubSpot / Sell.Do style kanban board"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Pipeline" },
        ]}
        actions={
          <>
            <Link
              href="/admin/leads"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              All leads table
            </Link>
            <Link
              href="/admin/crm/settings"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              CRM settings
            </Link>
          </>
        }
      />

      <CrmKpiStrip
        isAdmin
        total={leads.length}
        active={leads.length - won - lost}
        won={won}
        overdue={overdue}
        newInquiries={inquiriesPending}
        pendingShowings={showingsPending}
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
