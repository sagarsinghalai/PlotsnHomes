"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  DollarSign,
  FileCheck,
  Filter,
  KanbanSquare,
  LineChart,
  List,
  MessageSquare,
  Package,
  PauseCircle,
  PieChart as PieChartIcon,
  Plus,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { useAdminCurrency } from "@/components/admin/admin-currency-context";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";
import { AnalyticsDateFilter } from "@/components/admin/analytics-sections/analytics-date-filter";
import { AdminExtendedAnalytics } from "@/components/admin/analytics-sections/admin-extended-analytics";

interface AdminDashboardOverviewProps {
  userCount: number;
  onlineUsers: number;
  propertyCount: number;
  revenue: number;
  inquiryCount: number;
  yieldAvg: number;
  changeYtdAvg: number;
  topMovers: Array<{ id: string; symbol: string; title: string; price: number; changeYtd: number }>;
  recentInquiries: Array<{ id: string; name: string; email: string; property: { symbol: string } }>;
  activityLogs: Array<{ id: string; type: string; details: string; actor: string; role: string; timestamp: string }>;
}

type TimeRange = "7d" | "30d" | "90d" | "ytd" | "1y" | "all";

const rangeMultiplierMap: Record<TimeRange, number> = {
  "7d": 1.0,
  "30d": 3.6,
  "90d": 9.8,
  ytd: 22.4,
  "1y": 38.0,
  all: 54.0,
};

const rangeLabelMap: Record<TimeRange, string> = {
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  ytd: "Year to Date",
  "1y": "Last 1 Year",
  all: "All Time",
};

export function AdminDashboardOverview({
  userCount,
  onlineUsers,
  propertyCount,
  revenue,
  inquiryCount,
  yieldAvg,
  changeYtdAvg,
  topMovers,
  recentInquiries,
  activityLogs,
}: AdminDashboardOverviewProps) {
  const { formatAmount } = useAdminCurrency();
  const { hasAddPermission } = useAdminPermissions();
  const canAddProperty = hasAddPermission("/admin/properties");

  // Global date range filter
  const [globalRange, setGlobalRange] = useState<TimeRange>("7d");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Individual card time range states
  const [aumRange, setAumRange] = useState<TimeRange>("7d");
  const [usersRange, setUsersRange] = useState<TimeRange>("7d");
  const [propsRange, setPropsRange] = useState<TimeRange>("7d");
  const [txnsRange, setTxnsRange] = useState<TimeRange>("7d");
  const [brokRange, setBrokRange] = useState<TimeRange>("7d");
  const [revRange, setRevRange] = useState<TimeRange>("7d");
  const [volRange, setVolRange] = useState<TimeRange>("7d");
  const [pnlRange, setPnlRange] = useState<TimeRange>("7d");
  const [tradesRange, setTradesRange] = useState<TimeRange>("7d");
  const [moneyRange, setMoneyRange] = useState<TimeRange>("7d");
  const [tradersRange, setTradersRange] = useState<TimeRange>("7d");
  const [netMarginRange, setNetMarginRange] = useState<TimeRange>("7d");
  const [yieldApprRange, setYieldApprRange] = useState<TimeRange>("7d");
  const [conversionRange, setConversionRange] = useState<TimeRange>("7d");
  const [agentPoolRange, setAgentPoolRange] = useState<TimeRange>("7d");

  function handleGlobalRangeChange(r: TimeRange) {
    setGlobalRange(r);
    setAumRange(r);
    setUsersRange(r);
    setPropsRange(r);
    setTxnsRange(r);
    setBrokRange(r);
    setRevRange(r);
    setVolRange(r);
    setPnlRange(r);
    setTradesRange(r);
    setMoneyRange(r);
    setTradersRange(r);
    setNetMarginRange(r);
    setYieldApprRange(r);
    setConversionRange(r);
    setAgentPoolRange(r);
  }

  // Multiplier helpers
  const gMul = rangeMultiplierMap[globalRange];

  // Calculated Top Row Stats
  const calculatedAum = Math.round(32595035 * rangeMultiplierMap[aumRange]);
  const calculatedUsers = Math.round(userCount * (rangeMultiplierMap[usersRange] > 1 ? rangeMultiplierMap[usersRange] * 0.4 : 1));
  const calculatedProps = Math.round(propertyCount * (rangeMultiplierMap[propsRange] > 1 ? 1.2 : 1));
  const calculatedFlagged = Math.max(1, Math.round(2 * (rangeMultiplierMap[txnsRange] > 5 ? 2.5 : 1)));

  // Brokerage Calculations
  const brokMul = rangeMultiplierMap[brokRange];
  const brokerageTotal = Math.round(2353854 * brokMul);
  const buyFees = Math.round(brokerageTotal * 0.525);
  const sellFees = Math.round(brokerageTotal * 0.29);
  const mgmtFees = Math.round(brokerageTotal * 0.185);

  // Revenue by Source Calculations
  const revMul = rangeMultiplierMap[revRange];
  const revTotal = Math.round(3490715 * revMul);
  const tradeFees = Math.round(revTotal * 0.5);
  const revMgmt = Math.round(revTotal * 0.3);
  const revListing = Math.round(revTotal * 0.2);

  // Trading Volume Bar Chart Data
  const volMul = rangeMultiplierMap[volRange];
  const volumeBars = [
    { day: "Mon", height: Math.round(45 * volMul * 0.6) },
    { day: "Tue", height: Math.round(65 * volMul * 0.6) },
    { day: "Wed", height: Math.round(58 * volMul * 0.6) },
    { day: "Thu", height: Math.round(92 * volMul * 0.6) },
    { day: "Fri", height: Math.round(78 * volMul * 0.6) },
    { day: "Sat", height: Math.round(38 * volMul * 0.6) },
    { day: "Sun", height: Math.round(24 * volMul * 0.6) },
  ];
  const maxVolHeight = 92 * volMul * 0.6 || 1;

  // PnL Metrics
  const pnlMul = rangeMultiplierMap[pnlRange];
  const netPnl = Math.round(3986527 * pnlMul);
  const totalGains = Math.round(4086691 * pnlMul);
  const totalLosses = Math.round(100164 * pnlMul);
  const profitableUsersCount = Math.max(1, Math.round(5 * (pnlMul > 3 ? 2.4 : 1)));
  const losingUsersCount = Math.max(1, Math.round(1 * (pnlMul > 3 ? 1.5 : 1)));

  // Total Trades Metrics
  const trdMul = rangeMultiplierMap[tradesRange];
  const totalTradesCount = Math.round(58 * trdMul);
  const buyTradesCount = Math.round(totalTradesCount * 0.58);
  const sellTradesCount = totalTradesCount - buyTradesCount;
  const avgTradeSize = Math.round(408753 * (trdMul > 5 ? 1.2 : 1));
  const tradeDaysCount = Math.min(Math.round(7 * trdMul), 365);

  // Volume Traded Metrics
  const moneyMul = rangeMultiplierMap[moneyRange];
  const totalVolumeTraded = Math.round(165938360 * moneyMul);
  const volumeTradedBars = [35, 52, 48, 85, 70, 95, 110];

  // Active Traders Metrics
  const traderMul = rangeMultiplierMap[tradersRange];
  const activeTradersCount = Math.max(1, Math.round(3 * (traderMul > 3 ? 2.8 : 1)));
  const newTraders = Math.round(activeTradersCount * 0.35);
  const returningTraders = activeTradersCount - newTraders;

  // Executive E-Business Owner Additional Metrics
  const marginMul = rangeMultiplierMap[netMarginRange];
  const netPlatformCommissions = Math.round((revenue || 18500000) * 0.185 * marginMul);

  const yieldMul = rangeMultiplierMap[yieldApprRange];
  const avgPortfolioYield = (yieldAvg || 9.4) * (yieldMul > 3 ? 1.08 : 1.0);
  const avgYtdAppreciation = (changeYtdAvg || 12.8) * (yieldMul > 3 ? 1.15 : 1.0);

  const convMul = rangeMultiplierMap[conversionRange];
  const pipelineDeals = Math.round(38 * (convMul > 3 ? 2.1 : 1));

  const agentPoolMul = rangeMultiplierMap[agentPoolRange];
  const agentCommissionPool = Math.round(4280000 * agentPoolMul);
  const paidCommissions = Math.round(agentCommissionPool * 0.75);
  const pendingEscrow = agentCommissionPool - paidCommissions;

  return (
    <div className="space-y-8">
      {/* Global Date Range Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Date Range:
          </span>
          <div className="inline-flex rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1 text-xs font-medium">
            {(["7d", "30d", "90d", "ytd", "1y", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => handleGlobalRangeChange(r)}
                className={`rounded-lg px-3 py-1.5 transition ${
                  globalRange === r
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Custom:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-brand"
            />
            <span>→</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-brand"
            />
          </div>
          <span className="rounded-lg bg-brand/10 px-3 py-1 text-xs font-bold text-brand-hover dark:text-brand border border-brand/20">
            {rangeLabelMap[globalRange]}
          </span>
        </div>
      </div>

      {/* TOP ROW: 4 KEY STAT CARDS WITH CLEAN WHITE BOX BACKGROUND */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. TOTAL AUM */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total AUM
              </span>
              <AnalyticsDateFilter value={aumRange} onChange={(v) => setAumRange(v as TimeRange)} />
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {formatAmount(calculatedAum)}
            </p>
            <p className="mt-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> +8.2% vs prior
            </p>
          </div>
        </div>

        {/* 2. TOTAL USERS */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Users
              </span>
              <AnalyticsDateFilter value={usersRange} onChange={(v) => setUsersRange(v as TimeRange)} />
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {calculatedUsers}
            </p>
            <p className="mt-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> +5 pending KYC
            </p>
          </div>
        </div>

        {/* 3. PROPERTIES LISTED */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Properties Listed
              </span>
              <AnalyticsDateFilter value={propsRange} onChange={(v) => setPropsRange(v as TimeRange)} />
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {calculatedProps}
            </p>
            <p className="mt-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              {calculatedProps - 1} active listings
            </p>
          </div>
        </div>

        {/* 4. FLAGGED TXNS */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Flagged Txns
              </span>
              <AnalyticsDateFilter value={txnsRange} onChange={(v) => setTxnsRange(v as TimeRange)} />
            </div>
            <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {calculatedFlagged}
            </p>
            <p className="mt-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Needs review
            </p>
          </div>
        </div>
      </div>

      {/* SECOND ROW: BROKERAGE + REVENUE DONUT + TRADING VOLUME (3 MAIN ANALYTICS CARDS) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* TOTAL BROKERAGE EARNED (HTML Match: Sparkline Area + Buy/Sell/Mgmt Fees) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Brokerage Earned
              </span>
              <select
                value={brokRange}
                onChange={(e) => setBrokRange(e.target.value as TimeRange)}
                className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {formatAmount(brokerageTotal)}
              </p>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                ▲ +12.3% vs prior
              </span>
            </div>

            {/* Gold Area Sparkline Chart */}
            <div className="mt-4 h-16 w-full relative">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 200 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="brandAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3347b0" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#3347b0" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M 0 40 Q 35 15 70 30 T 140 10 T 200 25 L 200 50 L 0 50 Z"
                  fill="url(#brandAreaGrad)"
                />
                <path
                  d="M 0 40 Q 35 15 70 30 T 140 10 T 200 25"
                  fill="none"
                  stroke="#3347b0"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(buyFees)}</p>
              <p className="text-[9px] font-semibold text-slate-500 uppercase mt-0.5">BUY FEES</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400">{formatAmount(sellFees)}</p>
              <p className="text-[9px] font-semibold text-slate-500 uppercase mt-0.5">SELL FEES</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{formatAmount(mgmtFees)}</p>
              <p className="text-[9px] font-semibold text-slate-500 uppercase mt-0.5">MGMT FEES</p>
            </div>
          </div>
        </div>

        {/* REVENUE BY SOURCE (HTML Match: SVG Donut Chart + Color Legend) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Revenue By Source
              </span>
              <select
                value={revRange}
                onChange={(e) => setRevRange(e.target.value as TimeRange)}
                className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="mt-4 flex items-center gap-6">
              {/* SVG Donut Chart */}
              <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
                <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="4"
                    strokeDasharray="50, 100"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeDasharray="30, 100"
                    strokeDashoffset="-50"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="4"
                    strokeDasharray="20, 100"
                    strokeDashoffset="-80"
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-xs font-black text-slate-900 dark:text-emerald-400">
                    {formatAmount(revTotal)}
                  </p>
                  <p className="text-[9px] font-semibold text-slate-400 uppercase">total</p>
                </div>
              </div>

              {/* Color Legend */}
              <div className="space-y-2 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">Trade Fees 50%</span>
                  <span className="font-bold text-slate-900 dark:text-white ml-auto">{formatAmount(tradeFees)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">Mgmt Fees 30%</span>
                  <span className="font-bold text-slate-900 dark:text-white ml-auto">{formatAmount(revMgmt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-300">Listing 20%</span>
                  <span className="font-bold text-slate-900 dark:text-white ml-auto">{formatAmount(revListing)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TRADING VOLUME (HTML Match: Blue Bar Chart) */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Trading Volume
              </span>
              <select
                value={volRange}
                onChange={(e) => setVolRange(e.target.value as TimeRange)}
                className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>

            {/* Blue Bar Chart Visual */}
            <div className="mt-5 flex items-end justify-between gap-2 h-28 pt-2">
              {volumeBars.map((b, idx) => (
                <div key={b.day} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                  <div
                    className={`w-full rounded-md transition-all duration-200 ${
                      idx === 3 ? "bg-blue-500" : "bg-blue-900/40 dark:bg-blue-950/60"
                    }`}
                    style={{ height: `${(b.height / maxVolHeight) * 100}%` }}
                  />
                  <span className="text-[9px] font-semibold text-slate-400">{b.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* THIRD ROW: 4 FINANCIAL & TRADING CARDS (P&L, TRADES, VOLUME TRADED, USERS WHO TRADED) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. TOTAL USERS P&L */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Users P&L
              </span>
              <select
                value={pnlRange}
                onChange={(e) => setPnlRange(e.target.value as TimeRange)}
                className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <p className="mt-3 text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              +{formatAmount(netPnl)}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {profitableUsersCount} in profit · {losingUsersCount} at loss
            </p>

            <div className="mt-4 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Profitable Users</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{profitableUsersCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Losing Users</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{losingUsersCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Gains</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(totalGains)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Losses</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{formatAmount(totalLosses)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. TOTAL TRADES */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Trades
              </span>
              <select
                value={tradesRange}
                onChange={(e) => setTradesRange(e.target.value as TimeRange)}
                className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalTradesCount}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{rangeLabelMap[tradesRange]}</p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-emerald-500/10 p-2 border border-emerald-500/20">
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{buyTradesCount}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">BUY TRADES</p>
              </div>
              <div className="rounded-lg bg-rose-500/10 p-2 border border-rose-500/20">
                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{sellTradesCount}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">SELL TRADES</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-2 border border-blue-500/20">
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400">{formatAmount(avgTradeSize)}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">AVG TRADE SIZE</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-2 border border-purple-500/20">
                <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{tradeDaysCount}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">TRADE DAYS</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. VOLUME TRADED */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Volume Traded
              </span>
              <select
                value={moneyRange}
                onChange={(e) => setMoneyRange(e.target.value as TimeRange)}
                className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <p className="mt-3 text-2xl font-black text-purple-600 dark:text-purple-400 tracking-tight">
              {formatAmount(totalVolumeTraded)}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">across {totalTradesCount} trades</p>

            {/* Purple Bar Chart SVG */}
            <div className="mt-5 h-16 w-full">
              <svg className="h-full w-full" viewBox="0 0 100 40">
                {volumeTradedBars.map((val, i) => (
                  <rect
                    key={i}
                    x={i * 14 + 2}
                    y={40 - val * 0.3}
                    width={10}
                    height={val * 0.3}
                    rx={2}
                    fill={i === 6 ? "#8b5cf6" : "#6d28d9"}
                    opacity={i === 6 ? 1 : 0.4}
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* 4. USERS WHO TRADED */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Users Who Traded
              </span>
              <select
                value={tradersRange}
                onChange={(e) => setTradersRange(e.target.value as TimeRange)}
                className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {activeTradersCount}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">of {userCount} total registered users</p>

            <div className="mt-4 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">New Traders</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{newTraders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Returning Traders</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{returningTraders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avg Trades / User</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {(totalTradesCount / Math.max(1, activeTradersCount)).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. NET PLATFORM COMMISSIONS */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Net Margin & Fees
              </span>
              <select
                value={netMarginRange}
                onChange={(e) => setNetMarginRange(e.target.value as TimeRange)}
                className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <p className="mt-3 text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {formatAmount(netPlatformCommissions)}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">18.5% Net Revenue Take-Rate</p>

            <div className="mt-4 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Fee Margin</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">18.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Secondary Market Cut</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">2.5% / Trade</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Management Share</span>
                <span className="font-bold text-slate-900 dark:text-white">30%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. PORTFOLIO YIELD & APPRECIATION */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Yield & Gain Spread
              </span>
              <select
                value={yieldApprRange}
                onChange={(e) => setYieldApprRange(e.target.value as TimeRange)}
                className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <p className="mt-3 text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              +{avgPortfolioYield.toFixed(1)}%
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Average Portfolio Rental Yield</p>

            <div className="mt-4 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">YTD Appreciation</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+{avgYtdAppreciation.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active High-Yield Assets</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{calculatedProps}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Benchmark Spread</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">+3.2% vs Govt</span>
              </div>
            </div>
          </div>
        </div>

        {/* 7. LEAD CONVERSION & DEALS */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Conversion & Funnel
              </span>
              <select
                value={conversionRange}
                onChange={(e) => setConversionRange(e.target.value as TimeRange)}
                className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <p className="mt-3 text-2xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight">
              28.4%
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Qualified Lead Win Rate</p>

            <div className="mt-4 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Active Pipeline Deals</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">{pipelineDeals}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Avg Closing Cycle</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">4.2 Days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Inquiries</span>
                <span className="font-bold text-slate-900 dark:text-white">{inquiryCount || 142}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 8. AGENT COMMISSIONS POOL */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Agent Payout Pool
              </span>
              <select
                value={agentPoolRange}
                onChange={(e) => setAgentPoolRange(e.target.value as TimeRange)}
                className="rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <p className="mt-3 text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {formatAmount(agentCommissionPool)}
            </p>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">Distributed Commission Reserve</p>

            <div className="mt-4 space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Paid Out</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(paidCommissions)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pending Escrow</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{formatAmount(pendingEscrow)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Active Sales Force</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">18 Agents</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXTENDED ANALYTICS SECTIONS (8 SECTIONS) */}
      <AdminExtendedAnalytics range={globalRange} fromDate={fromDate} toDate={toDate} />

      {/* FOURTH ROW: QUICK ACTIONS + TABLES */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand" /> Quick Actions
            </h2>
            <ul className="space-y-2.5">
              {[
                { href: "/admin/users", label: "Manage Users & Accounts", desc: "Access roles, staff & clients", icon: Users },
                { href: "/admin/properties", label: "Properties & Inventory", desc: "Listings, edit & launch pricing", icon: Building2 },
                { href: "/admin/crm", label: "Sales Pipeline", desc: "Leads kanban & deals", icon: List },
                { href: "/admin/reports", label: "Analytics & Reports", desc: "Performance charts & exports", icon: LineChart },
                { href: "/admin/platform", label: "Platform & Company", desc: "Settings & configuration", icon: ShieldCheck },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800/80 p-3 hover:border-brand/50 hover:bg-brand/5 transition group"
                  >
                    <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/50 p-2 text-indigo-600 dark:text-indigo-400 group-hover:bg-amber-500/15 group-hover:text-amber-600 dark:group-hover:text-amber-400 border border-indigo-100 dark:border-indigo-800/40 transition shrink-0">
                      <l.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{l.label}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{l.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {canAddProperty && (
            <Link
              href="/admin/properties/new"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-xs font-bold text-white hover:bg-brand-hover transition shadow-md"
            >
              <Plus className="h-4 w-4 stroke-[3]" /> Add New Property
            </Link>
          )}
        </div>

        {/* Top YTD Performing Properties Table */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Top YTD Performing Properties</h2>
              <Link href="/admin/properties" className="text-xs font-bold text-brand-hover dark:text-brand hover:underline flex items-center gap-1">
                View all properties <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Property / Symbol</th>
                    <th className="px-6 py-3">Current Price</th>
                    <th className="px-6 py-3">YTD Appreciation</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {topMovers.map((p) => (
                    <tr key={p.symbol} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white">
                        <span className="font-mono text-brand-hover dark:text-brand font-bold mr-2">[{p.symbol}]</span>
                        {p.title}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-slate-100">{formatAmount(p.price)}</td>
                      <td className="px-6 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          <TrendingUp className="h-3 w-3" /> +{p.changeYtd.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link href={`/admin/properties/${p.id}/edit`} className="font-bold text-brand-hover dark:text-brand hover:underline">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Inquiries Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
              <h2 className="font-bold text-slate-900 dark:text-white text-base">Recent Inquiries & Leads</h2>
              <Link href="/admin/inquiries" className="text-xs font-bold text-brand-hover dark:text-brand hover:underline flex items-center gap-1">
                View all inquiries <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Property</th>
                    <th className="px-6 py-3">Contact Person</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentInquiries.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="px-6 py-3.5 font-mono font-bold text-brand-hover dark:text-brand">{q.property.symbol}</td>
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-slate-900 dark:text-white">{q.name}</span>
                        <span className="block text-slate-500 text-[11px]">{q.email}</span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link href="/admin/inquiries" className="font-bold text-brand-hover dark:text-brand hover:underline">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Activity & Audit Record Logs Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">Platform Activity & Audit Logs</h2>
            <p className="text-xs text-slate-500">Real-time audit trail of actions taken across system modules</p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            ● Live Sync
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3">Event Type</th>
                <th className="px-6 py-3">Record Details</th>
                <th className="px-6 py-3">Actor</th>
                <th className="px-6 py-3">Role Badge</th>
                <th className="px-6 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activityLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                  <td className="px-6 py-3.5 font-bold text-slate-900 dark:text-white">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      log.type === "User Registration"
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60"
                        : log.type === "Property Listed"
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60"
                        : log.type === "Transaction Completed"
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60"
                        : "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60"
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 font-medium">{log.details}</td>
                  <td className="px-6 py-3.5 text-slate-900 dark:text-white font-bold">{log.actor}</td>
                  <td className="px-6 py-3.5">
                    <span className="rounded-full bg-brand/10 border border-brand/30 px-2.5 py-0.5 text-[10px] text-brand-hover dark:text-brand font-bold tracking-wider uppercase">
                      {log.role}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 text-[11px]" suppressHydrationWarning>
                    {new Date(log.timestamp).toLocaleString("en-US", { month: "numeric", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
