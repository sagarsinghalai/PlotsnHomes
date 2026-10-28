"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Check, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

type Masked = {
  enabled: boolean;
  displayNumber: string;
  phoneNumberId: string;
  apiVersion: string;
  _secrets: Record<string, boolean>;
  isConfigured: boolean;
};

function Field({ label, value, onChange, placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; hint?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function SecretField({ label, value, onChange, configured, hint }: { label: string; value: string; onChange: (v: string) => void; configured?: boolean; hint?: string }) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
        {configured && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">set</span>}
      </label>
      <Input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={configured ? "•••••••• saved — type to replace" : "Not set"}
        className="rounded-xl text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function WhatsAppSettingsClient() {
  const [cfg, setCfg] = useState<Masked | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  // secret inputs (only sent if the admin types a new value)
  const [accessToken, setAccessToken] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [verifyToken, setVerifyToken] = useState("");

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/whatsapp-settings");
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
      const body: any = {
        enabled: cfg.enabled,
        displayNumber: cfg.displayNumber,
        phoneNumberId: cfg.phoneNumberId,
        apiVersion: cfg.apiVersion,
      };
      if (accessToken) body.accessToken = accessToken;
      if (appSecret) body.appSecret = appSecret;
      if (verifyToken) body.verifyToken = verifyToken;
      const res = await fetch("/api/admin/whatsapp-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Save failed");
      setAccessToken(""); setAppSecret(""); setVerifyToken("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      load();
    } catch (e: any) {
      setError(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>;
  if (!cfg) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Failed to load"}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-emerald-600" />
        <h1 className="text-lg font-bold text-slate-900 dark:text-white">WhatsApp Business settings</h1>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        The number here powers the property "Enquire on WhatsApp" button and inbound lead capture. Secrets are stored encrypted and never shown again. You can change the number anytime.
      </p>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
        <input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} />
        Enabled
      </label>

      <Field label="Business number (click-to-chat)" value={cfg.displayNumber} onChange={(v) => setCfg({ ...cfg, displayNumber: v })} placeholder="+919876543210" hint="The number customers message. Used for the wa.me enquiry link." />
      <Field label="Phone number ID (Cloud API)" value={cfg.phoneNumberId} onChange={(v) => setCfg({ ...cfg, phoneNumberId: v })} placeholder="1234567890" hint="From Meta → WhatsApp → API Setup." />
      <Field label="API version" value={cfg.apiVersion} onChange={(v) => setCfg({ ...cfg, apiVersion: v })} placeholder="v20.0" />

      <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Secrets (encrypted at rest)</p>
        <div className="space-y-4">
          <SecretField label="Access token" value={accessToken} onChange={setAccessToken} configured={cfg._secrets?.hasAccessToken} hint="Permanent/system-user token for the Cloud API." />
          <SecretField label="App secret" value={appSecret} onChange={setAppSecret} configured={cfg._secrets?.hasAppSecret} hint="Used to verify inbound webhook signatures." />
          <SecretField label="Webhook verify token" value={verifyToken} onChange={setVerifyToken} configured={cfg._secrets?.hasVerifyToken} hint="The token you set in Meta's webhook config." />
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saved ? "Saved" : "Save settings"}
      </button>
    </div>
  );
}
