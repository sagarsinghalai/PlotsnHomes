"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function RatesSettings({
  defaultInterestRate,
  defaultYieldRate,
  defaultCapRate,
}: {
  defaultInterestRate: number;
  defaultYieldRate: number;
  defaultCapRate: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [interest, setInterest] = useState(String(defaultInterestRate));
  const [yieldR, setYieldR] = useState(String(defaultYieldRate));
  const [cap, setCap] = useState(String(defaultCapRate));
  const [applyAll, setApplyAll] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defaultInterestRate: parseFloat(interest),
        defaultYieldRate: parseFloat(yieldR),
        defaultCapRate: parseFloat(cap),
        applyToAllProperties: applyAll,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    setMsg(applyAll ? "Platform rates saved and applied to all listings." : "Platform default rates saved.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="max-w-lg space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-sm text-slate-600">
        Set default rates for new properties. New listings use these values. Per-property rates can be edited on each listing.
      </p>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Default interest rate (%)</span>
        <input
          type="number"
          step="0.1"
          required
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Default yield (%)</span>
        <input
          type="number"
          step="0.1"
          required
          value={yieldR}
          onChange={(e) => setYieldR(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-slate-700">Default cap rate (%)</span>
        <input
          type="number"
          step="0.1"
          required
          value={cap}
          onChange={(e) => setCap(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} />
        Apply to all existing properties now
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}
      <Button type="submit" variant="gold" loading={loading}>
        Save rates
      </Button>
    </form>
  );
}
