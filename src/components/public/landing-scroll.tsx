"use client";

import { useEffect } from "react";

export function LandingScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const bar = document.querySelector<HTMLElement>("[data-scroll-bar]");
    const rail = document.querySelector<HTMLElement>("[data-scroll-rail]");

    const groups: Array<{ items: HTMLElement[]; trigger: HTMLElement; played: boolean }> = [];

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      groups.push({ items: [el], trigger: el, played: false });
    });
    document.querySelectorAll<HTMLElement>("[data-reveal-group]").forEach((group) => {
      const items = Array.from(group.querySelectorAll<HTMLElement>("[data-reveal-item]"));
      if (items.length) groups.push({ items, trigger: group, played: false });
    });

    if (!reduce) {
      groups.forEach((group) => {
        group.items.forEach((el) => {
          el.style.opacity = "0";
          el.style.transform = "translateY(28px)";
          el.style.transition =
            "opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)";
        });
      });
    }

    const parallax = reduce
      ? []
      : Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]"));

    const play = (group: (typeof groups)[number]) => {
      if (group.played || reduce) return;
      group.played = true;
      group.items.forEach((el, index) => {
        window.setTimeout(() => {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }, index * 80);
      });
    };

    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (bar) bar.style.transform = `scaleX(${progress})`;
      if (rail) rail.style.transform = `scaleY(${progress})`;

      const view = window.innerHeight * 0.94;
      groups.forEach((group) => {
        if (group.played) return;
        const box = group.trigger.getBoundingClientRect();
        if (box.top < view && box.bottom > 0) play(group);
      });

      parallax.forEach((el) => {
        const parent = el.parentElement ?? el;
        const box = parent.getBoundingClientRect();
        const range = window.innerHeight + box.height;
        const passed = window.innerHeight - box.top;
        const t = range > 0 ? Math.min(1, Math.max(0, passed / range)) : 0;
        el.style.transform = `translateY(${-8 + t * 16}%)`;
      });
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("hashchange", onScroll);
    const late = window.setTimeout(update, 600);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("hashchange", onScroll);
      window.clearTimeout(late);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
        <div
          data-scroll-bar
          className="h-full w-full bg-[#2563EB] text-white"
          style={{ transform: "scaleX(0)", transformOrigin: "left center" }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-8 right-3 top-24 z-40 w-[3px] overflow-hidden rounded-full bg-slate-200/80"
      >
        <div
          data-scroll-rail
          className="h-full w-full rounded-full bg-[#2563EB] text-white"
          style={{ transform: "scaleY(0)", transformOrigin: "top center" }}
        />
      </div>
    </>
  );
}
