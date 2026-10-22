"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Check, Bot, Plus, Trash2 } from "lucide-react";

type Rule = { id: string; keywords: string[]; reply: string };
type Cfg = {
  enabled: boolean;
  welcomeMessage: string;
  fallbackMessage: string;
  handoffKeywords: string[];
  handoffMessage: string;
  rules: Rule[];
};

export function WhatsAppBotClient() {
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp/bot");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load");
      setCfg(data.config);
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!cfg) return;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/admin/whatsapp/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  if (!cfg) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Failed to load"}</div>;

  const set = (patch: Partial<Cfg>) => setCfg({ ...cfg, ...patch });
  const ta = "w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-emerald-600" />
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">WhatsApp bot flows</h1>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Automatic replies to inbound WhatsApp messages (within the 24-hour window). The bot matches keywords to your recorded responses and hands off to the assigned agent on request. It goes silent once a team member replies, so it never talks over your staff.
      </p>

      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
        <input type="checkbox" checked={cfg.enabled} onChange={(e) => set({ enabled: e.target.checked })} />
        Bot enabled
      </label>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Welcome message (first reply)</label>
        <textarea rows={4} className={ta} value={cfg.welcomeMessage} onChange={(e) => set({ welcomeMessage: e.target.value })} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Fallback (no keyword matched)</label>
        <textarea rows={2} className={ta} value={cfg.fallbackMessage} onChange={(e) => set({ fallbackMessage: e.target.value })} />
      </div>

      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Keyword rules</p>
        <div className="space-y-3">
          {cfg.rules.map((r, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <input
                  className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  placeholder="keywords, comma-separated (e.g. price, cost)"
                  value={r.keywords.join(", ")}
                  onChange={(e) => {
                    const rules = [...cfg.rules];
                    rules[i] = { ...r, keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) };
                    set({ rules });
                  }}
                />
                <button onClick={() => set({ rules: cfg.rules.filter((_, j) => j !== i) })} className="text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea
                rows={2}
                className={`${ta} mt-2`}
                placeholder="Reply to send when a keyword matches…"
                value={r.reply}
                onChange={(e) => {
                  const rules = [...cfg.rules];
                  rules[i] = { ...r, reply: e.target.value };
                  set({ rules });
                }}
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => set({ rules: [...cfg.rules, { id: `rule-${Date.now()}`, keywords: [], reply: "" }] })}
          className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700"
        >
          <Plus className="h-3.5 w-3.5" /> Add rule
        </button>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
        <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Handoff to a human</p>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Trigger keywords (comma-separated)</label>
        <input
          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
          value={cfg.handoffKeywords.join(", ")}
          onChange={(e) => set({ handoffKeywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
        />
        <label className="mb-1 mt-3 block text-xs font-medium text-slate-600 dark:text-slate-300">Handoff message</label>
        <textarea rows={2} className={ta} value={cfg.handoffMessage} onChange={(e) => set({ handoffMessage: e.target.value })} />
        <p className="mt-2 text-[11px] text-slate-500">When triggered, the bot stops replying and the assigned agent takes over (logged on the lead).</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saved ? "Saved" : "Save bot flows"}
      </button>
    </div>
  );
}
