"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, MapPin, Percent, PieChart, Play, ShieldCheck } from "lucide-react";

const BLUE = "#2563EB";

const opportunities = [
  {
    category: "Office",
    title: "Bengaluru Tech Park",
    location: "ORR, Bengaluru",
    yield: "8.6%",
    min: "₹50,000",
    funded: "72%",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "Retail",
    title: "Pune Lifestyle Plaza",
    location: "Hinjawadi, Pune",
    yield: "8.9%",
    min: "₹50,000",
    funded: "68%",
    image: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "Industrial",
    title: "Hyderabad LogisHub",
    location: "Patancheru, Hyderabad",
    yield: "8.1%",
    min: "₹50,000",
    funded: "61%",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "Plotted Development",
    title: "Chennai Green Enclave",
    location: "Sriperumbudur, Chennai",
    yield: "7.8%",
    min: "₹50,000",
    funded: "80%",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
  },
  {
    category: "Office",
    title: "Mumbai BKC Tower",
    location: "Bandra Kurla Complex, Mumbai",
    yield: "9.4%",
    min: "₹50,000",
    funded: "54%",
    image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80",
  },
];

function YieldRing() {
  return (
    <div className="relative h-[92px] w-[92px] shrink-0">
      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r="14" fill="none" stroke="#E6EDF5" strokeWidth="3.2" />
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="none"
          stroke={BLUE}
          strokeWidth="3.2"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="78 100"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[1.35rem] font-bold leading-none tracking-tight" style={{ color: BLUE }}>
          8.6%
        </span>
        <span className="mt-0.5 text-[10px] font-medium text-slate-500">p.a.</span>
      </div>
    </div>
  );
}

export function FractionalLanding() {
  const scroller = useRef<HTMLDivElement>(null);

  function scrollByCard(direction: number) {
    const node = scroller.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>("[data-opportunity]");
    const amount = (card?.offsetWidth ?? 280) + 16;
    node.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <div className="bg-white">
      <section className="mx-auto grid max-w-7xl items-center gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-4 lg:px-8 lg:py-4">
        <div className="max-w-xl">
          <h1 className="text-[clamp(2.45rem,4.2vw,3.85rem)] font-extrabold leading-[0.96] tracking-[-0.035em] text-slate-950">
            Invest beyond
            <br />
            four walls.
          </h1>
          <p className="mt-3 max-w-md text-[15px] leading-6 text-slate-600">
            Own a share of high-quality, income-generating real estate. PlotsnHomes makes fractional ownership simple, transparent and accessible for every investor.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-4">
            <Link
              href="#opportunities"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
              style={{ backgroundColor: BLUE }}
            >
              Explore opportunities
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#how-it-works" className="inline-flex items-center gap-2.5 text-sm font-semibold text-slate-800">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-800">
                <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
              </span>
              See how it works
            </Link>
          </div>
          <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
            {[
              { icon: PieChart, text: "Own a fraction, not the full property" },
              { icon: Percent, text: "Earn rental income & appreciation" },
              { icon: ShieldCheck, text: "Institutional-grade due diligence" },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#E8F0FE] text-[#2563EB]">
                  <item.icon className="h-3.5 w-3.5" />
                </span>
                <p className="text-[12px] font-medium leading-snug text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[360px] sm:min-h-[400px] lg:min-h-[420px]">
          <div className="absolute inset-0 overflow-hidden rounded-[1.75rem] lg:rounded-none lg:[clip-path:polygon(15%_0,100%_0,100%_100%,0_100%)]">
            <Image
              src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=1800&q=80"
              alt="Grade A office campus in Bengaluru"
              fill
              priority
              className="object-cover object-[center_45%]"
              sizes="(max-width: 1024px) 100vw, 720px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-white/10" />
          </div>

          <article className="absolute bottom-4 left-4 right-4 z-10 rounded-3xl border border-white/70 bg-white/95 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur sm:left-auto sm:w-[330px] lg:bottom-auto lg:right-3 lg:top-1/2 lg:w-[318px] lg:-translate-y-1/2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Featured opportunity</p>
            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-950">Bengaluru Tech Park</h2>
            <p className="mt-0.5 text-sm text-slate-500">Grade A office · ORR, Bengaluru</p>

            <div className="mt-4 flex items-center gap-4">
              <div>
                <p className="text-[11px] font-medium text-slate-500">Expected yield</p>
                <YieldRing />
              </div>
              <div className="min-w-0 flex-1 space-y-3 border-l border-slate-100 pl-4">
                <div>
                  <p className="text-[11px] text-slate-500">Min. investment</p>
                  <p className="text-lg font-bold tracking-tight text-slate-950">₹50,000</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">Target size</p>
                  <p className="text-lg font-bold tracking-tight text-slate-950">₹25.00 Cr</p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">Funding progress</span>
                <span className="font-semibold" style={{ color: BLUE }}>
                  72% funded
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full" style={{ width: "72%", backgroundColor: BLUE }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">₹18.00 Cr raised of ₹25.00 Cr</p>
            </div>
          </article>
        </div>
      </section>

      <section id="opportunities" className="scroll-mt-24 bg-[#F5F7FB] py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Curated opportunities</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous opportunities"
                onClick={() => scrollByCard(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next opportunities"
                onClick={() => scrollByCard(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={scroller}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {opportunities.map((item) => (
              <Link
                key={item.title}
                href="/properties"
                data-opportunity
                className="w-[78%] shrink-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-[46%] lg:w-[calc(25%-12px)]"
              >
                <div className="relative h-40 sm:h-44">
                  <Image src={item.image} alt={item.title} fill className="object-cover" sizes="320px" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-800 shadow-sm">
                    {item.category}
                  </span>
                  <span
                    className="absolute right-3 top-3 rounded-full bg-[#E8F0FE] px-2.5 py-1 text-[11px] font-semibold"
                    style={{ color: BLUE }}
                  >
                    {item.yield} Yield
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="text-[15px] font-bold text-slate-950">{item.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {item.location}
                  </p>
                  <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200 border-t border-slate-100 pt-3">
                    <div className="pr-2">
                      <p className="text-sm font-bold" style={{ color: BLUE }}>
                        {item.yield}
                      </p>
                      <p className="text-[11px] text-slate-500">Expected yield</p>
                    </div>
                    <div className="px-2">
                      <p className="text-sm font-bold text-slate-950">{item.min}</p>
                      <p className="text-[11px] text-slate-500">Min. investment</p>
                    </div>
                    <div className="pl-2">
                      <p className="text-sm font-bold" style={{ color: BLUE }}>
                        {item.funded}
                      </p>
                      <p className="text-[11px] text-slate-500">Funded</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
