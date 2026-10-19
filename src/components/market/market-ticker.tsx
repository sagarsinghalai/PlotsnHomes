import Link from "next/link";
import { changeColor, formatChangePercent } from "@/lib/market";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getSiteSetting, SITE_SETTING_KEYS, TickerConfig } from "@/lib/site-settings";

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

  const doubled = [...items, ...items];

  return (
    <div className="border-b border-slate-800 bg-slate-950 overflow-hidden">
      <div className="relative flex overflow-hidden">
        <div 
          className="flex animate-ticker gap-8 whitespace-nowrap py-2.5 px-4"
          style={{ animationDuration: `${speed}s` }}
        >
          {doubled.map((item, i) => (
            <Link
              key={`${item.symbol}-${i}`}
              href={`/properties/${item.slug}`}
              className="inline-flex items-center gap-3 text-sm hover:opacity-80 transition"
            >
              <span className="font-mono font-bold text-brand">{item.symbol}</span>
              <span className="text-white font-medium">{formatCurrency(Number(item.price))}</span>
              <span className={`font-mono ${changeColor(Number(item.change24h))}`}>
                {formatChangePercent(Number(item.change24h))}
              </span>
              <span className="text-slate-500 text-xs">Yield {Number(item.yieldRate).toFixed(2)}%</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
