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
    <form onSubmit={save} className="max-w-2xl mx-auto space-y-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Set default rates for new properties. New listings use these values. Per-property rates can be edited on each listing.
      </p>
      <label className="block text-sm">
        <span className="font-bold text-slate-900 dark:text-white">Default interest rate (%)</span>
        <input
          type="number"
          step="0.1"
          required
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-brand"
        />
      </label>
      <label className="block text-sm">
        <span className="font-bold text-slate-900 dark:text-white">Default yield (%)</span>
        <input
          type="number"
          step="0.1"
          required
          value={yieldR}
          onChange={(e) => setYieldR(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-brand"
        />
      </label>
      <label className="block text-sm">
        <span className="font-bold text-slate-900 dark:text-white">Default cap rate (%)</span>
        <input
          type="number"
          step="0.1"
          required
          value={cap}
          onChange={(e) => setCap(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-brand"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} className="rounded text-brand focus:ring-brand" />
        Apply to all existing properties now
      </label>
      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      {msg && <p className="text-sm text-emerald-600 font-medium">{msg}</p>}
      <Button type="submit" variant="gold" loading={loading} className="w-full sm:w-auto px-6">
        Save rates
      </Button>
    </form>
  );
}
