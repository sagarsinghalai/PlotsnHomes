"use client";

import {
  ArrowUpDown,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
  Plus,
  Search,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { StageBadge } from "@/components/admin/crm/stage-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SMART_LISTS } from "@/lib/smart-list-defs";
import { CRM_STAGES, initials, stageLabel } from "@/lib/crm-ui";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";

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

const WORLD_COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+971", label: "🇦🇪 +971" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+65", label: "🇸🇬 +65" },
  { code: "+61", label: "🇦🇺 +61" },
  { code: "+49", label: "🇩🇪 +49" },
  { code: "+966", label: "🇸🇦 +966" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+39", label: "🇮🇹 +39" },
  { code: "+34", label: "🇪🇸 +34" },
  { code: "+31", label: "🇳🇱 +31" },
  { code: "+32", label: "🇧🇪 +32" },
  { code: "+41", label: "🇨🇭 +41" },
  { code: "+43", label: "🇦🇹 +43" },
  { code: "+46", label: "🇸🇪 +46" },
  { code: "+47", label: "🇳🇴 +47" },
  { code: "+45", label: "🇩🇰 +45" },
  { code: "+358", label: "🇫🇮 +358" },
  { code: "+351", label: "🇵🇹 +351" },
  { code: "+353", label: "🇮🇪 +353" },
  { code: "+48", label: "🇵🇱 +48" },
  { code: "+420", label: "🇨🇿 +420" },
  { code: "+40", label: "🇷🇴 +40" },
  { code: "+36", label: "🇭🇺 +36" },
  { code: "+30", label: "🇬🇷 +30" },
  { code: "+7", label: "🇷🇺 +7" },
  { code: "+90", label: "🇹🇷 +90" },
  { code: "+81", label: "🇯🇵 +81" },
  { code: "+86", label: "🇨🇳 +86" },
  { code: "+82", label: "🇰🇷 +82" },
  { code: "+66", label: "🇹🇭 +66" },
  { code: "+60", label: "🇲🇾 +60" },
  { code: "+62", label: "🇮🇩 +62" },
  { code: "+63", label: "🇵🇭 +63" },
  { code: "+84", label: "🇻🇳 +84" },
  { code: "+880", label: "🇧🇩 +880" },
  { code: "+92", label: "🇵🇰 +92" },
  { code: "+94", label: "🇱🇰 +94" },
  { code: "+977", label: "🇳🇵 +977" },
  { code: "+27", label: "🇿🇦 +27" },
  { code: "+234", label: "🇳🇬 +234" },
  { code: "+254", label: "🇰🇪 +254" },
  { code: "+20", label: "🇪🇬 +20" },
  { code: "+233", label: "🇬🇭 +233" },
  { code: "+52", label: "🇲🇽 +52" },
  { code: "+55", label: "🇧🇷 +55" },
  { code: "+54", label: "🇦🇷 +54" },
  { code: "+57", label: "🇨🇴 +57" },
  { code: "+56", label: "🇨🇱 +56" },
  { code: "+51", label: "🇵🇪 +51" },
  { code: "+64", label: "🇳🇿 +64" },
  { code: "+974", label: "🇶🇦 +974" },
  { code: "+965", label: "🇰🇼 +965" },
  { code: "+973", label: "🇧🇭 +973" },
  { code: "+968", label: "🇴🇲 +968" },
  { code: "+962", label: "🇯🇴 +962" },
  { code: "+961", label: "🇱🇧 +961" },
  { code: "+972", label: "🇮🇱 +972" },
  { code: "+886", label: "🇹🇼 +886" },
  { code: "+852", label: "🇭🇰 +852" },
];

const LIFECYCLE_STAGES = ["Lead", "MQL", "SQL", "Opportunity", "Customer", "Evangelist", "Other"];
const LEAD_STATUSES = [
  "NEW",
  "UNTOUCHED",
  "CALL_LATER",
  "IN_PROGRESS",
  "OPEN_DEAL",
  "QUALIFIED",
  "UNQUALIFIED",
  "WON",
  "LOST",
];
const LEAD_SOURCES = [
  "Website",
  "Site Visit",
  "Phone Call",
  "Referral",
  "Social Media",
  "Direct Inbound",
  "WhatsApp",
  "Google Ads",
];

function formatDateString(isoStr: string | null | undefined): string {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
}

export function LeadsTableView({
  leads,
  listCounts,
  activeList,
  stageLabels = {},
  totalAll,
  agents = [],
  properties = [],
  pipelines = [],
}: {
  leads: LeadRow[];
  listCounts: Record<string, number>;
  activeList: string;
  stageLabels?: Record<string, string>;
  totalAll: number;
  agents?: Array<{ id: string; name: string }>;
  properties?: Array<{ id: string; symbol: string; title: string }>;
  pipelines?: Array<{
    id: string;
    name: string;
    stages?: Array<{ id: string; key: string; name: string }>;
  }>;
}) {
  const { hasAddPermission } = useAdminPermissions();
  const canAdd = hasAddPermission("/admin/leads");
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [sortKey, setSortKey] = useState<"createdAt" | "score" | "name">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const initialPipelineId = pipelines[0]?.id || "";
  const initialStage = pipelines[0]?.stages?.[0]?.key || "NEW";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    countryCode: "+91",
    phone: "",
    ownerId: "",
    lifecycleStage: "Lead",
    leadStatus: "NEW",
    propertyId: "",
    pipelineId: initialPipelineId,
    stage: initialStage,
    source: "Website",
    notes: "",
  });

  const activeListMeta = SMART_LISTS.find((s) => s.id === activeList) ?? SMART_LISTS[0];

  const selectedPipeline = useMemo(() => {
    return pipelines.find((p) => p.id === formData.pipelineId) || pipelines[0];
  }, [pipelines, formData.pipelineId]);

  async function handleCreateLead(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    const trimName = formData.name.trim();
    if (!trimName || trimName.length < 2) {
      setFormError("Full Name must be at least 2 characters.");
      return;
    }
    if (/\d/.test(trimName)) {
      setFormError("Full Name cannot contain numbers.");
      return;
    }
    const wordCount = trimName.split(/\s+/).filter(Boolean).length;
    if (wordCount > 30) {
      setFormError("Full Name cannot exceed 30 words.");
      return;
    }

    const emailVal = formData.email.trim().toLowerCase();
    if (!emailVal) {
      setFormError("Email address is required.");
      return;
    }
    if (!emailVal.includes("@")) {
      setFormError("Email address must contain '@'.");
      return;
    }
    if (!/.+@.+\..+/.test(emailVal)) {
      setFormError("Please enter a valid email address (e.g. user@domain.com).");
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length !== 10) {
      setFormError("Phone number must be strictly 10 digits.");
      return;
    }

    setSubmitting(true);

    try {
      const formattedPhone = cleanPhone ? `${formData.countryCode} ${cleanPhone}` : null;
      let notesWithTimestamp = formData.notes.trim();
      if (notesWithTimestamp) {
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        notesWithTimestamp = `[Saved ${dateStr}] ${notesWithTimestamp}`;
      }

      const payload = {
        name: trimName,
        email: emailVal,
        phone: formattedPhone,
        ownerId: formData.ownerId || null,
        lifecycleStage: formData.lifecycleStage,
        leadStatus: formData.leadStatus,
        propertyId: formData.propertyId || null,
        stage: formData.stage,
        source: formData.source,
        notes: notesWithTimestamp || null,
        ...(formData.pipelineId ? { requirements: JSON.stringify({ pipelineId: formData.pipelineId }) } : {}),
      };

      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setSubmitting(false);

      if (!res.ok) {
        setFormError(data.error || "Failed to create lead. Please check details.");
        return;
      }

      setFormSuccess("Lead created successfully!");
      setTimeout(() => {
        setIsCreateOpen(false);
        setFormSuccess("");
        setFormData({
          name: "",
          email: "",
          countryCode: "+91",
          phone: "",
          ownerId: "",
          lifecycleStage: "Lead",
          leadStatus: "NEW",
          propertyId: "",
          pipelineId: initialPipelineId,
          stage: initialStage,
          source: "Website",
          notes: "",
        });
        router.refresh();
      }, 1000);
    } catch {
      setSubmitting(false);
      setFormError("Network error. Please try again.");
    }
  }

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
      formatDateString(l.createdAt),
      formatDateString(l.nextFollowUpAt),
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

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([filtered]);

  const hasActiveFilters = search !== "" || stageFilter !== "" || sourceFilter !== "";
  const clearAllFilters = () => {
    setSearch("");
    setStageFilter("");
    setSourceFilter("");
  };

  return (
    <div className="space-y-6">
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
                {canAdd && (
                  <Button variant="gold" onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4" />
                    New lead
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <Filter className="h-3.5 w-3.5" />
                Filters
              </div>
              <div className="flex items-center gap-2">
                <TableScrollButtons
                  canScrollLeft={canScrollLeft}
                  canScrollRight={canScrollRight}
                  onScroll={scroll}
                />
                <button
                  type="button"
                  onClick={clearAllFilters}
                  disabled={!hasActiveFilters}
                  title={hasActiveFilters ? "Clear all filters" : "No filters applied"}
                  className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed ${
                    hasActiveFilters
                      ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20"
                      : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                  }`}
                >
                  <X className="h-4 w-4 stroke-[2.5]" /> Clear All
                </button>
              </div>
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
            <div ref={tableScrollRef} className="overflow-x-auto">
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
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap" suppressHydrationWarning>
                          {formatDateString(l.createdAt)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" suppressHydrationWarning>
                          {l.nextFollowUpAt ? (
                            <span className={overdue ? "text-red-600 font-medium text-xs" : "text-slate-600 text-xs"}>
                              {formatDateString(l.nextFollowUpAt)}
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

      {/* Create Lead Modal Dialog */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold-dark dark:text-gold border border-gold/30">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans text-xl font-bold text-slate-900 dark:text-white tracking-tight">Create New Lead</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add a new opportunity directly to your CRM database</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateLead} className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {formError && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-gold outline-none"
                />
              </div>

              {/* 2. Email */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="rahul@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-gold outline-none"
                />
              </div>

              {/* 3. Phone number */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Phone number
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.countryCode}
                    onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-gold outline-none shrink-0 max-w-[110px]"
                  >
                    {WORLD_COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="8319549581"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:border-gold outline-none"
                  />
                </div>
              </div>

              {/* 4. Contact Owner / Agent */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Contact Owner / Agent
                </label>
                <select
                  value={formData.ownerId}
                  onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-gold outline-none"
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Lifecycle Stage */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Lifecycle Stage
                </label>
                <select
                  value={formData.lifecycleStage}
                  onChange={(e) => setFormData({ ...formData, lifecycleStage: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-gold outline-none"
                >
                  {LIFECYCLE_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Lead Status */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Lead Status
                </label>
                <select
                  value={formData.leadStatus}
                  onChange={(e) => setFormData({ ...formData, leadStatus: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-gold outline-none"
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 7. Interested Property */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Interested Property
                </label>
                <select
                  value={formData.propertyId}
                  onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-gold outline-none"
                >
                  <option value="">Select Property (Optional)</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.symbol} - {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 8. Pipeline */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Pipeline
                </label>
                <select
                  value={formData.pipelineId}
                  onChange={(e) => {
                    const pipeId = e.target.value;
                    const pipe = pipelines.find((p) => p.id === pipeId);
                    const firstStageKey = pipe?.stages?.[0]?.key || "NEW";
                    setFormData((x) => ({ ...x, pipelineId: pipeId, stage: firstStageKey }));
                  }}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-gold outline-none"
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 9. Pipeline Stage */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Pipeline Stage
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-gold outline-none"
                >
                  {selectedPipeline?.stages && selectedPipeline.stages.length > 0
                    ? selectedPipeline.stages.map((stg) => (
                        <option key={stg.id || stg.key} value={stg.key}>
                          {stg.name} ({stg.key})
                        </option>
                      ))
                    : CRM_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {stageLabel(s, stageLabels)}
                        </option>
                      ))}
                </select>
              </div>

              {/* 10. Lead Source */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Lead Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:border-gold outline-none"
                >
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* 11. Notes / Requirements */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Requirements
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Looking for land parcel or 3BHK under ₹80 Lakhs..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs font-medium text-slate-900 dark:text-white focus:border-gold outline-none"
                />
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-slate-950 text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  <span>{submitting ? "Creating..." : "Create Lead"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
