import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { RateBadge } from "@/components/market/rate-badge";
import { Sparkline } from "@/components/market/sparkline";
import { changeColor, marketRatingColor } from "@/lib/market";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BodyThemeSync } from "@/components/layout/body-theme-sync";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const [properties, stats] = await Promise.all([
    prisma.property.findMany({
      where: { status: "ACTIVE" },
      orderBy: { volumeScore: "desc" },
      take: 100,
      include: { agent: { select: { name: true } } },
    }),
    prisma.property.aggregate({
      where: { status: "ACTIVE" },
      _avg: { yieldRate: true, capRate: true, changeYtd: true, price: true },
      _count: true,
    }),
  ]);

  const gainers = [...properties].sort((a, b) => b.changeYtd - a.changeYtd).slice(0, 8);
  const losers = [...properties].sort((a, b) => a.changeYtd - b.changeYtd).slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <BodyThemeSync theme="dark" />
      <div className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold">PlotsnHomes Exchange</p>
          <h1 className="mt-2 font-display text-4xl font-bold">Markets</h1>
          <p className="mt-2 text-slate-400">Real-time property rates, yields, and performance — like a stock board</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Listed assets", value: stats._count.toLocaleString() },
              { label: "Avg yield", value: `${(stats._avg.yieldRate ?? 0).toFixed(2)}%` },
              { label: "Avg cap rate", value: `${(stats._avg.capRate ?? 0).toFixed(2)}%` },
              { label: "Avg YTD", value: `${formatNumber(stats._avg.changeYtd ?? 0, 2)}%`, colored: true },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide">{s.label}</p>
                <p className={`mt-2 text-2xl font-mono font-bold ${s.colored ? changeColor(stats._avg.changeYtd ?? 0) : ""}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 mb-10">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
              <ArrowUp className="h-4 w-4 text-emerald-500" />
              <h2 className="font-semibold">Top gainers (YTD)</h2>
            </div>
            <ul className="divide-y divide-slate-800">
              {gainers.map((p) => (
                <li key={p.id}>
                  <Link href={`/properties/${p.slug}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/50">
                    <span className="font-mono text-gold text-sm">{p.symbol}</span>
                    <RateBadge value={p.changeYtd} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
              <ArrowDown className="h-4 w-4 text-red-500" />
              <h2 className="font-semibold">Top decliners (YTD)</h2>
            </div>
            <ul className="divide-y divide-slate-800">
              {losers.map((p) => (
                <li key={p.id}>
                  <Link href={`/properties/${p.slug}`} className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/50">
                    <span className="font-mono text-gold text-sm">{p.symbol}</span>
                    <RateBadge value={p.changeYtd} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Property</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">24h</th>
                  <th className="px-4 py-3 font-medium">7d</th>
                  <th className="px-4 py-3 font-medium">YTD</th>
                  <th className="px-4 py-3 font-medium">Yield</th>
                  <th className="px-4 py-3 font-medium">Cap</th>
                  <th className="px-4 py-3 font-medium">Rating</th>
                  <th className="px-4 py-3 font-medium">Chart</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/80 hover:bg-slate-900/60">
                    <td className="px-4 py-3">
                      <Link href={`/properties/${p.slug}`} className="font-mono font-bold text-gold hover:underline">
                        {p.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate text-slate-300">{p.city}, {p.state}</td>
                    <td className="px-4 py-3 font-mono font-medium">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3"><span className={`font-mono ${changeColor(p.change24h)}`}>{p.change24h.toFixed(2)}%</span></td>
                    <td className="px-4 py-3"><span className={`font-mono ${changeColor(p.change7d)}`}>{p.change7d.toFixed(2)}%</span></td>
                    <td className="px-4 py-3"><span className={`font-mono ${changeColor(p.changeYtd)}`}>{p.changeYtd.toFixed(2)}%</span></td>
                    <td className="px-4 py-3 font-mono text-emerald-400">{p.yieldRate.toFixed(2)}%</td>
                    <td className="px-4 py-3 font-mono">{p.capRate.toFixed(2)}%</td>
                    <td className={`px-4 py-3 font-bold ${marketRatingColor(p.marketRating)}`}>{p.marketRating}</td>
                    <td className="px-4 py-3"><Sparkline priceHistory={p.priceHistory} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/properties" className="text-gold hover:underline">Browse all {stats._count} listings with filters →</Link>
        </p>
      </div>
    </div>
  );
}
