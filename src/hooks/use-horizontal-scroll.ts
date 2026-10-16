"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Keeps horizontal scroll buttons in sync with whether a scroll container can
 * actually scroll. On wide screens where the table fits, there is nothing to
 * scroll, so `canScrollLeft` / `canScrollRight` are false and the buttons can
 * be disabled instead of appearing broken.
 *
 * Usage:
 *   const { ref, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([rows, columns]);
 *   <div ref={ref} className="overflow-x-auto">...</div>
 *   <TableScrollButtons canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onScroll={scroll} />
 *
 * Pass values that change the table width (row data, visible columns) as `deps`
 * so the state recomputes when they change.
 */
export function useHorizontalScroll(deps: ReadonlyArray<unknown> = []) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft < maxScroll - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update, ...deps]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction === "left" ? -350 : 350, behavior: "smooth" });
  }, []);

  return { ref, canScrollLeft, canScrollRight, scroll };
}
