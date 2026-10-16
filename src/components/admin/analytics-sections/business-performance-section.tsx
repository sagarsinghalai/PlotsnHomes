"use client";

import { useState } from "react";
import { BarChart3, Target, TrendingUp, DollarSign, Building2, Users } from "lucide-react";
import { useAdminCurrency } from "@/components/admin/admin-currency-context";
import { AnalyticsDateFilter } from "./analytics-date-filter";

interface BusinessPerformanceProps {
  data: {
    monthlyGrowthMoM?: any;
    monthlyGrowth?: any;
    quarterlyGrowth?: any;
    yoyGrowthTrajectory?: any;
    yoyGrowth?: any;
    targetVsAchievement?: any;
    salesForecast?: any;
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

export function BusinessPerformanceSection({ data }: BusinessPerformanceProps) {
  const { formatAmount } = useAdminCurrency();
  const [dateFilter, setDateFilter] = useState("30d");

  const rawMom = Array.isArray(data?.monthlyGrowthMoM)
    ? data.monthlyGrowthMoM
    : Array.isArray(data?.monthlyGrowth)
    ? data.monthlyGrowth
    : [
        { label: "Revenue Growth", momPct: 14.8, value: 15000000, icon: DollarSign, color: "amber" },
        { label: "Bookings Growth", momPct: 11.2, value: 11000000, icon: Building2, color: "emerald" },
        { label: "Leads Volume Growth", momPct: 18.5, value: 19000000, icon: Users, color: "cyan" },
      ];

  const momData = rawMom.map((m: any, i: number) => {
    const rawLabel = (m.month || m.label || `Metric ${i + 1}`).replace(/\s+growth$/i, "");
    const label = `${rawLabel} Growth`;
    const momPct = typeof m.momPct === "number" ? m.momPct : typeof m.sales === "number" ? m.sales : 12.5;
    const rawVal = typeof m.value === "number" ? m.value : typeof m.sales === "number" && m.sales > 1000 ? m.sales : 15000000;
    const icons = [DollarSign, Building2, Users];
    const icon = icons[i % icons.length];
    return { label, momPct, value: rawVal, icon };
  });

  const quarterly = Array.isArray(data?.quarterlyGrowth) ? data.quarterlyGrowth : [];
  const yoyData = Array.isArray(data?.yoyGrowthTrajectory)
    ? data.yoyGrowthTrajectory
    : Array.isArray(data?.yoyGrowth)
    ? data.yoyGrowth
    : [
        { year: "2023", revenue: 110000000 },
        { year: "2024", revenue: 165000000 },
        { year: "2025", revenue: 210000000 },
        { year: "2026", revenue: 265000000 },
      ];

  const rawTarget = data?.targetVsAchievement || {};
  const targetRevenue = rawTarget.targetRevenue || rawTarget.target || 250000000;
  const achievedRevenue = rawTarget.achievedRevenue || rawTarget.current || 185000000;
  const achievementPct = rawTarget.achievementPct || Math.round((achievedRevenue / targetRevenue) * 100) || 74;

  const forecast = Array.isArray(data?.salesForecast) ? data.salesForecast : [];

  const gaugeArcLength = 141.37;
  const pct = Math.min(100, Math.max(0, achievementPct));
  const gaugeDashoffset = gaugeArcLength - (pct / 100) * gaugeArcLength;

  const maxYoY = Math.max(...yoyData.map((y: any) => y.revenue || 0), 1);
  const chartW = 500;
  const chartH = 140;
  const pad = 20;

  const yoyPoints = yoyData.map((d: any, i: number) => {
    const x = pad + (yoyData.length > 1 ? (i / (yoyData.length - 1)) * (chartW - pad * 2) : (chartW - pad * 2) / 2);
    const y = chartH - pad - ((d.revenue || 0) / maxYoY) * (chartH - pad * 2);
    return { x, y, ...d };
  });

  const yoyLinePath = getCubicBezierPath(yoyPoints);
  const yoyAreaPath = getCubicBezierArea(yoyPoints, chartH, pad);

  const maxForecast = Math.max(...forecast.map((f: any) => Math.max(f.actual || 0, f.forecast || 0)), 1);

  const momGradients = [
    "from-amber-500 via-orange-500 to-yellow-400 shadow-[0_0_16px_rgba(245,158,11,0.6)]",
    "from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_0_16px_rgba(16,185,129,0.6)]",
    "from-cyan-500 via-blue-500 to-indigo-500 shadow-[0_0_16px_rgba(6,182,212,0.6)]",
  ];

  return (
    <div className="space-y-6">
      {/* Grid Row 1: MoM KPI Cards (3 cols) + Target Gauge (1 col) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* 3 MoM GROWTH KPI CARDS */}
        {momData.slice(0, 3).map((m, idx) => {
          const IconComp = m.icon;
          const grad = momGradients[idx % momGradients.length];

          return (
            <div
              key={m.label}
              className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 h-28 w-28 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-all duration-500" />

              <div>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <IconComp className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {m.label}
                    </span>
                  </div>

                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/70 px-2.5 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shadow-sm shadow-emerald-500/10">
                    +{m.momPct}% MoM
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {formatAmount(m.value)}
                  </p>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                    Gross Volume Run-Rate
                  </p>
                </div>
              </div>

              {/* Broader 18px Glossy Progress Bar with Glow */}
              <div className="mt-6">
                <div className="h-4.5 rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 shadow-inner border border-slate-200/60 dark:border-slate-700/60 relative overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${grad} transition-all duration-700 relative overflow-hidden`}
                    style={{ width: `${Math.min(100, Math.max(20, Math.abs(m.momPct * 4)))}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-60 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* TARGET VS ACHIEVEMENT (100% GLITCH-FREE RADIAL GAUGE CARD) */}
        <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm hover:shadow-md transition flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-amber-500" /> TARGET VS ACHIEVEMENT
            </span>
          </div>

          {/* Smooth Arc Container with Zero Header Overlap */}
          <div className="relative h-32 w-full my-2 flex flex-col items-center justify-end">
            {/* Soft Ambient Radial Aura Background */}
            <div className="absolute bottom-0 h-24 w-24 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-xl pointer-events-none" />

            <svg className="w-48 h-28 overflow-hidden" viewBox="0 0 120 70">
              <defs>
                <linearGradient id="amberGaugeGradClean" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
              <path
                d="M 15 62 A 45 45 0 0 1 105 62"
                fill="none"
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 15 62 A 45 45 0 0 1 105 62"
                fill="none"
                stroke="url(#amberGaugeGradClean)"
                strokeWidth="10"
                strokeDasharray="141.37"
                strokeDashoffset={gaugeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute bottom-1 flex flex-col items-center z-10">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{achievementPct}%</span>
              <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">TARGET REACHED</span>
            </div>
          </div>

          <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-semibold">
            <span className="text-slate-500 dark:text-slate-400">Achieved: <b className="text-emerald-600 dark:text-emerald-400 font-black">{formatAmount(achievedRevenue)}</b></span>
            <span className="text-slate-500 dark:text-slate-400">Target: <b className="text-slate-900 dark:text-white font-black">{formatAmount(targetRevenue)}</b></span>
          </div>
        </div>
      </div>

      {/* Grid Row 2: Quarterly Growth & YoY Trajectory & Sales Forecast */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* QUARTERLY GROWTH VS TARGET */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                QUARTERLY PERFORMANCE GROWTH
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Revenue vs quarterly targets</p>
            </div>
            <AnalyticsDateFilter value={dateFilter} onChange={setDateFilter} />
          </div>

          <div className="space-y-4">
            {quarterly.map((q: any, i: number) => {
              const rev = q.revenue || 0;
              const tgt = q.target || q.bookings * 2000000 || 50000000;
              const achievePct = Math.min(100, Math.round((rev / Math.max(1, tgt)) * 100)) || 75;

              return (
                <div key={q.quarter || i} className="group">
                  <div className="flex justify-between items-center text-xs mb-1.5 font-bold">
                    <span className="text-slate-900 dark:text-white text-sm font-black">{q.quarter}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-black">{achievePct}% Achieved ({formatAmount(rev)})</span>
                  </div>

                  {/* Broader 20px Pill Bar */}
                  <div className="h-5 rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 shadow-inner relative overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 shadow-[0_0_14px_rgba(245,158,11,0.6)] transition-all duration-700 relative overflow-hidden"
                      style={{ width: `${achievePct}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent opacity-60 rounded-full" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* YoY GROWTH TRAJECTORY */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              YoY Growth Trajectory
            </h3>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {formatAmount(yoyData[yoyData.length - 1]?.revenue || 165000000)} <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Current Year</span>
            </p>
          </div>

          <div className="relative h-36 w-full mt-4">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-full w-full overflow-visible">
              <defs>
                <filter id="glow-yoy-bg3" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="yoyAreaGradBg3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {yoyAreaPath && <path d={yoyAreaPath} fill="url(#yoyAreaGradBg3)" />}
              {yoyLinePath && (
                <path d={yoyLinePath} fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" filter="url(#glow-yoy-bg3)" />
              )}
              {yoyPoints.map((p: any, i: number) => (
                <circle key={p.year || i} cx={p.x} cy={p.y} r="4.5" className="fill-amber-500 stroke-white dark:stroke-slate-900" strokeWidth="2.5" />
              ))}
            </svg>
          </div>
        </div>

        {/* SALES FORECAST LINE CHART */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-cyan-500" /> 6-MONTH SALES FORECAST
              </h3>
              <AnalyticsDateFilter value={dateFilter} onChange={setDateFilter} />
            </div>

            <div className="space-y-3.5">
              {forecast.slice(0, 5).map((f: any, i: number) => {
                const val = f.actual !== null && f.actual !== undefined ? f.actual : f.forecast || 5000000;
                const pct = Math.min(100, Math.max(12, (val / maxForecast) * 100));

                return (
                  <div key={f.month || i}>
                    <div className="flex justify-between items-center text-xs mb-1 font-bold">
                      <span className="text-slate-900 dark:text-white text-sm">{f.month}</span>
                      <span className={f.actual !== null && f.actual !== undefined ? 'text-emerald-600 dark:text-emerald-400 font-black' : 'text-cyan-600 dark:text-cyan-400 font-bold italic'}>
                        {formatAmount(val)} {f.actual === null && '(Est)'}
                      </span>
                    </div>

                    {/* Broader 20px Pill Bar */}
                    <div className="h-5 rounded-full bg-slate-100 dark:bg-slate-800/80 p-0.5 shadow-inner relative overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                      <div
                        className={`h-full rounded-full transition-all duration-700 relative overflow-hidden ${
                          f.actual !== null && f.actual !== undefined
                            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 shadow-[0_0_14px_rgba(16,185,129,0.6)]'
                            : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 shadow-[0_0_14px_rgba(6,182,212,0.6)]'
                        }`}
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
        </div>
      </div>
    </div>
  );
}
