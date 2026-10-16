"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Calendar,
  History,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Building,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export type PriceLogItem = {
  id: string;
  propertyId: string;
  price: number;
  ratePerSqft: number | null;
  stage: string | null;
  changedByUserId: string | null;
  changedByName: string | null;
  notes: string | null;
  createdAt: string | Date;
};

export type AppreciationMetrics = {
  currentPrice: number;
  ratePerSqft: number | null;
  price7d: number | null;
  change7dAmount: number;
  change7dPercent: number;
  price30d: number | null;
  change30dAmount: number;
  change30dPercent: number;
  price90d: number | null;
  change90dAmount: number;
  change90dPercent: number;
  priceAnnual: number | null;
  changeAnnualAmount: number;
  changeAnnualPercent: number;
  logs: PriceLogItem[];
};

export function PropertyPriceHistoryCard({
  propertyId,
  initialPrice,
  sqft,
  isAdmin = true,
}: {
  propertyId: string;
  initialPrice: number;
  sqft?: number | null;
  isAdmin?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AppreciationMetrics | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPrice, setNewPrice] = useState<string>(initialPrice.toString());
  const [newStage, setNewStage] = useState("Current Price");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPriceHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/price-history`);
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.error("Error fetching price history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceHistory();
  }, [propertyId]);

  const handleAddPriceEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceVal = parseFloat(newPrice);
    if (!priceVal || isNaN(priceVal)) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/properties/${propertyId}/price-history`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: priceVal,
          ratePerSqft: sqft && sqft > 0 ? priceVal / sqft : null,
          stage: newStage,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.metrics) {
          setMetrics(data.metrics);
        }
        setShowAddModal(false);
        setNotes("");
      }
    } catch (err) {
      console.error("Failed to add price entry:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Render change badge helper
  const renderAppreciationBadge = (pct: number, amount: number) => {
    const isPositive = pct >= 0;
    return (
      <div className="mt-2 space-y-1">
        <div className="flex items-center gap-1">
          {isPositive ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold text-xs">
              <ArrowUpRight className="h-3.5 w-3.5 stroke-[3]" />
              +{pct.toFixed(2)}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-300 font-extrabold text-xs">
              <ArrowDownRight className="h-3.5 w-3.5 stroke-[3]" />
              {pct.toFixed(2)}%
            </span>
          )}
        </div>
        <p className={`text-xs font-bold ${isPositive ? "text-emerald-700" : "text-rose-700"}`}>
          {isPositive ? "+" : ""}
          {formatCurrency(amount)}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Container - Clean White Box */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-bold tracking-tight text-slate-900">
              Property Price History &amp; Appreciation Log
            </h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Compare latest listing price against historical price logs across 7-day, 30-day, 90-day &amp; annual benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchPriceHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs border border-slate-300 shadow-sm transition"
            title="Refresh Price History"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-900 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-sm transition"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>Log Price Change</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Appreciation Metric Boxes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 7-Day Appreciation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>7-Day Yield</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          {metrics ? (
            renderAppreciationBadge(metrics.change7dPercent, metrics.change7dAmount)
          ) : (
            <p className="text-xs text-slate-400 mt-2">Calculating...</p>
          )}
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Prev 7D: {formatCurrency(metrics?.price7d || initialPrice)}
          </p>
        </div>

        {/* 30-Day Appreciation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>30-Day Yield</span>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </div>
          {metrics ? (
            renderAppreciationBadge(metrics.change30dPercent, metrics.change30dAmount)
          ) : (
            <p className="text-xs text-slate-400 mt-2">Calculating...</p>
          )}
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Prev 30D: {formatCurrency(metrics?.price30d || initialPrice)}
          </p>
        </div>

        {/* 90-Day Appreciation */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>90-Day Yield</span>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </div>
          {metrics ? (
            renderAppreciationBadge(metrics.change90dPercent, metrics.change90dAmount)
          ) : (
            <p className="text-xs text-slate-400 mt-2">Calculating...</p>
          )}
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Prev 90D: {formatCurrency(metrics?.price90d || initialPrice)}
          </p>
        </div>

        {/* Annual Appreciation (YTD / 365d) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Annual Yield</span>
            <Building className="h-4 w-4 text-amber-600" />
          </div>
          {metrics ? (
            renderAppreciationBadge(metrics.changeAnnualPercent, metrics.changeAnnualAmount)
          ) : (
            <p className="text-xs text-slate-400 mt-2">Calculating...</p>
          )}
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Prev Annual: {formatCurrency(metrics?.priceAnnual || initialPrice)}
          </p>
        </div>
      </div>

      {/* Price Logs Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">
            Individual Price Change Log History ({metrics?.logs.length || 0} entries)
          </h4>
          <span className="text-xs text-slate-500 font-medium">Chronological record of price revisions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Stage / Event</th>
                <th className="p-3.5">Log Price</th>
                <th className="p-3.5">Rate / Sqft</th>
                <th className="p-3.5">Price Shift (vs Prev)</th>
                <th className="p-3.5">Appreciation %</th>
                <th className="p-3.5">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
              {metrics && metrics.logs.length > 0 ? (
                metrics.logs.map((log, idx) => {
                  const prevLog = idx > 0 ? metrics.logs[idx - 1] : null;
                  const diffAmount = prevLog ? log.price - prevLog.price : 0;
                  const diffPct = prevLog && prevLog.price > 0 ? (diffAmount / prevLog.price) * 100 : 0;

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition">
                      {/* Timestamp */}
                      <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Stage */}
                      <td className="p-3.5">
                        <span className="font-bold text-slate-900 bg-white border border-slate-300 px-2.5 py-0.5 rounded-lg shadow-sm">
                          {log.stage || "Current Price"}
                        </span>
                        {log.notes && (
                          <p className="text-[10px] text-slate-500 font-medium mt-0.5">{log.notes}</p>
                        )}
                      </td>

                      {/* Log Price */}
                      <td className="p-3.5 font-bold text-slate-900 text-sm">
                        {formatCurrency(log.price)}
                      </td>

                      {/* Rate / Sqft */}
                      <td className="p-3.5 font-mono text-slate-700">
                        {log.ratePerSqft ? `₹${Math.round(log.ratePerSqft).toLocaleString("en-IN")}/sqft` : "N/A"}
                      </td>

                      {/* Price Shift */}
                      <td className="p-3.5">
                        {prevLog ? (
                          <span
                            className={`font-bold ${
                              diffAmount >= 0 ? "text-emerald-700" : "text-rose-700"
                            }`}
                          >
                            {diffAmount >= 0 ? "+" : ""}
                            {formatCurrency(diffAmount)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Baseline Entry</span>
                        )}
                      </td>

                      {/* Appreciation % */}
                      <td className="p-3.5">
                        {prevLog ? (
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[11px] border ${
                              diffPct >= 0
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-rose-50 text-rose-800 border-rose-300"
                            }`}
                          >
                            {diffPct >= 0 ? "+" : ""}
                            {diffPct.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Logged By */}
                      <td className="p-3.5 text-slate-600 font-medium">
                        {log.changedByName || "System Admin"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    No price log entries recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Price Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-5 w-5 text-amber-600" />
                Log Price Update
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPriceEntry} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  New Property Price (₹)
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 outline-none focus:border-slate-400 shadow-sm"
                  placeholder="Enter updated price..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Price Stage / Category
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-900 outline-none focus:border-slate-400 shadow-sm"
                >
                  <option value="Current Price">Current Price</option>
                  <option value="Soft Launch">Soft Launch</option>
                  <option value="Pre Launch">Pre Launch</option>
                  <option value="Launch Price">Launch Price</option>
                  <option value="Market Revision">Market Revision</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Notes / Revision Reason
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Q3 Market Price Revision..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-slate-400 shadow-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 shadow-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 text-xs font-bold transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Logging..." : "Log & Recalculate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
