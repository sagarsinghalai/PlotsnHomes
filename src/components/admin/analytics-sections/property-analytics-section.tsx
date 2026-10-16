"use client";

import { useState } from "react";
import { KeyRound, Eye, ExternalLink, ArrowUpRight } from "lucide-react";
import { useAdminCurrency } from "@/components/admin/admin-currency-context";
import { AnalyticsDateFilter } from "./analytics-date-filter";
import {
  PriceLogEntry,
  getPriceAppreciationForRange,
  DEFAULT_GLOBAL_PRICE_LOGS,
} from "@/lib/price-history";

interface PropertyAnalyticsProps {
  data: {
    propertyListingTrend?: Array<{ date: string; count?: number }>;
    propertyStatusBreakdown?: Array<{ status: string; count: number }>;
    propertyTypeDistribution?: Array<{ type: string; count: number }>;
    avgPricePerSqFt?: { currentRate: number; changePct: number; sparkline: number[] };
    mostViewedProperties?: Array<{
      id: string;
      title: string;
      city: string;
      price: number;
      views: number;
      status: string;
    }>;
  };
}

function getCubicBezierPath(points: Array<{ x: number; y: number }>) {
  if (!points || points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }
  return path;
}

function getCubicBezierArea(points: Array<{ x: number; y: number }>, height: number, padding: number) {
  if (!points || points.length === 0) return "";
  const linePath = getCubicBezierPath(points);
  const lastP = points[points.length - 1];
  const firstP = points[0];
  return `${linePath} L ${lastP.x} ${height - padding} L ${firstP.x} ${height - padding} Z`;
}

export function PropertyAnalyticsSection({ data }: PropertyAnalyticsProps) {
  const { formatAmount } = useAdminCurrency();
  const [priceLogFilter, setPriceLogFilter] = useState("30d");
  const [logsList, setLogsList] = useState<PriceLogEntry[]>(
    Array.isArray((data as any)?.priceLogs) && (data as any).priceLogs.length > 0
      ? (data as any).priceLogs
      : DEFAULT_GLOBAL_PRICE_LOGS
  );

  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [newStage, setNewStage] = useState("Quarterly Price Revision");
  const [newRate, setNewRate] = useState(17500);
  const [newPrice, setNewPrice] = useState(43750000);
  const [newNotes, setNewNotes] = useState("Updated price appreciation following market benchmark survey");

  const priceMetrics = getPriceAppreciationForRange(logsList, priceLogFilter);

  const handleAddPriceLog = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: PriceLogEntry = {
      id: `log-${Date.now()}`,
      propertyId: "prop-1",
      price: Number(newPrice),
      ratePerSqft: Number(newRate),
      stage: newStage,
      changedByUserId: "user-admin",
      changedByName: "System Admin",
      notes: newNotes,
      createdAt: new Date().toISOString(),
    };
    setLogsList((prev) => [newEntry, ...prev]);
    setShowAddLogModal(false);
  };

  const rawTrend = Array.isArray(data?.propertyListingTrend) ? data.propertyListingTrend : [];
  const defaultDates = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const listingTrend = rawTrend.length > 0 ? rawTrend : defaultDates.map((d, i) => ({ date: d, count: [3, 5, 4, 8, 11, 9, 14][i] }));

  const rawStatus = Array.isArray(data?.propertyStatusBreakdown) ? data.propertyStatusBreakdown : [];
  const statusBreakdown = rawStatus.length > 0 ? rawStatus : [
    { status: "ACTIVE", count: 8 },
    { status: "PENDING", count: 3 },
    { status: "SOLD", count: 5 },
  ];

  const rawTypes = Array.isArray(data?.propertyTypeDistribution) ? data.propertyTypeDistribution : [];
  const typeDistribution = rawTypes.length > 0 ? rawTypes : [
    { type: "RESIDENTIAL", count: 10 },
    { type: "COMMERCIAL", count: 4 },
    { type: "PLOT", count: 2 },
  ];

  const mostViewed = Array.isArray(data?.mostViewedProperties) ? data.mostViewedProperties : [];

  const maxListings = Math.max(...listingTrend.map((l) => l.count || 1), 1);
  const chartW = 400;
  const chartH = 140;
  const pad = 16;

  const trendPoints = listingTrend.map((d, i) => {
    const val = d.count || 0;
    const x = pad + (listingTrend.length > 1 ? (i / (listingTrend.length - 1)) * (chartW - pad * 2) : (chartW - pad * 2) / 2);
    const y = chartH - pad - (val / maxListings) * (chartH - pad * 2);
    return { x, y, date: d.date, val };
  });

  const trendLinePath = getCubicBezierPath(trendPoints);
  const trendAreaPath = getCubicBezierArea(trendPoints, chartH, pad);

  const sqftVals = priceMetrics.sparkline;
  const maxSqft = Math.max(...sqftVals, 1);
  const sqftPoints = sqftVals.map((v, i) => {
    const x = pad + (sqftVals.length > 1 ? (i / (sqftVals.length - 1)) * (chartW - pad * 2) : (chartW - pad * 2) / 2);
    const y = chartH - pad - (v / maxSqft) * (chartH - pad * 2);
    return { x, y };
  });
  const sqftLinePath = getCubicBezierPath(sqftPoints);
  const sqftAreaPath = getCubicBezierArea(sqftPoints, chartH, pad);

  const typeColors: Record<string, string> = {
    RESIDENTIAL: "#3b82f6",
    COMMERCIAL: "#10b981",
    PLOT: "#f59e0b",
    INDUSTRIAL: "#8b5cf6",
  };

  return (
    <div className="space-y-6">
      {/* Grid of 4 Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. PROPERTY LISTING TREND */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Listing Velocity
            </span>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {listingTrend.reduce((sum, l) => sum + (l.count || 0), 0)} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">units</span>
            </p>
          </div>
          <div className="relative h-16 w-full mt-2">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-full w-full overflow-visible">
              {trendAreaPath && <path d={trendAreaPath} fill="rgba(16,185,129,0.12)" />}
              {trendLinePath && <path d={trendLinePath} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
          </div>
        </div>

        {/* 2. PROPERTY STATUS BREAKDOWN */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Status Lifecycle
            </span>
            <div className="mt-3 space-y-2 text-xs font-medium">
              {statusBreakdown.map((s) => (
                <div key={s.status} className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-500' : s.status === 'PENDING' ? 'bg-amber-500' : 'bg-indigo-500'}`} />
                    {s.status}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. PROPERTY TYPE DISTRIBUTION */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Asset Type Distribution
            </span>
            <div className="mt-3 space-y-2 text-xs font-medium">
              {typeDistribution.map((t) => (
                <div key={t.type} className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: typeColors[t.type] || "#3b82f6" }} />
                    <span className="font-bold">{t.type}</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. AVG PRICE / SQ.FT CARD */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                AVG PRICE / SQ. FT.
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold flex items-center gap-0.5 ${
                priceMetrics.sqftChangePct >= 0
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
              }`}>
                <ArrowUpRight className="h-3 w-3" /> {priceMetrics.sqftChangePct >= 0 ? '+' : ''}{priceMetrics.sqftChangePct}% ({priceLogFilter.toUpperCase()})
              </span>
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatAmount(priceMetrics.currentRatePerSqft)} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ sq.ft</span>
            </p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Valuation: <b className="text-slate-900 dark:text-white font-black">{formatAmount(priceMetrics.currentPrice)}</b>
            </p>
          </div>

          <div className="relative h-16 w-full mt-2">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-full w-full overflow-visible">
              <defs>
                <linearGradient id="sqftAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c9a227" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#c9a227" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {sqftAreaPath && <path d={sqftAreaPath} fill="url(#sqftAreaGrad)" />}
              {sqftLinePath && <path d={sqftLinePath} fill="none" stroke="#c9a227" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
          </div>
        </div>
      </div>

      {/* DYNAMIC PROPERTY PRICE CHANGE LOG TABLE */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
              Property Price Revision & Appreciation Log
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Filtered for <b className="text-amber-600 dark:text-amber-400">{priceLogFilter.toUpperCase()}</b> · Total Appreciation: <b className="text-emerald-600 dark:text-emerald-400">+{priceMetrics.appreciationPct}% ({formatAmount(priceMetrics.priceChangeAmount)})</b>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <AnalyticsDateFilter value={priceLogFilter} onChange={setPriceLogFilter} />
            <button
              onClick={() => setShowAddLogModal(true)}
              className="rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3.5 py-1.5 text-xs font-black shadow-sm hover:opacity-90 transition cursor-pointer"
            >
              + Log Price Revision
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3">Timestamp / Date</th>
                <th className="px-6 py-3">Phase / Event Stage</th>
                <th className="px-6 py-3">Rate / Sq. Ft.</th>
                <th className="px-6 py-3">Total Valuation</th>
                <th className="px-6 py-3">Price Appreciation</th>
                <th className="px-6 py-3">Logged By</th>
                <th className="px-6 py-3 text-right">Notes / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {priceMetrics.filteredLogs.map((log, idx) => {
                const prevLog = priceMetrics.filteredLogs[idx - 1];
                const diffPct = prevLog ? Number((((log.price - prevLog.price) / prevLog.price) * 100).toFixed(2)) : 0;
                return (
                  <tr key={log.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]" suppressHydrationWarning>
                      {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                      <span className="rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2.5 py-1 text-[11px] font-black">
                        {log.stage}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-black text-slate-900 dark:text-white">
                      ₹{log.ratePerSqft ? log.ratePerSqft.toLocaleString('en-IN') : '—'} <span className="text-[10px] text-slate-400 font-normal">/ sq.ft</span>
                    </td>
                    <td className="px-6 py-3.5 font-black text-slate-900 dark:text-white">
                      {formatAmount(log.price)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 font-bold text-xs ${
                        diffPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {diffPct >= 0 ? '+' : ''}{diffPct}%
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-semibold">
                      {log.changedByName || 'System Admin'}
                    </td>
                    <td className="px-6 py-3.5 text-right text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {log.notes || 'Routine appreciation logging'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MOST VIEWED PROPERTIES TABLE */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Most Viewed Properties</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
            View All Properties <ExternalLink className="h-3 w-3" />
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3">Property / Symbol</th>
                <th className="px-6 py-3">City</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Views / Volume Score</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {mostViewed.slice(0, 6).map((item: any, i: number) => (
                <tr key={item.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-6 py-3.5">
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">{item.title}</span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300 font-semibold">{item.city}</td>
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                    {formatAmount(item.price)}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 px-2.5 py-0.5 rounded-md">
                      <Eye className="h-3 w-3" /> {item.views} views
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      item.status === 'AVAILABLE' || item.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD PRICE LOG MODAL */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Record New Property Price Revision</h3>
            <form onSubmit={handleAddPriceLog} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Phase / Stage Event</label>
                <input
                  type="text"
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2.5 font-bold outline-none text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">New Rate / Sq. Ft. (₹)</label>
                <input
                  type="number"
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2.5 font-bold outline-none text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Total Valuation (₹)</label>
                <input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2.5 font-bold outline-none text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Notes / Revision Reason</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 p-2.5 font-medium outline-none text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className="rounded-xl px-4 py-2 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 text-white font-black px-4 py-2 hover:bg-amber-600 transition shadow-sm"
                >
                  Save Log Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
