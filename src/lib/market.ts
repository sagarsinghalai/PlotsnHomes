export type PricePoint = { d: string; p: number };

export function parsePriceHistory(json: string): PricePoint[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function formatChangePercent(value: number, decimals = 2) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function changeColor(value: number) {
  if (value > 0) return "text-emerald-500";
  if (value < 0) return "text-red-500";
  return "text-slate-400";
}

export function changeBg(value: number) {
  if (value > 0) return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (value < 0) return "bg-red-500/15 text-red-400 border-red-500/30";
  return "bg-slate-500/15 text-slate-400 border-slate-500/30";
}

export function marketRatingColor(rating: string) {
  if (rating.startsWith("A")) return "text-emerald-400";
  if (rating.startsWith("B")) return "text-brand";
  return "text-slate-400";
}

/** Build SVG sparkline path from price history */
export function sparklinePath(
  points: PricePoint[],
  width = 120,
  height = 36
): { line: string; area: string; positive: boolean } {
  if (points.length < 2) {
    return { line: "", area: "", positive: true };
  }

  const prices = points.map((p) => p.p);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const coords = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width;
    const y = height - ((p - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });

  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const positive = prices[prices.length - 1] >= prices[0];

  return { line, area, positive };
}

export function generatePriceHistory(
  basePrice: number,
  days = 30
): PricePoint[] {
  const points: PricePoint[] = [];
  let price = basePrice * (0.92 + Math.random() * 0.08);
  const now = Date.now();

  for (let i = days; i >= 0; i--) {
    const drift = (Math.random() - 0.48) * 0.025;
    price = Math.max(basePrice * 0.75, price * (1 + drift));
    const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
    points.push({ d, p: Math.round(price) });
  }
  points[points.length - 1].p = basePrice;
  return points;
}

export function computeChangesFromHistory(history: PricePoint[]) {
  if (history.length < 2) {
    return { change24h: 0, change7d: 0, changeYtd: 0 };
  }
  const last = history[history.length - 1].p;
  const prev = history[history.length - 2]?.p ?? last;
  const weekAgo = history[Math.max(0, history.length - 8)]?.p ?? last;
  const yearStart = history[0]?.p ?? last;

  const pct = (a: number, b: number) => (b === 0 ? 0 : ((a - b) / b) * 100);

  return {
    change24h: pct(last, prev),
    change7d: pct(last, weekAgo),
    changeYtd: pct(last, yearStart),
  };
}
