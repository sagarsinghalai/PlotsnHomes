"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const CATEGORIES = ["Office", "Retail", "Industrial", "Plotted", "Residential"] as const;
const CITIES = ["All cities", "Bengaluru", "Pune", "Hyderabad", "Chennai", "Mumbai"] as const;
const YIELDS = [
  { id: "any", label: "Any yield", min: 0 },
  { id: "8", label: "8%+", min: 8 },
  { id: "8.5", label: "8.5%+", min: 8.5 },
  { id: "9", label: "9%+", min: 9 },
] as const;

type Category = (typeof CATEGORIES)[number];

type Listing = {
  id: string;
  category: Category;
  city: string;
  title: string;
  location: string;
  yield: number;
  min: string;
  funded: number;
  image: string;
};

const LISTINGS: Listing[] = [
  { id: "blr-tech", category: "Office", city: "Bengaluru", title: "Bengaluru Tech Park", location: "ORR, Bengaluru", yield: 8.6, min: "₹50,000", funded: 72, image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80" },
  { id: "mum-bkc", category: "Office", city: "Mumbai", title: "Mumbai BKC Tower", location: "Bandra Kurla Complex", yield: 9.4, min: "₹50,000", funded: 54, image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80" },
  { id: "hyd-office", category: "Office", city: "Hyderabad", title: "Financial District One", location: "Gachibowli, Hyderabad", yield: 8.1, min: "₹50,000", funded: 63, image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=900&q=80" },
  { id: "pun-retail", category: "Retail", city: "Pune", title: "Pune Lifestyle Plaza", location: "Hinjawadi, Pune", yield: 8.9, min: "₹50,000", funded: 68, image: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=900&q=80" },
  { id: "chn-retail", category: "Retail", city: "Chennai", title: "OMR High Street", location: "Sholinganallur, Chennai", yield: 8.4, min: "₹40,000", funded: 47, image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80" },
  { id: "blr-retail", category: "Retail", city: "Bengaluru", title: "Indiranagar Arcade", location: "Indiranagar, Bengaluru", yield: 9.1, min: "₹50,000", funded: 81, image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=900&q=80" },
  { id: "hyd-log", category: "Industrial", city: "Hyderabad", title: "Hyderabad LogisHub", location: "Patancheru, Hyderabad", yield: 8.1, min: "₹50,000", funded: 61, image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80" },
  { id: "pun-ind", category: "Industrial", city: "Pune", title: "Chakan Industrial Park", location: "Chakan, Pune", yield: 8.7, min: "₹75,000", funded: 44, image: "https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=900&q=80" },
  { id: "chn-plot", category: "Plotted", city: "Chennai", title: "Chennai Green Enclave", location: "Sriperumbudur, Chennai", yield: 7.8, min: "₹50,000", funded: 80, image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80" },
  { id: "blr-plot", category: "Plotted", city: "Bengaluru", title: "Devanahalli Plots", location: "Devanahalli, Bengaluru", yield: 9.2, min: "₹40,000", funded: 58, image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80" },
  { id: "mum-home", category: "Residential", city: "Mumbai", title: "Worli Sea Residences", location: "Worli, Mumbai", yield: 8.3, min: "₹1,00,000", funded: 39, image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80" },
  { id: "blr-home", category: "Residential", city: "Bengaluru", title: "Whitefield Residences", location: "Whitefield, Bengaluru", yield: 8.8, min: "₹50,000", funded: 66, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80" },
];

export function EditorialShowcase() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [city, setCity] = useState<(typeof CITIES)[number]>("All cities");
  const [yieldId, setYieldId] = useState<(typeof YIELDS)[number]["id"]>("any");

  const minYield = YIELDS.find((item) => item.id === yieldId)?.min ?? 0;

  const listings = useMemo(() => {
    return LISTINGS.filter((item) => {
      if (categories.length > 0 && !categories.includes(item.category)) return false;
      if (city !== "All cities" && item.city !== city) return false;
      if (item.yield < minYield) return false;
      return true;
    });
  }, [categories, city, minYield]);

  function toggleCategory(category: Category) {
    setCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  }

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
              className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2563EB] px-6 py-3 text-center text-[11px] font-bold uppercase leading-tight tracking-[0.16em] text-white shadow-md transition hover:brightness-95"
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

      <section id="our-properties" className="bg-white px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Browse by category</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                Pick one or more categories, then narrow by city and yield. The list updates as you choose.
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              <span className="text-[#2563EB]">{listings.length}</span> {listings.length === 1 ? "opportunity" : "opportunities"}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Categories">
            <button
              type="button"
              onClick={() => setCategories([])}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                categories.length === 0 ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((category) => {
              const selected = categories.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selected ? "bg-[#2563EB] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="City">
              {CITIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={city === item}
                  onClick={() => setCity(item)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    city === item
                      ? "border-[#2563EB] bg-[#E8F0FE] text-[#2563EB]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <span className="hidden h-5 w-px bg-slate-200 sm:block" aria-hidden />
            <div className="flex shrink-0 gap-2" role="group" aria-label="Minimum yield">
              {YIELDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={yieldId === item.id}
                  onClick={() => setYieldId(item.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    yieldId === item.id
                      ? "border-[#2563EB] bg-[#2563EB] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
              <p className="text-base font-semibold text-slate-950">No opportunities match these filters</p>
              <button
                type="button"
                onClick={() => {
                  setCategories([]);
                  setCity("All cities");
                  setYieldId("any");
                }}
                className="mt-4 rounded-full bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {listings.map((item) => (
                <Link
                  key={item.id}
                  href="/properties"
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#2563EB]/40 hover:shadow-md"
                >
                  <div className="relative h-44">
                    <img src={item.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm">
                      {item.category}
                    </span>
                    <span className="absolute right-3 top-3 rounded-full bg-[#E8F0FE] px-2.5 py-1 text-[11px] font-semibold text-[#2563EB]">
                      {item.yield.toFixed(1)}% Yield
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[15px] font-bold text-slate-950">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.location}</p>
                    <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-100 pt-3">
                      <div className="pr-2">
                        <p className="text-sm font-bold text-[#2563EB]">{item.yield.toFixed(1)}%</p>
                        <p className="text-[11px] text-slate-500">Yield</p>
                      </div>
                      <div className="px-2">
                        <p className="truncate text-[13px] font-bold text-slate-950">{item.min}</p>
                        <p className="text-[11px] text-slate-500">Minimum</p>
                      </div>
                      <div className="pl-2">
                        <p className="text-sm font-bold text-[#2563EB]">{item.funded}%</p>
                        <p className="text-[11px] text-slate-500">Funded</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-[#2563EB]" style={{ width: `${item.funded}%` }} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
