"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

type Def = { id: string; category: string; label: string; fieldType: string; options: string | null; required: boolean };

const TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Paragraph" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
];

export function CustomFieldsEditor({ category, initialDefs }: { category: string; initialDefs: Def[] }) {
  const toast = useToast();
  const [defs, setDefs] = useState<Def[]>(initialDefs);
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState("");
  const [busy, setBusy] = useState(false);
  const cls = "rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-brand";

  async function add() {
    if (!label.trim()) { toast.error("Enter a field label."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/custom-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, label, fieldType, required, options: fieldType === "select" ? options : "" }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not add field.");
      setDefs((d) => [...d, data.def]);
      setLabel(""); setRequired(false); setOptions(""); setFieldType("text");
      toast.success("Field added.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this field? Existing records keep their stored value but the field is removed from the form.")) return;
    await fetch(`/api/admin/custom-fields?id=${id}`, { method: "DELETE" });
    setDefs((d) => d.filter((x) => x.id !== id));
    toast.success("Field removed.");
  }

  return (
    <div className="space-y-5">
      {/* Existing fields */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
        {defs.length === 0 && <p className="p-5 text-sm text-slate-400">No custom fields yet.</p>}
        {defs.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-4">
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{d.label}</span>
              <span className="ml-2 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{d.fieldType}</span>
              {d.required && <span className="ml-1 text-[10px] font-bold text-rose-500">required</span>}
              {d.options && <span className="ml-2 text-[11px] text-slate-400">[{d.options}]</span>}
            </div>
            <button onClick={() => remove(d.id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {/* Add field */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Add a field</h3>
        <div className="flex flex-wrap items-center gap-2">
          <input className={cls + " flex-1 min-w-[160px]"} placeholder="Field label (e.g. LinkedIn URL)" value={label} onChange={(e) => setLabel(e.target.value)} />
          <select className={cls} value={fieldType} onChange={(e) => setFieldType(e.target.value)}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <label className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} /> Required</label>
          <button onClick={add} disabled={busy} className="inline-flex items-center gap-1 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60"><Plus className="h-4 w-4" /> Add</button>
        </div>
        {fieldType === "select" && (
          <input className={cls + " w-full"} placeholder="Dropdown options, comma separated" value={options} onChange={(e) => setOptions(e.target.value)} />
        )}
      </div>
    </div>
  );
}
