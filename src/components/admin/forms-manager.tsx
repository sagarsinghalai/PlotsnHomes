"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Copy, Share2, Code2, BarChart3, Pencil, Eye, Send } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { FormDef, FormField, FormFieldType, FormMetrics } from "@/lib/forms-store";

type FormWithMetrics = FormDef & { metrics: FormMetrics };

const FIELD_TYPES: { type: FormFieldType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "email", label: "Email" },
  { type: "phone", label: "Phone" },
  { type: "number", label: "Number" },
  { type: "textarea", label: "Paragraph" },
  { type: "select", label: "Dropdown" },
  { type: "checkbox", label: "Checkbox" },
];

function newField(): FormField {
  return { id: `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`, label: "New field", type: "text", required: false };
}

export function FormsManager({ initialForms }: { initialForms: FormWithMetrics[] }) {
  const toast = useToast();
  const [forms, setForms] = useState<FormWithMetrics[]>(initialForms);
  const [editing, setEditing] = useState<FormDef | null>(null);
  const [origin, setOrigin] = useState("");
  const [analyticsFor, setAnalyticsFor] = useState<string | null>(null);

  useEffect(() => setOrigin(window.location.origin), []);

  async function refresh() {
    try {
      const data = await fetch("/api/admin/forms", { cache: "no-store" }).then((r) => r.json());
      if (data.forms) setForms(data.forms);
    } catch {}
  }

  function startNew() {
    setEditing({
      id: "", name: "", slug: "", description: "", fields: [newField()],
      settings: { submitText: "Submit", successMessage: "Thanks! Your response has been recorded.", createLead: true, resetOnRefresh: true, refreshSeconds: 0 },
      createdAt: "", updatedAt: "",
    } as FormDef);
  }

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) { toast.error("Give your form a name."); return; }
    try {
      const res = await fetch("/api/admin/forms", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not save.");
      toast.success("Form saved.");
      setEditing(null);
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Could not save the form.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this form? Its submissions are kept but the form stops accepting responses.")) return;
    await fetch(`/api/admin/forms?id=${id}`, { method: "DELETE" });
    setForms((f) => f.filter((x) => x.id !== id));
    toast.success("Form deleted.");
  }

  if (editing) return <FormEditor form={editing} setForm={setEditing as any} onSave={save} onCancel={() => setEditing(null)} />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={startNew} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover">
          <Plus className="h-4 w-4" /> New form
        </button>
      </div>

      {forms.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center text-sm text-slate-500">
          No forms yet. Create one to start collecting leads and information.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {forms.map((f) => {
          const conv = f.metrics.views ? Math.round((f.metrics.submissions / f.metrics.views) * 100) : 0;
          const link = `${origin}/f/${f.slug}`;
          const embed = `<iframe src="${origin}/f/${f.slug}?embed=1" style="width:100%;border:0;min-height:520px" title="${f.name}"></iframe>`;
          return (
            <div key={f.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{f.name}</h3>
                  <p className="font-mono text-xs text-brand-hover">/f/{f.slug}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditing(f)} title="Edit" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(f.id)} title="Delete" className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>

              {/* Analytics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat icon={<Eye className="h-3.5 w-3.5" />} label="Views" value={f.metrics.views} />
                <Stat icon={<Send className="h-3.5 w-3.5" />} label="Submissions" value={f.metrics.submissions} />
                <Stat icon={<BarChart3 className="h-3.5 w-3.5" />} label="Conversion" value={`${conv}%`} />
              </div>

              {/* Share + embed */}
              <div className="space-y-2">
                <CopyRow icon={<Share2 className="h-3.5 w-3.5" />} label="Share link" value={link} onCopy={() => toast.success("Link copied.")} />
                <CopyRow icon={<Code2 className="h-3.5 w-3.5" />} label="Embed code" value={embed} onCopy={() => toast.success("Embed code copied.")} mono />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                <span className="text-slate-500">{f.fields.length} fields</span>
                <button onClick={() => setAnalyticsFor(analyticsFor === f.id ? null : f.id)} className="font-semibold text-brand-hover hover:underline">
                  {analyticsFor === f.id ? "Hide submissions" : "View submissions"}
                </button>
              </div>

              {analyticsFor === f.id && <Submissions formId={f.id} fields={f.fields} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 py-2">
      <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{icon}{label}</div>
      <div className="text-lg font-extrabold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}

function CopyRow({ icon, label, value, onCopy, mono }: { icon: React.ReactNode; label: string; value: string; onCopy: () => void; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex w-28 shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{icon}{label}</span>
      <input readOnly value={value} className={`min-w-0 flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 py-1.5 text-[11px] text-slate-600 dark:text-slate-300 ${mono ? "font-mono" : ""}`} onFocus={(e) => e.currentTarget.select()} />
      <button type="button" onClick={() => { navigator.clipboard?.writeText(value); onCopy(); }} className="rounded-lg border border-slate-200 dark:border-slate-800 p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><Copy className="h-3.5 w-3.5" /></button>
    </div>
  );
}

function Submissions({ formId, fields }: { formId: string; fields: FormField[] }) {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    fetch(`/api/admin/forms/submissions?id=${formId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRows(d.submissions || []))
      .catch(() => setRows([]));
  }, [formId]);

  if (rows === null) return <p className="pt-2 text-xs text-slate-400">Loading…</p>;
  if (rows.length === 0) return <p className="pt-2 text-xs text-slate-400">No submissions yet.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
      <table className="w-full text-left text-[11px]">
        <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500">
          <tr>
            <th className="px-2 py-1.5 font-semibold">When</th>
            {fields.map((f) => <th key={f.id} className="px-2 py-1.5 font-semibold">{f.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.slice(0, 50).map((r) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap px-2 py-1.5 text-slate-400">{new Date(r.createdAt).toLocaleString()}</td>
              {fields.map((f) => <td key={f.id} className="px-2 py-1.5 text-slate-700 dark:text-slate-300">{r.data?.[f.id] || "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormEditor({ form, setForm, onSave, onCancel }: { form: FormDef; setForm: (f: FormDef) => void; onSave: () => void; onCancel: () => void }) {
  const set = (patch: Partial<FormDef>) => setForm({ ...form, ...patch });
  const setField = (id: string, patch: Partial<FormField>) =>
    setForm({ ...form, fields: form.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  const addField = () => setForm({ ...form, fields: [...form.fields, newField()] });
  const removeField = (id: string) => setForm({ ...form, fields: form.fields.filter((f) => f.id !== id) });
  const moveField = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= form.fields.length) return;
    const fields = [...form.fields];
    [fields[i], fields[j]] = [fields[j], fields[i]];
    setForm({ ...form, fields });
  };
  const cls = "w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{form.id ? "Edit form" : "New form"}</h2>
        <div className="flex gap-2">
          <button onClick={onCancel} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Cancel</button>
          <button onClick={onSave} className="rounded-xl bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-hover">Save form</button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Form name</label><input className={cls} value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Contact us" /></div>
          <div><label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">URL slug (optional)</label><input className={cls} value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder="auto from name" /></div>
        </div>
        <div><label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Description (optional)</label><input className={cls} value={form.description || ""} onChange={(e) => set({ description: e.target.value })} /></div>
      </div>

      {/* Fields builder */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fields</h3>
          <button onClick={addField} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-brand"><Plus className="h-3.5 w-3.5" /> Add field</button>
        </div>
        <div className="space-y-2">
          {form.fields.map((f, i) => (
            <div key={f.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button onClick={() => moveField(i, -1)} className="text-slate-400 hover:text-brand disabled:opacity-30" disabled={i === 0}>▲</button>
                  <button onClick={() => moveField(i, 1)} className="text-slate-400 hover:text-brand disabled:opacity-30" disabled={i === form.fields.length - 1}>▼</button>
                </div>
                <input className={cls + " flex-1"} value={f.label} onChange={(e) => setField(f.id, { label: e.target.value })} placeholder="Field label" />
                <select className={cls + " w-32"} value={f.type} onChange={(e) => setField(f.id, { type: e.target.value as FormFieldType })}>
                  {FIELD_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
                </select>
                <label className="flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={!!f.required} onChange={(e) => setField(f.id, { required: e.target.checked })} /> Req</label>
                <button onClick={() => removeField(f.id)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              {f.type === "select" && (
                <input className={cls} value={(f.options || []).join(", ")} onChange={(e) => setField(f.id, { options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="Options, comma separated" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Settings</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Submit button text</label><input className={cls} value={form.settings.submitText || ""} onChange={(e) => set({ settings: { ...form.settings, submitText: e.target.value } })} /></div>
          <div><label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Auto-refresh timer (seconds, 0 = off)</label><input type="number" min={0} className={cls} value={form.settings.refreshSeconds || 0} onChange={(e) => set({ settings: { ...form.settings, refreshSeconds: Number(e.target.value) || 0 } })} /></div>
        </div>
        <div><label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">Success message</label><input className={cls} value={form.settings.successMessage || ""} onChange={(e) => set({ settings: { ...form.settings, successMessage: e.target.value } })} /></div>
        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={!!form.settings.createLead} onChange={(e) => set({ settings: { ...form.settings, createLead: e.target.checked } })} /> Create a CRM lead on submit</label>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"><input type="checkbox" checked={form.settings.resetOnRefresh !== false} onChange={(e) => set({ settings: { ...form.settings, resetOnRefresh: e.target.checked } })} /> Reset fields after page refresh</label>
        </div>
      </div>
    </div>
  );
}
