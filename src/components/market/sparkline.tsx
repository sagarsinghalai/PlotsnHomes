import { parsePriceHistory, sparklinePath } from "@/lib/market";

export function Sparkline({
  priceHistory,
  width = 100,
  height = 32,
  className = "",
}: {
  priceHistory: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const points = parsePriceHistory(priceHistory);
  const { line, area, positive } = sparklinePath(points, width, height);
  const stroke = positive ? "#10b981" : "#ef4444";
  const fill = positive ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)";

  if (!line) {
    return <div className={`bg-slate-800/50 rounded ${className}`} style={{ width, height }} />;
  }

  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="1.5" />
    </svg>
  );
}
