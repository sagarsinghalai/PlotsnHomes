"use client";

import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  Search,
  Plus,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  X,
  Filter,
  DollarSign,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";

export type PriceLogItem = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertySymbol: string;
  oldPrice: number;
  newPrice: number;
  changePct: number;
  ratePerSqft?: number;
  stage: string;
  changedByName: string;
  notes: string;
  createdAt: string;
};

export type PropertyOption = {
  id: string;
  title: string;
  symbol: string;
  price: number;
};

export function PriceHistoryManager({
  initialProperties = [],
}: {
  initialProperties?: PropertyOption[];
}) {
  const { hasAddPermission } = useAdminPermissions();
  const canAdd = hasAddPermission("/admin/price-history");
  const [logs, setLogs] = useState<PriceLogItem[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>(initialProperties);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<"all" | "7d" | "30d" | "90d" | "12m" | "ytd">("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset to page 1 when search or timeframe changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, timeframe]);

  // Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [ratePerSqft, setRatePerSqft] = useState("");
  const [stage, setStage] = useState("Market Demand Revision");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPriceHistory(timeframe);
    fetchProperties();
  }, [timeframe]);

  async function fetchPriceHistory(tf: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/price-history?timeframe=${tf}`);
      const data = await res.json();
      if (data.success && data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Failed to fetch price history logs:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProperties() {
    if (properties.length > 0) return;
    try {
      const res = await fetch("/api/admin/properties");
      const data = await res.json();
      if (data.properties) {
        setProperties(
          data.properties.map((p: any) => ({
            id: p.id,
            title: p.title,
            symbol: p.symbol,
            price: p.price,
          }))
        );
      }
    } catch (e) {
      console.error("Failed to fetch properties list", e);
    }
  }

  // Calculated Summary Statistics for Date Filters
  const stats = useMemo(() => {
    if (logs.length === 0) {
      return { totalLogs: 0, avgAppreciation: 0, positiveCount: 0, negativeCount: 0 };
    }
    const totalApprec = logs.reduce((sum, l) => sum + (l.changePct || 0), 0);
    const avgAppreciation = Math.round((totalApprec / logs.length) * 100) / 100;
    const positiveCount = logs.filter((l) => l.changePct > 0).length;
    const negativeCount = logs.filter((l) => l.changePct < 0).length;
    return {
      totalLogs: logs.length,
      avgAppreciation,
      positiveCount,
      negativeCount,
    };
  }, [logs]);

  // Filtered logs by search term
  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const query = search.toLowerCase();
      return (
        l.propertyTitle.toLowerCase().includes(query) ||
        l.propertySymbol.toLowerCase().includes(query) ||
        l.stage.toLowerCase().includes(query) ||
        l.changedByName.toLowerCase().includes(query)
      );
    });
  }, [logs, search]);

  const totalFiltered = filteredLogs.length;
  const totalLogsCount = logs.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(totalFiltered, startIndex + pageSize);

  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(startIndex, startIndex + pageSize);
  }, [filteredLogs, startIndex, pageSize]);

  // Handle submitting a new price change log
  async function handleCreateLog(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPropertyId || !newPrice) {
      alert("Please select a property and enter the new price.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/price-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          newPrice,
          ratePerSqft,
          stage,
          notes,
          changedByName: "Admin User",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to log price change");
      }
      setShowLogModal(false);
      setSelectedPropertyId("");
      setNewPrice("");
      setRatePerSqft("");
      setNotes("");
      fetchPriceHistory(timeframe);
      alert("Price change successfully logged! Appreciation rates updated across system.");
    } catch (err: any) {
      alert(err.message || "Error logging price change");
    } finally {
      setSubmitting(false);
    }
  }

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([filteredLogs]);

  const hasActiveFilters = search !== "" || timeframe !== "all";
  const clearAllFilters = () => {
    setSearch("");
    setTimeframe("all");
  };

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto bg-slate-50 min-h-screen">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <TrendingUp className="h-7 w-7 text-amber-600" />
            Price History & Appreciation Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Track historical property price changes, capital appreciation trends, and sync date-filtered metrics (7D, 30D, 90D, 12M, YTD) across the entire platform.
          </p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowLogModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-hover hover:from-brand hover:to-brand-hover text-white font-extrabold text-sm px-4 py-2.5 shadow-md transition"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Log Price Change</span>
          </button>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Price Adjustments</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">{stats.totalLogs} Logs</span>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Filtered ({timeframe.toUpperCase()})
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Avg Appreciation</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-700">+{stats.avgAppreciation}%</span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" /> Growth
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Appreciated Properties</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">{stats.positiveCount} Assets</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Positive Trend
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Date Filter</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-lg font-black text-amber-600 uppercase">
              {timeframe === "all" ? "All Time History" : timeframe === "12m" ? "12 Months" : timeframe}
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Date Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-amber-500" /> Filter:
          </span>
          {[
            { id: "all", label: "All Time" },
            { id: "7d", label: "7 Days" },
            { id: "30d", label: "30 Days" },
            { id: "90d", label: "90 Days" },
            { id: "12m", label: "12 Months" },
            { id: "ytd", label: "YTD" },
          ].map((item) => {
            const active = timeframe === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTimeframe(item.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search by Symbol, Title, Stage..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-amber-500"
            />
          </div>
          <TableScrollButtons canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onScroll={scroll} />
          <button
            type="button"
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            title={hasActiveFilters ? "Clear all filters" : "No filters applied"}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
              hasActiveFilters
                ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "border-slate-300 bg-white text-slate-800"
            }`}
          >
            <X className="h-4 w-4 stroke-[2.5]" /> Clear All
          </button>
        </div>
      </div>

      {/* Price Logs Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div ref={tableScrollRef} className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Date & Time</th>
                <th className="px-4 py-3">Property Symbol</th>
                <th className="px-4 py-3">Property Asset</th>
                <th className="px-4 py-3">Previous Price</th>
                <th className="px-4 py-3">New Price</th>
                <th className="px-4 py-3">Appreciation</th>
                <th className="px-4 py-3">Rate / SqFt</th>
                <th className="px-4 py-3">Milestone / Stage</th>
                <th className="px-4 py-3">Changed By</th>
                <th className="px-4 py-3">Notes & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    Loading price logs...
                  </td>
                </tr>
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    No price changes logged for this query or date range.
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const isPositive = log.changePct >= 0;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {new Date(log.createdAt).toISOString().replace("T", " ").slice(0, 16)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="rounded-md bg-slate-900 text-white font-mono font-extrabold px-2 py-0.5 text-[10px]">
                          {log.propertySymbol}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {log.propertyTitle}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-500 line-through">
                        {formatCurrency(log.oldPrice)}
                      </td>
                      <td className="px-4 py-3.5 font-mono font-black text-slate-900">
                        {formatCurrency(log.newPrice)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-extrabold text-[11px] ${
                            isPositive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {isPositive ? `+${log.changePct}%` : `${log.changePct}%`}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-600">
                        ₹{log.ratePerSqft?.toLocaleString("en-IN") || "—"}/sqft
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 font-semibold text-[10px]">
                          {log.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {log.changedByName}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">
                        {log.notes}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Total Count Summary & Pagination Controls */}
        <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-600">
          {/* Total Number of Price Changes (Always Visible at Bottom) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-900 bg-white border border-slate-200 shadow-2xs px-3 py-1 rounded-xl flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-amber-500" />
              Total Price Changes: <b className="text-amber-600 font-extrabold text-sm">{totalFiltered}</b>
            </span>
            {search.trim() ? (
              <span className="text-[11px] text-amber-900 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl">
                Filtered results from {totalLogsCount} total recorded price logs
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium">
                Showing {totalFiltered === 0 ? 0 : startIndex + 1} – {endIndex} of {totalFiltered} entries
              </span>
            )}
          </div>

          {/* Pagination Navigation */}
          {totalFiltered > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 font-semibold">Show:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-800 outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <span className="text-xs font-semibold text-slate-700">
                Page <b className="font-bold text-slate-900">{currentPage}</b> of <b className="font-bold text-slate-900">{totalPages}</b>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                  title="First Page"
                >
                  «
                </button>
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                >
                  ‹ Prev
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                >
                  Next ›
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
                  title="Last Page"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODAL: LOG NEW PRICE CHANGE ── */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" /> Log Property Price Revision
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record price change to update appreciation metrics across 7D, 30D, 90D & YTD filters
                </p>
              </div>
              <button onClick={() => setShowLogModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Property Asset *</label>
                <select
                  required
                  value={selectedPropertyId}
                  onChange={(e) => {
                    setSelectedPropertyId(e.target.value);
                    const prop = properties.find((p) => p.id === e.target.value);
                    if (prop) setNewPrice(prop.price.toString());
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-900 outline-none focus:border-amber-500"
                >
                  <option value="">-- Choose Property --</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.symbol}) — Current: ₹{p.price?.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">New Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 45000000"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-black text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rate per SqFt (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5200"
                    value={ratePerSqft}
                    onChange={(e) => setRatePerSqft(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-900 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Milestone / Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-900 outline-none focus:border-amber-500"
                >
                  <option value="Pre-Launch Price">Pre-Launch Price</option>
                  <option value="Construction Milestone">Construction Milestone</option>
                  <option value="Market Demand Revision">Market Demand Revision</option>
                  <option value="Annual Appraisal">Annual Appraisal</option>
                  <option value="Ready to Move">Ready to Move</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes & Rationale</label>
                <textarea
                  rows={2}
                  placeholder="Record market reasons, infrastructure triggers, or valuation comments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-medium text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 font-bold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-4 py-2 shadow-sm transition"
                >
                  {submitting ? "Saving Log..." : "Log & Sync Price"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
