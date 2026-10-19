"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CURRENCIES_MAP, type CurrencyCode, type CurrencyInfo } from "@/lib/currencies";

export type { CurrencyCode, CurrencyInfo };
export { CURRENCIES_MAP };

type CurrencyContextType = {
  currency: CurrencyCode;
  currencyInfo: CurrencyInfo;
  setCurrency: (c: CurrencyCode) => void;
  formatAmount: (inrAmount: number) => string;
  isMounted: boolean;
};

const AdminCurrencyContext = createContext<CurrencyContextType>({
  currency: "INR",
  currencyInfo: CURRENCIES_MAP.INR,
  setCurrency: () => {},
  formatAmount: (inrAmount: number) => `₹${Math.round(inrAmount || 0).toLocaleString("en-IN")}`,
  isMounted: false,
});

export function AdminCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("INR");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("admin_currency") as CurrencyCode;
    if (saved && CURRENCIES_MAP[saved]) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_currency", c);
    }
  };

  const currencyInfo = CURRENCIES_MAP[currency] || CURRENCIES_MAP.INR;

  const formatAmount = (inrAmount: number) => {
    if (inrAmount === null || inrAmount === undefined || isNaN(inrAmount)) return "—";

    // Guarantee 100% hydration match between SSR and client initial render by using base INR until mounted
    const activeCurrency = isMounted ? currencyInfo : CURRENCIES_MAP.INR;
    const converted = inrAmount * activeCurrency.rateFromINR;

    if (activeCurrency.code === "INR") {
      return `₹${Math.round(converted).toLocaleString("en-IN")}`;
    }
    return new Intl.NumberFormat(activeCurrency.locale, {
      style: "currency",
      currency: activeCurrency.code,
      maximumFractionDigits: activeCurrency.code === "JPY" ? 0 : 2,
    }).format(converted);
  };

  return (
    <AdminCurrencyContext.Provider value={{ currency, currencyInfo, setCurrency, formatAmount, isMounted }}>
      {children}
    </AdminCurrencyContext.Provider>
  );
}

export function useAdminCurrency() {
  return useContext(AdminCurrencyContext);
}

export function AdminCurrencySelector() {
  const { currency, setCurrency } = useAdminCurrency();

  return (
    <div className="pt-2 border-t border-slate-800/80">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block mb-1">
        Currency
      </label>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-white outline-none transition focus:border-brand cursor-pointer"
      >
        {Object.values(CURRENCIES_MAP).map((c) => (
          <option key={c.code} value={c.code} className="bg-slate-900 text-white">
            {c.flag} {c.code} ({c.symbol}) - {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
