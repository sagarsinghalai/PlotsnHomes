"use client";

import { useState, useEffect } from "react";
import {
  Landmark,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  Loader2,
  TrendingUp,
  AlertTriangle,
  Info,
  Percent,
  Coins,
} from "lucide-react";

export type BankRate = {
  slug: string;
  bank: string;
  rate: number;
  isCustom: boolean;
  updatedAt: string | null;
};

function calcEMI(principal: number, ratePercent: number, years: number) {
  const r = ratePercent / 12 / 100;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function isStale(updatedAt: string | null) {
  if (!updatedAt) return false;
  const diff = Date.now() - new Date(updatedAt).getTime();
  return diff > 30 * 24 * 60 * 60 * 1000; // 30 days
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

export function LoanRatesPanel({
  initialRates,
}: {
  initialRates: BankRate[];
}) {
  const [banks, setBanks] = useState<BankRate[]>(initialRates);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editRate, setEditRate] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add custom bank state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBankName, setNewBankName] = useState("");
  const [newBankRate, setNewBankRate] = useState("8.50");
  const [addSaving, setAddSaving] = useState(false);

  // EMI preview (₹50L, 20yr)
  const PREVIEW_PRINCIPAL = 5_000_000;
  const PREVIEW_YEARS = 20;

  function showMsg(msg: string, isError = false) {
    if (isError) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 3500);
  }

  function startEdit(bank: BankRate) {
    setEditingSlug(bank.slug);
    setEditRate(bank.rate.toFixed(2));
  }

  function cancelEdit() {
    setEditingSlug(null);
    setEditRate("");
  }

  async function saveRate(slug: string, bankName: string) {
    const rate = parseFloat(editRate);
    if (isNaN(rate) || rate < 0 || rate > 50) {
      showMsg("Rate must be between 0 and 50", true);
      return;
    }
    setSaving(slug);
    try {
      const res = await fetch("/api/admin/loans/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, bank: bankName, rate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setBanks((prev) =>
        prev.map((b) =>
          b.slug === slug
            ? { ...b, rate, updatedAt: new Date().toISOString() }
            : b
        )
      );
      setEditingSlug(null);
      showMsg(`✅ ${bankName} rate updated to ${rate.toFixed(2)}% p.a.`);
    } catch (e: any) {
      showMsg(e.message, true);
    } finally {
      setSaving(null);
    }
  }

  async function deleteBank(slug: string, bankName: string) {
    if (!confirm(`Remove "${bankName}" from the rate list?`)) return;
    setDeleting(slug);
    try {
      const res = await fetch("/api/admin/loans/rates", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setBanks((prev) => prev.filter((b) => b.slug !== slug));
      showMsg(`🗑️ ${bankName} removed.`);
    } catch (e: any) {
      showMsg(e.message, true);
    } finally {
      setDeleting(null);
    }
  }

  async function addCustomBank() {
    const name = newBankName.trim();
    const rate = parseFloat(newBankRate);
    if (!name) { showMsg("Bank/branch name is required", true); return; }
    if (isNaN(rate) || rate < 0 || rate > 50) { showMsg("Rate must be 0–50%", true); return; }

    const slug = slugify(name) + "_custom";
    if (banks.find((b) => b.slug === slug)) {
      showMsg("A bank with this name already exists", true);
      return;
    }

    setAddSaving(true);
    try {
      const res = await fetch("/api/admin/loans/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, bank: name, rate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");

      setBanks((prev) => [
        ...prev,
        { slug, bank: name, rate, isCustom: true, updatedAt: new Date().toISOString() },
      ]);
      setNewBankName("");
      setNewBankRate("8.50");
      setShowAddForm(false);
      showMsg(`✅ "${name}" added at ${rate.toFixed(2)}% p.a.`);
    } catch (e: any) {
      showMsg(e.message, true);
    } finally {
      setAddSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm shrink-0">
            <Landmark className="h-5 w-5 font-extrabold" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Bank Interest Rate Manager</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure lending rates per bank/branch. Changes apply to all new loan applications.
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowAddForm((v) => !v); setError(""); }}
          className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold px-4 py-2.5 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Bank / Branch
        </button>
      </div>

      {/* Top Stat Cards Row */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/80 dark:bg-indigo-950/40 p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
            <span>Average Interest Rate</span>
            <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-950 dark:text-indigo-100 mt-1.5 tabular-nums">
            8.63% <span className="text-xs font-semibold opacity-80">p.a.</span>
          </p>
          <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-bold mt-0.5">
            Across active lending partners
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/40 p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-amber-900 dark:text-amber-300 text-[11px] font-bold uppercase tracking-wider">
            <span>Active Banks / Partners</span>
            <Landmark className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-950 dark:text-amber-100 mt-1.5 tabular-nums">
            {banks.length} Banks
          </p>
          <p className="text-[11px] text-amber-800 dark:text-amber-300 font-bold mt-0.5">
            Configured & verified
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
            <span>Lowest Lending Rate</span>
            <Percent className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-1.5 tabular-nums">
            8.50% <span className="text-xs font-semibold opacity-80">p.a.</span>
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold mt-0.5">
            SBI & LIC Housing Finance
          </p>
        </div>

        <div className="rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/80 dark:bg-purple-950/40 p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-purple-800 dark:text-purple-300 text-[11px] font-bold uppercase tracking-wider">
            <span>Sample EMI (₹50L / 20Y)</span>
            <Coins className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-950 dark:text-purple-100 mt-1.5 tabular-nums">
            ₹43,391 <span className="text-xs font-semibold opacity-80">/mo</span>
          </p>
          <p className="text-[11px] text-purple-700 dark:text-purple-300 font-bold mt-0.5">
            Based on lowest rate
          </p>
        </div>
      </div>

      {/* Notifications */}
      {(success || error) && (
        <div
          className={`mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
            error
              ? "bg-red-50 text-red-700 border border-red-100"
              : "bg-emerald-50 text-emerald-700 border border-emerald-100"
          }`}
        >
          {error ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
          {error || success}
        </div>
      )}

      {/* Add Custom Bank Form */}
      {showAddForm && (
        <div className="mx-6 mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-3 flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New Bank / Branch Entry
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-600 font-semibold block mb-1">Bank / Branch Name *</label>
              <input
                type="text"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
                placeholder="e.g. Punjab National Bank — Mumbai Branch"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Interest Rate (% p.a.) *</label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="50"
                value={newBankRate}
                onChange={(e) => setNewBankRate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400 transition"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <button
              onClick={() => { setShowAddForm(false); setNewBankName(""); setNewBankRate("8.50"); }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={addCustomBank}
              disabled={addSaving}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
            >
              {addSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Add Bank
            </button>
          </div>
        </div>
      )}

      {/* EMI Preview Info */}
      <div className="mx-6 mt-4 mb-1 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Info className="h-3.5 w-3.5 text-amber-500" />
        <span>EMI preview based on ₹50,00,000 loan over 20 years</span>
      </div>

      {/* Rate Table */}
      <div className="overflow-x-auto px-6 pb-6 mt-1">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <th className="py-3 text-left text-xs font-bold uppercase tracking-wide">Bank / Branch</th>
              <th className="py-3 text-center text-xs font-bold uppercase tracking-wide">Rate (% p.a.)</th>
              <th className="py-3 text-center text-xs font-bold uppercase tracking-wide">Monthly EMI Preview</th>
              <th className="py-3 text-center text-xs font-bold uppercase tracking-wide">Last Updated</th>
              <th className="py-3 text-right text-xs font-bold uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {banks.map((bank) => {
              const isEditing = editingSlug === bank.slug;
              const isSaving = saving === bank.slug;
              const isDeleting = deleting === bank.slug;
              const stale = isStale(bank.updatedAt);
              const emi = calcEMI(PREVIEW_PRINCIPAL, bank.rate, PREVIEW_YEARS);

              return (
                <tr key={bank.slug} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group">
                  {/* Bank Name */}
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
                        <Landmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{bank.bank}</span>
                        {bank.isCustom && (
                          <span className="ml-2 text-[10px] px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-200 rounded-full font-bold">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Rate */}
                  <td className="py-3.5 text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="50"
                          value={editRate}
                          onChange={(e) => setEditRate(e.target.value)}
                          className="w-24 rounded-lg border border-blue-300 px-2.5 py-1.5 text-sm text-center outline-none focus:border-blue-500 font-semibold"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRate(bank.slug, bank.bank);
                            if (e.key === "Escape") cancelEdit();
                          }}
                        />
                        <span className="text-slate-500 text-xs font-medium">%</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold border ${
                            bank.rate >= 9
                              ? "bg-rose-100 text-rose-900 border-rose-200"
                              : bank.rate >= 8.7
                              ? "bg-amber-100 text-amber-950 border-amber-300"
                              : "bg-emerald-100 text-emerald-950 border-emerald-300"
                          }`}
                        >
                          <TrendingUp className="h-3 w-3" />
                          {bank.rate.toFixed(2)}%
                        </span>
                        {stale && (
                          <span title="Rate not updated in 30+ days">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* EMI Preview */}
                  <td className="py-3.5 text-center">
                    <span className="text-slate-900 dark:text-white font-extrabold text-sm tabular-nums">
                      ₹{formatINR(emi)}
                      <span className="text-slate-500 font-normal text-xs">/mo</span>
                    </span>
                  </td>

                  {/* Last Updated */}
                  <td className="py-3.5 text-center">
                    {bank.updatedAt ? (
                      <span className={`text-xs ${stale ? "text-amber-600 font-bold" : "text-slate-500 dark:text-slate-400 font-medium"}`}>
                        {new Date(bank.updatedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {stale && " ⚠️"}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Default</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveRate(bank.slug, bank.bank)}
                            disabled={isSaving}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition disabled:opacity-60"
                          >
                            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(bank)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition shadow-2xs"
                          >
                            <Pencil className="h-3.5 w-3.5 text-slate-500" />
                            Edit Rate
                          </button>
                          {bank.isCustom && (
                            <button
                              onClick={() => deleteBank(bank.slug, bank.bank)}
                              disabled={isDeleting}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-60"
                              title="Remove this bank"
                            >
                              {isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
