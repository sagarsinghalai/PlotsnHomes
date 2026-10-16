"use client";

import { Loader2, Save, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

// Mirrors AudienceFilters in src/lib/audiences.ts
type Base = "leads" | "customers" | "agents";
type Filters = {
  base: Base;
  leadStages?: string[];
  sources?: string[];
  ownerIds?: string[];
  createdFrom?: string;
  createdTo?: string;
  roles?: string[];
  activeStatus?: "active" | "inactive" | "any";
  kycStatus?: string[];
  city?: string;
  nameSearch?: string;
  transactionTypes?: string[];
  paymentStatus?: string[];
  propertySearch?: string;
  propertyTypes?: string[];
  developerIds?: string[];
  projectIds?: string[];
  agentIds?: string[];
};

type Options = {
  sources: string[];
  agents: { id: string; name: string; role: string }[];
  developers: { id: string; name: string }[];
  projects: { id: string; name: string; developerId: string | null }[];
  leadStages: string[];
  transactionTypes: string[];
  propertyTypes: string[];
  roles: string[];
  kycStatuses: string[];
  paymentStatuses: string[];
};

type SavedAudience = { id: string; name: string; filters: Filters; createdAt: string };

const pretty = (s: string) =>
  s.replace(/_/g, " ").replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());

/** A wrap of toggle-able pills for multi-select of string values. */
function PillGroup({
  options,
  selected,
  onToggle,
  labels,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  labels?: Record<string, string>;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.value)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              on
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
            }`}
          >
            {labels?.[o.value] ?? o.label}
          </button>
        );
      })}
    </div>
  );
}

type Props = {
  subject: string;
  html: string;
  onAudienceChange?: () => void;
  selectedAudienceKey?: string;
  onSelectAudienceKey?: (key: string) => void;
};

export function EmailAudienceBuilder({
  subject,
  html,
  onAudienceChange,
  selectedAudienceKey,
  onSelectAudienceKey,
}: Props) {
  const [options, setOptions] = useState<Options | null>(null);
  const [saved, setSaved] = useState<SavedAudience[]>([]);
  const [filters, setFilters] = useState<Filters>({ base: "leads", activeStatus: "any" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");

  const [preview, setPreview] = useState<{ count: number; sample: { name: string; phone: string }[] } | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const loadSaved = useCallback(async () => {
    const res = await fetch("/api/admin/audiences", { cache: "no-store" });
    if (res.ok) {
      setSaved((await res.json()).audiences ?? []);
      onAudienceChange?.();
    }
  }, [onAudienceChange]);

  useEffect(() => {
    fetch("/api/admin/audiences/options", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setOptions(d))
      .catch(() => {});
    void loadSaved();
  }, [loadSaved]);

  useEffect(() => {
    if (!selectedAudienceKey) return;
    if (selectedAudienceKey.startsWith("saved:")) {
      const id = selectedAudienceKey.replace(/^saved:/, "");
      const found = saved.find((a) => a.id === id);
      if (found && editingId !== found.id) {
        setFilters({ activeStatus: "any", ...found.filters });
        setName(found.name);
        setEditingId(found.id);
        setPreview(null);
        setMsg(`Loaded "${found.name}" — edit and re-save, or broadcast email.`);
      }
    } else if (selectedAudienceKey === "leads" || selectedAudienceKey === "customers" || selectedAudienceKey === "agents") {
      if (filters.base !== selectedAudienceKey || editingId !== null) {
        setFilters({ base: selectedAudienceKey as Base, activeStatus: "any" });
        setName("");
        setEditingId(null);
        setPreview(null);
      }
    }
  }, [selectedAudienceKey, saved, editingId, filters.base]);

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPreview(null);
  }

  function toggle(key: keyof Filters, value: string) {
    setFilters((f) => {
      const arr = (f[key] as string[] | undefined) ?? [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      return { ...f, [key]: next };
    });
    setPreview(null);
  }

  async function runPreview() {
    setPreviewBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/audiences/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      const data = await res.json();
      if (res.ok) setPreview(data);
      else setMsg(data.error ?? "Preview failed.");
    } finally {
      setPreviewBusy(false);
    }
  }

  async function saveAudience() {
    if (!name.trim()) {
      setMsg("Give the audience a name to save it.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId ?? undefined, name: name.trim(), filters }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsg(`Saved audience "${data.audience.name}".`);
        setEditingId(data.audience.id);
        onSelectAudienceKey?.(`saved:${data.audience.id}`);
        await loadSaved();
      } else {
        setMsg(data.error ?? "Save failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  function loadAudience(a: SavedAudience) {
    setFilters({ activeStatus: "any", ...a.filters });
    setName(a.name);
    setEditingId(a.id);
    setPreview(null);
    setMsg(`Loaded "${a.name}" — edit and re-save, or broadcast email.`);
    onSelectAudienceKey?.(`saved:${a.id}`);
  }

  function newAudience() {
    setFilters({ base: "leads", activeStatus: "any" });
    setName("");
    setEditingId(null);
    setPreview(null);
    setMsg("");
    onSelectAudienceKey?.("leads");
  }

  async function deleteAudience(id: string) {
    await fetch(`/api/admin/audiences?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (editingId === id) newAudience();
    await loadSaved();
  }

  async function broadcast(payload: object, label: string) {
    if (!subject.trim()) {
      setMsg("Write a subject line above before broadcasting.");
      return;
    }
    if (!html.trim()) {
      setMsg("Write an email body above before broadcasting.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/emails/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html, ...payload }),
      });
      const data = await res.json();
      const s = data.summary;
      setMsg(
        s
          ? `${label}: ${s.sent} sent, ${s.failed} failed (of ${s.total}).`
          : (data.error ?? "Broadcast failed."),
      );
    } finally {
      setBusy(false);
    }
  }

  if (!options) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading audience filters…
      </div>
    );
  }

  const base = filters.base;
  const pill = (v: string) => ({ value: v, label: pretty(v) });

  const selectedDevs = filters.developerIds ?? [];
  const projectOptions = selectedDevs.length
    ? options.projects.filter((p) => p.developerId && selectedDevs.includes(p.developerId))
    : options.projects;

  return (
    <div className="space-y-4 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-600" />
          <p className="text-sm font-semibold text-indigo-900">Audience builder &amp; segments</p>
        </div>
        <button type="button" onClick={newAudience} className="text-xs text-slate-500 hover:text-slate-800">
          + New
        </button>
      </div>

      {/* Saved audiences */}
      {saved.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {saved.map((a) => (
            <div
              key={a.id}
              className={`flex items-center gap-1 rounded-lg border bg-white px-2 py-1 text-xs ${
                editingId === a.id ? "border-indigo-400" : "border-slate-200"
              }`}
            >
              <button type="button" onClick={() => loadAudience(a)} className="font-medium text-slate-700">
                {a.name}
              </button>
              <button
                type="button"
                onClick={() => void broadcast({ audienceId: a.id }, a.name)}
                className="rounded bg-indigo-600 px-1.5 py-0.5 text-white hover:bg-indigo-700"
                title="Broadcast email to this saved audience"
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => void deleteAudience(a.id)}
                className="text-slate-300 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Base selector */}
      <div>
        <Label>Who to message</Label>
        <div className="mt-1 flex gap-2">
          {(["leads", "customers", "agents"] as const).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => set("base", b)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
                base === b ? "bg-indigo-600 text-white" : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-2">
        {base === "leads" && (
          <>
            <div className="space-y-1 sm:col-span-2">
              <Label>Lead status</Label>
              <PillGroup
                options={options.leadStages.map(pill)}
                selected={filters.leadStages ?? []}
                onToggle={(v) => toggle("leadStages", v)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Sources</Label>
              <PillGroup
                options={options.sources.map((s) => ({ value: s, label: s }))}
                selected={filters.sources ?? []}
                onToggle={(v) => toggle("sources", v)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Assigned agent (owner)</Label>
              <PillGroup
                options={options.agents.map((a) => ({ value: a.id, label: a.name }))}
                selected={filters.ownerIds ?? []}
                onToggle={(v) => toggle("ownerIds", v)}
              />
            </div>
            <div className="space-y-1">
              <Label>Generated from</Label>
              <Input type="date" value={filters.createdFrom ?? ""} onChange={(e) => set("createdFrom", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Generated to</Label>
              <Input type="date" value={filters.createdTo ?? ""} onChange={(e) => set("createdTo", e.target.value)} />
            </div>
          </>
        )}

        {base === "customers" && (
          <>
            <div className="space-y-1">
              <Label>Type</Label>
              <PillGroup
                options={options.roles.map((r) => ({ value: r, label: r === "BUYER" ? "Buyers" : "Sellers" }))}
                selected={filters.roles ?? []}
                onToggle={(v) => toggle("roles", v)}
              />
            </div>
            <div className="space-y-1">
              <Label>Customer status</Label>
              <select
                value={filters.activeStatus ?? "any"}
                onChange={(e) => set("activeStatus", e.target.value as Filters["activeStatus"])}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm"
              >
                <option value="any">Any</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>KYC status</Label>
              <PillGroup
                options={options.kycStatuses.map((k) => ({
                  value: k,
                  label: k === "NONE" ? "No KYC" : pretty(k),
                }))}
                selected={filters.kycStatus ?? []}
                onToggle={(v) => toggle("kycStatus", v)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Transaction type</Label>
              <PillGroup
                options={options.transactionTypes.map(pill)}
                selected={filters.transactionTypes ?? []}
                onToggle={(v) => toggle("transactionTypes", v)}
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Payment status</Label>
              <PillGroup
                options={options.paymentStatuses.map((p) => ({ value: p, label: pretty(p) }))}
                selected={filters.paymentStatus ?? []}
                onToggle={(v) => toggle("paymentStatus", v)}
                labels={{ partial: "Partially paid", paid: "Fully paid" }}
              />
            </div>
            <div className="space-y-1">
              <Label>Location (city)</Label>
              <Input value={filters.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="Mumbai" />
            </div>
            <div className="space-y-1">
              <Label>Name contains</Label>
              <Input value={filters.nameSearch ?? ""} onChange={(e) => set("nameSearch", e.target.value)} placeholder="seller / buyer name" />
            </div>
          </>
        )}

        {base === "agents" && (
          <>
            <div className="space-y-1 sm:col-span-2">
              <Label>Agents</Label>
              <PillGroup
                options={options.agents.map((a) => ({ value: a.id, label: `${a.name} (${pretty(a.role)})` }))}
                selected={filters.agentIds ?? []}
                onToggle={(v) => toggle("agentIds", v)}
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <select
                value={filters.activeStatus ?? "any"}
                onChange={(e) => set("activeStatus", e.target.value as Filters["activeStatus"])}
                className="w-full rounded-lg border border-slate-200 p-2 text-sm"
              >
                <option value="any">Any</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </>
        )}

        {base !== "agents" && (
          <>
            <div className="space-y-1 sm:col-span-2">
              <Label>
                {base === "customers" ? "Interested in property (name / location / project)" : "Property (name / location / project)"}
              </Label>
              <Input
                value={filters.propertySearch ?? ""}
                onChange={(e) => set("propertySearch", e.target.value)}
                placeholder="e.g. Bandra, Sea View, BV-NY-0133"
              />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label>Property type</Label>
              <PillGroup
                options={options.propertyTypes.map(pill)}
                selected={filters.propertyTypes ?? []}
                onToggle={(v) => toggle("propertyTypes", v)}
              />
            </div>
            {options.developers.length > 0 && (
              <div className="space-y-1 sm:col-span-2">
                <Label>Builder / developer</Label>
                <PillGroup
                  options={options.developers.map((d) => ({ value: d.id, label: d.name }))}
                  selected={filters.developerIds ?? []}
                  onToggle={(v) => toggle("developerIds", v)}
                />
              </div>
            )}
            {projectOptions.length > 0 && (
              <div className="space-y-1 sm:col-span-2">
                <Label>Project</Label>
                <PillGroup
                  options={projectOptions.map((p) => ({ value: p.id, label: p.name }))}
                  selected={filters.projectIds ?? []}
                  onToggle={(v) => toggle("projectIds", v)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview + actions */}
      <div className="flex flex-wrap items-center gap-2 border-t border-indigo-100 pt-3">
        <Button type="button" variant="secondary" loading={previewBusy} onClick={() => void runPreview()}>
          Preview count
        </Button>
        {preview && (
          <span className="text-sm text-slate-700">
            <strong>{preview.count}</strong> recipient{preview.count === 1 ? "" : "s"}
            {preview.sample.length > 0 && (
              <span className="text-slate-400"> · {preview.sample.map((s) => s.name).slice(0, 3).join(", ")}
                {preview.count > 3 ? "…" : ""}
              </span>
            )}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Audience name (to save)"
          className="max-w-[220px]"
        />
        <Button type="button" variant="secondary" loading={busy} onClick={() => void saveAudience()}>
          <Save className="h-4 w-4" />
          {editingId ? "Update" : "Save"}
        </Button>
        <Button
          type="button"
          variant="gold"
          loading={busy}
          onClick={() => void broadcast({ filters }, "This segment")}
        >
          Broadcast email to this segment
        </Button>
      </div>

      {msg && <p className="text-sm text-slate-700 break-words">{msg}</p>}
    </div>
  );
}
