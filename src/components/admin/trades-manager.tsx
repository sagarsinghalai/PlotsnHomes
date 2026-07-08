"use client";

import { useState, useMemo } from "react";
import { LineChart, ArrowUpRight, ArrowDownRight, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

type Trade = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  type: "BUY" | "SELL";
  propertyTitle: string;
  propertySymbol: string;
  shares: number;
  pricePerShare: number;
  totalValue: number;
  pnl: number;
  status: string;
  createdAt: string;
};

export function TradesManager({ trades }: { trades: Trade[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "BUY" | "SELL">("");
  const [propertyFilter, setPropertyFilter] = useState("");

  // Unique properties for selection
  const properties = useMemo(() => {
    const set = new Set<string>();
    trades.forEach(t => set.add(t.propertyTitle));
    return Array.from(set);
  }, [trades]);

  // Calculations for stats
  const stats = useMemo(() => {
    const totalVolume = trades.reduce((sum, t) => sum + t.totalValue, 0);
    const totalCount = trades.length;
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const avgTrade = totalCount > 0 ? totalVolume / totalCount : 0;

    return {
      totalVolume,
      totalCount,
      totalPnl,
      avgTrade,
    };
  }, [trades]);

  // Filtered list
  const filteredTrades = useMemo(() => {
    let list = [...trades];

    if (typeFilter) {
      list = list.filter(t => t.type === typeFilter);
    }

    if (propertyFilter) {
      list = list.filter(t => t.propertyTitle === propertyFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t => 
        t.userName.toLowerCase().includes(q) || 
        t.userEmail.toLowerCase().includes(q) ||
        t.propertyTitle.toLowerCase().includes(q) ||
        t.propertySymbol.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      );
    }

    return list;
  }, [trades, typeFilter, propertyFilter, search]);

  const exportCSV = () => {
    const headers = ["Trade ID", "User", "Email", "Type", "Property", "Shares", "Price/Share", "Total Value", "P&L", "Date"];
    const rows = filteredTrades.map(t => [
      t.id,
      t.userName,
      `"${t.userEmail}"`,
      t.type,
      `"${t.propertySymbol} — ${t.propertyTitle}"`,
      t.shares,
      t.pricePerShare,
      t.totalValue,
      t.pnl,
      t.createdAt
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trades_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Trade Volume</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(stats.totalVolume)}</p>
          <p className="text-xs text-slate-400 mt-1">Cumulative transactions</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Trades Executed</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{stats.totalCount}</p>
          <p className="text-xs text-slate-400 mt-1">Secondary & primary orders</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Combined Investor P&L</p>
          <p className={`mt-2 text-2xl font-bold ${stats.totalPnl >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {stats.totalPnl >= 0 ? "+" : ""}{formatCurrency(stats.totalPnl)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Realized investment gains</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 transition-colors">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Order Size</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{formatCurrency(stats.avgTrade)}</p>
          <p className="text-xs text-slate-400 mt-1">Per fractional share sale</p>
        </div>
      </div>

      {/* 2. Filter Bar and Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, property, symbol..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2 text-xs font-medium focus:border-gold focus:outline-none bg-white transition"
            />
          </div>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as "" | "BUY" | "SELL")}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-gold focus:outline-none bg-white transition cursor-pointer min-w-[120px]"
          >
            <option value="">All Types</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>

          <select
            value={propertyFilter}
            onChange={e => setPropertyFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium focus:border-gold focus:outline-none bg-white transition cursor-pointer min-w-[180px]"
          >
            <option value="">All Properties</option>
            {properties.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">
              {filteredTrades.length} records
            </span>
            <Button
              variant="secondary"
              className="!py-1.5 !px-3 text-xs h-8 gap-1.5"
              onClick={exportCSV}
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Trade History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50 text-left text-slate-500 font-medium">
              <tr>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Trade ID</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Property</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider text-center">Shares</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Price / Share</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Total Value</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Realized P&L</th>
                <th className="px-5 py-3 text-[11px] uppercase tracking-wider">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                    No trade logs found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredTrades.map((t, idx) => {
                  const colors = ["bg-blue-500", "bg-purple-500", "bg-indigo-500", "bg-teal-500", "bg-amber-500"];
                  const avatarColor = colors[idx % colors.length];

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-400">
                        {t.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[9px] ${avatarColor}`}>
                            {t.userName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block leading-none">{t.userName}</span>
                            <span className="text-[10px] text-slate-400">{t.userEmail}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-xs font-bold ${
                          t.type === "BUY" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                        }`}>
                          {t.type === "BUY" ? (
                            <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />
                          )}
                          {t.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-900 block leading-tight">{t.propertyTitle}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-medium">{t.propertySymbol}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center font-bold text-slate-900 font-mono">
                        {t.shares}
                      </td>
                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        {formatCurrency(t.pricePerShare)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {formatCurrency(t.totalValue)}
                      </td>
                      <td className={`px-5 py-3.5 font-bold font-mono ${
                        t.pnl > 0 ? "text-emerald-600" : t.pnl < 0 ? "text-red-600" : "text-slate-400 font-normal"
                      }`}>
                        {t.pnl === 0 ? "—" : (t.pnl > 0 ? "+" : "") + formatCurrency(t.pnl)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {new Date(t.createdAt).toLocaleDateString()}
                        <span className="text-[10px] text-slate-400 block">{new Date(t.createdAt).toLocaleTimeString()}</span>
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
