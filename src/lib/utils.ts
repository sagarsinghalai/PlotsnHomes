import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { currencyLocale, DEFAULT_CURRENCY } from "@/lib/locale-defaults";

export function formatCurrency(amount: number, currency = DEFAULT_CURRENCY) {
  const code = currency.toUpperCase();
  return new Intl.NumberFormat(currencyLocale(code), {
    style: "currency",
    currency: code,
    maximumFractionDigits: code === "INR" ? 0 : 0,
  }).format(amount);
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
