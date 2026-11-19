"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function LandingScroll() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let scan = () => {};
    let late = 0;

    const ctx = gsap.context(() => {
      const bar = document.querySelector<HTMLElement>("[data-scroll-bar]");
      const rail = document.querySelector<HTMLElement>("[data-scroll-rail]");

      if (bar) {
        gsap.to(bar, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.35 },
        });
      }
      if (rail) {
        gsap.to(rail, {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.35 },
        });
      }

      if (reduce) return;

      const pending: Array<{ targets: HTMLElement[]; trigger: HTMLElement; stagger: number; played: boolean }> = [];

      const play = (entry: (typeof pending)[number]) => {
        if (entry.played) return;
        entry.played = true;
        gsap.fromTo(
          entry.targets,
          { y: 24 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.7,
            stagger: entry.stagger,
            ease: "power3.out",
            overwrite: "auto",
          },
        );
      };

      scan = () => {
        const view = window.innerHeight * 0.94;
        pending.forEach((entry) => {
          if (entry.played) return;
          const box = entry.trigger.getBoundingClientRect();
          if (box.top < view && box.bottom > 0) play(entry);
        });
      };

      const queue = (targets: HTMLElement[], trigger: HTMLElement, stagger = 0) => {
        const box = trigger.getBoundingClientRect();
        const inView = box.top < window.innerHeight * 0.94 && box.bottom > 0;
        if (!inView) gsap.set(targets, { autoAlpha: 0, y: 28 });
        const entry = { targets, trigger, stagger, played: false };
        pending.push(entry);
        if (inView) play(entry);
      };

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => queue([el], el));
      gsap.utils.toArray<HTMLElement>("[data-reveal-group]").forEach((group) => {
        const items = Array.from(group.querySelectorAll<HTMLElement>("[data-reveal-item]"));
        if (items.length) queue(items, group, 0.08);
      });

      scan();
      window.addEventListener("scroll", scan, { passive: true });
      window.addEventListener("hashchange", scan);
      late = window.setTimeout(scan, 600);

      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    const timer = window.setTimeout(refresh, 400);

    return () => {
      window.removeEventListener("load", refresh);
      window.removeEventListener("scroll", scan);
      window.removeEventListener("hashchange", scan);
      window.clearTimeout(timer);
      window.clearTimeout(late);
      ctx.revert();
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
