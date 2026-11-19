import Link from "next/link";
import { Activity } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getSiteSetting, SITE_SETTING_KEYS, TickerConfig } from "@/lib/site-settings";

const fallbackItems = [
  { symbol: "BLR-ORR", slug: "", price: 12480, yieldRate: 8.9 },
  { symbol: "HYD-FIN", slug: "", price: 9320, yieldRate: 8.1 },
  { symbol: "MUM-BKC", slug: "", price: 32600, yieldRate: 9.4 },
  { symbol: "PUN-HIN", slug: "", price: 7860, yieldRate: 7.8 },
];

export async function MarketTicker() {
  const config = await getSiteSetting<TickerConfig>(SITE_SETTING_KEYS.TICKER_CONFIG);
  let items = config?.items || [];
  const speed = config?.speed || 45;

  if (!items.length) {
    const dbItems = await prisma.property.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ volumeScore: "desc" }, { changeYtd: "desc" }],
      take: 24,
      select: {
        symbol: true,
        slug: true,
        price: true,
        change24h: true,
        yieldRate: true,
      },
    });
    items = dbItems as any;
  }

  if (!items.length) items = fallbackItems;

  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden bg-[#0B1220] text-white">
      <div className="flex items-stretch">
        <div className="z-10 hidden shrink-0 items-center gap-2 bg-[#0B1220] px-4 text-[11px] font-semibold tracking-wide sm:flex">
          <Activity className="h-3.5 w-3.5 text-[#60A5FA]" />
          Property Market Live
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div
            className="flex animate-ticker gap-8 whitespace-nowrap px-4 py-2.5"
            style={{ animationDuration: `${speed}s` }}
          >
            {doubled.map((item, i) => {
              const price = Number(item.price);
              const priceLabel = price > 0 && price < 100000 ? `${formatCurrency(price)}/sq ft` : formatCurrency(price);
              const href = item.slug && !String(item.slug).includes(" ") ? `/properties/${item.slug}` : "/properties";
              return (
                <Link
                  key={`${item.symbol}-${i}`}
                  href={href}
                  className="inline-flex items-center gap-2.5 text-[13px] transition hover:opacity-80"
                >
                  <span className="font-semibold tracking-wide">{item.symbol}</span>
                  <span className="text-white/85">{priceLabel}</span>
                  <span className="font-semibold text-[#60A5FA]">+{Number(item.yieldRate).toFixed(1)}% Yield</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
