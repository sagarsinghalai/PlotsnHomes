"use client";

import {
  Calendar,
  Filter,
  GripVertical,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CrmSubNav } from "@/components/admin/crm/crm-sub-nav";
import { StageBadge } from "@/components/admin/crm/stage-badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  CRM_STAGES,
  formatBudget,
  initials,
  stageLabel,
  STAGE_META,
} from "@/lib/crm-ui";

export type CrmLead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  stage: string;
  score: number;
  budgetMin: number | null;
  budgetMax: number | null;
  notes: string | null;
  nextFollowUpAt: string | null;
  property: { title: string; symbol: string } | null;
  owner: { id: string; name: string } | null;
  tasks: { id: string; title: string; completed: boolean; dueAt: string | null }[];
  activities: { id: string; type: string; message: string; createdAt: string }[];
};

export function CrmManager({
  leads,
  agents,
  sources,
  properties,
  stageLabels = {},
  agentMode = false,
}: {
  leads: CrmLead[];
  agents: { id: string; name: string }[];
  sources: string[];
  properties: { id: string; title: string; symbol: string }[];
  stageLabels?: Record<string, string>;
  agentMode?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"kanban" | "list">(
    searchParams.get("view") === "list" ? "list" : "kanban"
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState(searchParams.get("stage") ?? "");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(searchParams.get("active") === "1");
  const [overdueOnly, setOverdueOnly] = useState(searchParams.get("overdue") === "1");

  useEffect(() => {
    const stage = searchParams.get("stage") ?? "";
    const overdue = searchParams.get("overdue") === "1";
    const active = searchParams.get("active") === "1";
    const forceList = searchParams.get("view") === "list" || !!stage || overdue || active;

    setFilterStage(stage);
    setActiveOnly(active);
    setOverdueOnly(overdue);
    setView(forceList ? "list" : "kanban");
  }, [searchParams]);
  const [showCreate, setShowCreate] = useState(false);
  const [createError, setCreateError] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    source: sources[0] ?? "Website",
    propertyId: "",
    score: 50,
  });

  const leadHref = (id: string) =>
    agentMode ? `/dashboard/crm/leads/${id}` : `/admin/crm/leads/${id}`;

  const filtered = useMemo(() => {
    const now = new Date();
    return leads.filter((l) => {
      if (activeOnly && (l.stage === "WON" || l.stage === "LOST")) return false;
      if (overdueOnly) {
        const isOverdue =
          l.nextFollowUpAt &&
          new Date(l.nextFollowUpAt) < now &&
          l.stage !== "WON" &&
          l.stage !== "LOST";
        if (!isOverdue) return false;
      }
      if (filterStage && l.stage !== filterStage) return false;
      if (filterOwner && l.owner?.id !== filterOwner) return false;
      if (filterSource && l.source !== filterSource) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.name.toLowerCase().includes(q) &&
          !l.email.toLowerCase().includes(q) &&
          !(l.phone ?? "").includes(q) &&
          !(l.property?.symbol ?? "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [leads, filterStage, filterOwner, filterSource, search, activeOnly, overdueOnly]);

  const grouped = useMemo(
    () =>
      Object.fromEntries(CRM_STAGES.map((s) => [s, filtered.filter((l) => l.stage === s)])) as Record<
        string,
        CrmLead[]
      >,
    [filtered]
  );

  const visibleStages = useMemo(() => {
    if (filterStage) return [filterStage];
    if (overdueOnly) return CRM_STAGES.filter((s) => (grouped[s]?.length ?? 0) > 0);
    if (activeOnly) return CRM_STAGES.filter((s) => s !== "WON" && s !== "LOST");
    return [...CRM_STAGES];
  }, [filterStage, overdueOnly, activeOnly, grouped]);

  const filterBanner = useMemo(() => {
    if (overdueOnly) return { title: "Overdue follow-ups", desc: "Leads past their follow-up date" };
    if (filterStage === "WON") return { title: "Won deals", desc: "Closed won — booked" };
    if (filterStage === "LOST") return { title: "Lost deals", desc: "Closed lost" };
    if (filterStage) return { title: stageLabel(filterStage, stageLabels), desc: "Filtered by stage" };
    if (activeOnly) return { title: "Active pipeline", desc: "Open deals (excluding won & lost)" };
    return null;
  }, [overdueOnly, filterStage, activeOnly, stageLabels]);

  const overdueCount = useMemo(
    () =>
      leads.filter(
        (l) =>
          l.nextFollowUpAt &&
          new Date(l.nextFollowUpAt) < new Date() &&
          l.stage !== "WON" &&
          l.stage !== "LOST"
      ).length,
    [leads]
  );

  const openTasks = useMemo(
    () => leads.reduce((s, l) => s + l.tasks.filter((t) => !t.completed).length, 0),
    [leads]
  );

  async function moveStage(id: string, stage: string) {
    setBusy(id);
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    setBusy(null);
    router.refresh();
  }

  async function createLead() {
    if (!createForm.name.trim() || !createForm.email.trim()) return;
    setBusy("create");
    setCreateError("");
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          phone: createForm.phone || null,
          source: createForm.source,
          propertyId: createForm.propertyId || null,
          score: createForm.score,
        }),
      });
      const data = await res.json();
      setBusy(null);
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create lead. Please try again.");
        return;
      }
      // Success — reset form, close modal, navigate directly to new lead
      setShowCreate(false);
      setCreateError("");
      setCreateForm({
        name: "",
        email: "",
        phone: "",
        source: sources[0] ?? "Website",
        propertyId: "",
        score: 50,
      });
      // Navigate to the new lead's detail page so it's immediately visible
      const newLeadId = data.lead?.id;
      if (newLeadId) {
        router.push(agentMode ? `/dashboard/crm/leads/${newLeadId}` : `/admin/crm/leads/${newLeadId}`);
      } else {
        router.refresh();
      }
    } catch {
      setBusy(null);
      setCreateError("Network error. Please check your connection and try again.");
    }
  }

  function LeadCard({ lead, compact }: { lead: CrmLead; compact?: boolean }) {
    const overdue =
      lead.nextFollowUpAt &&
      new Date(lead.nextFollowUpAt) < new Date() &&
      lead.stage !== "WON" &&
      lead.stage !== "LOST";
    const budget = formatBudget(lead.budgetMin, lead.budgetMax);
    const openTaskCount = lead.tasks.filter((t) => !t.completed).length;

    return (
      <div
        draggable={view === "kanban"}
        onDragStart={() => setDragId(lead.id)}
        onDragEnd={() => setDragId(null)}
        className={`group rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-gold/30 ${
          dragId === lead.id ? "opacity-60 ring-2 ring-gold/40" : ""
        } ${overdue ? "ring-2 ring-red-300 border-red-200" : ""}`}
      >
        <div className="flex items-start gap-2 p-3 border-b border-slate-50">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            {initials(lead.name)}
          </div>
          <div className="min-w-0 flex-1">
            <Link href={leadHref(lead.id)} className="font-semibold text-sm text-slate-900 hover:text-gold-dark line-clamp-1">
              {lead.name}
            </Link>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <Mail className="h-3 w-3 shrink-0" />
              {lead.email}
            </p>
          </div>
          {view === "kanban" && (
            <GripVertical className="h-4 w-4 text-slate-300 shrink-0 opacity-0 group-hover:opacity-100" />
          )}
        </div>

        <Link href={leadHref(lead.id)} className="block px-3 py-2.5 space-y-2">
          {lead.property && (
            <span className="inline-flex items-center rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
              {lead.property.symbol}
            </span>
          )}
          <div className="flex flex-wrap gap-1">
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">{lead.source}</span>
            {budget && (
              <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-800">{budget}</span>
            )}
            {overdue && (
              <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">Overdue</span>
            )}
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gold"
                style={{ width: `${Math.min(100, lead.score)}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-slate-500">{lead.score}</span>
          </div>
          {!compact && (
            <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 pt-1">
              {lead.phone && (
                <span className="flex items-center gap-0.5">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </span>
              )}
              {lead.nextFollowUpAt && (
                <span className={`flex items-center gap-0.5 ${overdue ? "text-red-600 font-medium" : ""}`}>
                  <Calendar className="h-3 w-3" />
                  {new Date(lead.nextFollowUpAt).toLocaleDateString()}
                </span>
              )}
              {openTaskCount > 0 && <span>{openTaskCount} open tasks</span>}
            </div>
          )}
          {lead.owner && (
            <p className="text-[10px] text-slate-400">Owner · {lead.owner.name}</p>
          )}
        </Link>

        {view === "list" && (
          <div className="px-3 pb-3 flex items-center gap-2">
            <StageBadge stage={lead.stage} labels={stageLabels} />
            <select
              value={lead.stage}
              disabled={busy === lead.id}
              onChange={(e) => moveStage(lead.id, e.target.value)}
              className="ml-auto rounded-lg border border-slate-200 px-2 py-1 text-xs bg-slate-50"
            >
              {CRM_STAGES.map((s) => (
                <option key={s} value={s}>
                  {stageLabel(s, stageLabels)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!agentMode && <CrmSubNav active="pipeline" />}

      {/* Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setView("kanban")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  view === "kanban" ? "bg-white shadow text-slate-900" : "text-slate-600"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Board
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  view === "list" ? "bg-white shadow text-slate-900" : "text-slate-600"
                }`}
              >
                <List className="h-4 w-4" />
                Cards
              </button>
            </div>
            <Button variant="gold" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              New lead
            </Button>
            {!agentMode && (
              <Link href="/admin/leads">
                <Button variant="secondary">All leads table</Button>
              </Link>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {overdueCount > 0 && (
              <Link
                href={
                  agentMode
                    ? "/dashboard/crm?overdue=1&view=list"
                    : "/admin/leads?list=missed_followups"
                }
                className="rounded-full bg-red-100 text-red-800 px-3 py-1 text-xs font-semibold hover:bg-red-200"
              >
                {overdueCount} overdue
              </Link>
            )}
            <span className="text-xs text-slate-500">{openTasks} open tasks</span>
            {!agentMode && (
              <Link href="/admin/crm/settings" className="text-slate-500 hover:text-gold-dark">
                <Settings className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
          <Filter className="h-3.5 w-3.5" />
          Filters
        </div>
        <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 bg-slate-50"
              placeholder="Search leads, email, property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          >
            <option value="">All stages</option>
            {CRM_STAGES.map((s) => (
              <option key={s} value={s}>
                {stageLabel(s, stageLabels)}
              </option>
            ))}
          </select>
          <select
            value={filterOwner}
            onChange={(e) => setFilterOwner(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          >
            <option value="">All owners</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
          >
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-3 text-xs text-slate-500 flex flex-wrap items-center gap-2">
          <span>
            Showing <strong>{filtered.length}</strong> of {leads.length} leads
            {search || filterStage || filterOwner || filterSource || activeOnly || overdueOnly
              ? " (filtered)"
              : ""}
          </span>
          {(activeOnly || overdueOnly || filterStage) && (
            <button
              type="button"
              onClick={() => {
                setActiveOnly(false);
                setOverdueOnly(false);
                setFilterStage("");
                const base = agentMode ? "/dashboard/crm" : "/admin/crm";
                router.push(base);
              }}
              className="text-gold-dark hover:underline font-medium"
            >
              Clear URL filters
            </button>
          )}
        </p>
      </div>

      {filterBanner && (
        <div
          className={`rounded-xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${
            overdueOnly ? "border-red-200 bg-red-50" : "border-gold/30 bg-amber-50/80"
          }`}
        >
          <div>
            <p className="font-semibold text-slate-900">{filterBanner.title}</p>
            <p className="text-sm text-slate-600">
              {filterBanner.desc} · <strong>{filtered.length}</strong> lead
              {filtered.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveOnly(false);
              setOverdueOnly(false);
              setFilterStage("");
              router.push(agentMode ? "/dashboard/crm" : "/admin/crm");
            }}
            className="text-sm font-medium text-gold-dark hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {view === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1">
          {visibleStages.map((stage) => {
            const meta = STAGE_META[stage];
            const columnLeads = grouped[stage] ?? [];
            const columnValue = columnLeads.reduce((s, l) => s + (l.budgetMax ?? l.budgetMin ?? 0), 0);

            return (
              <div
                key={stage}
                className="min-w-[300px] max-w-[300px] flex-shrink-0 flex flex-col rounded-2xl border border-slate-200 bg-slate-50/80 overflow-hidden"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragId) moveStage(dragId, stage);
                  setDragId(null);
                }}
              >
                <div className={`px-4 py-3 border-b ${meta?.border ?? "border-slate-200"} ${meta?.bg ?? "bg-white"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${meta?.dot}`} />
                      <h3 className={`font-semibold text-sm truncate ${meta?.color}`}>
                        {stageLabel(stage, stageLabels)}
                      </h3>
                    </div>
                    <span className="rounded-full bg-white border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-700">
                      {columnLeads.length}
                    </span>
                  </div>
                  {columnValue > 0 && (
                    <p className="text-[10px] text-slate-500 mt-1 pl-4">
                      Est. {formatBudget(null, columnValue) ?? `$${columnValue.toLocaleString()}`}
                    </p>
                  )}
                </div>
                <div className="flex-1 p-2 space-y-2 max-h-[calc(100vh-320px)] min-h-[200px] overflow-y-auto">
                  {columnLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} compact />
                  ))}
                  {columnLeads.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white/50 py-8 text-center text-xs text-slate-400">
                      Drop leads here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <p className="text-slate-500">No leads match your filters.</p>
              <Button variant="secondary" className="mt-4" onClick={() => {
                setSearch("");
                setFilterStage("");
                setFilterOwner("");
                setFilterSource("");
                setActiveOnly(false);
                setOverdueOnly(false);
                router.push(agentMode ? "/dashboard/crm" : "/admin/crm");
              }}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h3 className="font-display text-xl font-bold text-slate-900">Create new lead</h3>
              <p className="text-sm text-slate-500 mt-0.5">Adds to pipeline as Incoming / New</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>Full name *</Label>
                  <Input value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <PhoneInput value={createForm.phone} onChange={(phone) => setCreateForm((f) => ({ ...f, phone }))} defaultCountry="IN" />
                </div>
                <div>
                  <Label>Source</Label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    value={createForm.source}
                    onChange={(e) => setCreateForm((f) => ({ ...f, source: e.target.value }))}
                  >
                    {sources.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Lead score</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={createForm.score}
                    onChange={(e) => setCreateForm((f) => ({ ...f, score: Number(e.target.value) }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Property (optional)</Label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    value={createForm.propertyId}
                    onChange={(e) => setCreateForm((f) => ({ ...f, propertyId: e.target.value }))}
                  >
                    <option value="">— None —</option>
                    {properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.symbol} — {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end border-t border-slate-100 px-6 py-4 bg-slate-50 flex-wrap">
              {createError && (
                <p className="flex-1 text-sm text-red-600 font-medium rounded-lg bg-red-50 border border-red-200 px-3 py-2">
                  ⚠ {createError}
                </p>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="secondary" onClick={() => { setShowCreate(false); setCreateError(""); }}>
                  Cancel
                </Button>
                <Button variant="gold" loading={busy === "create"} disabled={busy === "create"} onClick={createLead}>
                  Create lead
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
