"use client";

import {
  ArrowUpDown,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { CrmSubNav } from "@/components/admin/crm/crm-sub-nav";
import { StageBadge } from "@/components/admin/crm/stage-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SMART_LISTS } from "@/lib/smart-list-defs";
import { CRM_STAGES, initials, stageLabel } from "@/lib/crm-ui";

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  stage: string;
  score: number;
  createdAt: string;
  nextFollowUpAt: string | null;
  property: { symbol: string } | null;
  owner: { name: string } | null;
};

export function LeadsTableView({
  leads,
  listCounts,
  activeList,
  stageLabels = {},
  totalAll,
}: {
  leads: LeadRow[];
  listCounts: Record<string, number>;
  activeList: string;
  stageLabels?: Record<string, string>;
  totalAll: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sortKey, setSortKey] = useState<"createdAt" | "score" | "name">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const activeListMeta = SMART_LISTS.find((s) => s.id === activeList) ?? SMART_LISTS[0];

  function selectList(id: string) {
    const q = new URLSearchParams(params.toString());
    q.set("list", id);
    router.push(`/admin/leads?${q.toString()}`);
  }

  const sources = useMemo(() => Array.from(new Set(leads.map((l) => l.source))).sort(), [leads]);

  const filtered = useMemo(() => {
    let list = leads;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          (l.phone ?? "").includes(q) ||
          (l.property?.symbol ?? "").toLowerCase().includes(q)
      );
    }
    if (stageFilter) list = list.filter((l) => l.stage === stageFilter);
    if (sourceFilter) list = list.filter((l) => l.source === sourceFilter);
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "score") cmp = a.score - b.score;
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [leads, search, stageFilter, sourceFilter, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function exportCsv() {
    const headers = ["Name", "Email", "Phone", "Source", "Stage", "Property", "Owner", "Score", "Created", "Follow-up"];
    const rows = filtered.map((l) => [
      l.name,
      l.email,
      l.phone ?? "",
      l.source,
      l.stage,
      l.property?.symbol ?? "",
      l.owner?.name ?? "",
      String(l.score),
      new Date(l.createdAt).toISOString(),
      l.nextFollowUpAt ?? "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${activeList}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const overdueInView = filtered.filter(
    (l) =>
      l.nextFollowUpAt &&
      new Date(l.nextFollowUpAt) < new Date() &&
      l.stage !== "WON" &&
      l.stage !== "LOST"
  ).length;

  return (
    <div className="space-y-6">
      <CrmSubNav active="leads" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Smart lists sidebar */}
        <aside className="lg:w-72 shrink-0">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-4">
            <div className="bg-slate-900 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Lead lists</p>
              <p className="text-white font-semibold mt-0.5">{totalAll} total in CRM</p>
            </div>
            <nav className="p-2 max-h-[calc(100vh-220px)] overflow-y-auto">
              {SMART_LISTS.map((s) => {
                const active = activeList === s.id;
                const count = listCounts[s.id] ?? 0;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectList(s.id)}
                    className={`w-full text-left rounded-xl px-3 py-2.5 mb-0.5 transition ${
                      active
                        ? "bg-gold/15 border border-gold/30"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-medium ${active ? "text-gold-dark" : "text-slate-800"}`}>
                        {s.label}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                          active ? "bg-gold text-slate-900" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                    {active && (
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">{s.description}</p>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="border-t border-slate-100 p-3">
              <Link
                href="/admin/crm"
                className="flex items-center justify-between text-sm font-medium text-gold-dark hover:underline"
              >
                Open pipeline board
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Main table area */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{activeListMeta.label}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{activeListMeta.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={exportCsv}>
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Link href="/admin/crm">
                  <Button variant="gold">
                    <Plus className="h-4 w-4" />
                    New lead
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
              <Filter className="h-3.5 w-3.5" />
              Filters
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9 bg-slate-50"
                  placeholder="Search name, email, property..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
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
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
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
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
              <span>
                Showing <strong className="text-slate-800">{filtered.length}</strong> of {leads.length} in this list
              </span>
              {overdueInView > 0 && (
                <span className="text-red-600 font-medium">{overdueInView} overdue in view</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3.5 font-semibold">Lead</th>
                    <th className="px-4 py-3.5 font-semibold">Contact</th>
                    <th className="px-4 py-3.5 font-semibold">Source</th>
                    <th className="px-4 py-3.5 font-semibold">Stage</th>
                    <th className="px-4 py-3.5 font-semibold">Property</th>
                    <th className="px-4 py-3.5 font-semibold">Owner</th>
                    <th className="px-4 py-3.5 font-semibold">
                      <button type="button" onClick={() => toggleSort("score")} className="inline-flex items-center gap-1 hover:text-slate-800">
                        Score <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3.5 font-semibold">
                      <button type="button" onClick={() => toggleSort("createdAt")} className="inline-flex items-center gap-1 hover:text-slate-800">
                        Received <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3.5 font-semibold">Follow-up</th>
                    <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => {
                    const overdue =
                      l.nextFollowUpAt &&
                      new Date(l.nextFollowUpAt) < new Date() &&
                      l.stage !== "WON" &&
                      l.stage !== "LOST";
                    return (
                      <tr
                        key={l.id}
                        className={`border-t border-slate-100 hover:bg-slate-50/80 transition ${
                          overdue ? "bg-red-50/30" : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
                              {initials(l.name)}
                            </div>
                            <div>
                              <Link
                                href={`/admin/crm/leads/${l.id}`}
                                className="font-semibold text-slate-900 hover:text-gold-dark"
                              >
                                {l.name}
                              </Link>
                              <p className="text-[11px] text-slate-400">ID {l.id.slice(0, 8)}…</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700">{l.email}</p>
                          <p className="text-xs text-slate-500">{l.phone ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs">{l.source}</span>
                        </td>
                        <td className="px-4 py-3">
                          <StageBadge stage={l.stage} labels={stageLabels} />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gold-dark">{l.property?.symbol ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{l.owner?.name ?? "Unassigned"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-[80px]">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full bg-gold rounded-full" style={{ width: `${l.score}%` }} />
                            </div>
                            <span className="text-xs font-mono text-slate-500">{l.score}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {new Date(l.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {l.nextFollowUpAt ? (
                            <span className={overdue ? "text-red-600 font-medium text-xs" : "text-slate-600 text-xs"}>
                              {new Date(l.nextFollowUpAt).toLocaleDateString()}
                              {overdue && " · Overdue"}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/crm/leads/${l.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-slate-500">No leads match this list or your filters.</p>
                <Button
                  variant="secondary"
                  className="mt-4"
                  onClick={() => {
                    setSearch("");
                    setStageFilter("");
                    setSourceFilter("");
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
            {filtered.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-3 bg-slate-50 text-xs text-slate-500 flex justify-between">
                <span>{filtered.length} rows displayed</span>
                <span>Sorted by {sortKey} ({sortDir})</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
