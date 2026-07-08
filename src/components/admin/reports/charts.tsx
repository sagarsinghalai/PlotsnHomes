"use client";

import type { ChartPoint } from "@/lib/admin-reports";
import { CHART_COLORS } from "@/lib/admin-reports";
import { formatCurrency } from "@/lib/utils";

type ValueFormat = "number" | "currency";

function formatChartValue(n: number, format: ValueFormat = "number") {
  if (format === "currency") return formatCurrency(n);
  return String(n);
}

export function ReportKpiGrid({
  items,
}: {
  items: { label: string; value: string | number; sub?: string; highlight?: boolean }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl border p-5 ${
            item.highlight ? "border-red-200 bg-red-50" : "bg-white border-slate-200"
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{item.value}</p>
          {item.sub && <p className="mt-1 text-xs text-slate-500">{item.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export function VerticalBarChart({
  data,
  height = 280,
  valueFormat = "number",
}: {
  data: ChartPoint[];
  height?: number;
  valueFormat?: ValueFormat;
}) {
  const width = 640;
  const pad = { top: 24, right: 16, bottom: 48, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barGap = 12;
  const barW = data.length ? (innerW - barGap * (data.length - 1)) / data.length : innerW;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.top + innerH * (1 - t);
          const val = Math.round(max * t);
          return (
            <g key={t}>
              <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#E2E8F0" strokeWidth="1" />
              <text x={pad.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400 text-[10px]">
                {formatChartValue(val, valueFormat)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = (d.value / max) * innerH;
          const x = pad.left + i * (barW + barGap);
          const y = pad.top + innerH - h;
          const color = d.color ?? CHART_COLORS[i % CHART_COLORS.length];
          return (
            <g key={d.label}>
              <rect x={x} y={y} width={barW} height={h} rx={6} fill={color} opacity={0.9} />
              <text
                x={x + barW / 2}
                y={height - pad.bottom + 16}
                textAnchor="middle"
                className="fill-slate-600 text-[10px]"
              >
                {d.label.length > 10 ? d.label.slice(0, 9) + "…" : d.label}
              </text>
              {d.value > 0 && (
                <text x={x + barW / 2} y={y - 6} textAnchor="middle" className="fill-slate-700 text-[10px] font-semibold">
                  {formatChartValue(d.value, valueFormat)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function HorizontalBarChart({ data }: { data: ChartPoint[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const color = d.color ?? CHART_COLORS[i % CHART_COLORS.length];
        return (
          <div key={d.label}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium text-slate-800">{d.label}</span>
              <span className="text-slate-500 tabular-nums">{d.value}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
        );
      })}
      {data.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No data for this period</p>}
    </div>
  );
}

export function DonutChart({ data, size = 220 }: { data: ChartPoint[]; size?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = 40;
  const c = 2 * Math.PI * r;
  let offset = 0;

  const slices = data.map((d, i) => {
    const pct = d.value / total;
    const dash = pct * c;
    const slice = {
      ...d,
      color: d.color ?? CHART_COLORS[i % CHART_COLORS.length],
      dash,
      offset,
      pct: Math.round(pct * 100),
    };
    offset += dash;
    return slice;
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col sm:flex-row items-center gap-8">
        <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0 -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#F1F5F9" strokeWidth="12" />
          {slices.map((s) => (
            <circle
              key={s.label}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="12"
              strokeDasharray={`${s.dash} ${c - s.dash}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="round"
            />
          ))}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-900 text-[14px] font-bold rotate-90"
            style={{ transform: "rotate(90deg)", transformOrigin: "50px 50px" }}
          >
            {total}
          </text>
        </svg>
        <ul className="flex-1 space-y-2 w-full">
          {slices.map((s) => (
            <li key={s.label} className="flex items-center justify-between text-sm gap-3">
              <span className="flex items-center gap-2 min-w-0">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="truncate text-slate-700">{s.label}</span>
              </span>
              <span className="text-slate-500 tabular-nums shrink-0">
                {s.value} ({s.pct}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function AreaLineChart({
  data,
  height = 260,
  valueFormat = "number",
}: {
  data: ChartPoint[];
  height?: number;
  valueFormat?: ValueFormat;
}) {
  const width = 640;
  const pad = { top: 24, right: 16, bottom: 40, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...data.map((d) => d.value), 1);

  const points =
    data.length === 0
      ? []
      : data.map((d, i) => {
          const x = pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
          const y = pad.top + innerH - (d.value / max) * innerH;
          return { x, y, ...d };
        });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${pad.top + innerH} L ${points[0].x} ${pad.top + innerH} Z`
      : "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
        {[0, 0.5, 1].map((t) => {
          const y = pad.top + innerH * (1 - t);
          return (
            <line key={t} x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#E2E8F0" strokeWidth="1" />
          );
        })}
        {areaPath && <path d={areaPath} fill="rgba(201,162,39,0.15)" />}
        {linePath && (
          <path d={linePath} fill="none" stroke="#C9A227" strokeWidth="2.5" strokeLinejoin="round" />
        )}
        {points.map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="4" fill="#C9A227" stroke="#fff" strokeWidth="2" />
            <text x={p.x} y={height - 12} textAnchor="middle" className="fill-slate-500 text-[9px]">
              {p.label}
            </text>
          </g>
        ))}
        {points.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" className="fill-slate-400 text-sm">
            No trend data yet
          </text>
        )}
      </svg>
      {valueFormat === "currency" && points.length > 0 && (
        <p className="text-xs text-slate-500 mt-2 text-right">
          Peak: {formatChartValue(Math.max(...data.map((d) => d.value)), valueFormat)}
        </p>
      )}
    </div>
  );
}

export function FunnelChart({ stages }: { stages: ChartPoint[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8">
      <div className="space-y-3 max-w-3xl mx-auto">
        {stages.map((s, i) => {
          const width = Math.max(18, (s.value / max) * 100);
          const color = s.color ?? CHART_COLORS[i % CHART_COLORS.length];
          const next = stages[i + 1];
          const drop =
            s.value > 0 && next ? Math.round((next.value / s.value) * 100) : null;
          return (
            <div key={s.label} className="flex items-center gap-4">
              <div className="w-36 text-right text-sm font-medium text-slate-600 shrink-0">{s.label}</div>
              <div className="flex-1 flex items-center gap-3">
                <div
                  className="h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm"
                  style={{ width: `${width}%`, minWidth: "72px", backgroundColor: color }}
                >
                  {s.value}
                </div>
                {drop !== null && (
                  <span className="text-xs text-slate-400 whitespace-nowrap">→ {drop}% to next</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DataTable({
  title,
  columns,
  rows,
}: {
  title?: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      {title && (
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-6 py-3 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50">
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-3.5 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-center text-slate-400 py-12 text-sm">No rows</p>}
      </div>
    </div>
  );
}
