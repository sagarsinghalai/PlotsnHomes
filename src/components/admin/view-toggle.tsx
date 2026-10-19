"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Grid2x2, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "tile" | "list";

/** Per-list view mode, remembered in localStorage (per-viewer convenience). */
export function useViewMode(key: string, initial: ViewMode = "grid") {
  const [mode, setMode] = useState<ViewMode>(initial);
  useEffect(() => {
    try {
      const s = localStorage.getItem(`viewmode:${key}`);
      if (s === "grid" || s === "tile" || s === "list") setMode(s);
    } catch { /* ignore */ }
  }, [key]);
  const set = (m: ViewMode) => {
    setMode(m);
    try { localStorage.setItem(`viewmode:${key}`, m); } catch { /* ignore */ }
  };
  return [mode, set] as const;
}

/** Map a view mode to the container layout classes for a card list. */
export function viewContainerClass(mode: ViewMode): string {
  if (mode === "list") return "flex flex-col gap-2";
  if (mode === "tile") return "grid gap-5 grid-cols-1 lg:grid-cols-2";
  return "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"; // grid (default)
}

const OPTIONS: { m: ViewMode; label: string; Icon: typeof LayoutGrid }[] = [
  { m: "grid", label: "Grid view", Icon: LayoutGrid },
  { m: "tile", label: "Tile view", Icon: Grid2x2 },
  { m: "list", label: "List view", Icon: List },
];

export function ViewToggle({
  mode,
  onChange,
  className,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Choose view"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5",
        className
      )}
    >
      {OPTIONS.map(({ m, label, Icon }) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          aria-label={label}
          title={label}
          className={cn(
            "inline-flex items-center justify-center h-8 w-8 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
            mode === m
              ? "bg-brand text-white"
              : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
