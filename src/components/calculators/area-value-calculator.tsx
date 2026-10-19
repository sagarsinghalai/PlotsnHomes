"use client";

import { useState } from "react";
import { ArrowLeftRight, Calculator, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export type AreaUnit =
  | "sqft"
  | "sqm"
  | "sqyd"
  | "acre"
  | "hectare"
  | "bigha"
  | "katha"
  | "guntha"
  | "marla"
  | "cent";

export const AREA_UNITS: { key: AreaUnit; label: string; sqftFactor: number; symbol: string }[] = [
  { key: "sqft", label: "Square Feet (sq ft)", sqftFactor: 1, symbol: "sq ft" },
  { key: "sqm", label: "Square Meters (sq m)", sqftFactor: 10.7639104, symbol: "sq m" },
  { key: "sqyd", label: "Square Yards / Gaj (sq yd)", sqftFactor: 9, symbol: "Gaj" },
  { key: "acre", label: "Acres (acre)", sqftFactor: 43560, symbol: "acre" },
  { key: "hectare", label: "Hectares (ha)", sqftFactor: 107639.104, symbol: "ha" },
  { key: "bigha", label: "Bigha (Standard 27,225 sq ft)", sqftFactor: 27225, symbol: "bigha" },
  { key: "katha", label: "Katha (1,361.25 sq ft)", sqftFactor: 1361.25, symbol: "katha" },
  { key: "guntha", label: "Guntha (1,089 sq ft)", sqftFactor: 1089, symbol: "guntha" },
  { key: "marla", label: "Marla (272.25 sq ft)", sqftFactor: 272.25, symbol: "marla" },
  { key: "cent", label: "Cent (435.6 sq ft)", sqftFactor: 435.6, symbol: "cent" },
];

export function AreaValueCalculator() {
  // ─── 1. Unit Converter State ───────────────────────────────────────────────
  const [convertVal, setConvertVal] = useState<string>("1000");
  const [fromUnit, setFromUnit] = useState<AreaUnit>("sqft");
  const [toUnit, setToUnit] = useState<AreaUnit>("sqyd");

  // ─── 2. Price Per Unit Matrix State ─────────────────────────────────────────
  const [propertyPrice, setPropertyPrice] = useState<string>("7300000");
  const [propertyArea, setPropertyArea] = useState<string>("1000");
  const [areaUnit, setAreaUnit] = useState<AreaUnit>("sqft");

  // ─── 3. Launch Stage Pricing Simulator State (PriceFilters.xlsx) ────────────
  const [softRate, setSoftRate] = useState<string>("6000");
  const [preRate, setPreRate] = useState<string>("6500");
  const [launchRate, setLaunchRate] = useState<string>("7000");
  const [currentRate, setCurrentRate] = useState<string>("7300");
  const [simAreaSqft, setSimAreaSqft] = useState<string>("1000");

  // Helper conversions
  const fromFactor = AREA_UNITS.find((u) => u.key === fromUnit)?.sqftFactor ?? 1;
  const toFactor = AREA_UNITS.find((u) => u.key === toUnit)?.sqftFactor ?? 1;
  const numConvertVal = parseFloat(convertVal) || 0;

  // Convert value to Sq Ft first, then to Target Unit
  const convertedSqft = numConvertVal * fromFactor;
  const convertedResult = convertedSqft / toFactor;

  function handleSwapUnits() {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  }

  // Price Per Unit Calculations
  const totalPrice = parseFloat(propertyPrice) || 0;
  const areaInputVal = parseFloat(propertyArea) || 0;
  const propAreaUnitFactor = AREA_UNITS.find((u) => u.key === areaUnit)?.sqftFactor ?? 1;
  const totalSqft = areaInputVal * propAreaUnitFactor;

  // Launch Stage Excel Calculations (PriceFilters.xlsx)
  const simArea = parseFloat(simAreaSqft) || 1000;
  const sRate = parseFloat(softRate) || 0;
  const pRate = parseFloat(preRate) || 0;
  const lRate = parseFloat(launchRate) || 0;
  const cRate = parseFloat(currentRate) || 0;

  const sTotal = sRate * simArea;
  const pTotal = pRate * simArea;
  const lTotal = lRate * simArea;
  const cTotal = cRate * simArea;

  // Excel Formulas (PriceFilters.xlsx - Current vs Pre-Launch Price Appreciation):
  // D14 / B14 in Excel represents Pre-Launch / Soft Launch rate (sRate if > 0, else pRate, else lRate)
  // D17 / B17 in Excel represents Current Price rate (cRate)
  const baseSimRate = sRate > 0 ? sRate : (pRate > 0 ? pRate : (lRate > 0 ? lRate : 0));
  const baseSimTotal = baseSimRate * simArea;

  // Appreciation (amount) = Current Price - Prelaunch Price (=(D17-D14))
  const appRate = cRate > 0 && baseSimRate > 0 ? cRate - baseSimRate : 0;
  const appTotalVal = cTotal > 0 && baseSimTotal > 0 ? cTotal - baseSimTotal : 0;
  // Appreciation (%) = (Current Price - Prelaunch Price) / Prelaunch Price * 100 (=(D17-D14)/D14)
  const appPct = baseSimRate > 0 && cRate > 0 ? ((cRate - baseSimRate) / baseSimRate) * 100 : 0;

  return (
    <div className="space-y-12 text-slate-100">
      {/* ─── SECTION 1: Google-Style Area Unit Converter ─────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="rounded-xl bg-brand/10 p-3 text-brand">
            <ArrowLeftRight className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Google Area Value & Unit Converter</h2>
            <p className="text-xs text-slate-400">
              Convert between Square Feet, Square Meters, Gaj / Square Yards, Acres, Bigha, Katha, Guntha & Marla instantly.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-7 items-center">
          {/* Input Value */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Area Value</label>
            <input
              type="number"
              min="0"
              value={convertVal}
              onChange={(e) => setConvertVal(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-lg font-bold text-white focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* From Unit Dropdown */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">From Unit</label>
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value as AreaUnit)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white focus:border-brand focus:outline-none"
            >
              {AREA_UNITS.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex justify-center pt-4 md:pt-0">
            <button
              type="button"
              onClick={handleSwapUnits}
              title="Swap units"
              className="rounded-full border border-slate-700 bg-slate-800 p-3 text-brand hover:bg-brand hover:text-white transition-all shadow-md"
            >
              <ArrowLeftRight className="h-5 w-5" />
            </button>
          </div>

          {/* To Unit Dropdown */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">To Unit</label>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value as AreaUnit)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white focus:border-brand focus:outline-none"
            >
              {AREA_UNITS.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Conversion Banner */}
        <div className="mt-8 rounded-xl border border-brand/30 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Conversion Output</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-brand">
                {numConvertVal.toLocaleString()} {AREA_UNITS.find((u) => u.key === fromUnit)?.symbol}
              </span>
              <span className="text-xl font-bold text-slate-400">=</span>
              <span className="text-3xl font-extrabold text-emerald-400">
                {convertedResult < 0.0001
                  ? convertedResult.toExponential(4)
                  : convertedResult.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
                {AREA_UNITS.find((u) => u.key === toUnit)?.symbol}
              </span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-400 border-l border-slate-800 pl-4 hidden sm:block">
            <p>1 {AREA_UNITS.find((u) => u.key === fromUnit)?.label.split("(")[0]} =</p>
            <p className="font-semibold text-white">
              {(fromFactor / toFactor).toLocaleString(undefined, { maximumFractionDigits: 6 })}{" "}
              {AREA_UNITS.find((u) => u.key === toUnit)?.symbol}
            </p>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: Final Price Per Unit Matrix ─────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
              <Calculator className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Final Price Per Unit Table Matrix</h2>
              <p className="text-xs text-slate-400">
                Enter total property price and area to calculate the exact rate across all standard units simultaneously.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 rounded-full px-3 py-1">
            <Sparkles className="h-3.5 w-3.5" /> All Units Calculated
          </span>
        </div>

        {/* Inputs */}
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Property Price (₹)</label>
            <input
              type="number"
              min="0"
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(e.target.value)}
              placeholder="e.g. 7300000"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-base font-bold text-white focus:border-brand focus:outline-none"
            />
            <span className="text-[11px] text-slate-500">{formatCurrency(totalPrice)}</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Property Area Size</label>
            <input
              type="number"
              min="0"
              value={propertyArea}
              onChange={(e) => setPropertyArea(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-base font-bold text-white focus:border-brand focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Area Unit</label>
            <select
              value={areaUnit}
              onChange={(e) => setAreaUnit(e.target.value as AreaUnit)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white focus:border-brand focus:outline-none"
            >
              {AREA_UNITS.map((u) => (
                <option key={u.key} value={u.key}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Per Unit Breakdown Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900 text-xs text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Unit Name</th>
                <th className="px-6 py-3.5 font-semibold">Equivalent Area</th>
                <th className="px-6 py-3.5 font-semibold">Final Rate / Price Per Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {AREA_UNITS.map((u) => {
                const equivalentUnits = totalSqft / u.sqftFactor;
                const pricePerThisUnit = equivalentUnits > 0 ? totalPrice / equivalentUnits : 0;
                const isSelected = u.key === areaUnit;

                return (
                  <tr
                    key={u.key}
                    className={`transition-colors ${
                      isSelected ? "bg-amber-950/30 text-brand" : "hover:bg-slate-900/60 text-slate-200"
                    }`}
                  >
                    <td className="px-6 py-3.5 flex items-center gap-2">
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-brand flex-shrink-0" />}
                      <span className="font-semibold">{u.label}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {equivalentUnits.toLocaleString(undefined, { maximumFractionDigits: 4 })} {u.symbol}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-emerald-400">
                      ₹{Math.round(pricePerThisUnit).toLocaleString("en-IN")} / {u.symbol}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── SECTION 3: Launch Stage Pricing & Appreciation (PriceFilters.xlsx) ─── */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl backdrop-blur-sm sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-brand/10 p-3 text-brand">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Price Filters & Stage Appreciation Calculator</h2>
              <p className="text-xs text-slate-400">
                Formula logic based on PriceFilters.xlsx (Base, Soft Launch, Pre-Launch, Launch Price & Appreciation)
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 border border-brand/30 px-3 py-1 text-xs font-semibold text-brand">
            Excel Formula Sync
          </span>
        </div>

        {/* Inputs */}
        <div className="grid gap-4 sm:grid-cols-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-400">Area (sq ft)</label>
            <input
              type="number"
              value={simAreaSqft}
              onChange={(e) => setSimAreaSqft(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-400">Soft Launch (₹/sqft)</label>
            <input
              type="number"
              value={softRate}
              onChange={(e) => setSoftRate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-400">Pre-Launch (₹/sqft)</label>
            <input
              type="number"
              value={preRate}
              onChange={(e) => setPreRate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-400">Launch Price (₹/sqft)</label>
            <input
              type="number"
              value={launchRate}
              onChange={(e) => setLaunchRate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-emerald-400">Current Price (₹/sqft)</label>
            <input
              type="number"
              value={currentRate}
              onChange={(e) => setCurrentRate(e.target.value)}
              className="w-full rounded-xl border border-emerald-700/60 bg-emerald-950/30 px-3 py-2 text-sm font-bold text-emerald-300"
            />
          </div>
        </div>

        {/* 4 Stage Boxes (Divided Launch & Current into separate boxes) */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-400">Soft Launch</span>
            <p className="text-xl font-bold text-white">₹{sRate.toLocaleString("en-IN")} / sqft</p>
            <p className="text-xs text-slate-400">Total: ₹{sTotal.toLocaleString("en-IN")}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-400">Pre Launch</span>
            <p className="text-xl font-bold text-white">₹{pRate.toLocaleString("en-IN")} / sqft</p>
            <p className="text-xs text-slate-400">Total: ₹{pTotal.toLocaleString("en-IN")}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-1">
            <span className="text-xs font-semibold text-slate-400">Launch Price</span>
            <p className="text-xl font-bold text-white">₹{lRate.toLocaleString("en-IN")} / sqft</p>
            <p className="text-xs text-slate-400">Total: ₹{lTotal.toLocaleString("en-IN")}</p>
          </div>

          <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/40 p-4 space-y-1">
            <span className="text-xs text-emerald-400 font-bold">Current Price</span>
            <p className="text-xl font-extrabold text-emerald-300">₹{cRate.toLocaleString("en-IN")} / sqft</p>
            <p className="text-xs text-emerald-400/80 font-medium">Total: ₹{cTotal.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Exact Excel Matrix matching PriceFilters.xlsx */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            PriceFilters.xlsx Data Matrix
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-900 text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Stage / Parameter</th>
                  <th className="px-6 py-3.5 font-bold text-emerald-400">rate/sqft</th>
                  <th className="px-6 py-3.5 font-bold text-slate-300">Area (sqft)</th>
                  <th className="px-6 py-3.5 font-bold text-brand">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                <tr>
                  <td className="px-6 py-3.5 font-semibold text-white">Soft Launch</td>
                  <td className="px-6 py-3.5 font-mono">{sRate}</td>
                  <td className="px-6 py-3.5 font-mono">{simArea}</td>
                  <td className="px-6 py-3.5 font-mono font-bold text-brand">₹{sTotal.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-semibold text-white">Pre Launch</td>
                  <td className="px-6 py-3.5 font-mono">{pRate}</td>
                  <td className="px-6 py-3.5 font-mono">{simArea}</td>
                  <td className="px-6 py-3.5 font-mono font-bold text-brand">₹{pTotal.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5 font-semibold text-white">Launch Price</td>
                  <td className="px-6 py-3.5 font-mono">{lRate}</td>
                  <td className="px-6 py-3.5 font-mono">{simArea}</td>
                  <td className="px-6 py-3.5 font-mono font-bold text-brand">₹{lTotal.toLocaleString("en-IN")}</td>
                </tr>
                <tr className="bg-emerald-950/20 font-bold">
                  <td className="px-6 py-3.5 text-emerald-300">Current Price</td>
                  <td className="px-6 py-3.5 font-mono text-emerald-400">{cRate}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-200">{simArea}</td>
                  <td className="px-6 py-3.5 font-mono text-emerald-400">₹{cTotal.toLocaleString("en-IN")}</td>
                </tr>
                <tr className="bg-amber-950/20 font-bold border-t-2 border-slate-700">
                  <td className="px-6 py-3.5 text-amber-300">Appreciation (%)</td>
                  <td className="px-6 py-3.5 font-mono text-emerald-400">+{appPct.toFixed(2)}%</td>
                  <td className="px-6 py-3.5 text-slate-500">—</td>
                  <td className="px-6 py-3.5 font-mono text-emerald-400">+{appPct.toFixed(2)}%</td>
                </tr>
                <tr className="bg-amber-950/30 font-extrabold">
                  <td className="px-6 py-3.5 text-brand">Appreciation (amount)</td>
                  <td className="px-6 py-3.5 font-mono text-brand">+{appRate} / sqft</td>
                  <td className="px-6 py-3.5 font-mono text-slate-500">—</td>
                  <td className="px-6 py-3.5 font-mono text-brand">+₹{appTotalVal.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
