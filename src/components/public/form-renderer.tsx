"use client";

import { useEffect, useState } from "react";
import type { FormDef } from "@/lib/forms-store";

export function FormRenderer({ form, embed = false }: { form: FormDef; embed?: boolean }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const storeKey = `form_draft_${form.id}`;
  const persist = form.settings.resetOnRefresh === false; // default: reset on refresh

  // Restore a draft only when the form is configured NOT to reset on refresh.
  useEffect(() => {
    if (!persist) return;
    try {
      const raw = localStorage.getItem(storeKey);
      if (raw) setValues(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional auto-refresh timer.
  useEffect(() => {
    const secs = form.settings.refreshSeconds || 0;
    if (!secs || secs < 3) return;
    const t = setTimeout(() => window.location.reload(), secs * 1000);
    return () => clearTimeout(t);
  }, [form.settings.refreshSeconds]);

  function set(id: string, v: string) {
    setValues((prev) => {
      const next = { ...prev, [id]: v };
      if (persist) {
        try {
          localStorage.setItem(storeKey, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/forms/${form.slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not submit the form.");
      setDone(true);
      setValues({});
      try {
        localStorage.removeItem(storeKey);
      } catch {}
    } catch (err: any) {
      setError(err.message || "Could not submit the form.");
    } finally {
      setBusy(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  if (done) {
    return (
      <div className={`${embed ? "" : "mx-auto max-w-lg"} rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center`}>
        <p className="text-base font-semibold text-emerald-800">
          {form.settings.successMessage || "Thanks! Your response has been recorded."}
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-4 text-xs font-semibold text-emerald-700 underline"
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`${embed ? "" : "mx-auto max-w-lg"} space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm`}>
      {!embed && (
        <div className="mb-2">
          <h1 className="text-xl font-bold text-slate-900">{form.name}</h1>
          {form.description && <p className="mt-1 text-sm text-slate-500">{form.description}</p>}
        </div>
      )}

      {form.fields.map((f) => (
        <div key={f.id}>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {f.label}
            {f.required && <span className="ml-0.5 text-rose-500">*</span>}
          </label>
          {f.type === "textarea" ? (
            <textarea
              rows={4}
              required={f.required}
              placeholder={f.placeholder}
              value={values[f.id] || ""}
              onChange={(e) => set(f.id, e.target.value)}
              className={inputCls}
            />
          ) : f.type === "select" ? (
            <select
              required={f.required}
              value={values[f.id] || ""}
              onChange={(e) => set(f.id, e.target.value)}
              className={inputCls}
            >
              <option value="">Select…</option>
              {(f.options || []).map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : f.type === "checkbox" ? (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={values[f.id] === "yes"}
                onChange={(e) => set(f.id, e.target.checked ? "yes" : "")}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              />
              {f.placeholder || "Yes"}
            </label>
          ) : (
            <input
              type={f.type === "number" ? "number" : f.type === "email" ? "email" : f.type === "phone" ? "tel" : "text"}
              required={f.required}
              placeholder={f.placeholder}
              value={values[f.id] || ""}
              onChange={(e) => set(f.id, e.target.value)}
              className={inputCls}
            />
          )}
        </div>
      ))}

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {busy ? "Submitting…" : form.settings.submitText || "Submit"}
      </button>
    </form>
  );
}
