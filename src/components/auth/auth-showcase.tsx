"use client";

import Image from "next/image";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";

const SLIDES = [
  {
    title: "Bengaluru Tech Park",
    place: "ORR, Bengaluru",
    line: "Grade A office · 8.6% target yield",
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Mumbai BKC Tower",
    place: "Bandra Kurla Complex",
    line: "City skyline share · from ₹50,000",
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Whitefield Residences",
    place: "Whitefield, Bengaluru",
    line: "Rent paid into your wallet each cycle",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80",
  },
  {
    title: "Chennai Green Enclave",
    place: "Sriperumbudur, Chennai",
    line: "Verified plotted development",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80",
  },
];

export function AuthShowcase({ intent = "sign-in" }: { intent?: "sign-in" | "join" }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slide = SLIDES[index];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <aside
      className="relative flex h-[300px] shrink-0 flex-col overflow-hidden bg-[#1D4ED8] text-white sm:h-[340px] lg:h-full lg:min-h-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(120deg, transparent 0%, transparent 42%, rgba(255,255,255,0.16) 42.2%, transparent 42.6%), linear-gradient(300deg, transparent 0%, transparent 58%, rgba(255,255,255,0.12) 58.2%, transparent 58.6%)",
        }}
      />
      <div className="relative z-10 flex h-full min-h-0 flex-col px-4 py-4 sm:px-8 sm:py-6 lg:px-10">
        <Link href="/" className="inline-flex w-fit items-center gap-2 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#1D4ED8]">
            <Building2 className="h-4 w-4" />
          </span>
          <span className="text-base font-bold tracking-tight">PlotsnHomes</span>
        </Link>

        <div className="mt-3 hidden max-w-md lg:mt-5 lg:block">
          <h2 className="text-2xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl">
            Hello,
            <br />
            PlotsnHomes.
          </h2>
          <p className="mt-2 max-w-sm text-xs leading-5 text-white/85 sm:text-sm">
            {intent === "join"
              ? "Own a share of income-generating real estate. Choose an account type and start with a portfolio built around real buildings."
              : "Own a share of income-generating real estate. Browse the properties, then sign in to track yield, rent, and your portfolio."}
          </p>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col justify-end">
          <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl shadow-[0_24px_50px_rgba(15,23,42,0.28)]">
            {SLIDES.map((item, slideIndex) => (
              <button
                key={item.title}
                type="button"
                aria-label={`Show ${item.title}`}
                onClick={() => setIndex((slideIndex + 1) % SLIDES.length)}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  slideIndex === index ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  priority={slideIndex === 0}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
              </button>
            ))}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 sm:p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">{slide.place}</p>
              <p className="mt-0.5 text-base font-bold leading-tight sm:text-lg">{slide.title}</p>
              <p className="mt-0.5 text-xs text-white/80">{slide.line}</p>
            </div>
          </div>

          <div className="mt-2 grid shrink-0 grid-cols-4 gap-1.5" role="tablist" aria-label="Property previews">
            {SLIDES.map((item, slideIndex) => {
              const active = slideIndex === index;
              return (
                <button
                  key={item.title}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setIndex(slideIndex)}
                  className={`relative h-11 overflow-hidden rounded-lg border-2 transition sm:h-12 ${
                    active ? "border-white" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={item.image} alt="" fill className="object-cover" sizes="120px" />
                  {active && <span className="absolute inset-x-0 bottom-0 h-0.5 animate-pulse bg-white" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
}

export function AuthShell({
  children,
  intent = "sign-in",
}: {
  children: React.ReactNode;
  intent?: "sign-in" | "join";
}) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const desktop = window.matchMedia("(min-width: 1024px)");
    function apply() {
      const lock = desktop.matches ? "hidden" : "";
      html.style.overflow = lock;
      body.style.overflow = lock;
    }
    apply();
    desktop.addEventListener("change", apply);
    return () => {
      desktop.removeEventListener("change", apply);
      html.style.overflow = "";
      body.style.overflow = "";
    };
  }, []);

  return (
    <div className="min-h-dvh overflow-x-hidden bg-white lg:grid lg:h-dvh lg:max-h-dvh lg:grid-cols-2 lg:overflow-hidden">
      <AuthShowcase intent={intent} />
      <div className="flex items-start justify-center px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-8 lg:h-full lg:min-h-0 lg:items-center lg:overflow-hidden lg:px-10 lg:py-4">
        <div className="w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  );
}
