"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";

export type PortfolioSlide = {
  area: string;
  count: number;
  imageUrl: string;
};

type Kind = "City" | "Waterfront" | "Hills" | "Residences";

type Piece = PortfolioSlide & {
  id: string;
  kind: Kind;
  note: string;
  highlight: string;
};

const FILTERS = ["All", "City", "Waterfront", "Hills", "Residences"] as const;

const META: Record<string, { kind: Kind; note: string; highlight: string }> = {
  downtown: {
    kind: "City",
    note: "Skyline homes a short walk from work, dining, and the water.",
    highlight: "Prime skyline",
  },
  "business bay": {
    kind: "City",
    note: "Tower residences with canal views and a fast path into the city.",
    highlight: "Canal living",
  },
  marina: {
    kind: "Waterfront",
    note: "Walkable waterfront apartments with a marina at the door.",
    highlight: "On the water",
  },
  jumeirah: {
    kind: "Waterfront",
    note: "Low-rise beach homes on quiet streets, close to the shore.",
    highlight: "Beach streets",
  },
  "dubai hills estate": {
    kind: "Hills",
    note: "Family villas set around parks, with room for a garden.",
    highlight: "Park villas",
  },
  "palm jumeirah": {
    kind: "Waterfront",
    note: "Island villas with a private stretch of water.",
    highlight: "Island villas",
  },
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80";

function enrich(slide: PortfolioSlide, index: number): Piece {
  const key = slide.area.toLowerCase().trim();
  const meta = META[key] ?? {
    kind: "Residences" as Kind,
    note: "Verified homes in a neighbourhood people actually want to live in.",
    highlight: "Curated homes",
  };
  return {
    ...slide,
    id: `${slide.area}-${index}`,
    imageUrl: slide.imageUrl || FALLBACK_IMAGE,
    kind: meta.kind,
    note: meta.note,
    highlight: meta.highlight,
  };
}

function useCountUp(value: number) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 720);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduce]);

  return shown;
}

const rise = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function PortfolioShowcase({ slides }: { slides: PortfolioSlide[] }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () => slides.filter((s) => s.area).map(enrich),
    [slides],
  );
  const availableFilters = useMemo(
    () => FILTERS.filter((f) => f === "All" || pieces.some((p) => p.kind === f)),
    [pieces],
  );

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const visible = useMemo(
    () => (filter === "All" ? pieces : pieces.filter((p) => p.kind === filter)),
    [pieces, filter],
  );

  const active = visible[index] ?? visible[0];
  const listingCount = useCountUp(active?.count ?? 0);

  useEffect(() => {
    setIndex(0);
  }, [filter]);

  useEffect(() => {
    if (paused || reduce || visible.length < 2) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % visible.length);
    }, 4600);
    return () => clearInterval(timer);
  }, [paused, reduce, visible.length, index]);

  if (!active) return null;

  const pick = (next: number) => {
    setIndex((next + visible.length) % visible.length);
  };

  return (
    <section
      id="portfolio"
      className="relative overflow-hidden bg-white py-16 sm:py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#2563EB]/50 blur-3xl"
        animate={reduce ? undefined : { scale: [1, 1.15, 1], opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 bottom-0 h-64 w-64 rounded-full bg-[#2563EB]/35 blur-3xl"
        animate={reduce ? undefined : { y: [0, -18, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <motion.p
              className="inline-flex rounded-full bg-[#2563EB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white"
              initial={reduce ? false : { opacity: 0, y: 12, scale: 0.92 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Our portfolio
            </motion.p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-[1.05] text-slate-950 sm:text-6xl">
              {"Places worth coming home to".split(" ").map((word, i) => (
                <motion.span
                  key={word}
                  className="mr-[0.28em] inline-block"
                  custom={i}
                  variants={rise}
                  initial={reduce ? false : "hidden"}
                  whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                >
                  {word}
                </motion.span>
              ))}
            </h2>
            <motion.p
              className="mt-4 max-w-md text-base leading-relaxed text-slate-600"
              custom={5}
              variants={rise}
              initial={reduce ? false : "hidden"}
              whileInView="show"
              viewport={{ once: true }}
            >
              Pick a neighbourhood. The collection shifts with you — photos, listings, and a short reason people choose it.
            </motion.p>
          </div>

          <motion.div
            className="flex flex-wrap gap-2"
            role="tablist"
            aria-label="Filter portfolio"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {availableFilters.map((item) => {
              const on = item === filter;
              return (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFilter(item)}
                  className="relative rounded-full px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  {on && (
                    <motion.span
                      layoutId="portfolio-filter"
                      className="absolute inset-0 rounded-full bg-[#2563EB] text-white"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{item}</span>
                </button>
              );
            })}
          </motion.div>
        </div>

        <div className="mt-10 grid items-stretch gap-5 lg:grid-cols-[1.45fr_0.7fr]">
          <motion.article
            className="relative min-h-[420px] overflow-hidden rounded-[2rem] bg-slate-900 shadow-xl sm:min-h-[520px]"
            initial={reduce ? false : { opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={active.id}
                src={active.imageUrl}
                alt={active.area}
                className="absolute inset-0 h-full w-full object-cover"
                initial={reduce ? false : { opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: reduce ? 1 : 1.04 }}
                exit={{ opacity: 0, scale: 1 }}
                transition={{ duration: reduce ? 0.2 : 0.85, ease: "easeOut" }}
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-slate-950/10" />

            <div className="relative flex h-full min-h-[420px] flex-col justify-between p-6 sm:min-h-[520px] sm:p-9">
              <div className="flex items-center justify-between">
                <motion.span
                  key={`${active.id}-chip`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white"
                  initial={reduce ? false : { opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {active.kind}
                </motion.span>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                  {String(visible.indexOf(active) + 1).padStart(2, "0")} / {String(visible.length).padStart(2, "0")}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id + "-copy"}
                  initial={reduce ? false : { opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="text-sm font-medium text-[#2563EB]">{active.highlight}</p>
                  <h3 className="mt-2 font-display text-5xl font-medium leading-none text-white sm:text-7xl">
                    {active.area}
                  </h3>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">{active.note}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <div>
                      <p className="font-display text-4xl text-white">{listingCount}</p>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                        {active.count === 1 ? "Listing" : "Listings"}
                      </p>
                    </div>
                    <Link
                      href={`/properties?area=${encodeURIComponent(active.area)}`}
                      className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
                    >
                      View properties
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {!reduce && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/15">
                <motion.div
                  key={`${active.id}-${paused ? "pause" : "play"}`}
                  className="h-full origin-left bg-[#2563EB] text-white"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: paused ? 0.15 : 1 }}
                  transition={{ duration: paused ? 0.3 : 4.6, ease: "linear" }}
                />
              </div>
            )}
          </motion.article>

          <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
            <AnimatePresence mode="popLayout">
              {visible.map((piece, i) => {
                const on = piece.id === active.id;
                return (
                  <motion.button
                    key={piece.id}
                    type="button"
                    layout
                    onClick={() => pick(i)}
                    initial={reduce ? false : { opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4, delay: reduce ? 0 : i * 0.05 }}
                    whileHover={reduce ? undefined : { y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative flex min-w-[240px] items-center gap-3 overflow-hidden rounded-2xl border p-2.5 text-left lg:min-w-0 ${
                      on ? "border-transparent bg-white shadow-lg" : "border-slate-200 bg-white/80"
                    }`}
                  >
                    {on && (
                      <motion.span
                        layoutId="portfolio-rail"
                        className="absolute inset-0 rounded-2xl ring-2 ring-[#2563EB]"
                        transition={{ type: "spring", stiffness: 360, damping: 30 }}
                      />
                    )}
                    <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                      <motion.img
                        src={piece.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        animate={{ scale: on ? 1.08 : 1 }}
                        transition={{ duration: 0.5 }}
                      />
                    </span>
                    <span className="relative min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-950">{piece.area}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {piece.kind} · {piece.count} listings
                      </span>
                    </span>
                    <motion.span
                      className="relative mr-1 text-slate-950"
                      animate={{ x: on ? 0 : 4, opacity: on ? 1 : 0.35 }}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </motion.span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
