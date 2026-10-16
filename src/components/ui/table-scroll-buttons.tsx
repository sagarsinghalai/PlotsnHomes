"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Left / Right buttons for horizontally scrolling a wide table. Pair with the
 * `useHorizontalScroll` hook — the buttons auto-disable when the table cannot
 * scroll further in that direction, so they never look broken on wide screens
 * where everything already fits.
 */
export function TableScrollButtons({
  canScrollLeft,
  canScrollRight,
  onScroll,
  className = "",
}: {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  onScroll: (direction: "left" | "right") => void;
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-900";
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={() => onScroll("left")}
        disabled={!canScrollLeft}
        title={canScrollLeft ? "Scroll table left" : "No more columns to the left"}
        className={base}
      >
        <ChevronLeft className="h-4 w-4 stroke-[2.5]" /> Left
      </button>
      <button
        type="button"
        onClick={() => onScroll("right")}
        disabled={!canScrollRight}
        title={canScrollRight ? "Scroll table right" : "No more columns to the right"}
        className={base}
      >
        Right <ChevronRight className="h-4 w-4 stroke-[2.5]" />
      </button>
    </div>
  );
}
