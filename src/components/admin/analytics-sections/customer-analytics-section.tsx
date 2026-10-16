"use client";

import { useState } from "react";
import { Globe2, MapPin, Repeat } from "lucide-react";
import { useAdminCurrency } from "@/components/admin/admin-currency-context";
import { AnalyticsDateFilter } from "./analytics-date-filter";

interface CustomerAnalyticsProps {
  data: {
    newCustomers?: { count: number; changePct: number; sparkline: number[] };
    repeatCustomers?: { count: number; repeatRate: number; totalBuyers: number };
    customerAcquisitionSource?: Array<{ source: string; count: number; percentage: number }>;
    customerLocations?: Array<{
      city: string;
      state: string;
      lat: number;
      lng: number;
      customerCount: number;
      revenue: number;
    }>;
  };
}

const DEFAULT_MOCK_LOCATIONS = [
  { city: "Gurugram", state: "Haryana", lat: 28.4595, lng: 77.0266, customerCount: 14, revenue: 48500000, marketShare: "32%" },
  { city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777, customerCount: 12, revenue: 62000000, marketShare: "28%" },
  { city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, customerCount: 9, revenue: 34000000, marketShare: "18%" },
  { city: "Noida", state: "Uttar Pradesh", lat: 28.5355, lng: 77.391, customerCount: 7, revenue: 21500000, marketShare: "11%" },
  { city: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867, customerCount: 6, revenue: 29000000, marketShare: "7%" },
  { city: "Goa", state: "Goa", lat: 15.2993, lng: 74.124, customerCount: 4, revenue: 18000000, marketShare: "4%" },
];

export function CustomerAnalyticsSection({ data }: CustomerAnalyticsProps) {
  const { formatAmount } = useAdminCurrency();
  const [selectedCity, setSelectedCity] = useState<string | null>("Gurugram");
  const [dateFilter, setDateFilter] = useState("30d");

  const newCust = data?.newCustomers || { count: 18, changePct: 15.4, sparkline: [4, 6, 8, 10] };
  const repeatCust = data?.repeatCustomers || { count: 6, repeatRate: 25, totalBuyers: 24 };
  const acqSources = Array.isArray(data?.customerAcquisitionSource) && data.customerAcquisitionSource.length > 0
    ? data.customerAcquisitionSource
    : [
        { source: "Website", count: 18, percentage: 42 },
        { source: "Facebook Ads", count: 12, percentage: 28 },
        { source: "99acres", count: 7, percentage: 16 },
        { source: "Referral", count: 4, percentage: 10 },
        { source: "MagicBricks", count: 2, percentage: 4 },
      ];

  const locations = Array.isArray(data?.customerLocations) && data.customerLocations.length > 0
    ? data.customerLocations
    : DEFAULT_MOCK_LOCATIONS;

  const sourceColors: Record<string, string> = {
    Website: "#3b82f6",
    "Facebook Ads": "#10b981",
    "99acres": "#f59e0b",
    MagicBricks: "#8b5cf6",
    Referral: "#ec4899",
    "Google Ads": "#06b6d4",
  };

  const totalLocationRev = locations.reduce((sum, l) => sum + l.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Top 3 Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* NEW CUSTOMERS */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                New Customers Joined
              </span>
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{newCust.changePct}% MoM
              </span>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {newCust.count} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Buyers</span>
            </p>
          </div>

          <div className="mt-4 h-12 w-full">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 100 40">
              <path d="M 0 30 C 30 25, 60 15, 100 8" fill="none" stroke="#06b6d4" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* REPEAT CUSTOMERS */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Repeat Customers Rate
              </span>
              <span className="rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <Repeat className="h-3 w-3" /> {repeatCust.repeatRate}% Repeat
              </span>
            </div>
            <p className="mt-3 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {repeatCust.count} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Multiple Purchases</span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Total Buyers: <b className="text-slate-900 dark:text-white">{repeatCust.totalBuyers}</b></span>
            <span>Repeat Ratio: <b className="text-purple-600 dark:text-purple-400">{repeatCust.repeatRate}%</b></span>
          </div>
        </div>

        {/* ACQUISITION SOURCE DONUT */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Customer Acquisition Source
            </span>
            <div className="mt-3 space-y-2 text-xs font-medium">
              {acqSources.slice(0, 4).map((s) => (
                <div key={s.source} className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ backgroundColor: sourceColors[s.source] || "#3b82f6" }} />
                    <span className="font-bold">{s.source}</span>
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{s.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOMER LOCATIONS MAP */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <MapPin className="h-5 w-5 text-rose-500" /> Geographic Customer Locations Map
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of registered buyers and total transactions by city</p>
          </div>
          <AnalyticsDateFilter value={dateFilter} onChange={setDateFilter} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl bg-slate-900 dark:bg-slate-950 p-6 relative overflow-hidden border border-slate-800 min-h-[280px] flex items-center justify-center">
            <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
              <Globe2 className="h-72 w-72 text-cyan-400 stroke-[1]" />
            </div>

            <div className="relative w-full h-full min-h-[250px] grid grid-cols-2 sm:grid-cols-3 gap-4 z-10">
              {locations.map((loc: any) => {
                const isSelected = selectedCity === loc.city;
                return (
                  <div
                    key={loc.city}
                    onClick={() => setSelectedCity(loc.city)}
                    className={`rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-900 border-2 border-rose-500 shadow-[0_0_24px_rgba(244,63,94,0.35)] scale-[1.02] ring-2 ring-rose-500/30"
                        : "bg-slate-800/90 border border-slate-700/80 hover:border-slate-500 hover:bg-slate-800 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Header Row: City Name + State Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="relative flex h-3 w-3 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.9)]" />
                        </span>
                        <span className="font-extrabold text-white text-sm tracking-tight truncate">
                          {loc.city}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-200 bg-slate-700/90 border border-slate-600/80 px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
                        {loc.state}
                      </span>
                    </div>

                    {/* Middle Row: Buyers Count + Market Share */}
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-white bg-rose-500/20 border border-rose-500/40 px-2.5 py-1 rounded-lg text-rose-200">
                        {loc.customerCount} Active Buyers
                      </span>
                      {loc.marketShare && (
                        <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full">
                          {loc.marketShare}
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Revenue */}
                    <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-bold text-slate-300">Revenue</span>
                      <span className="font-black text-emerald-400 text-xs tracking-tight">
                        {formatAmount(loc.revenue)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Top Revenue Cities
              </h4>
              <div className="space-y-2.5 text-xs font-medium">
                {locations.slice(0, 6).map((loc) => (
                  <div key={loc.city} className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{loc.city}, {loc.state}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{loc.customerCount} Active Buyers</span>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(loc.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700 text-xs font-bold flex justify-between text-slate-900 dark:text-white">
              <span>Total Regional Revenue</span>
              <span className="text-emerald-600 dark:text-emerald-400">{formatAmount(totalLocationRev)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
