import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  change?: number;
  changeLabel?: string;
  icon: LucideIcon;
  href?: string;
  sparklineData?: number[];
  className?: string;
}

export function StatCard({
  label,
  value,
  sub,
  change,
  changeLabel,
  icon: Icon,
  href,
  sparklineData,
  className,
}: StatCardProps) {
  const isPositive = change === undefined || change >= 0;

  const inner = (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 p-5 shadow-sm transition-all duration-200 hover:border-gold/40 hover:shadow-md flex flex-col justify-between h-full group",
        className
      )}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-2.5 text-slate-600 dark:text-slate-300 shrink-0 group-hover:bg-gold/10 group-hover:text-gold transition">
            <Icon className="h-5 w-5 shrink-0" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {value}
          </p>
          {change !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold",
                isPositive
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              )}
            >
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? `+${change}%` : `${change}%`}
            </span>
          )}
        </div>

        {(sub || changeLabel) && (
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            {sub || changeLabel}
          </p>
        )}
      </div>

      {sparklineData && sparklineData.length > 1 && (
        <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
          <svg className="w-full h-8 overflow-visible" viewBox="0 0 100 30" preserveAspectRatio="none">
            <path
              d={generateSparklinePath(sparklineData, 100, 30)}
              fill="none"
              stroke={isPositive ? "#10b981" : "#f43f5e"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {href && (
        <div className="mt-3 text-[11px] font-bold text-gold-dark dark:text-gold flex items-center gap-1 opacity-90 group-hover:opacity-100">
          View details <span className="transition-transform group-hover:translate-x-0.5">→</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full">
        {inner}
      </Link>
    );
  }
  return inner;
}

function generateSparklinePath(data: number[], width: number, height: number): string {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  return data
    .map((val, i) => {
      const x = i * step;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}
