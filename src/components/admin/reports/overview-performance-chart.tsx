"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Users, MessageSquare, Banknote, RefreshCw } from "lucide-react";

type ChartPoint = { label: string; value: number };

type OverviewData = {
  revenue: ChartPoint[];
  leads: ChartPoint[];
  users: ChartPoint[];
  inquiries: ChartPoint[];
};

const METRICS = [
  {
    key: "revenue" as const,
    label: "Revenue",
    color: "#C9A227",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    textColor: "text-amber-700",
    icon: Banknote,
    href: "/admin/reports/revenue",
    format: (v: number) =>
      v >= 1_000_000
        ? `$${(v / 1_000_000).toFixed(1)}M`
        : v >= 1_000
        ? `$${(v / 1_000).toFixed(0)}K`
        : `$${v}`,
  },
  {
    key: "leads" as const,
    label: "Leads",
    color: "#6366F1",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-300",
    textColor: "text-indigo-700",
    icon: TrendingUp,
    href: "/admin/reports/pipeline",
    format: (v: number) => String(v),
  },
  {
    key: "users" as const,
    label: "Users",
    color: "#10B981",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    textColor: "text-emerald-700",
    icon: Users,
    href: "/admin/reports/users",
    format: (v: number) => String(v),
  },
  {
    key: "inquiries" as const,
    label: "Inquiries",
    color: "#EC4899",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-300",
    textColor: "text-pink-700",
    icon: MessageSquare,
    href: "/admin/reports/inquiries",
    format: (v: number) => String(v),
  },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

function normalize(data: ChartPoint[]): { label: string; norm: number; raw: number }[] {
  const max = Math.max(...data.map((d) => d.value), 1);
  return data.map((d) => ({ label: d.label, norm: d.value / max, raw: d.value }));
}

// Align all series to a common set of month labels
function alignSeries(data: OverviewData): string[] {
  const allLabels = new Set<string>();
  for (const key of Object.keys(data) as MetricKey[]) {
    data[key].forEach((p) => allLabels.add(p.label));
  }
  return Array.from(allLabels).sort();
}

function getAlignedValues(series: ChartPoint[], labels: string[]): number[] {
  const map = new Map(series.map((p) => [p.label, p.value]));
  return labels.map((l) => map.get(l) ?? 0);
}

export function OverviewPerformanceChart() {
  const router = useRouter();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMetrics, setActiveMetrics] = useState<Set<MetricKey>>(
    new Set<MetricKey>(["revenue", "leads", "users", "inquiries"])
  );
  const [hoveredPoint, setHoveredPoint] = useState<{
    metricKey: MetricKey;
    idx: number;
    x: number;
    y: number;
    value: number;
    label: string;
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/reports/overview");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleMetric = (key: MetricKey) => {
    setActiveMetrics((prev) => {
      const next = new Set<MetricKey>(prev);
      if (next.has(key) && next.size > 1) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-300" />
      </div>
    );
  }

  if (!data) return null;

  const labels = alignSeries(data);
  if (labels.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-400 text-sm h-48 flex items-center justify-center">
        No historical data yet — data will appear here once activity is recorded.
      </div>
    );
  }

  // SVG dimensions
  const W = 720;
  const H = 280;
  const pad = { top: 28, right: 24, bottom: 44, left: 16 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const n = labels.length;

  const xOf = (i: number) => pad.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yOf = (norm: number) => pad.top + innerH * (1 - norm);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-bold text-slate-900 text-lg">Overview performance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monthly trends across all key metrics · click a metric or line to open its report
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-xl hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Metric toggles */}
      <div className="px-6 pt-4 flex flex-wrap gap-2">
        {METRICS.map((m) => {
          const series = data[m.key];
          const total = series.reduce((s, p) => s + p.value, 0);
          const latest = series[series.length - 1]?.value ?? 0;
          const prev = series[series.length - 2]?.value ?? 0;
          const delta = prev > 0 ? Math.round(((latest - prev) / prev) * 100) : 0;
          const active = activeMetrics.has(m.key);
          return (
            <button
              key={m.key}
              onClick={() => toggleMetric(m.key)}
              onDoubleClick={() => router.push(m.href)}
              title={`Click to toggle · Double-click to open ${m.label} report`}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border text-xs font-semibold transition-all ${
                active
                  ? `${m.bgColor} ${m.borderColor} ${m.textColor}`
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: active ? m.color : "#CBD5E1" }}
              />
              <m.icon className="h-3.5 w-3.5" />
              <span>{m.label}</span>
              {active && (
                <span className="tabular-nums font-bold ml-1">{m.format(total)}</span>
              )}
              {active && delta !== 0 && (
                <span className={`text-[10px] font-medium ${delta > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="px-6 pb-6 pt-2 relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <line
              key={t}
              x1={pad.left}
              y1={yOf(t)}
              x2={W - pad.right}
              y2={yOf(t)}
              stroke="#F1F5F9"
              strokeWidth="1"
            />
          ))}

          {/* Vertical guide lines for each month */}
          {labels.map((_, i) => (
            <line
              key={i}
              x1={xOf(i)}
              y1={pad.top}
              x2={xOf(i)}
              y2={pad.top + innerH}
              stroke="#F8FAFC"
              strokeWidth="1"
            />
          ))}

          {/* Lines + dots per metric */}
          {METRICS.filter((m) => activeMetrics.has(m.key)).map((m) => {
            const values = getAlignedValues(data[m.key], labels);
            const max = Math.max(...values, 1);
            const pts = values.map((v, i) => ({
              x: xOf(i),
              y: yOf(v / max),
              raw: v,
              label: labels[i],
              i,
            }));
            const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
            const areaPath =
              pts.length > 0
                ? `${linePath} L ${pts[pts.length - 1].x} ${pad.top + innerH} L ${pts[0].x} ${pad.top + innerH} Z`
                : "";

            return (
              <g key={m.key}>
                {/* Area fill */}
                {areaPath && (
                  <path d={areaPath} fill={m.color} fillOpacity={0.06} />
                )}
                {/* Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={m.color}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  className="cursor-pointer"
                  onClick={() => router.push(m.href)}
                />
                {/* Dots */}
                {pts.map((p) => (
                  <circle
                    key={`${m.key}-${p.i}`}
                    cx={p.x}
                    cy={p.y}
                    r={
                      hoveredPoint?.metricKey === m.key && hoveredPoint?.idx === p.i ? 6 : 4
                    }
                    fill={m.color}
                    stroke="#fff"
                    strokeWidth="2"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        metricKey: m.key,
                        idx: p.i,
                        x: p.x,
                        y: p.y,
                        value: p.raw,
                        label: p.label,
                      })
                    }
                    onClick={() => router.push(m.href)}
                  />
                ))}
              </g>
            );
          })}

          {/* X-axis labels (month names) */}
          {labels.map((lbl, i) => {
            // show every other if crowded
            if (n > 8 && i % 2 !== 0) return null;
            return (
              <text
                key={lbl}
                x={xOf(i)}
                y={H - 6}
                textAnchor="middle"
                fontSize="9"
                fill="#94A3B8"
              >
                {lbl}
              </text>
            );
          })}

          {/* Tooltip */}
          {hoveredPoint && (() => {
            const metric = METRICS.find((m) => m.key === hoveredPoint.metricKey)!;
            const formatted = metric.format(hoveredPoint.value);
            const tw = Math.max(formatted.length * 6.5 + 24, 80);
            const tx = Math.min(
              Math.max(hoveredPoint.x - tw / 2, pad.left),
              W - pad.right - tw
            );
            const ty = hoveredPoint.y - 46;
            return (
              <g>
                <rect
                  x={tx}
                  y={ty < pad.top ? hoveredPoint.y + 10 : ty}
                  width={tw}
                  height={34}
                  rx={8}
                  fill="#1E293B"
                  opacity={0.92}
                />
                <text
                  x={tx + tw / 2}
                  y={(ty < pad.top ? hoveredPoint.y + 10 : ty) + 13}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#94A3B8"
                >
                  {hoveredPoint.label} · {metric.label}
                </text>
                <text
                  x={tx + tw / 2}
                  y={(ty < pad.top ? hoveredPoint.y + 10 : ty) + 26}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#F8FAFC"
                >
                  {formatted}
                </text>
              </g>
            );
          })()}
        </svg>

        {/* Click-to-report hint */}
        <p className="text-center text-[10px] text-slate-400 mt-1">
          Click any line or dot to open its detailed report · Double-click a metric badge to jump directly
        </p>
      </div>
    </div>
  );
}
