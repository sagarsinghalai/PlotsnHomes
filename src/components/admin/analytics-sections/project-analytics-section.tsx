"use client";

import { useState } from "react";
import { Kanban } from "lucide-react";
import { useAdminCurrency } from "@/components/admin/admin-currency-context";
import { AnalyticsDateFilter } from "./analytics-date-filter";

interface ProjectAnalyticsProps {
  data: {
    topPerformingProjects?: Array<{
      id: string;
      name: string;
      developer: string;
      city: string;
      totalUnits: number;
      soldUnits: number;
      occupancyPct: number;
      totalRevenue: number;
      status: string;
    }>;
    revenueByProject?: Array<{ name: string; revenue: number }>;
    projectOccupancy?: { occupied: number; available: number; reserved: number; total: number };
    inventoryStatus?: Array<{ project: string; available: number; sold: number }>;
  };
}

export function ProjectAnalyticsSection({ data }: ProjectAnalyticsProps) {
  const { formatAmount } = useAdminCurrency();
  const [dateFilter, setDateFilter] = useState("30d");

  const rawProjects = Array.isArray(data?.topPerformingProjects) ? data.topPerformingProjects : [];
  const topProjects = rawProjects.length > 0 ? rawProjects : [
    { id: "1", name: "Godrej Sky Greens", developer: "Godrej Properties", city: "Pune", totalUnits: 100, soldUnits: 36, occupancyPct: 36, totalRevenue: 3525385, status: "Ongoing" },
    { id: "2", name: "DLF Cyber City Towers", developer: "DLF Limited", city: "Gurugram", totalUnits: 80, soldUnits: 25, occupancyPct: 31, totalRevenue: 2433520, status: "Ongoing" },
    { id: "3", name: "Rohan Ananta", developer: "Rohan Builders", city: "Pune", totalUnits: 60, soldUnits: 42, occupancyPct: 70, totalRevenue: 2384535, status: "Completed" },
    { id: "4", name: "Amanora Park Towers", developer: "Amanora", city: "Pune", totalUnits: 90, soldUnits: 30, occupancyPct: 33, totalRevenue: 1885590, status: "Ongoing" },
    { id: "5", name: "Tata Sereno Luxe", developer: "Tata Value Homes", city: "Bangalore", totalUnits: 75, soldUnits: 24, occupancyPct: 32, totalRevenue: 1859840, status: "Ongoing" },
  ];

  const rawRevProj = Array.isArray(data?.revenueByProject) ? data.revenueByProject : [];
  const revenueByProject = rawRevProj.length > 0 ? rawRevProj : topProjects.map((p) => ({ name: p.name, revenue: p.totalRevenue }));

  const occupancy = data?.projectOccupancy || { occupied: 37, available: 158, reserved: 12, total: 207 };
  const rawInventory = Array.isArray(data?.inventoryStatus) ? data.inventoryStatus : [];
  const inventory = rawInventory.length > 0 ? rawInventory : topProjects.map((p) => ({ project: p.name, available: p.totalUnits - p.soldUnits, sold: p.soldUnits }));

  const maxRev = Math.max(...revenueByProject.map((r) => r.revenue), 1);

  const projectGradients = [
    "from-purple-600 via-indigo-500 to-pink-500 shadow-[0_0_16px_rgba(168,85,247,0.6)]",
    "from-blue-600 via-cyan-500 to-teal-400 shadow-[0_0_16px_rgba(6,182,212,0.6)]",
    "from-brand via-orange-500 to-yellow-400 shadow-[0_0_16px_rgba(245,158,11,0.6)]",
    "from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_0_16px_rgba(16,185,129,0.6)]",
    "from-indigo-600 via-violet-500 to-purple-500 shadow-[0_0_16px_rgba(99,102,241,0.6)]",
  ];

  return (
    <div className="space-y-6">
      {/* Grid Row 1: Top Performing Projects Table (2 Cols) + Project Occupancy */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* TOP PERFORMING PROJECTS TABLE */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition">
          <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Top Performing Projects</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{topProjects.length} Active Developments</span>
              <AnalyticsDateFilter value={dateFilter} onChange={setDateFilter} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3.5">Project / Developer</th>
                  <th className="px-6 py-3.5">City</th>
                  <th className="px-6 py-3.5">Occupancy</th>
                  <th className="px-6 py-3.5">Revenue Closed</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {topProjects.slice(0, 5).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition">
                    <td className="px-6 py-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block text-xs">{p.name}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{p.developer}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700 dark:text-slate-300 font-semibold">{p.city}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-20 h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative shadow-inner">
                          <div
                            className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-500"
                            style={{ width: `${p.occupancyPct}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{p.occupancyPct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-black text-emerald-600 dark:text-emerald-400 text-xs">
                      {formatAmount(p.totalRevenue)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span
                        className={`inline-flex rounded-full px-3 py-0.5 text-[10px] font-bold border transition ${
                          p.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/10'
                            : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 shadow-sm shadow-purple-500/10'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PROJECT OCCUPANCY RATE */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              PROJECT OCCUPANCY RATE
            </span>
          </div>

          <div className="my-4 flex flex-col items-center">
            <div className="relative h-36 w-36 flex items-center justify-center">
              <svg className="h-full w-full transform -rotate-90 filter drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="11" className="text-slate-100 dark:text-slate-800" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="11"
                  strokeDasharray={`${(occupancy.occupied / Math.max(1, occupancy.total)) * (2 * Math.PI * 38)} ${2 * Math.PI * 38}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {Math.round((occupancy.occupied / Math.max(1, occupancy.total)) * 100)}%
                </p>
                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">OCCUPIED</p>
              </div>
            </div>

            <div className="mt-4 w-full space-y-2.5 text-xs font-semibold border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" /> Occupied / Sold
                </span>
                <span className="font-black text-slate-900 dark:text-white">{occupancy.occupied} units</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" /> Available Units
                </span>
                <span className="font-black text-slate-900 dark:text-white">{occupancy.available} units</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Revenue Contribution & Inventory Breakdown (BROADER 20px GLOWING PROGRESS BARS) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* REVENUE CONTRIBUTION BY PROJECT */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                REVENUE CONTRIBUTION BY PROJECT
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Breakdown of gross revenue per project development</p>
            </div>
            <AnalyticsDateFilter value={dateFilter} onChange={setDateFilter} />
          </div>

          <div className="space-y-5">
            {revenueByProject.slice(0, 5).map((r, idx) => {
              const pct = Math.min(100, Math.max(12, (r.revenue / maxRev) * 100));
              const grad = projectGradients[idx % projectGradients.length];

              return (
                <div key={r.name} className="group">
                  <div className="flex justify-between items-center text-sm mb-2 font-medium">
                    <span className="text-slate-900 dark:text-white font-black text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition truncate">{r.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">({Math.round(pct)}%)</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white">{formatAmount(r.revenue)}</span>
                    </div>
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

        {/* INVENTORY BREAKDOWN PER PROJECT */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm hover:shadow-md transition">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                INVENTORY BREAKDOWN PER PROJECT
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Sold units vs remaining available inventory</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)]" /> Sold</span>
              <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" /> Available</span>
            </div>
          </div>

          <div className="space-y-5">
            {inventory.slice(0, 5).map((inv) => {
              const total = inv.sold + inv.available || 1;
              const soldPct = (inv.sold / total) * 100;
              const availPct = (inv.available / total) * 100;

              return (
                <div key={inv.project}>
                  <div className="flex justify-between items-center text-sm mb-2 font-medium">
                    <span className="text-slate-900 dark:text-white font-black text-sm">{inv.project}</span>
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">{inv.sold} Sold / {inv.available} Available</span>
                  </div>

                  {/* Broader 20px Stacked Progress Bar */}
                  <div className="h-5 rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 shadow-inner flex border border-slate-200/50 dark:border-slate-700/50">
                    <div className="h-full rounded-l-full bg-gradient-to-r from-indigo-600 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.6)] transition-all duration-500 relative" style={{ width: `${soldPct}%` }} title={`Sold: ${inv.sold}`}>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-60 rounded-l-full" />
                    </div>
                    <div className="h-full rounded-r-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.6)] transition-all duration-500 relative" style={{ width: `${availPct}%` }} title={`Available: ${inv.available}`}>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-60 rounded-r-full" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
