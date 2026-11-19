import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { RateBadge } from "@/components/market/rate-badge";
import { Sparkline } from "@/components/market/sparkline";
import { changeColor, marketRatingColor } from "@/lib/market";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getPublicTenantId } from "@/lib/public-tenant";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const tenantId = await getPublicTenantId();
  const [properties, stats] = await Promise.all([
    prisma.property.findMany({
      where: { status: "ACTIVE", tenantId },
      orderBy: { volumeScore: "desc" },
      take: 100,
      include: { agent: { select: { name: true } } },
    }),
    prisma.property.aggregate({
      where: { status: "ACTIVE", tenantId },
      _avg: { yieldRate: true, capRate: true, changeYtd: true, price: true },
      _count: true,
    }),
  ]);

  const gainers = [...properties].sort((a, b) => b.changeYtd - a.changeYtd).slice(0, 8);
  const losers = [...properties].sort((a, b) => a.changeYtd - b.changeYtd).slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">PlotsnHomes Exchange</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Markets</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Property rates, yields, and performance on one board.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Listed assets", value: stats._count.toLocaleString() },
              { label: "Avg yield", value: `${(stats._avg.yieldRate ?? 0).toFixed(2)}%` },
              { label: "Avg cap rate", value: `${(stats._avg.capRate ?? 0).toFixed(2)}%` },
              { label: "Avg YTD", value: `${formatNumber(stats._avg.changeYtd ?? 0, 2)}%`, colored: true },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
                <p className={`mt-2 text-2xl font-bold ${s.colored ? changeColor(stats._avg.changeYtd ?? 0) : "text-slate-950"}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <ArrowUp className="h-4 w-4 text-emerald-600" />
              <h2 className="font-semibold text-slate-950">Top gainers (YTD)</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {gainers.map((p) => (
                <li key={p.id}>
                  <Link href={`/properties/${p.slug}`} className="flex items-center justify-between px-4 py-3 hover:bg-[#E8F0FE]/60">
                    <span className="font-mono text-sm font-semibold text-[#2563EB]">{p.symbol}</span>
                    <RateBadge value={p.changeYtd} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
              <ArrowDown className="h-4 w-4 text-red-600" />
              <h2 className="font-semibold text-slate-950">Top decliners (YTD)</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {losers.map((p) => (
                <li key={p.id}>
                  <Link href={`/properties/${p.slug}`} className="flex items-center justify-between px-4 py-3 hover:bg-[#E8F0FE]/60">
                    <span className="font-mono text-sm font-semibold text-[#2563EB]">{p.symbol}</span>
                    <RateBadge value={p.changeYtd} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
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
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/properties/${p.slug}`} className="font-mono font-bold text-[#2563EB] hover:underline">
                        {p.symbol}
                      </Link>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">{p.city}, {p.state}</td>
                    <td className="px-4 py-3 font-mono font-medium text-slate-950">{formatCurrency(p.price)}</td>
                    <td className="px-4 py-3"><span className={`font-mono ${changeColor(p.change24h)}`}>{p.change24h.toFixed(2)}%</span></td>
                    <td className="px-4 py-3"><span className={`font-mono ${changeColor(p.change7d)}`}>{p.change7d.toFixed(2)}%</span></td>
                    <td className="px-4 py-3"><span className={`font-mono ${changeColor(p.changeYtd)}`}>{p.changeYtd.toFixed(2)}%</span></td>
                    <td className="px-4 py-3 font-mono text-emerald-600">{p.yieldRate.toFixed(2)}%</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{p.capRate.toFixed(2)}%</td>
                    <td className={`px-4 py-3 font-bold ${marketRatingColor(p.marketRating)}`}>{p.marketRating}</td>
                    <td className="px-4 py-3"><Sparkline priceHistory={p.priceHistory} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/properties" className="font-semibold text-[#2563EB] hover:underline">Browse all {stats._count} listings</Link>
        </p>
      </div>
    </div>
  );
}
