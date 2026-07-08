"use client";

import { useMemo, useState } from "react";
import { buildInvestmentSummary } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function InvestmentCalculator({ defaultPrice = 450000 }: { defaultPrice?: number }) {
  const [price, setPrice] = useState(defaultPrice);
  const [down, setDown] = useState(20);
  const [rate, setRate] = useState(6.5);
  const [years, setYears] = useState(30);
  const [rent, setRent] = useState(2800);
  const [expenses, setExpenses] = useState(450);
  const [closing, setClosing] = useState(8000);

  const summary = useMemo(
    () =>
      buildInvestmentSummary({
        price,
        downPaymentPercent: down,
        annualRatePercent: rate,
        loanYears: years,
        monthlyRent: rent,
        monthlyExpenses: expenses,
        closingCosts: closing,
      }),
    [price, down, rate, years, rent, expenses, closing]
  );

  const fields = [
    { label: "Purchase price", value: price, set: setPrice, min: 50000, max: 5000000, step: 5000 },
    { label: "Down payment %", value: down, set: setDown, min: 5, max: 50, step: 1 },
    { label: "Interest rate %", value: rate, set: setRate, min: 1, max: 15, step: 0.1 },
    { label: "Loan term (years)", value: years, set: setYears, min: 5, max: 40, step: 1 },
    { label: "Monthly rent", value: rent, set: setRent, min: 0, max: 50000, step: 100 },
    { label: "Monthly expenses (excl. mortgage)", value: expenses, set: setExpenses, min: 0, max: 10000, step: 50 },
    { label: "Closing costs", value: closing, set: setClosing, min: 0, max: 100000, step: 500 },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Investment inputs</h3>
        {fields.map((f) => (
          <div key={f.label}>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-600">{f.label}</span>
              <span className="font-medium text-slate-900">
                {f.label.includes("%")
                  ? `${f.value}%`
                  : f.label.includes("price") || f.label.includes("rent") || f.label.includes("costs")
                    ? formatCurrency(f.value)
                    : f.value}
              </span>
            </div>
            <input
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={f.value}
              onChange={(e) => f.set(Number(e.target.value))}
              className="w-full accent-gold"
            />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-900 p-6 text-white">
          <p className="text-sm text-slate-400">Monthly cash flow</p>
          <p className={`text-4xl font-bold ${summary.monthlyCashFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatCurrency(summary.monthlyCashFlow)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            ["Mortgage / mo", formatCurrency(summary.monthlyMortgage)],
            ["Gross yield", `${formatNumber(summary.grossYield, 2)}%`],
            ["Cap rate", `${formatNumber(summary.capRate, 2)}%`],
            ["Cash-on-cash", `${formatNumber(summary.cashOnCash, 2)}%`],
            ["Annual cash flow", formatCurrency(summary.annualCashFlow)],
            ["Cash invested", formatCurrency(summary.totalCashInvested)],
          ].map(([label, val]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
