"use client";

import { useEffect, useState } from "react";
import { validateFormValue, type FormDef } from "@/lib/forms-store";
import { COUNTRY_DIAL_CODES, dialCodeLabel } from "@/lib/country-codes";

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
    // Client-side validation (the server re-checks).
    for (const f of form.fields) {
      const err = validateFormValue(f, values[f.id] || "");
      if (err) { setError(err); return; }
    }
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

      {form.fields.map((f) => {
        const val = values[f.id] || "";
        return (
        <div key={f.id}>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {f.label}
            {f.required && <span className="ml-0.5 text-rose-500">*</span>}
          </label>
          {f.type === "textarea" ? (
            <textarea rows={4} required={f.required} placeholder={f.placeholder} value={val} onChange={(e) => set(f.id, e.target.value)} className={inputCls} />
          ) : f.type === "select" ? (
            <select required={f.required} value={val} onChange={(e) => set(f.id, e.target.value)} className={inputCls}>
              <option value="">Select…</option>
              {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : f.type === "radio" ? (
            <div className="space-y-1.5">
              {(f.options || []).map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" name={f.id} checked={val === o} onChange={() => set(f.id, o)} className="h-4 w-4 border-slate-300 text-brand focus:ring-brand" />
                  {o}
                </label>
              ))}
            </div>
          ) : f.type === "checkboxGroup" ? (
            <div className="space-y-1.5">
              {(f.options || []).map((o) => {
                const chosen = val ? val.split("|").filter(Boolean) : [];
                const on = chosen.includes(o);
                return (
                  <label key={o} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={on} onChange={(e) => {
                      const next = e.target.checked ? [...chosen, o] : chosen.filter((x) => x !== o);
                      set(f.id, next.join("|"));
                    }} className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
                    {o}
                  </label>
                );
              })}
            </div>
          ) : f.type === "checkbox" ? (
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={val === "yes"} onChange={(e) => set(f.id, e.target.checked ? "yes" : "")} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" />
              <span>{f.placeholder || "I agree"}</span>
            </label>
          ) : f.type === "phone" ? (
            (() => {
              const parts = val.split(" ");
              const cc = parts[0] && parts[0].startsWith("+") ? parts[0] : "+91";
              const digits = (parts.slice(1).join("") || (parts[0]?.startsWith("+") ? "" : parts[0] || "")).replace(/\D/g, "");
              return (
                <div className="flex gap-2">
                  <select value={cc} onChange={(e) => set(f.id, `${e.target.value} ${digits}`)} className={inputCls + " max-w-[160px] shrink-0"}>
                    {COUNTRY_DIAL_CODES.map((c) => <option key={`${c.code}-${c.name}`} value={c.code}>{dialCodeLabel(c)}</option>)}
                  </select>
                  <input type="tel" inputMode="numeric" maxLength={10} required={f.required} placeholder={f.placeholder || "10-digit number"} value={digits}
                    onChange={(e) => set(f.id, `${cc} ${e.target.value.replace(/\D/g, "").slice(0, 10)}`)} className={inputCls} />
                </div>
              );
            })()
          ) : (
            <input
              type={f.type === "number" ? "number" : f.type === "email" ? "email" : "text"}
              required={f.required}
              placeholder={f.placeholder}
              value={val}
              onChange={(e) => set(f.id, f.validate === "letters" ? e.target.value.replace(/[^A-Za-z\s.'-]/g, "") : e.target.value)}
              className={inputCls}
            />
          )}
        </div>
        );
      })}

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
