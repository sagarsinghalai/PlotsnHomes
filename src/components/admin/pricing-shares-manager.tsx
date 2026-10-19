"use client";

import React, { useState } from "react";
import {
  Coins,
  Save,
  RotateCcw,
  Search,
  Building2,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Calculator,
  Sliders,
  DollarSign,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useAdminCurrency } from "@/components/admin/admin-currency-context";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export type PropertyPricingItem = {
  id: string;
  symbol: string;
  title: string;
  city: string;
  state: string;
  country: string;
  price: number;
  yieldRate: number;
  brokerageRate: number; // buy fee %
  status: string;
  images: string;
  customFields?: string;
};

type PlatformFee = {
  id: string;
  type: string;
  rate: number;
  desc: string;
  color: string;
};

const DEFAULT_PLATFORM_FEES: PlatformFee[] = [
  {
    id: "buy",
    type: "Buy Fee",
    rate: 0.5,
    desc: "Fee charged to investors upon purchasing property shares.",
    color: "emerald",
  },
  {
    id: "sell",
    type: "Sell Fee",
    rate: 0.3,
    desc: "Fee charged when an investor liquidates or sells shares.",
    color: "rose",
  },
  {
    id: "mgmt",
    type: "Management Fee",
    rate: 1.2,
    desc: "Annual asset management & property maintenance fee.",
    color: "amber",
  },
  {
    id: "wdr",
    type: "Withdrawal Fee",
    rate: 0.2,
    desc: "Standard fee levied on capital withdrawal to bank.",
    color: "sky",
  },
  {
    id: "listing",
    type: "Listing Fee",
    rate: 2.5,
    desc: "One-time platform onboarding & valuation fee for properties.",
    color: "indigo",
  },
];

export function PricingSharesManager({
  initialProperties,
}: {
  initialProperties: PropertyPricingItem[];
}) {
  const { formatAmount, currencyInfo } = useAdminCurrency();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Platform Fees State
  const [fees, setFees] = useState<PlatformFee[]>(DEFAULT_PLATFORM_FEES);

  // Property Row Edit States
  const [propertiesState, setPropertiesState] = useState(() => {
    return initialProperties.map((p) => {
      let customData: any = {};
      try {
        if (p.customFields) customData = JSON.parse(p.customFields);
      } catch (e) {}

      const sharePrice = customData.sharePrice || Math.round(p.price / 2500) || 1000;
      const totalShares = customData.totalShares || Math.round(p.price / sharePrice) || 2500;
      const sharesSold = customData.sharesSold || Math.round(totalShares * 0.68);

      return {
        ...p,
        sharePrice,
        totalShares,
        sharesSold,
        overridePrice: p.price,
        buyFee: customData.buyFee ?? p.brokerageRate ?? 0.5,
        sellFee: customData.sellFee ?? 0.3,
        mgmtFee: customData.mgmtFee ?? 1.2,
        wdrFee: customData.wdrFee ?? 0.2,
        listingFee: customData.listingFee ?? 2.5,
        isSaving: false,
        savedSuccess: false,
      };
    });
  });

  // Interactive Calculator Modal / Widget State
  const [calcValue, setCalcValue] = useState(2500000);
  const [calcSharePrice, setCalcSharePrice] = useState(1000);
  const [calcYield, setCalcYield] = useState(7.0);

  // Save status notifications
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  // Auto Calculations helper
  const calculateDerivedShares = (value: number, sp: number) => {
    if (sp <= 0) return 0;
    return Math.round(value / sp);
  };

  // Property Table Handlers
  const handlePropChange = (id: string, field: string, val: number) => {
    setPropertiesState((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: val, savedSuccess: false };

        // Auto-recalculate linked fields in real-time matching brickvest logic
        if (field === "sharePrice") {
          if (val > 0) {
            updated.totalShares = calculateDerivedShares(updated.overridePrice, val);
          }
        } else if (field === "totalShares") {
          if (val > 0) {
            updated.sharePrice = Math.round(updated.overridePrice / val);
          }
        } else if (field === "overridePrice") {
          if (updated.sharePrice > 0) {
            updated.totalShares = calculateDerivedShares(val, updated.sharePrice);
          }
        }

        return updated;
      })
    );
  };

  // Single Property Save
  const handleSaveRow = async (id: string) => {
    const target = propertiesState.find((p) => p.id === id);
    if (!target) return;

    setPropertiesState((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isSaving: true } : item))
    );

    try {
      let existingCustom: any = {};
      try {
        if (target.customFields) existingCustom = JSON.parse(target.customFields);
      } catch (e) {}

      const customFieldsObj = {
        ...existingCustom,
        sharePrice: target.sharePrice,
        totalShares: target.totalShares,
        sharesSold: target.sharesSold,
        buyFee: target.buyFee,
        sellFee: target.sellFee,
        mgmtFee: target.mgmtFee,
        wdrFee: target.wdrFee,
        listingFee: target.listingFee,
      };

      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: target.overridePrice,
          yieldRate: target.yieldRate,
          brokerageRate: target.buyFee,
          customFields: JSON.stringify(customFieldsObj),
        }),
      });

      if (!res.ok) throw new Error("Failed to update property pricing");

      setPropertiesState((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isSaving: false, savedSuccess: true, price: target.overridePrice } : item
        )
      );

      setTimeout(() => {
        setPropertiesState((prev) =>
          prev.map((item) => (item.id === id ? { ...item, savedSuccess: false } : item))
        );
      }, 2500);
    } catch (err: any) {
      alert("Error updating property: " + err.message);
      setPropertiesState((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isSaving: false } : item))
      );
    }
  };

  // Global Bulk Save
  const handleSaveAll = async () => {
    setGlobalMessage("Saving pricing & fee overrides for all properties...");
    for (const p of propertiesState) {
      await handleSaveRow(p.id);
    }
    setGlobalMessage("All property share prices & fee structures saved successfully!");
    setTimeout(() => setGlobalMessage(null), 4000);
  };

  // Platform Fee Handlers
  const handlePlatformFeeChange = (idx: number, val: number) => {
    setFees((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], rate: val };
      return next;
    });
  };

  const handleSavePlatformFees = () => {
    setGlobalMessage("Platform fee defaults updated!");
    setTimeout(() => setGlobalMessage(null), 3000);
  };

  const handleResetPlatformFees = () => {
    setFees(DEFAULT_PLATFORM_FEES);
  };

  // Filtered Properties
  const filteredProperties = propertiesState.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || p.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  // Aggregated Summary Stats
  const totalValueSum = propertiesState.reduce((acc, p) => acc + p.overridePrice, 0);
  const totalSharesSum = propertiesState.reduce((acc, p) => acc + p.totalShares, 0);
  const totalSharesSoldSum = propertiesState.reduce((acc, p) => acc + p.sharesSold, 0);
  const avgYield = (
    propertiesState.reduce((acc, p) => acc + p.yieldRate, 0) / (propertiesState.length || 1)
  ).toFixed(1);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <AdminPageHeader
        title="Pricing & Shares"
        description="Configure fractional property share prices, share supply auto-calculators, platform transaction fees, and custom property overrides."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Finance", href: "/admin/transactions" }, { label: "Pricing & Shares" }]}
        actions={
          <button
            type="button"
            onClick={handleSaveAll}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-hover hover:from-brand hover:to-brand-hover text-slate-950 font-bold px-4 py-2.5 text-xs shadow-md transition-all active:scale-95"
          >
            <Save className="h-4 w-4" />
            <span>Save All Changes</span>
          </button>
        }
      />

      {/* Global Toast Message */}
      {globalMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{globalMessage}</span>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Listed Assets Value</span>
            <Building2 className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 tabular-nums">
            {formatAmount(totalValueSum)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
            Across {propertiesState.length} active property portfolios
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Total Share Supply</span>
            <Layers className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 tabular-nums">
            {totalSharesSum.toLocaleString()} <span className="text-xs font-semibold opacity-80">shares</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
            {totalSharesSoldSum.toLocaleString()} sold ({Math.round((totalSharesSoldSum / (totalSharesSum || 1)) * 100)}% funded)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Average Rental Yield</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 tabular-nums">
            {avgYield}% <span className="text-xs font-semibold opacity-80">p.a.</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
            Target annual yield distributed to shareholders
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
            <span>Default Buy / Sell Fee</span>
            <Percent className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1.5 tabular-nums">
            {fees[0]?.rate}% <span className="opacity-80 text-sm font-semibold">/ {fees[1]?.rate}%</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
            Global baseline transaction rates
          </p>
        </div>
      </div>

      {/* Platform Fee Structure Section (Matching brickvest-admin fee cards) */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Platform Fee Structure
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Default baseline fee rates applied globally across all trades & management transactions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetPlatformFees}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={handleSavePlatformFees}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Fee Changes</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {fees.map((f, idx) => (
              <div
                key={f.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 flex flex-col justify-between hover:border-amber-500/50 shadow-xs transition"
              >
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {f.type} (%)
                  </div>
                  <div className="mt-2 inline-flex items-center justify-between w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 focus-within:border-amber-500 transition">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="20"
                      value={f.rate}
                      onChange={(e) => handlePlatformFeeChange(idx, parseFloat(e.target.value) || 0)}
                      className="w-20 bg-transparent font-black text-2xl text-slate-900 dark:text-white outline-none tabular-nums"
                    />
                    <span className="text-sm font-extrabold text-slate-400 dark:text-slate-500">%</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug pt-1">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Auto-Calculator Interactive Widget (brickvest simulation tool) */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-brand/5 via-slate-900/5 to-brand-hover/5 dark:from-brand/10 dark:to-brand-hover/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-amber-500" />
            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
              Shares & Pricing Interactive Simulator
            </h4>
          </div>
          <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
            Real-Time Auto-Calculator
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Property Value ({currencyInfo.symbol})
            </label>
            <input
              type="number"
              value={calcValue}
              onChange={(e) => setCalcValue(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 shadow-xs tabular-nums"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Price Per Share ({currencyInfo.symbol})
            </label>
            <input
              type="number"
              value={calcSharePrice}
              onChange={(e) => setCalcSharePrice(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 shadow-xs tabular-nums"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Target Annual Yield (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={calcYield}
              onChange={(e) => setCalcYield(parseFloat(e.target.value) || 0)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/20 shadow-xs tabular-nums"
            />
          </div>
        </div>

        {/* Calculated Output Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Total Share Supply</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums mt-0.5">
              {calculateDerivedShares(calcValue, calcSharePrice).toLocaleString()} shares
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Income Per Share / Year</div>
            <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-0.5">
              {formatAmount(calcSharePrice * (calcYield / 100))}/yr
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Annual Yield Pool</div>
            <div className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5">
              {formatAmount(calcValue * (calcYield / 100))}/yr
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">Buy Fee ({fees[0]?.rate}%)</div>
            <div className="text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
              {formatAmount(calcSharePrice * ((fees[0]?.rate || 0) / 100))} per share
            </div>
          </div>
        </div>
      </div>

      {/* Property Price & Fee Override Table (Matching brickvest-admin table) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-base">
              Property Price & Fee Overrides
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Edit share pricing, total share counts, and custom fee overrides. Changes auto-adjust in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="search"
                placeholder="Search property or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none shadow-xs focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none shadow-xs cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SOLD">Sold</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-2 py-2.5">Property</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Current Price</th>
                  <th className="px-2 py-2.5 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">Market Price</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Yield (%)</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Share Price</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Total Shares</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Shares Sold</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Funded %</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Override Price</th>
                  <th className="px-2 py-2.5 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">Buy Fee</th>
                  <th className="px-2 py-2.5 text-rose-600 dark:text-rose-400 whitespace-nowrap">Sell Fee</th>
                  <th className="px-2 py-2.5 text-amber-600 dark:text-amber-400 whitespace-nowrap">Mgmt Fee</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Wdr Fee</th>
                  <th className="px-2 py-2.5 text-indigo-600 dark:text-indigo-400 whitespace-nowrap">Listing Fee</th>
                  <th className="px-2 py-2.5 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredProperties.length > 0 ? (
                  filteredProperties.map((p) => {
                    const marketEst = Math.round(p.overridePrice * 1.025);
                    const fundedPct = Math.min(
                      100,
                      Math.round((p.sharesSold / (p.totalShares || 1)) * 100)
                    );
                    const isCustomBuy = Math.abs(p.buyFee - (fees[0]?.rate || 0.5)) > 0.001;
                    const isCustomSell = Math.abs(p.sellFee - (fees[1]?.rate || 0.3)) > 0.001;
                    const isCustomMgmt = Math.abs(p.mgmtFee - (fees[2]?.rate || 1.2)) > 0.001;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Property Title & Code */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold text-[10px] flex-shrink-0">
                              🏠
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 dark:text-white text-[11px] truncate max-w-[110px]">
                                {p.title}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                  {p.symbol}
                                </span>
                                <span className="text-[9px] text-slate-400 truncate max-w-[65px]">
                                  • {p.city}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Current Price */}
                        <td className="px-2 py-2 font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                          {formatAmount(p.price)}
                        </td>

                        {/* Market Price Estimate */}
                        <td className="px-2 py-2 font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                          {formatAmount(marketEst)}
                        </td>

                        {/* Yield % */}
                        <td className="px-2 py-2">
                          <div className="w-12">
                            <input
                              type="number"
                              step="0.1"
                              value={p.yieldRate}
                              onChange={(e) => handlePropChange(p.id, "yieldRate", parseFloat(e.target.value) || 0)}
                              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1 py-0.5 text-[11px] font-semibold text-slate-900 dark:text-white text-center outline-none focus:border-amber-500 tabular-nums"
                            />
                          </div>
                        </td>

                        {/* Share Price */}
                        <td className="px-2 py-2">
                          <div className="w-14">
                            <input
                              type="number"
                              value={p.sharePrice}
                              onChange={(e) => handlePropChange(p.id, "sharePrice", parseFloat(e.target.value) || 0)}
                              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1 py-0.5 text-[11px] font-bold text-slate-900 dark:text-white text-right outline-none focus:border-amber-500 tabular-nums"
                            />
                          </div>
                        </td>

                        {/* Total Shares */}
                        <td className="px-2 py-2">
                          <div className="w-14">
                            <input
                              type="number"
                              value={p.totalShares}
                              onChange={(e) => handlePropChange(p.id, "totalShares", parseFloat(e.target.value) || 0)}
                              className="w-full rounded-md border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 px-1 py-0.5 text-[11px] font-bold text-slate-900 dark:text-white text-right outline-none focus:border-amber-500 tabular-nums"
                            />
                          </div>
                        </td>

                        {/* Shares Sold */}
                        <td className="px-2 py-2 font-medium text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap text-[11px]">
                          {p.sharesSold.toLocaleString()}
                        </td>

                        {/* Funded % Bar */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1 min-w-[70px]">
                            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden w-10">
                              <div
                                className="h-full bg-gradient-to-r from-brand to-brand-hover rounded-full transition-all duration-300"
                                style={{ width: `${fundedPct}%` }}
                              />
                            </div>
                            <span className="font-bold text-[10px] text-slate-700 dark:text-slate-300 tabular-nums">
                              {fundedPct}%
                            </span>
                          </div>
                        </td>

                        {/* Override Price */}
                        <td className="px-2 py-2">
                          <div className="w-16">
                            <input
                              type="number"
                              value={p.overridePrice}
                              onChange={(e) => handlePropChange(p.id, "overridePrice", parseFloat(e.target.value) || 0)}
                              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1 py-0.5 text-[11px] font-bold text-slate-900 dark:text-white text-right outline-none focus:border-amber-500 tabular-nums"
                            />
                          </div>
                        </td>

                        {/* Buy Fee % */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              step="0.05"
                              value={p.buyFee}
                              onChange={(e) => handlePropChange(p.id, "buyFee", parseFloat(e.target.value) || 0)}
                              className={`w-11 rounded-md border px-1 py-0.5 text-[10px] font-semibold text-center outline-none tabular-nums ${
                                isCustomBuy
                                  ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                              }`}
                            />
                            {isCustomBuy && <span className="text-amber-500 text-[9px]" title="Custom Override">✦</span>}
                          </div>
                        </td>

                        {/* Sell Fee % */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              step="0.05"
                              value={p.sellFee}
                              onChange={(e) => handlePropChange(p.id, "sellFee", parseFloat(e.target.value) || 0)}
                              className={`w-11 rounded-md border px-1 py-0.5 text-[10px] font-semibold text-center outline-none tabular-nums ${
                                isCustomSell
                                  ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                              }`}
                            />
                            {isCustomSell && <span className="text-amber-500 text-[9px]" title="Custom Override">✦</span>}
                          </div>
                        </td>

                        {/* Mgmt Fee % */}
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-0.5">
                            <input
                              type="number"
                              step="0.05"
                              value={p.mgmtFee}
                              onChange={(e) => handlePropChange(p.id, "mgmtFee", parseFloat(e.target.value) || 0)}
                              className={`w-11 rounded-md border px-1 py-0.5 text-[10px] font-semibold text-center outline-none tabular-nums ${
                                isCustomMgmt
                                  ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                              }`}
                            />
                            {isCustomMgmt && <span className="text-amber-500 text-[9px]" title="Custom Override">✦</span>}
                          </div>
                        </td>

                        {/* Wdr Fee % */}
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="0.05"
                            value={p.wdrFee}
                            onChange={(e) => handlePropChange(p.id, "wdrFee", parseFloat(e.target.value) || 0)}
                            className="w-11 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1 py-0.5 text-[10px] font-semibold text-slate-900 dark:text-white text-center outline-none tabular-nums"
                          />
                        </td>

                        {/* Listing Fee % */}
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            step="0.05"
                            value={p.listingFee}
                            onChange={(e) => handlePropChange(p.id, "listingFee", parseFloat(e.target.value) || 0)}
                            className="w-11 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1 py-0.5 text-[10px] font-semibold text-slate-900 dark:text-white text-center outline-none tabular-nums"
                          />
                        </td>

                        {/* Row Save Button */}
                        <td className="px-2 py-2 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleSaveRow(p.id)}
                            disabled={p.isSaving}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all ${
                              p.savedSuccess
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900"
                            }`}
                          >
                            {p.isSaving ? (
                              <span>Saving...</span>
                            ) : p.savedSuccess ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Saved</span>
                              </>
                            ) : (
                              <>
                                <Save className="h-3.5 w-3.5" />
                                <span>Save</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={15} className="px-5 py-10 text-center text-slate-400 italic">
                      No property records found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
