"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Tile = {
  id: string;
  kind: "Villas" | "Homes" | "Interiors";
  label: string;
  stat: string;
  note: string;
  image: string;
  span: string;
};

const TILES: Tile[] = [
  {
    id: "villa",
    kind: "Villas",
    label: "Pool villa",
    stat: "4 BHK",
    note: "Private garden and an open living room",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    span: "sm:col-span-2 sm:row-span-2 min-h-[280px]",
  },
  {
    id: "skyline",
    kind: "Homes",
    label: "City residence",
    stat: "2,100",
    note: "Square feet, ready to move",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80",
    span: "min-h-[220px]",
  },
  {
    id: "courtyard",
    kind: "Villas",
    label: "Courtyard house",
    stat: "3 beds",
    note: "Quiet street, verified title",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    span: "min-h-[220px]",
  },
  {
    id: "living",
    kind: "Interiors",
    label: "Daylight living",
    stat: "Ready",
    note: "Furnished, photographed in place",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80",
    span: "min-h-[240px]",
  },
  {
    id: "view",
    kind: "Homes",
    label: "Open view",
    stat: "₹2.4 Cr",
    note: "Honest price, no hidden extras",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80",
    span: "min-h-[240px]",
  },
];

const FILTERS = ["All", "Villas", "Homes", "Interiors"] as const;

export function EditorialShowcase() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const tiles = useMemo(
    () => (filter === "All" ? TILES : TILES.filter((tile) => tile.kind === filter)),
    [filter]
  );

  return (
    <>
      <section className="bg-[#f7f6f2] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-display text-[clamp(2.6rem,6vw,5.2rem)] font-medium uppercase leading-[0.92] tracking-tight text-slate-950">
            Homes with
            <span className="block">room to breathe</span>
          </h2>

          <div className="relative mx-auto mt-8 max-w-5xl">
            <Link
              href="#get-in-touch"
              className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#B4F06B] px-6 py-3 text-center text-[11px] font-bold uppercase leading-tight tracking-[0.16em] text-slate-950 shadow-md transition hover:brightness-95"
            >
              Request
              <span className="block">brochure</span>
            </Link>
            <div
              className="relative aspect-[16/10] overflow-hidden shadow-[0_24px_60px_rgba(15,23,42,0.12)] sm:aspect-[16/8.5]"
              style={{ borderRadius: "48% 52% 46% 54% / 36% 42% 58% 64%" }}
            >
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1800&q=80"
                alt="A bright modern villa surrounded by trees"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="our-properties" className="bg-[#f7f6f2] px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-end gap-6 lg:grid-cols-[1fr_1.1fr]">
            <h2 className="font-display text-4xl font-medium text-slate-950 sm:text-5xl">Our properties</h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <p className="max-w-sm text-sm leading-relaxed text-slate-600">
                A few homes from the collection. Filter by the kind of place you are picturing, then ask for the full brochure.
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <label className="sr-only" htmlFor="property-kind">Property kind</label>
                <select
                  id="property-kind"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as (typeof FILTERS)[number])}
                  className="h-11 rounded-full border border-slate-300 bg-white px-4 text-sm font-medium text-slate-950 outline-none focus:border-[#B4F06B]"
                >
                  {FILTERS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <Link
                  href="/properties"
                  aria-label="Browse all properties"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#B4F06B] text-slate-950 transition hover:brightness-95"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiles.map((tile) => (
              <Link
                key={tile.id}
                href="/properties"
                className={`group relative overflow-hidden rounded-[1.6rem] bg-slate-200 ${tile.span}`}
              >
                <img
                  src={tile.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                <span className="relative flex h-full min-h-[inherit] flex-col justify-end p-5 text-white">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">{tile.label}</span>
                  <span className="mt-1 font-display text-4xl leading-none text-[#B4F06B]">{tile.stat}</span>
                  <span className="mt-1 max-w-[16rem] text-sm text-white/90">{tile.note}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
