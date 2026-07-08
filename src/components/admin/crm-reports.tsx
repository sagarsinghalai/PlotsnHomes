"use client";

import Link from "next/link";

type ReportData = {
  totalLeads: number;
  byStage: { stage: string; count: number }[];
  bySource: { source: string; count: number }[];
  byOwner: { ownerId: string | null; ownerName: string; count: number }[];
  wonCount: number;
  lostCount: number;
  overdueFollowUps: number;
  inquiriesPending: number;
  showingsPending: number;
};

const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  SITE_VISIT: "Site visit",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export function CrmReports({ data }: { data: ReportData }) {
  const active =
    data.totalLeads - data.wonCount - data.lostCount;
  const conversionRate =
    data.totalLeads > 0 ? Math.round((data.wonCount / data.totalLeads) * 100) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-4">
        <Link href="/admin/crm/reports/funnel" className="text-sm text-gold-dark hover:underline font-medium">
          Lead funnel →
        </Link>
        <Link href="/admin/crm" className="text-sm text-gold-dark hover:underline font-medium">
          ← Pipeline
        </Link>
        <Link href="/admin/inquiries" className="text-sm text-gold-dark hover:underline font-medium">
          Inquiries ({data.inquiriesPending})
        </Link>
        <Link href="/admin/showings" className="text-sm text-gold-dark hover:underline font-medium">
          Site visits ({data.showingsPending})
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total leads" value={data.totalLeads} />
        <StatCard label="Active pipeline" value={active} />
        <StatCard label="Won" value={data.wonCount} sub={`${conversionRate}% conversion`} />
        <StatCard label="Overdue follow-ups" value={data.overdueFollowUps} alert={data.overdueFollowUps > 0} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ReportTable
          title="Funnel by stage"
          rows={data.byStage.map((r) => ({
            label: STAGE_LABELS[r.stage] ?? r.stage,
            count: r.count,
            pct: data.totalLeads ? Math.round((r.count / data.totalLeads) * 100) : 0,
          }))}
        />
        <ReportTable
          title="Leads by source"
          rows={data.bySource.map((r) => ({
            label: r.source,
            count: r.count,
            pct: data.totalLeads ? Math.round((r.count / data.totalLeads) * 100) : 0,
          }))}
        />
        <ReportTable
          title="Leads by owner"
          rows={data.byOwner.map((r) => ({
            label: r.ownerName,
            count: r.count,
            pct: data.totalLeads ? Math.round((r.count / data.totalLeads) * 100) : 0,
          }))}
        />
        <div className="rounded-2xl border bg-white p-6">
          <h3 className="font-semibold text-lg mb-4">Inbox to convert</h3>
          <p className="text-3xl font-bold text-slate-900">{data.inquiriesPending}</p>
          <p className="text-sm text-slate-500 mt-1">Property inquiries not yet in CRM</p>
          <p className="text-3xl font-bold text-slate-900 mt-6">{data.showingsPending}</p>
          <p className="text-sm text-slate-500 mt-1">Site visit requests pending review</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  alert,
}: {
  label: string;
  value: number;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-6 ${alert ? "border-red-200 bg-red-50" : "bg-white"}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function ReportTable({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; count: number; pct: number }[];
}) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h3 className="font-semibold text-lg mb-4">{title}</h3>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex justify-between text-sm mb-1">
              <span>{r.label}</span>
              <span className="text-slate-500">
                {r.count} ({r.pct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-gold rounded-full" style={{ width: `${r.pct}%` }} />
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-slate-400 text-sm">No data</p>}
      </div>
    </div>
  );
}
