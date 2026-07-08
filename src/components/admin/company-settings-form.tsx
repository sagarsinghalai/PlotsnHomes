"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/ui/country-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { Input, Label } from "@/components/ui/input";
import type { CompanySettings } from "@/lib/company-settings";
import {
  DEFAULT_COUNTRY_CODE,
  SUPPORTED_CURRENCIES,
  TIMEZONES,
  getCountryByCode,
} from "@/lib/locale-defaults";

export function CompanySettingsForm({ settings }: { settings: CompanySettings }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function onCountryChange(code: string) {
    const c = getCountryByCode(code);
    setForm((f) => ({
      ...f,
      country: code,
      currency: f.currency || c.currency,
    }));
  }

  async function save() {
    setBusy(true);
    const res = await fetch("/api/admin/platform/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setMsg(res.ok ? "Saved." : "Save failed.");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-4">
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      <p className="text-sm text-slate-500 rounded-xl bg-slate-50 px-4 py-3">
        Default region is <strong>India (+91)</strong> and currency <strong>INR (₹)</strong>.
        Change country here to update defaults across messaging, payments, and listings.
      </p>
      <div>
        <Label>Business name</Label>
        <Input value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} />
      </div>
      <div>
        <Label>Website</Label>
        <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
      </div>
      <div>
        <Label>Default country</Label>
        <CountrySelect
          value={form.country || DEFAULT_COUNTRY_CODE}
          onChange={onCountryChange}
        />
      </div>
      <div>
        <Label>Company phone</Label>
        <PhoneInput
          value={form.phone}
          onChange={(phone) => setForm((f) => ({ ...f, phone }))}
          defaultCountry={form.country || DEFAULT_COUNTRY_CODE}
        />
      </div>
      <div>
        <Label>Time zone</Label>
        <select
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          value={form.timezone}
          onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Default currency (payments &amp; display)</Label>
        <select
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          value={form.currency}
          onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label>Logo URL</Label>
        <Input value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.showLeadPhoneToSales}
          onChange={(e) => setForm((f) => ({ ...f, showLeadPhoneToSales: e.target.checked }))}
        />
        Display lead phone and email to sales
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.showAccessibleLeads}
          onChange={(e) => setForm((f) => ({ ...f, showAccessibleLeads: e.target.checked }))}
        />
        Display accessible leads to sales
      </label>
      <Button disabled={busy} onClick={save}>
        Save company settings
      </Button>
    </div>
  );
}
