"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Check, Save, Copy, RefreshCw, Zap, Plug, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { LEAD_CHANNEL_ORDER, type LeadChannels, type LeadChannelKey } from "@/lib/lead-channels-config";

type Opt = { id: string; name: string; email?: string };

const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "SITE_VISIT", "NEGOTIATION"];
const rand = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2, 8);

export function LeadChannelsClient({ initial, users, teams }: { initial: LeadChannels; users: Opt[]; teams: Opt[] }) {
  const [channels, setChannels] = useState<LeadChannels>(initial);
  const [origin, setOrigin] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [testing, setTesting] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState<{ channel: string; text: string } | null>(null);
  const [open, setOpen] = useState<LeadChannelKey | null>("generic");
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => { setOrigin(window.location.origin); loadLogs(); }, []);

  async function loadLogs() {
    try { const r = await fetch("/api/admin/lead-channels/logs"); const d = await r.json(); if (d.success) setLogs(d.logs); } catch {}
  }

  const userOpts = useMemo(() => [{ value: "", label: "— Auto (global rules) —" }, ...users.map((u) => ({ value: u.id, label: u.name, sublabel: [u.email].filter(Boolean).join(" ") }))], [users]);

  function patch(key: LeadChannelKey, p: Partial<LeadChannels[LeadChannelKey]>) {
    setChannels((c) => ({ ...c, [key]: { ...c[key], ...p } }));
  }
  function patchMap(key: LeadChannelKey, p: any) {
    setChannels((c) => ({ ...c, [key]: { ...c[key], fieldMap: { ...c[key].fieldMap, ...p } } }));
  }

  async function save() {
    setSaving(true); setError("");
    try {
      const r = await fetch("/api/admin/lead-channels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(channels) });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || "Failed to save");
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  }

  async function sendTest(channel: string) {
    setTesting(channel); setTestMsg(null);
    try {
      // Save first so the test uses the latest config
      await fetch("/api/admin/lead-channels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(channels) });
      const r = await fetch("/api/admin/lead-channels/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel }) });
      const d = await r.json();
      setTestMsg({ channel, text: d.success ? `Test lead ${d.result?.status === "CREATED" ? "created ✓ — check All Leads" : d.result?.status}` : (d.error || "Test failed") });
      loadLogs();
    } catch (e: any) { setTestMsg({ channel, text: e.message }); } finally { setTesting(null); }
  }

  function webhookUrl(key: LeadChannelKey): string {
    const base = `${origin}/api/integrations/leads/${key}`;
    const c = channels[key];
    if (key === "meta" || key === "google") return base;
    return c.secret ? `${base}?key=${c.secret}` : base;
  }

  function copy(text: string) { navigator.clipboard?.writeText(text).catch(() => {}); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">Connect lead sources so their leads drop straight into the CRM and get auto-assigned. Paste each channel&rsquo;s webhook URL into that platform&rsquo;s lead setup.</p>
        <button onClick={save} disabled={saving} className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Saved" : "Save All"}
        </button>
      </div>
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-100">{error}</div>}

      <div className="space-y-3">
        {LEAD_CHANNEL_ORDER.map((key) => {
          const c = channels[key];
          const isOpen = open === key;
          const isPortal = key !== "meta" && key !== "google";
          return (
            <div key={key} className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-sm ${c.enabled ? "border-emerald-200 dark:border-emerald-900" : "border-slate-200 dark:border-slate-800"}`}>
              <div className="flex items-center justify-between gap-3 p-4">
                <button type="button" onClick={() => setOpen(isOpen ? null : key)} className="flex items-center gap-2 min-w-0">
                  <Plug className="h-4 w-4 text-brand shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-white truncate">{c.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{c.enabled ? "ON" : "OFF"}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer shrink-0">
                  <input type="checkbox" checked={c.enabled} onChange={(e) => patch(key, { enabled: e.target.checked })} className="rounded text-emerald-500" />
                  Enabled
                </label>
              </div>

              {isOpen && (
                <div className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4">
                  {/* Webhook URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Webhook URL (paste into {c.label})</label>
                    <div className="flex gap-2">
                      <input readOnly value={webhookUrl(key)} className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300" />
                      <button type="button" onClick={() => copy(webhookUrl(key))} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800"><Copy className="h-3.5 w-3.5" /> Copy</button>
                    </div>
                    {isPortal && c._secrets?.hasSecret && !c.secret && (
                      <p className="text-[11px] text-amber-600">A webhook secret is saved but hidden for security — the live URL needs <code>?key=&lt;your secret&gt;</code>. Click <b>generate</b> on the secret below to rotate it and get a fresh copyable URL.</p>
                    )}
                  </div>

                  {/* Credentials */}
                  {key === "meta" && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      <SecretField label="Verify Token" value={c.verifyToken || ""} onChange={(v) => patch(key, { verifyToken: v })} onGen={() => patch(key, { verifyToken: rand() })} configured={!!c._secrets?.hasVerifyToken} />
                      <Field label="Page Access Token" value={c.pageAccessToken || ""} onChange={(v) => patch(key, { pageAccessToken: v })} placeholder="EAAG..." configured={!!c._secrets?.hasPageAccessToken} />
                      <SecretField label="App Secret" value={c.appSecret || ""} onChange={(v) => patch(key, { appSecret: v })} onGen={() => patch(key, { appSecret: rand() })} configured={!!c._secrets?.hasAppSecret} />
                    </div>
                  )}
                  {key === "google" && (
                    <SecretField label="Webhook Key (google_key)" value={c.googleKey || ""} onChange={(v) => patch(key, { googleKey: v })} onGen={() => patch(key, { googleKey: rand() })} configured={!!c._secrets?.hasGoogleKey} />
                  )}
                  {isPortal && (
                    <>
                      <SecretField label="Webhook Secret (added to URL as ?key=)" value={c.secret || ""} onChange={(v) => patch(key, { secret: v })} onGen={() => patch(key, { secret: rand() })} configured={!!c._secrets?.hasSecret} />
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Field Mapping <span className="text-slate-400 font-medium">(incoming key for each CRM field; use | for alternatives)</span></label>
                        <div className="grid gap-2 sm:grid-cols-4">
                          {(["name", "phone", "email", "message"] as const).map((f) => (
                            <input key={f} value={(c.fieldMap as any)?.[f] || ""} onChange={(e) => patchMap(key, { [f]: e.target.value })} placeholder={f} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs outline-none focus:border-brand" />
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Assignment */}
                  <div className="grid gap-3 sm:grid-cols-3 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assign to owner</label>
                      <SearchableSelect options={userOpts} value={c.assignOwnerId || ""} onChange={(v) => patch(key, { assignOwnerId: v })} placeholder="Auto (global rules)" searchPlaceholder="Search user..." />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">…or round-robin team</label>
                      <select value={c.assignTeamId || ""} onChange={(e) => patch(key, { assignTeamId: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-bold">
                        <option value="">— None —</option>
                        {teams.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default stage</label>
                      <select value={c.defaultStage || "NEW"} onChange={(e) => patch(key, { defaultStage: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-bold">
                        {STAGES.map((s) => (<option key={s} value={s}>{s.replace("_", " ")}</option>))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => sendTest(key)} disabled={testing === key} className="inline-flex items-center gap-1.5 rounded-xl border border-brand/40 bg-brand-soft px-3 py-2 text-xs font-bold text-brand hover:bg-brand/10 disabled:opacity-60">
                      {testing === key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />} Send test lead
                    </button>
                    {testMsg?.channel === key && <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{testMsg.text}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Recent inbound log */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Shield className="h-4 w-4 text-brand" /> Recent inbound leads</h3>
          <button onClick={loadLogs} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
        </div>
        {logs.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No inbound leads yet. Enable a channel and send a test lead.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  <span className={`rounded-full px-2 py-0.5 font-bold ${l.status === "CREATED" ? "bg-emerald-100 text-emerald-700" : l.status === "DUPLICATE" ? "bg-amber-100 text-amber-700" : l.status === "ERROR" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{l.status}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{l.name || "—"}</span>
                  <span className="text-slate-400">{l.phone || ""}</span>
                </span>
                <span className="flex items-center gap-3 shrink-0 text-slate-400">
                  <span className="font-mono">{l.channel}</span>
                  <span suppressHydrationWarning>{new Date(l.createdAt).toLocaleString()}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, configured }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; configured?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
        {label}
        {configured && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600"><Check className="h-3 w-3" /> set</span>}
      </label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={configured ? "•••••••• saved — type to replace" : placeholder} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono outline-none focus:border-brand" />
    </div>
  );
}

function SecretField({ label, value, onChange, onGen, configured }: { label: string; value: string; onChange: (v: string) => void; onGen: () => void; configured?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
        {label}
        {configured && <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600"><Check className="h-3 w-3" /> set</span>}
      </label>
      <div className="flex gap-1.5">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={configured ? "•••••••• saved — type to replace" : "•••••"} className="flex-1 min-w-0 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-mono outline-none focus:border-brand" />
        <button type="button" onClick={onGen} title="Generate new" className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 px-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"><RefreshCw className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}
