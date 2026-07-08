import Link from "next/link";
import { changeColor, formatChangePercent } from "@/lib/market";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export async function MarketTicker() {
  const items = await prisma.property.findMany({
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

  const doubled = [...items, ...items];

  return (
    <div className="border-b border-slate-800 bg-slate-950 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/80">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gold">
          PlotsnHomes Exchange — Live
        </span>
      </div>
      <div className="relative flex overflow-hidden">
        <div className="flex animate-ticker gap-8 whitespace-nowrap py-2.5 px-4">
          {doubled.map((item, i) => (
            <Link
              key={`${item.symbol}-${i}`}
              href={`/properties/${item.slug}`}
              className="inline-flex items-center gap-3 text-sm hover:opacity-80 transition"
            >
              <span className="font-mono font-bold text-gold">{item.symbol}</span>
              <span className="text-white font-medium">{formatCurrency(item.price)}</span>
              <span className={`font-mono ${changeColor(item.change24h)}`}>
                {formatChangePercent(item.change24h)}
              </span>
              <span className="text-slate-500 text-xs">Yield {item.yieldRate.toFixed(2)}%</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
