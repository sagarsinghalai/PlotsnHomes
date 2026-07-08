export type ChartPoint = { label: string; value: number; color?: string };

export function groupCountByMonth(
  dates: Date[],
  months = 12
): ChartPoint[] {
  const map = new Map<string, number>();
  for (const d of dates) {
    const key = monthKey(d);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return sortMonthKeys(map, months);
}

export function groupSumByMonth(
  rows: { createdAt: Date; amount: number }[],
  months = 12
): ChartPoint[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = monthKey(r.createdAt);
    map.set(key, (map.get(key) ?? 0) + r.amount);
  }
  return sortMonthKeys(map, months);
}

function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function sortMonthKeys(map: Map<string, number>, take: number): ChartPoint[] {
  const sorted = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-take);
  return sorted.map(([label, value]) => ({
    label: formatMonthLabel(label),
    value,
  }));
}

function formatMonthLabel(key: string) {
  const [y, m] = key.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

export const CHART_COLORS = [
  "#C9A227",
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#EC4899",
  "#64748B",
];

export const STAGE_COLORS: Record<string, string> = {
  NEW: "#0EA5E9",
  CONTACTED: "#6366F1",
  QUALIFIED: "#8B5CF6",
  SITE_VISIT: "#F59E0B",
  NEGOTIATION: "#F97316",
  WON: "#10B981",
  LOST: "#EF4444",
};

export const STAGE_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  SITE_VISIT: "Site visit",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};
