"use client";

interface AnalyticsDateFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function AnalyticsDateFilter({ value, onChange, className = "" }: AnalyticsDateFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-xs outline-none cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition ${className}`}
    >
      <option value="7d">Last 7 Days</option>
      <option value="30d">Last 30 Days</option>
      <option value="90d">Last 90 Days</option>
      <option value="ytd">Year to Date</option>
      <option value="all">All Time</option>
    </select>
  );
}
