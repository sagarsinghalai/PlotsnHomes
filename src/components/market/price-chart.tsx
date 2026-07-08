import { parsePriceHistory, sparklinePath } from "@/lib/market";
import { formatCurrency } from "@/lib/utils";

export function PriceChart({
  priceHistory,
  currentPrice,
}: {
  priceHistory: string;
  currentPrice: number;
}) {
  const points = parsePriceHistory(priceHistory);
  const width = 600;
  const height = 200;
  const { line, area, positive } = sparklinePath(points, width, height);
  const stroke = positive ? "#10b981" : "#ef4444";
  const fill = positive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)";

  const min = Math.min(...points.map((p) => p.p), currentPrice);
  const max = Math.max(...points.map((p) => p.p), currentPrice);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">30-day price history</p>
          <p className="text-3xl font-mono font-bold text-white mt-1">{formatCurrency(currentPrice)}</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>Low {formatCurrency(min)}</p>
          <p>High {formatCurrency(max)}</p>
        </div>
      </div>
      {line ? (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48" preserveAspectRatio="none">
          <path d={area} fill={fill} />
          <path d={line} fill="none" stroke={stroke} strokeWidth="2" />
        </svg>
      ) : (
        <div className="h-48 bg-slate-800 rounded-lg" />
      )}
    </div>
  );
}
