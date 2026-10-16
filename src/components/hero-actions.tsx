"use client";

export function HeroActions() {
  return (
    <div className="mt-8 flex flex-wrap gap-4 items-center">
      <a
        href="#featured-listings"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("featured-listings")?.scrollIntoView({ behavior: "smooth" });
        }}
        className="rounded-lg bg-gold hover:bg-gold-dark px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer"
      >
        Explore Properties →
      </a>
      <a
        href="#how-it-works"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
        }}
        className="rounded-lg border border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-200 cursor-pointer"
      >
        How It Works
      </a>
    </div>
  );
}
