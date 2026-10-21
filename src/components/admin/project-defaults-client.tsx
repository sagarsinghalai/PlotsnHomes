"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Check, Save, Sparkles, Hammer, FileText, Phone, MapPin } from "lucide-react";
import type { CatalogItem, ProjectFieldDefaults } from "@/lib/site-settings";

type CatKey = keyof ProjectFieldDefaults;

const TABS: { key: CatKey; label: string; icon: any; hasValue: boolean; valueLabel?: string; addLabel: string }[] = [
  { key: "amenities", label: "Amenities", icon: Sparkles, hasValue: false, addLabel: "Add amenity" },
  { key: "specifications", label: "Specifications", icon: Hammer, hasValue: true, valueLabel: "Default value", addLabel: "Add specification" },
  { key: "documents", label: "Documents", icon: FileText, hasValue: false, addLabel: "Add document field" },
  { key: "salesFields", label: "Sales Fields", icon: Phone, hasValue: true, valueLabel: "Default value", addLabel: "Add sales field" },
  { key: "nearbyCategories", label: "Nearby Categories", icon: MapPin, hasValue: false, addLabel: "Add category" },
];

function toKey(label: string) {
  return label.trim().replace(/\s+(.)/g, (_m, c) => c.toUpperCase()).replace(/\s+/g, "").replace(/^(.)/, (_m, c) => c.toLowerCase()) || `item-${Date.now()}`;
}

export function ProjectDefaultsClient({ initial }: { initial: ProjectFieldDefaults }) {
  const [data, setData] = useState<ProjectFieldDefaults>(initial);
  const [active, setActive] = useState<CatKey>("amenities");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  const tab = TABS.find((t) => t.key === active)!;
  const items = data[active];

  const update = (next: CatalogItem[]) => setData((d) => ({ ...d, [active]: next }));

  function addItem() {
    const label = newLabel.trim();
    if (!label) return;
    update([...items, { key: toKey(label), label, ...(tab.hasValue ? { value: newValue.trim() } : {}), enabled: true }]);
    setNewLabel("");
    setNewValue("");
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/project-defaults", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || "Failed to save");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Project Field Defaults</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Master catalogs that pre-fill every new project. Enabled items appear by default; admins can still add/remove per project.</p>
        </div>
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved" : "Save Catalog"}
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-100">{error}</div>}

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActive(t.key)} className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${active === t.key ? "bg-brand text-white shadow-sm" : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-brand/50"}`}>
            <t.icon className="h-4 w-4" /> {t.label}
            <span className={`rounded-full px-1.5 text-[10px] ${active === t.key ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700"}`}>{data[t.key].filter((i) => i.enabled).length}/{data[t.key].length}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
        {/* Add row */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder={tab.addLabel} className="flex-1 min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
          {tab.hasValue && (
            <input value={newValue} onChange={(e) => setNewValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder={tab.valueLabel} className="flex-1 min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
          )}
          <button onClick={addItem} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover"><Plus className="h-4 w-4" /> Add</button>
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">No items yet. Add one above.</p>
        ) : (
          <div className="space-y-1.5">
            {items.map((it, idx) => (
              <div key={idx} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${it.enabled ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 opacity-60"}`}>
                <label className="inline-flex items-center gap-1.5 shrink-0 cursor-pointer" title="Enabled (pre-fills projects)">
                  <input type="checkbox" checked={it.enabled} onChange={(e) => { const next = [...items]; next[idx] = { ...it, enabled: e.target.checked }; update(next); }} className="rounded text-brand" />
                </label>
                <input value={it.label} onChange={(e) => { const next = [...items]; next[idx] = { ...it, label: e.target.value }; update(next); }} className="flex-1 min-w-0 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-slate-200 dark:focus:border-slate-700" />
                {tab.hasValue && (
                  <input value={it.value || ""} onChange={(e) => { const next = [...items]; next[idx] = { ...it, value: e.target.value }; update(next); }} placeholder="Default value" className="flex-[1.5] min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2 py-1 text-xs text-slate-600 dark:text-slate-300 outline-none focus:border-brand" />
                )}
                <button onClick={() => update(items.filter((_, i) => i !== idx))} className="shrink-0 p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
