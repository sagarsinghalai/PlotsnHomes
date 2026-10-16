import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCIES_MAP, type CurrencyCode } from "@/lib/currencies";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, overrideCurrency?: string) {
  if (amount === null || amount === undefined || isNaN(amount)) return "—";

  let code: CurrencyCode = "INR";
  if (overrideCurrency && CURRENCIES_MAP[overrideCurrency as CurrencyCode]) {
    code = overrideCurrency as CurrencyCode;
  }

  const c = CURRENCIES_MAP[code] || CURRENCIES_MAP.INR;
  const converted = amount * c.rateFromINR;

  if (c.code === "INR") {
    return `₹${Math.round(converted).toLocaleString("en-IN")}`;
  }
  return new Intl.NumberFormat(c.locale, {
    style: "currency",
    currency: c.code,
    maximumFractionDigits: c.code === "JPY" ? 0 : 2,
  }).format(converted);
}

export function formatNumber(n: number, decimals = 0) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(n);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function parseImages(json: string): string[] {
  return parseJsonArray(json);
}

export function parseJsonArray(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter(Boolean) : [];
  } catch {
    return [];
  }
}
