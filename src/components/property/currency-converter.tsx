"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CURRENCY } from "@/lib/locale-defaults";
import { formatCurrency } from "@/lib/utils";

type Props = {
  amountUsd: number;
  baseCurrency?: string;
};

export function CurrencyConverter({ amountUsd, baseCurrency = DEFAULT_CURRENCY }: Props) {
  const [currency, setCurrency] = useState(baseCurrency);
  const [rates, setRates] = useState<Record<string, number>>({ [baseCurrency]: 1 });
  const [currencies, setCurrencies] = useState<string[]>([baseCurrency]);
  const [source, setSource] = useState<string>("");

  useEffect(() => {
    fetch(`/api/currency/rates?base=${baseCurrency}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.rates) setRates(data.rates);
        if (data.currencies) setCurrencies(data.currencies);
        if (data.source) setSource(data.source);
      })
      .catch(() => {});
  }, [baseCurrency]);

  const rate = rates[currency] ?? 1;
  const converted = amountUsd * rate;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-slate-600">Price in</span>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium"
        >
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="text-lg font-semibold text-slate-900">
          {formatCurrency(converted, currency)}
        </span>
        {currency !== baseCurrency && (
          <span className="text-xs text-slate-500">
            ({formatCurrency(amountUsd, baseCurrency)} base)
          </span>
        )}
      </div>
      {source && (
        <p className="mt-1 text-xs text-slate-400">
          {source === "xe" ? "Live rates via XE.com" : "Estimated rates (configure XE API keys for live data)"}
        </p>
      )}
    </div>
  );
}
