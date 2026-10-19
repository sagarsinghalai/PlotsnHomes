"use client";

import { useState, useMemo } from "react";
import { LineChart, ArrowUpRight, ArrowDownRight, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";
import { ViewToggle, useViewMode, viewContainerClass } from "@/components/admin/view-toggle";
import { X } from "lucide-react";

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
  const [viewMode, setViewMode] = useViewMode("admin-trades", "list");

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

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([filteredTrades]);

  const hasActiveFilters = search !== "" || typeFilter !== "" || propertyFilter !== "";
  const clearAllFilters = () => {
    setSearch("");
    setTypeFilter("");
    setPropertyFilter("");
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
              className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2 text-xs font-medium focus:border-brand focus:outline-none bg-white transition"
            />
          </div>

          <div className="w-[140px]">
            <SearchableSelect
              options={[
                { value: "", label: "All Types" },
                { value: "BUY", label: "BUY" },
                { value: "SELL", label: "SELL" },
              ]}
              value={typeFilter}
              onChange={(val) => setTypeFilter(val as "" | "BUY" | "SELL")}
              placeholder="All Types"
              searchPlaceholder="Search type..."
            />
          </div>

          <div className="w-[200px]">
            <SearchableSelect
              options={[
                { value: "", label: "All Properties" },
                ...properties.map((p) => ({ value: p, label: p })),
              ]}
              value={propertyFilter}
              onChange={(val) => setPropertyFilter(val)}
              placeholder="All Properties"
              searchPlaceholder="Search property..."
            />
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-mono">
              {filteredTrades.length} records
            </span>
            {viewMode === "list" && (
              <TableScrollButtons canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onScroll={scroll} />
            )}
            <ViewToggle mode={viewMode} onChange={setViewMode} />
            <button
              type="button"
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              title={hasActiveFilters ? "Clear all filters" : "No filters applied"}
              className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
                hasActiveFilters
                  ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-300"
                  : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
              }`}
            >
              <X className="h-4 w-4 stroke-[2.5]" /> Clear All
            </button>
            <Button
              variant="secondary"
              className="!py-1.5 !px-3 text-xs h-8 gap-1.5"
              onClick={exportCSV}
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Trade History — card grid */}
        {viewMode !== "list" ? (
          <div className="p-4">
            {filteredTrades.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">No trade logs found matching your filters.</div>
            ) : (
              <div className={viewContainerClass(viewMode)}>
                {filteredTrades.map((t, idx) => {
                  const colors = ["bg-blue-500", "bg-purple-500", "bg-indigo-500", "bg-teal-500", "bg-amber-500"];
                  const avatarColor = colors[idx % colors.length];
                  return (
                    <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-md flex items-center justify-center text-white font-bold text-[10px] shrink-0 ${avatarColor}`}>
                            {t.userName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 block leading-tight truncate">{t.userName}</span>
                            <span className="text-[10px] text-slate-400 truncate block">{t.userEmail}</span>
                          </div>
                        </div>
                        <span className={`shrink-0 inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-xs font-bold ${t.type === "BUY" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
                          {t.type === "BUY" ? <ArrowUpRight className="h-3 w-3 stroke-[2.5]" /> : <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />}
                          {t.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 border-t border-slate-100 pt-2">
                        <p className="font-semibold text-slate-900 truncate">{t.propertyTitle}</p>
                        <p className="font-mono text-[10px] text-slate-400">{t.propertySymbol} · {t.id.slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 border-t border-slate-100 pt-2">
                        <span>Shares: <strong className="text-slate-900 font-mono">{t.shares}</strong></span>
                        <span>Price: <strong className="text-slate-900">{formatCurrency(t.pricePerShare)}</strong></span>
                        <span>Total: <strong className="text-slate-900">{formatCurrency(t.totalValue)}</strong></span>
                        <span className={`font-bold font-mono ${t.pnl > 0 ? "text-emerald-600" : t.pnl < 0 ? "text-red-600" : "text-slate-400"}`}>
                          P&L: {t.pnl === 0 ? "—" : (t.pnl > 0 ? "+" : "") + formatCurrency(t.pnl)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 border-t border-slate-100 pt-2 mt-auto" suppressHydrationWarning>
                        {new Date(t.createdAt).toLocaleString("en-US")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
        <div ref={tableScrollRef} className="overflow-x-auto">
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
                      <td className="px-5 py-3.5 text-slate-500 text-xs" suppressHydrationWarning>
                        {new Date(t.createdAt).toLocaleDateString("en-US")}
                        <span className="text-[10px] text-slate-400 block" suppressHydrationWarning>{new Date(t.createdAt).toLocaleTimeString("en-US")}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
