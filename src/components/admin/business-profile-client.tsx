"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Check, Save, CreditCard, Image as ImageIcon } from "lucide-react";
import { DomainStatusCard } from "@/components/admin/domain-status-card";

type Profile = {
  companyName: string;
  tagline: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  supportPhone: string;
  supportEmail: string;
  officeAddress: string;
  gstCinNumber: string;
  copyrightNotice: string;
  customDomain: string;
  isWhiteLabelActive: boolean;
};

export function BusinessProfileClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [domain, setDomain] = useState("");
  const [orgName, setOrgName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/business-profile");
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Failed to load");
      setProfile(j.profile);
      setDomain(j.domain || "");
      setOrgName(j.orgName);
    } catch (e: any) {
      setErr(e.message || "Failed to load business profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    setErr("");
    try {
      const res = await fetch("/api/admin/business-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, domain }),
      });
      const j = await res.json();
      if (!res.ok || !j.ok) throw new Error(j.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setErr(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;
  }
  if (!profile) {
    return <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{err || "Could not load your business profile."}</div>;
  }

  const set = (k: keyof Profile, v: string) => setProfile({ ...profile, [k]: v });

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-bold text-slate-900">Brand & business details{orgName ? ` — ${orgName}` : ""}</h2>
        <p className="mt-1 text-sm text-slate-500">Your logo, name and contact details appear across your own public website.</p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Field label="Company / agency name" value={profile.companyName} onChange={(v) => set("companyName", v)} />
          <Field label="Tagline" value={profile.tagline} onChange={(v) => set("tagline", v)} />
          <div className="lg:col-span-2">
            <Field label="Logo URL" value={profile.logoUrl} onChange={(v) => set("logoUrl", v)} placeholder="https://… or /logo.png" mono />
            {profile.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logoUrl} alt="Logo preview" className="mt-2 h-12 w-auto rounded border border-slate-100 bg-slate-50 object-contain p-1" />
            ) : (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><ImageIcon className="h-3.5 w-3.5" /> No logo set</p>
            )}
          </div>
          <ColorField label="Primary color" value={profile.primaryColor} onChange={(v) => set("primaryColor", v)} />
          <ColorField label="Secondary color" value={profile.secondaryColor} onChange={(v) => set("secondaryColor", v)} />
          <Field label="Support phone" value={profile.supportPhone} onChange={(v) => set("supportPhone", v)} />
          <Field label="Support email" value={profile.supportEmail} onChange={(v) => set("supportEmail", v)} type="email" />
          <div className="lg:col-span-2">
            <Field label="Office address" value={profile.officeAddress} onChange={(v) => set("officeAddress", v)} />
          </div>
          <Field label="GST / CIN / Reg. no." value={profile.gstCinNumber} onChange={(v) => set("gstCinNumber", v)} />
          <Field label="Copyright notice" value={profile.copyrightNotice} onChange={(v) => set("copyrightNotice", v)} />
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <Field
            label="Custom domain"
            value={domain}
            onChange={setDomain}
            placeholder="acme-realty.com"
            mono
            hint="Your own domain for your public site. Set the DNS records shown below after saving."
          />
        </div>

        {err && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}

        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving…" : "Save business profile"}
          </button>
          {saved && <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600"><Check className="h-4 w-4" /> Saved</span>}
        </div>
      </section>

      <DomainStatusCard />

      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <CreditCard className="h-5 w-5 text-brand" />
        <p className="text-sm text-slate-600">Accept payments from your customers into your own account.</p>
        <Link href="/admin/payments" className="ml-auto inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-hover">
          Manage payment gateways →
        </Link>
      </section>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", placeholder, hint, mono,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; hint?: string; mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand ${mono ? "font-mono" : ""}`}
      />
      {hint && <span className="mt-0.5 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-slate-300" />
        <input value={value} onChange={(e) => onChange(e.target.value)} className="w-32 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-brand focus:outline-none" />
      </div>
    </label>
  );
}
