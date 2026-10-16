"use client";

import { useState } from "react";
import { CalendarCheck, CheckCircle2, XCircle } from "lucide-react";
import { AnalyticsDateFilter } from "./analytics-date-filter";

interface SiteVisitAnalyticsProps {
  data: {
    siteVisitsTrend?: Array<{ date: string; count: number }>;
    siteVisitConversionFunnel?: Array<{ stage: string; count: number; percentage: number }>;
    upcomingSiteVisits?: Array<any>;
    upcomingSiteVisitsTable?: Array<any>;
    cancelledVisits?: any;
  };
}

export function SiteVisitAnalyticsSection({ data }: SiteVisitAnalyticsProps) {
  const [dateFilter, setDateFilter] = useState("30d");

  const visitsTrend = Array.isArray(data?.siteVisitsTrend) ? data.siteVisitsTrend : [];
  const funnel = Array.isArray(data?.siteVisitConversionFunnel) ? data.siteVisitConversionFunnel : [];
  
  const upcomingVisits = Array.isArray(data?.upcomingSiteVisits)
    ? data.upcomingSiteVisits
    : Array.isArray(data?.upcomingSiteVisitsTable)
    ? data.upcomingSiteVisitsTable
    : [];

  const cancelledVisitsList = Array.isArray(data?.cancelledVisits)
    ? data.cancelledVisits
    : Array.isArray(data?.cancelledVisits?.table)
    ? data.cancelledVisits.table
    : [];

  const totalVisits = visitsTrend.reduce((sum, v) => sum + (v.count || 0), 0);

  const funnelGradients = [
    "from-blue-600 via-cyan-500 to-teal-400 shadow-[0_0_14px_rgba(6,182,212,0.6)]",
    "from-purple-600 via-indigo-500 to-pink-500 shadow-[0_0_14px_rgba(168,85,247,0.6)]",
    "from-amber-500 via-orange-500 to-yellow-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]",
    "from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_0_14px_rgba(16,185,129,0.6)]",
  ];

  return (
    <div className="space-y-6">
      {/* Grid Row 1: Site Visit Conversion Funnel & Cancelled Visits */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 4-STAGE CONVERSION FUNNEL (BROADER 20px BARS) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                4-STAGE SITE VISIT CONVERSION FUNNEL
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Conversion progression from inquiry to closed booking</p>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              Total Scheduled: {totalVisits}
            </span>
          </div>

          <div className="space-y-4">
            {funnel.map((fn, idx) => {
              const grad = funnelGradients[idx % funnelGradients.length];
              const pct = Math.max(8, fn.percentage || 0);

              return (
                <div key={fn.stage || idx} className="group">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-slate-900 dark:text-white font-black text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">{idx + 1}. {fn.stage}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{fn.count} ({fn.percentage}%)</span>
                  </div>

                  {/* Broader 20px Pill Bar */}
                  <div className="h-5 rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 shadow-inner relative overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700 relative overflow-hidden`}
                      style={{ width: `${pct}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-60 rounded-full" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CANCELLED VISITS CARD */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-rose-500" /> Cancelled Visits
              </span>
              <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300">
                {cancelledVisitsList.length} Visits
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              {cancelledVisitsList.slice(0, 3).map((c: any, i: number) => (
                <div key={c.id || i} className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-rose-200/80 dark:border-rose-900/60 shadow-sm">
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                    <span>{c.leadName || c.visitorName || "Lead"}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{c.date || ""}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate mt-0.5">{c.propertyName || c.propertyTitle || "Property Listing"}</p>
                  <p className="text-[10px] italic text-rose-600 dark:text-rose-400 mt-1 font-medium">Reason: {c.reason || "Client requested reschedule"}</p>
                </div>
              ))}
              {cancelledVisitsList.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">No cancelled site visits recorded.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* UPCOMING SITE VISITS TABLE */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Upcoming Site Visits Schedule
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{upcomingVisits.length} Confirmed Showings</span>
            <AnalyticsDateFilter value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3.5">Lead Name</th>
                <th className="px-6 py-3.5">Property Name</th>
                <th className="px-6 py-3.5">Assigned Agent</th>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {upcomingVisits.slice(0, 5).map((v: any, i: number) => (
                <tr key={v.id || i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">{v.leadName || v.visitorName || "Lead"}</td>
                  <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300">{v.propertyName || v.propertyTitle || "Property"}</td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">{v.agentName || "Assigned Agent"}</td>
                  <td className="px-6 py-3.5 text-blue-600 dark:text-blue-400 font-mono text-[11px]">{v.scheduledAt || v.date || "Scheduled"}</td>
                  <td className="px-6 py-3.5 text-right">
                    <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/10">
                      {v.status || "CONFIRMED"}
                    </span>
                  </td>
                </tr>
              ))}
              {upcomingVisits.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-slate-500 dark:text-slate-400 italic">
                    No upcoming site visits scheduled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
