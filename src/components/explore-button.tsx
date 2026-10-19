"use client";

export function ExploreButton() {
  return (
    <a
      href="#featured-listings"
      onClick={(e) => {
        e.preventDefault();
        document.getElementById("featured-listings")?.scrollIntoView({ behavior: "smooth" });
      }}
      className="rounded-lg bg-brand hover:bg-brand-hover px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer"
    >
      Explore Properties →
    </a>
  );
}
