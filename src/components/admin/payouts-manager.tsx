"use client";

import { useState, useMemo } from "react";
import { Coins, Calendar, Users, Percent, Check, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type PayoutProperty = {
  id: string;
  title: string;
  symbol: string;
  price: number;
  yieldRate: number;
  category: string;
  investorsCount: number;
};

type PayoutStatus = "SCHEDULED" | "PAUSED" | "PROCESSED";

export function PayoutsManager({ properties }: { properties: PayoutProperty[] }) {
  // Local state to track statuses of payouts
  const [statuses, setStatuses] = useState<Record<string, PayoutStatus>>({});

  // Calculations for stats
  const stats = useMemo(() => {
    const totalPool = properties.reduce((sum, p) => sum + p.price * (p.yieldRate / 100), 0);
    const totalInvestors = properties.reduce((sum, p) => sum + p.investorsCount, 0);
    const avgYield = properties.length > 0
      ? properties.reduce((sum, p) => sum + p.yieldRate, 0) / properties.length
      : 0;

    return {
      totalPool,
      totalInvestors,
      avgYield,
    };
  }, [properties]);

  const handleProcess = (id: string, name: string, poolAmount: number) => {
    alert(`Dividend payout processed for ${name}.\nTotal Distributed: ${formatCurrency(poolAmount / 12)} (Monthly Portion)`);
    setStatuses(prev => ({ ...prev, [id]: "PROCESSED" }));
  };

  const handleTogglePause = (id: string, name: string) => {
    const currentStatus = statuses[id] || "SCHEDULED";
    const newStatus: PayoutStatus = currentStatus === "PAUSED" ? "SCHEDULED" : "PAUSED";
    setStatuses(prev => ({ ...prev, [id]: newStatus }));
    alert(`Dividend schedule for ${name} has been ${newStatus === "PAUSED" ? "PAUSED" : "RESUMED"}.`);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Dividend Pool</p>
            <Coins className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(stats.totalPool)}</p>
          <p className="text-xs text-slate-400 mt-1">Annualized portfolio payouts</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next Payout Date</p>
            <Calendar className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-600">April 30, 2026</p>
          <p className="text-xs text-slate-400 mt-1">Monthly cycle distribution</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Eligible Investors</p>
            <Users className="h-4 w-4 text-purple-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalInvestors}</p>
          <p className="text-xs text-slate-400 mt-1">Unique fractional share owners</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Portfolio Yield</p>
            <Percent className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{stats.avgYield.toFixed(2)}%</p>
          <p className="text-xs text-slate-400 mt-1">Across all properties</p>
        </div>
      </div>

      {/* 2. Dividend Payout Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-900">Dividend Payout Schedule</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50 text-left text-slate-500 font-medium">
              <tr>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Property Asset</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Yield Rate</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Annual Pool</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Investors</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Per-Share yield</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Frequency</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Next Settlement</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                    No active property listings found to configure payouts.
                  </td>
                </tr>
              ) : (
                properties.map(p => {
                  const annualPool = p.price * (p.yieldRate / 100);
                  const perShareYield = 1000 * (p.yieldRate / 100); // assuming $1,000 share value
                  const status = statuses[p.id] || "SCHEDULED";

                  return (
                    <tr key={p.id} className={`hover:bg-slate-50/50 transition-colors ${
                      status === "PAUSED" ? "bg-amber-50/10" : status === "PROCESSED" ? "bg-emerald-50/10" : ""
                    }`}>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-900 block leading-tight">{p.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">{p.symbol} · {p.category}</span>
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-600 font-mono">
                        {p.yieldRate.toFixed(2)}%
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-900">
                        {formatCurrency(annualPool)}<span className="text-slate-400 text-xs font-normal">/yr</span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700 font-mono">
                        {p.investorsCount}
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        {formatCurrency(perShareYield)}<span className="text-slate-400 text-xs font-normal">/yr</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                          Monthly
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-500 font-medium">
                        {status === "PROCESSED" ? "Paid" : "April 30, 2026"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          status === "SCHEDULED" ? "bg-blue-100 text-blue-800" :
                          status === "PAUSED" ? "bg-amber-100 text-amber-800" :
                          "bg-emerald-100 text-emerald-800"
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {status !== "PROCESSED" && (
                            <Button
                              variant="gold"
                              className="!py-1 !px-2.5 text-xs h-7 gap-1"
                              onClick={() => handleProcess(p.id, p.title, annualPool)}
                            >
                              <Check className="h-3 w-3" /> Process
                            </Button>
                          )}
                          <button
                            onClick={() => handleTogglePause(p.id, p.title)}
                            className={`p-1.5 rounded-lg border transition ${
                              status === "PAUSED"
                                ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                : "border-amber-200 text-amber-700 hover:bg-amber-50"
                            }`}
                            title={status === "PAUSED" ? "Resume Dividend Schedule" : "Pause Dividend Schedule"}
                          >
                            {status === "PAUSED" ? (
                              <Play className="h-3.5 w-3.5" />
                            ) : (
                              <Pause className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
