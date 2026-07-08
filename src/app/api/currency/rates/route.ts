import { NextResponse } from "next/server";
import { fetchExchangeRates, SUPPORTED_CURRENCIES } from "@/lib/currency-exchange";
import { getCompanyCurrency } from "@/lib/company-settings";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const base = searchParams.get("base") ?? (await getCompanyCurrency());

  const symbols = SUPPORTED_CURRENCIES.filter((c) => c !== base);
  const { rates, source } = await fetchExchangeRates(base, [...symbols]);

  return NextResponse.json({
    base,
    rates,
    source,
    updatedAt: new Date().toISOString(),
    currencies: SUPPORTED_CURRENCIES,
  });
}
