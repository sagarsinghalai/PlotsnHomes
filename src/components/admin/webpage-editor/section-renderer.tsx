"use client";

import { useState } from "react";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Globe,
  HelpCircle,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { SectionBlock } from "@/lib/webpage-editor-store";

const ICON_MAP: Record<string, any> = {
  ShieldCheck,
  Tag,
  Calendar,
  Sparkles,
  Building2,
  UserCheck,
  TrendingUp,
  DollarSign,
  MapPin,
  Phone,
  Globe,
  CheckCircle2,
};

export function SectionRenderer({ section }: { section: SectionBlock }) {
  const [openFaq, setOpenFaq] = useState<Record<string, boolean>>({});
  const [testimonialSlide, setTestimonialSlide] = useState(0);

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  switch (section.type) {
    case "hero": {
      const alignClass =
        section.alignment === "center"
          ? "text-center items-center"
          : section.alignment === "right"
          ? "text-right items-end ml-auto"
          : "text-left items-start";

      return (
        <section
          className="relative min-h-[460px] w-full flex items-center justify-center p-6 sm:p-12 overflow-hidden rounded-3xl my-3 shadow-2xl border border-slate-800 text-white"
          style={{
            backgroundImage: section.bgImage ? `url(${section.bgImage})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: section.bgColor || "#030712",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-slate-950/80 z-0" />

          <div className={`relative z-10 max-w-4xl flex flex-col gap-4 w-full ${alignClass}`}>
            <div className="flex items-center justify-center gap-3">
              <span className="h-[2px] w-8 bg-gold" />
              <p className="text-xs font-semibold uppercase tracking-widest text-gold" style={{ color: "#f59e0b" }}>
                Fractional Real Estate Investment
              </p>
              <span className="h-[2px] w-8 bg-gold" />
            </div>

            <h1
              className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight"
              style={{ color: "#ffffff" }}
            >
              {section.title.includes("World's Finest") ? (
                <>
                  Own a Piece of the <span className="italic font-serif text-gold font-normal" style={{ color: "#f59e0b" }}>World's Finest </span> Properties
                </>
              ) : (
                section.title || "Own a Piece of the World's Finest Properties"
              )}
            </h1>

            {section.subtitle && (
              <p className="text-sm sm:text-base max-w-2xl font-medium leading-relaxed" style={{ color: "#cbd5e1" }}>
                {section.subtitle}
              </p>
            )}

            {/* HOMEPAGE SEARCH FILTER BAR BOX PREVIEW */}
            <div className="mt-4 w-full rounded-2xl border border-slate-800 bg-slate-950/90 p-4 sm:p-6 text-left shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex gap-2">
                  <span className="px-4 py-1.5 rounded-lg bg-gold text-slate-950 text-xs font-extrabold shadow-sm">
                    {section.ctaText || "Buy Properties"}
                  </span>
                  <span className="px-4 py-1.5 rounded-lg bg-slate-900 text-slate-300 text-xs font-bold border border-slate-800">
                    {section.secondaryCtaText || "Rent / Lease"}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold" style={{ color: "#f59e0b" }}>
                  PLOTSNHOMES PORTAL
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                    Bedrooms
                  </label>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 font-medium">
                    Any Bedrooms
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                    Search Property
                  </label>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-400 font-medium truncate">
                    🔍 Property name, symbol ID...
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                    Category
                  </label>
                  <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 font-medium">
                    All Categories
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button className="px-6 py-2.5 rounded-xl bg-gold text-slate-950 font-extrabold text-xs shadow-md">
                    🔍 Search Properties
                  </button>
                  <button className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-400 font-bold text-xs border border-slate-800">
                    Clear
                  </button>
                </div>
                <span className="text-[11px] font-bold text-gold cursor-pointer" style={{ color: "#f59e0b" }}>
                  ▼ SHOW ADVANCED FILTERS
                </span>
              </div>
            </div>
          </div>
        </section>
      );
    }

    case "text": {
      return (
        <section className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-4 shadow-sm">
          {section.title && (
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
              {section.title}
            </h2>
          )}
          {section.subtitle && (
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 font-medium">
              {section.subtitle}
            </p>
          )}
          <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {section.content || "Add your rich article or descriptive content here..."}
          </div>
        </section>
      );
    }

    case "features": {
      const cols = section.columns || 3;
      const gridCols =
        cols === 2
          ? "sm:grid-cols-2"
          : cols === 4
          ? "sm:grid-cols-2 lg:grid-cols-4"
          : "sm:grid-cols-2 lg:grid-cols-3";

      return (
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 my-4 space-y-8 text-white shadow-xl">
          {(section.title || section.subtitle) && (
            <div className="text-center max-w-2xl mx-auto space-y-2">
              {section.title && (
                <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: "#ffffff" }}>
                  {section.title}
                </h2>
              )}
              {section.subtitle && (
                <p className="text-xs font-bold text-gold tracking-widest uppercase" style={{ color: "#f59e0b" }}>
                  {section.subtitle}
                </p>
              )}
            </div>
          )}

          <div className={`grid gap-6 ${gridCols}`}>
            {(section.items || []).map((item) => {
              const IconComponent = (item.icon && ICON_MAP[item.icon]) || Sparkles;
              return (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-md hover:border-gold/40 transition-all space-y-3"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-gold">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-base" style={{ color: "#ffffff" }}>{item.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#cbd5e1" }}>
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    case "properties": {
      return (
        <section className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-4 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gold-dark dark:text-gold flex items-center gap-1.5 mb-1">
                <Building2 className="h-4 w-4" />
                Featured Listings
              </span>
              <h2 className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {section.title || "Handpicked Properties & Plots"}
              </h2>
            </div>
            <Link
              href="/admin/properties"
              className="text-xs font-bold text-gold-dark hover:underline flex items-center gap-1"
            >
              View All Properties <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                id: "p1",
                symbol: "PLT-01",
                title: "Premium Villa Plot in Super Corridor",
                location: "Super Corridor, Indore",
                price: "₹45.00 Lakhs",
                type: "RESIDENTIAL",
                badge: "RERA Approved",
              },
              {
                id: "p2",
                symbol: "VLA-09",
                title: "4BHK Luxury Smart Villa",
                location: "Vijay Nagar, Indore",
                price: "₹1.25 Crore",
                type: "RESIDENTIAL",
                badge: "New Launch",
              },
              {
                id: "p3",
                symbol: "COM-04",
                title: "High-Yield Retail Shop Unit",
                location: "AB Road Commercial Zone",
                price: "₹85.00 Lakhs",
                type: "COMMERCIAL",
                badge: "High ROI",
              },
            ].map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 overflow-hidden shadow-sm hover:shadow-md transition"
              >
                <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-gold">{p.symbol}</span>
                  <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold border border-gold/30">
                    {p.badge}
                  </span>
                </div>
                <div className="p-5 space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{p.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {p.location}
                  </p>
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">{p.price}</span>
                    <Link
                      href="/admin/properties"
                      className="px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-dark text-slate-950 text-xs font-bold transition"
                    >
                      Inquire
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "cta": {
      return (
        <section
          className="p-8 sm:p-12 rounded-3xl my-4 text-white text-center shadow-xl border border-slate-800 space-y-4"
          style={{ background: section.bgGradient || "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider border border-gold/30">
            <Sparkles className="h-3.5 w-3.5" />
            Take Action Today
          </span>
          <h2 className="font-sans text-2xl sm:text-4xl font-extrabold tracking-tight" style={{ color: "#ffffff" }}>
            {section.title || "Ready to Invest?"}
          </h2>
          {section.subtitle && (
            <p className="text-sm sm:text-base max-w-xl mx-auto leading-relaxed" style={{ color: "#cbd5e1" }}>
              {section.subtitle}
            </p>
          )}
          {section.ctaText && (
            <div className="pt-2">
              <Link
                href={section.ctaLink || "#"}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gold hover:bg-gold-dark text-slate-950 text-sm font-extrabold shadow-lg transition-all cursor-pointer"
              >
                <span>{section.ctaText}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      );
    }

    case "faq": {
      return (
        <section className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-4 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
              <HelpCircle className="h-3.5 w-3.5" />
              Got Questions?
            </span>
            <h2 className="font-sans text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {section.title || "Frequently Asked Questions"}
            </h2>
            {section.subtitle && (
              <p className="text-slate-500 dark:text-slate-400 text-sm">{section.subtitle}</p>
            )}
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {(section.items || []).map((item) => {
              const isOpen = openFaq[item.id];
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-950/40"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(item.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-center justify-between font-bold text-slate-900 dark:text-white text-sm sm:text-base hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                  >
                    <span>{item.title}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-gold-dark" : "text-slate-400"
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
                      {item.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    case "testimonials": {
      const itemsList = section.items && section.items.length > 0
        ? section.items
        : [
            {
              id: "t1",
              title: "Smooth Plot Purchase",
              description: "Bought a 2400 sqft plot in Super Corridor. Title verification was seamless and verified by their legal team.",
              author: "Vikram Mehta",
              role: "Investor",
            },
            {
              id: "t2",
              title: "Transparent Valuation",
              description: "The price history and yield calculator helped us select the highest growth area in Indore.",
              author: "Ananya Sharma",
              role: "Homebuyer",
            },
            {
              id: "t3",
              title: "Exceptional Service",
              description: "Site visits were arranged within hours. Great guidance on pre-approval loan process.",
              author: "Rajesh Khandelwal",
              role: "Commercial Buyer",
            },
          ];

      const maxIdx = Math.max(0, itemsList.length - 3);

      return (
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white my-4 space-y-6 shadow-xl overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider">
                <Star className="h-3.5 w-3.5 fill-gold" />
                Client Reviews
              </span>
              <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight">
                {section.title || "What Investors & Buyers Say"}
              </h2>
            </div>

            {itemsList.length > 3 && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setTestimonialSlide((prev) => (prev > 0 ? prev - 1 : maxIdx))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-white hover:border-gold hover:bg-gold hover:text-slate-950 transition cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTestimonialSlide((prev) => (prev < maxIdx ? prev + 1 : 0))}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-white hover:border-gold hover:bg-gold hover:text-slate-950 transition cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="overflow-hidden py-1">
            <div
              className="flex transition-transform duration-500 ease-out gap-6"
              style={{
                transform: `translateX(calc(-${testimonialSlide} * (33.333% + 16px)))`,
              }}
            >
              {itemsList.map((t, idx) => (
                <div
                  key={t.id || idx}
                  className="w-full sm:w-[calc(33.333%-16px)] shrink-0 p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex text-gold gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-gold" />
                      ))}
                    </div>
                    <p className="text-xs text-slate-300 italic leading-relaxed">"{t.description}"</p>
                  </div>
                  <div className="pt-2 border-t border-slate-700">
                    <p className="text-xs font-bold text-white">{t.author || t.title}</p>
                    <p className="text-[11px] text-slate-400">{t.role || "Client"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    case "stats": {
      return (
        <section className="p-8 rounded-3xl bg-slate-900 text-white my-4 border border-slate-800 shadow-lg">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {(section.items || []).map((st) => (
              <div key={st.id} className="p-4 space-y-1">
                <p className="font-mono text-3xl sm:text-4xl font-extrabold text-gold">
                  {st.statValue || "100+"}
                </p>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                  {st.statLabel || st.title}
                </p>
                {st.description && <p className="text-[11px] text-slate-400">{st.description}</p>}
              </div>
            ))}
          </div>
        </section>
      );
    }

    case "gallery": {
      return (
        <section className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-4 space-y-6">
          {section.title && (
            <h2 className="font-sans text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {section.title}
            </h2>
          )}
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
            {section.bgImage ? (
              <img src={section.bgImage} alt={section.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-6 text-slate-400 text-xs">
                <Globe className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <span>Media Gallery Container</span>
              </div>
            )}
          </div>
        </section>
      );
    }

    case "rawHtml": {
      return (
        <section className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-4 overflow-hidden">
          {section.rawCode ? (
            <div dangerouslySetInnerHTML={{ __html: section.rawCode }} />
          ) : (
            <div className="p-8 text-center text-xs font-mono text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
              [Raw HTML / Embed Widget Box]
            </div>
          )}
        </section>
      );
    }

    default:
      return null;
  }
}
