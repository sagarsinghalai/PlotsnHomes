/**
 * Real-time FX rates via XE.com API (https://www.xe.com/xecurrencydata/)
 * Set XE_ACCOUNT_ID and XE_API_KEY in environment.
 */

import { DEFAULT_CURRENCY } from "@/lib/locale-defaults";

const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: { rates: Record<string, number>; base: string; fetchedAt: number } | null = null;

type XeRate = { quotecurrency: string; mid: number };

type XeResponse = {
  from: string;
  timestamp: string;
  to: XeRate[];
};

export async function fetchExchangeRates(
  base = DEFAULT_CURRENCY,
  symbols = ["EUR", "GBP", "AED", "INR", "CAD", "AUD", "SGD", "JPY"]
): Promise<{ base: string; rates: Record<string, number>; source: "xe" | "fallback" }> {
  if (cache && cache.base === base && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return { base: cache.base, rates: cache.rates, source: "xe" };
  }

  const accountId = process.env.XE_ACCOUNT_ID;
  const apiKey = process.env.XE_API_KEY;

  if (!accountId || !apiKey) {
    return { base, rates: fallbackRates(base, symbols), source: "fallback" };
  }

  try {
    const to = symbols.filter((s) => s !== base).join(",");
    const url = `https://xecdapi.xe.com/v1/convert_from.json/?from=${encodeURIComponent(base)}&to=${encodeURIComponent(to)}&amount=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountId}:${apiKey}`).toString("base64")}`,
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn("XE API error", res.status);
      return { base, rates: fallbackRates(base, symbols), source: "fallback" };
    }

    const data = (await res.json()) as XeResponse;
    const rates: Record<string, number> = { [base]: 1 };
    for (const row of data.to ?? []) {
      rates[row.quotecurrency] = row.mid;
    }

    cache = { base, rates, fetchedAt: Date.now() };
    return { base, rates, source: "xe" };
  } catch (e) {
    console.warn("XE fetch failed", e);
    return { base, rates: fallbackRates(base, symbols), source: "fallback" };
  }
}

function fallbackRates(base: string, symbols: string[]): Record<string, number> {
  const usd: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    AED: 3.67,
    INR: 83.5,
    CAD: 1.36,
    AUD: 1.53,
    SGD: 1.34,
    JPY: 156,
  };
  const rates: Record<string, number> = { [base]: 1 };
  const baseRate = usd[base] ?? 1;
  for (const sym of symbols) {
    if (sym === base) continue;
    rates[sym] = (usd[sym] ?? 1) / baseRate;
  }
  return rates;
}

export function convertAmount(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number {
  if (from === to) return amount;
  const fromRate = rates[from] ?? 1;
  const toRate = rates[to] ?? 1;
  return (amount / fromRate) * toRate;
}

export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "AED", "INR", "CAD", "AUD", "SGD", "JPY"] as const;
