"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Save, ShieldCheck, Plug } from "lucide-react";

export function AnalyticsIntegrationClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [gaEnabled, setGaEnabled] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [keyJson, setKeyJson] = useState("");
  const [gtm, setGtm] = useState("");
  const [pixel, setPixel] = useState("");

  useEffect(() => {
    fetch("/api/admin/analytics-integration")
      .then((r) => r.json())
      .then((d) => {
        if (d?.integration) {
          setGaEnabled(d.integration.gaEnabled);
          setHasKey(d.integration.hasServiceAccount);
          setGtm(d.integration.defaultGtmId || "");
          setPixel(d.integration.defaultMetaPixelId || "");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/analytics-integration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gaEnabled, gaServiceAccountJson: keyJson, defaultGtmId: gtm, defaultMetaPixelId: pixel }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.error || "Failed to save");
      if (keyJson.trim()) setHasKey(true);
      setKeyJson("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;

  return (
    <div className="max-w-2xl space-y-5">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Plug className="h-5 w-5 text-brand" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Google Analytics (live data)</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Paste a Google Cloud <strong>service-account JSON key</strong> with access to your GA4 property. Once enabled, projects that have a GA4 Property ID (set per project under Analytics) show live view counts; otherwise the manually-entered numbers are used. Live pulls also require the <code className="text-xs">@google-analytics/data</code> package to be installed.
        </p>

        {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-100">{error}</div>}

        <label className="flex items-center gap-2 text-sm font-bold cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <input type="checkbox" checked={gaEnabled} onChange={(e) => setGaEnabled(e.target.checked)} className="rounded text-brand" />
          Enable live Google Analytics pulls
        </label>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            Service-account JSON key {hasKey && <span className="inline-flex items-center gap-1 text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" /> configured</span>}
          </label>
          <textarea value={keyJson} onChange={(e) => setKeyJson(e.target.value)} rows={6} placeholder={hasKey ? "A key is already stored — paste a new one only to replace it." : '{ "type": "service_account", "project_id": "...", "private_key": "..." }'} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs font-mono outline-none focus:border-brand" />
          <p className="text-[11px] text-slate-400">Stored securely server-side; never shown back here.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default GTM container ID</label>
            <input value={gtm} onChange={(e) => setGtm(e.target.value)} placeholder="GTM-XXXXXX" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-brand" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Meta Pixel ID</label>
            <input value={pixel} onChange={(e) => setPixel(e.target.value)} placeholder="1234567890" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-brand" />
          </div>
        </div>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved" : "Save Integration"}
          </button>
        </div>
      </div>
    </div>
  );
}
