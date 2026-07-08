"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

type Slab = {
  id?: string;
  label: string;
  minYield: number;
  maxYield?: number | null;
  color: string;
  sortOrder: number;
  type?: string;
};

const COLOR_PRESETS = [
  { label: "Green",  value: "#16a34a" },
  { label: "Lime",   value: "#84cc16" },
  { label: "Yellow", value: "#eab308" },
  { label: "Orange", value: "#f97316" },
  { label: "Red",    value: "#ef4444" },
  { label: "Blue",   value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
];

const EMPTY_SLAB: Slab = {
  label: "",
  minYield: 0,
  maxYield: null,
  color: "#22c55e",
  sortOrder: 0,
};

const SLAB_TYPES = [
  { key: "yieldRate", label: "Yield & Rating" },
  { key: "capRate", label: "Cap Rate" },
  { key: "interestRate", label: "Interest Rate" },
  { key: "brokerageRate", label: "Brokerage Rate" },
  { key: "change7d", label: "7d Change" },
  { key: "change1m", label: "1m Change" },
  { key: "change6m", label: "6m Change" },
  { key: "changeYtd", label: "YTD Change" },
];

export function RatingSlabsManager({
  onSlabsUpdated,
}: {
  onSlabsUpdated?: () => void;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get("tab") || "yieldRate";

  const [slabs, setSlabs] = useState<Slab[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Slab>(EMPTY_SLAB);
  const [addMode, setAddMode] = useState(false);
  const [addForm, setAddForm] = useState<Slab>(EMPTY_SLAB);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const getMinMaxLabels = (tab: string) => {
    switch (tab) {
      case "yieldRate":
        return { min: "Min Yield %", max: "Max Yield %" };
      case "capRate":
        return { min: "Min Cap Rate %", max: "Max Cap Rate %" };
      case "interestRate":
        return { min: "Min Interest %", max: "Max Interest %" };
      case "brokerageRate":
        return { min: "Min Brokerage %", max: "Max Brokerage %" };
      default:
        return { min: "Min Change %", max: "Max Change %" };
    }
  };

  const labels = getMinMaxLabels(activeTab);

  function setActiveTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setEditId(null);
    setAddMode(false);
  }

  async function loadSlabs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/rating-slabs?type=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setSlabs(data);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlabs();
  }, [activeTab]);

  function flash(m: string, isError = false) {
    if (isError) setError(m); else setMsg(m);
    setTimeout(() => { setMsg(""); setError(""); }, 3000);
  }

  async function saveSlab(slab: Slab) {
    setSaving(slab.id ?? "new");
    const url = slab.id ? `/api/admin/rating-slabs/${slab.id}` : "/api/admin/rating-slabs";
    const method = slab.id ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...slab, type: activeTab }),
    });
    setSaving(null);
    if (!res.ok) { flash("Save failed", true); return; }
    flash(slab.id ? "Slab updated." : "Slab added.");
    setEditId(null);
    setAddMode(false);
    setAddForm(EMPTY_SLAB);
    await loadSlabs();
    if (onSlabsUpdated) {
      onSlabsUpdated();
    }
  }

  async function removeSlab(id: string) {
    if (!confirm("Delete this slab?")) return;
    setDeleting(id);
    const res = await fetch(`/api/admin/rating-slabs/${id}`, { method: "DELETE" });
    setDeleting(null);
    if (!res.ok) { flash("Delete failed", true); return; }
    flash("Slab deleted.");
    await loadSlabs();
    if (onSlabsUpdated) {
      onSlabsUpdated();
    }
  }

  function startEdit(slab: Slab) {
    setEditId(slab.id ?? null);
    setEditForm({ ...slab });
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm(EMPTY_SLAB);
  }

  function SlabForm({
    form,
    setForm,
    onSave,
    onCancel,
    isSaving,
  }: {
    form: Slab;
    setForm: (s: Slab) => void;
    onSave: () => void;
    onCancel: () => void;
    isSaving: boolean;
  }) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Badge / Label</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder={activeTab === "yieldRate" ? "A+" : "High"}
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">{labels.min}</label>
          <input
            type="number"
            step="0.1"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={form.minYield}
            onChange={(e) => setForm({ ...form, minYield: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">{labels.max} <span className="text-slate-400">(optional)</span></label>
          <input
            type="number"
            step="0.1"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="No max"
            value={form.maxYield ?? ""}
            onChange={(e) => setForm({ ...form, maxYield: e.target.value ? parseFloat(e.target.value) : null })}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block mb-1">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="h-9 w-12 rounded border border-slate-200 cursor-pointer"
            />
            <select
              className="flex-1 rounded-lg border border-slate-200 px-2 py-2 text-xs"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            >
              {COLOR_PRESETS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || !form.label}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            <Check className="h-4 w-4" />
            {isSaving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Custom Slabs Configuration</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure thresholds, labels, and colors for different metrics across the platform.
          </p>
        </div>
        {!addMode && (
          <Button
            type="button"
            variant="gold"
            onClick={() => { setAddMode(true); setAddForm({ ...EMPTY_SLAB, sortOrder: slabs.length }); }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Slab
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {SLAB_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition uppercase tracking-wider ${
              activeTab === t.key
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && <p className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm text-emerald-700">{msg}</p>}
      {error && <p className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</p>}

      {/* Slab Application info card */}
      <div className="rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-4">
        <p className="text-sm font-semibold text-amber-800 mb-1">📐 Slabs logic for {SLAB_TYPES.find(t => t.key === activeTab)?.label}</p>
        <p className="text-xs text-amber-600">
          {activeTab === "yieldRate" && "These slabs determine the automatic Market Rating (A+, A, B+, B, C) of a property based on its computed annual yield."}
          {activeTab === "capRate" && "These slabs define the classification and badge color for Cap Rate values on properties."}
          {activeTab === "interestRate" && "These slabs define the classification and badge color for Interest Rate values on properties."}
          {activeTab === "brokerageRate" && "These slabs define the classification and badge color for Brokerage Rate values on properties."}
          {activeTab.startsWith("change") && `These slabs define the badge color and label for the ${SLAB_TYPES.find(t => t.key === activeTab)?.label} values.`}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading slabs…</div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-5 gap-3 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span className="col-span-1">Badge / Label</span>
            <span>{labels.min}</span>
            <span>{labels.max}</span>
            <span>Color</span>
            <span>Actions</span>
          </div>

          {slabs.map((slab) =>
            editId === slab.id ? (
              <SlabForm
                key={slab.id}
                form={editForm}
                setForm={setEditForm}
                onSave={() => saveSlab(editForm)}
                onCancel={cancelEdit}
                isSaving={saving === slab.id}
              />
            ) : (
              <div
                key={slab.id ?? slab.label}
                className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="col-span-1">
                  <span
                    className="inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-bold text-white shadow-sm"
                    style={{ backgroundColor: slab.color }}
                  >
                    {slab.label}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  {slab.minYield}%
                  <span className="ml-1 text-xs text-slate-400 font-normal">&amp; above</span>
                </div>
                <div className="text-sm text-slate-600">
                  {slab.maxYield != null ? `${slab.maxYield}%` : <span className="text-slate-400">No limit</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: slab.color }} />
                  <span className="text-xs text-slate-500">{slab.color}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(slab)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  {slab.id && (
                    <button
                      type="button"
                      onClick={() => removeSlab(slab.id!)}
                      disabled={deleting === slab.id}
                      className="flex items-center gap-1 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deleting === slab.id ? "…" : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            )
          )}

          {slabs.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-sm">
              No slabs configured for this section. Add your first slab above.
            </div>
          )}
        </div>
      )}

      {/* Add new slab form */}
      {addMode && (
        <SlabForm
          form={addForm}
          setForm={setAddForm}
          onSave={() => saveSlab(addForm)}
          onCancel={() => { setAddMode(false); setAddForm(EMPTY_SLAB); }}
          isSaving={saving === "new"}
        />
      )}
    </div>
  );
}
