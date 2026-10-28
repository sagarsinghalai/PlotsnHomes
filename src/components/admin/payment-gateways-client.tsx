"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Check, AlertTriangle, CreditCard, Building2, KeyRound } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";

type MaskedSection = {
  razorpay: { enabled: boolean; keyId: string; hasKeySecret: boolean; hasWebhookSecret: boolean };
  stripe: { enabled: boolean; publishableKey: string; hasSecretKey: boolean; hasWebhookSecret: boolean };
  preferred: "razorpay" | "stripe";
  currency: string;
  envFallback: { razorpay: boolean; stripe: boolean };
};

type ApiData = {
  success: boolean;
  encReady: boolean;
  canEditPlatform: boolean;
  tenantId: string | null;
  tenant: MaskedSection;
  platform: MaskedSection | null;
};

// Editable form shape — secrets are write-only (blank = keep existing).
type FormSection = {
  razorpay: { enabled: boolean; keyId: string; keySecret: string; webhookSecret: string };
  stripe: { enabled: boolean; publishableKey: string; secretKey: string; webhookSecret: string };
  preferred: "razorpay" | "stripe";
  currency: string;
};

function toForm(m: MaskedSection): FormSection {
  return {
    razorpay: { enabled: m.razorpay.enabled, keyId: m.razorpay.keyId, keySecret: "", webhookSecret: "" },
    stripe: { enabled: m.stripe.enabled, publishableKey: m.stripe.publishableKey, secretKey: "", webhookSecret: "" },
    preferred: m.preferred,
    currency: m.currency,
  };
}

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "SGD"];

export function PaymentGatewaysClient() {
  const [data, setData] = useState<ApiData | null>(null);
  const [tenantForm, setTenantForm] = useState<FormSection | null>(null);
  const [platformForm, setPlatformForm] = useState<FormSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/payment-settings");
      const j = (await res.json()) as ApiData;
      if (!res.ok || !j.success) throw new Error((j as any).error || "Failed to load payment settings");
      setData(j);
      setTenantForm(toForm(j.tenant));
      setPlatformForm(j.platform ? toForm(j.platform) : null);
    } catch (e: any) {
      setError(e.message || "Failed to load payment settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading payment settings…
      </div>
    );
  }
  if (error || !data || !tenantForm) {
    return (
      <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error || "Could not load payment settings."}</div>
    );
  }

  return (
    <div className="space-y-8">
      {!data.encReady && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Encryption key not set</p>
            <p className="mt-0.5">Set <code className="font-mono">CREDENTIALS_ENC_KEY</code> in the server environment before saving any live keys — secrets can&apos;t be stored safely without it.</p>
          </div>
        </div>
      )}

      <GatewaySection
        title="Your payment gateway"
        subtitle="Keys used to collect payments from your own customers (property deposits, bookings). Funds settle to this account."
        icon={<CreditCard className="h-5 w-5 text-brand" />}
        masked={data.tenant}
        form={tenantForm}
        setForm={setTenantForm}
        scope="tenant"
        onSaved={load}
        encReady={data.encReady}
      />

      {data.canEditPlatform && platformForm && data.platform && (
        <GatewaySection
          title="Platform subscription gateway"
          subtitle="Keys that collect white-label subscription payments from partners at signup & renewal. Funds settle to the platform (your company) and every subscription invoice is issued in your company's name."
          icon={<Building2 className="h-5 w-5 text-brand" />}
          masked={data.platform}
          form={platformForm}
          setForm={setPlatformForm}
          scope="platform"
          onSaved={load}
          encReady={data.encReady}
          platformBadge
        />
      )}
    </div>
  );
}

function GatewaySection({
  title, subtitle, icon, masked, form, setForm, scope, onSaved, encReady, platformBadge,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  masked: MaskedSection;
  form: FormSection;
  setForm: (f: FormSection) => void;
  scope: "tenant" | "platform";
  onSaved: () => void;
  encReady: boolean;
  platformBadge?: boolean;
}) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [testing, setTesting] = useState<"razorpay" | "stripe" | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; text: string }>>({});

  async function runTest(provider: "razorpay" | "stripe") {
    setTesting(provider);
    setTestResult((r) => ({ ...r, [provider]: undefined as any }));
    try {
      const res = await fetch("/api/admin/payment-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, provider }),
      });
      const j = await res.json();
      setTestResult((r) => ({ ...r, [provider]: { ok: !!j.ok, text: j.ok ? j.message : j.error || "Failed" } }));
    } catch (e: any) {
      setTestResult((r) => ({ ...r, [provider]: { ok: false, text: e?.message || "Request failed" } }));
    } finally {
      setTesting(null);
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    setErr("");
    try {
      const res = await fetch("/api/admin/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, config: form }),
      });
      const j = await res.json();
      if (!res.ok || !j.success) throw new Error(j.error || "Save failed");
      setSaved(true);
      toast.success(`${title} saved.`);
      onSaved();
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setErr(e.message || "Save failed");
      toast.error(e.message || "Could not save payment settings.");
    } finally {
      setSaving(false);
    }
  }

  const rzpLive = form.razorpay.enabled && !!form.razorpay.keyId && (masked.razorpay.hasKeySecret || !!form.razorpay.keySecret);
  const strLive = form.stripe.enabled && !!form.stripe.publishableKey && (masked.stripe.hasSecretKey || !!form.stripe.secretKey);
  const activeLabel = rzpLive && strLive ? `Both (prefers ${form.preferred})` : rzpLive ? "Razorpay" : strLive ? "Stripe" : masked.envFallback.razorpay ? "Razorpay (env)" : masked.envFallback.stripe ? "Stripe (env)" : "Test mode";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10">{icon}</div>
          <div>
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900">
              {title}
              {platformBadge && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Platform owner</span>}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Active: {activeLabel}</span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* Razorpay */}
        <div className="rounded-xl border border-slate-200 p-4">
          <label className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Razorpay</span>
            <Toggle checked={form.razorpay.enabled} onChange={(v) => setForm({ ...form, razorpay: { ...form.razorpay, enabled: v } })} />
          </label>
          <p className="mt-1 text-xs text-slate-400">Cards, UPI, net banking, wallets. Key id is public; secret is encrypted.</p>
          <div className="mt-3 space-y-3">
            <TextField label="Key ID" placeholder="rzp_live_… / rzp_test_…" value={form.razorpay.keyId} onChange={(v) => setForm({ ...form, razorpay: { ...form.razorpay, keyId: v } })} mono />
            <SecretField label="Key Secret" saved={masked.razorpay.hasKeySecret} value={form.razorpay.keySecret} onChange={(v) => setForm({ ...form, razorpay: { ...form.razorpay, keySecret: v } })} />
            <SecretField label="Webhook Secret" saved={masked.razorpay.hasWebhookSecret} value={form.razorpay.webhookSecret} onChange={(v) => setForm({ ...form, razorpay: { ...form.razorpay, webhookSecret: v } })} optional />
          </div>
          <TestRow provider="razorpay" testing={testing} result={testResult.razorpay} onTest={() => runTest("razorpay")} />
        </div>

        {/* Stripe */}
        <div className="rounded-xl border border-slate-200 p-4">
          <label className="flex items-center justify-between">
            <span className="font-semibold text-slate-900">Stripe</span>
            <Toggle checked={form.stripe.enabled} onChange={(v) => setForm({ ...form, stripe: { ...form.stripe, enabled: v } })} />
          </label>
          <p className="mt-1 text-xs text-slate-400">Global cards, wallets, ACH & more. Publishable key is public; secret is encrypted.</p>
          <div className="mt-3 space-y-3">
            <TextField label="Publishable Key" placeholder="pk_live_… / pk_test_…" value={form.stripe.publishableKey} onChange={(v) => setForm({ ...form, stripe: { ...form.stripe, publishableKey: v } })} mono />
            <SecretField label="Secret Key" saved={masked.stripe.hasSecretKey} value={form.stripe.secretKey} onChange={(v) => setForm({ ...form, stripe: { ...form.stripe, secretKey: v } })} />
            <SecretField label="Webhook Secret" saved={masked.stripe.hasWebhookSecret} value={form.stripe.webhookSecret} onChange={(v) => setForm({ ...form, stripe: { ...form.stripe, webhookSecret: v } })} optional />
          </div>
          <TestRow provider="stripe" testing={testing} result={testResult.stripe} onTest={() => runTest("stripe")} />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-5">
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Preferred (when both enabled)</span>
          <select
            value={form.preferred}
            onChange={(e) => setForm({ ...form, preferred: e.target.value as "razorpay" | "stripe" })}
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            <option value="razorpay">Razorpay</option>
            <option value="stripe">Stripe</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-600">Default currency</span>
          <select
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            className="mt-1 block rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        {(masked.envFallback.razorpay || masked.envFallback.stripe) && (
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <KeyRound className="h-3.5 w-3.5" />
            Environment keys detected — used only when nothing above is enabled.
          </p>
        )}
      </div>

      {err && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !encReady}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {saving ? "Saving…" : "Save gateway settings"}
        </button>
        {saved && <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600"><Check className="h-4 w-4" /> Saved</span>}
      </div>
    </section>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-brand" : "bg-slate-300"}`}
      aria-pressed={checked}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function TextField({ label, value, onChange, placeholder, mono }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}

function SecretField({ label, saved, value, onChange, optional }: { label: string; saved: boolean; value: string; onChange: (v: string) => void; optional?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">
        {label}
        {optional && <span className="ml-1 text-slate-400">(optional)</span>}
        {saved && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"><Check className="h-3 w-3" /> saved</span>}
      </span>
      <Input
        type="password"
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={saved ? "•••••••• (leave blank to keep)" : "Enter secret"}
        className="mt-1 font-mono text-sm"
      />
    </label>
  );
}

function TestRow({
  provider, testing, result, onTest,
}: {
  provider: "razorpay" | "stripe";
  testing: "razorpay" | "stripe" | null;
  result?: { ok: boolean; text: string };
  onTest: () => void;
}) {
  const busy = testing === provider;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onTest}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
        {busy ? "Testing…" : "Test connection"}
      </button>
      {result && (
        <span className={`inline-flex items-center gap-1 text-xs ${result.ok ? "text-emerald-600" : "text-rose-600"}`}>
          {result.ok ? <Check className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {result.text}
        </span>
      )}
    </div>
  );
}
