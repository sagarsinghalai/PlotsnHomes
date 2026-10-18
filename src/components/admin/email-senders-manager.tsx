"use client";

import { useEffect, useState } from "react";
import { Mail, Plus, Trash2, Save, Loader2, CheckCircle2, Star } from "lucide-react";

type Sender = {
  id?: string;
  label: string;
  fromName: string;
  fromEmail: string;
  apiKey: string;      // blank means "keep existing"
  hasApiKey?: boolean;
};

const empty = (): Sender => ({ label: "", fromName: "", fromEmail: "", apiKey: "", hasApiKey: false });

export function EmailSendersManager() {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/email-senders");
      const data = await res.json();
      if (res.ok) { setSenders(data.senders ?? []); setActiveId(data.activeId ?? ""); }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function update(i: number, patch: Partial<Sender>) {
    setSenders((list) => list.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function addAccount() { setSenders((list) => [...list, empty()]); }
  function removeAccount(i: number) { setSenders((list) => list.filter((_, idx) => idx !== i)); }

  async function save() {
    setErr(""); setMsg("");
    // Require a label + email on every row.
    for (const s of senders) {
      if (!s.label.trim() || !s.fromEmail.trim()) { setErr("Each account needs a label and a from email."); return; }
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/email-senders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senders: senders.map((s) => ({ id: s.id, label: s.label, fromName: s.fromName, fromEmail: s.fromEmail, apiKey: s.apiKey })),
          activeId,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Could not save."); return; }
      setSenders(data.senders ?? []); setActiveId(data.activeId ?? "");
      setMsg("Email accounts saved.");
      setTimeout(() => setMsg(""), 3000);
    } finally { setSaving(false); }
  }

  const input = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400";

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <Mail className="h-5 w-5 text-slate-700" />
        <div>
          <h2 className="text-lg font-bold text-slate-900">Email Accounts</h2>
          <p className="text-xs text-slate-500">Add multiple “from” accounts and pick the one used to send notifications and meeting invites.</p>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-slate-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></p>
      ) : (
        <div className="mt-4 space-y-3">
          {senders.length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
              No email accounts yet. Add one to choose which address sends your emails.
              Until then, the system uses the default <code className="font-mono text-xs">EMAIL_FROM</code> from the environment.
            </p>
          )}

          {senders.map((s, i) => {
            const isActive = !!s.id && activeId === s.id;
            return (
              <div key={s.id ?? `new-${i}`} className={`rounded-xl border p-4 ${isActive ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => s.id && setActiveId(s.id)}
                    disabled={!s.id}
                    title={s.id ? "Use this account to send" : "Save first to make this account selectable"}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition ${isActive ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 disabled:opacity-50"}`}
                  >
                    {isActive ? <><CheckCircle2 className="h-3.5 w-3.5" /> Active — sends email</> : <><Star className="h-3.5 w-3.5" /> Use this account</>}
                  </button>
                  <button type="button" onClick={() => removeAccount(i)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50" title="Remove account"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Label</label>
                    <input value={s.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="Sales" className={input} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">From name</label>
                    <input value={s.fromName} onChange={(e) => update(i, { fromName: e.target.value })} placeholder="PlotsnHomes Sales" className={input} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">From email</label>
                    <input value={s.fromEmail} onChange={(e) => update(i, { fromEmail: e.target.value })} placeholder="sales@yourdomain.com" className={input} />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500">Resend API key <span className="font-normal text-slate-400">(optional)</span></label>
                    <input type="password" value={s.apiKey} onChange={(e) => update(i, { apiKey: e.target.value })}
                      placeholder={s.hasApiKey ? "•••••••• (leave blank to keep)" : "re_… (uses default key if blank)"} className={input} />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="button" onClick={addAccount} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50">
              <Plus className="h-4 w-4" /> Add account
            </button>
            <button type="button" onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save accounts
            </button>
            {msg && <span className="text-xs font-bold text-emerald-600">{msg}</span>}
            {err && <span className="text-xs font-bold text-rose-600">{err}</span>}
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            Each from address must belong to a domain you have verified in your email provider (Resend). An account with its own API key sends through that account; otherwise it uses the default key with the chosen from address.
          </p>
        </div>
      )}
    </section>
  );
}
