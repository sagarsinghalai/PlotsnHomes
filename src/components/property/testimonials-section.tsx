"use client";

import { useState } from "react";
import { Star, CheckCircle, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { TestimonialsConfig } from "@/lib/site-settings";

const DEFAULT_TESTIMONIALS = [
  {
    id: "1",
    name: "Rohan Sharma",
    role: "Senior Software Engineer",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
    rating: 5,
    text: "PlotsnHomes made it possible for me to invest in prime office spaces in Business Bay with just ₹1 Lac. The monthly rental payouts arrive in my wallet without fail. Brilliant UX!",
    investmentAmount: "₹2,50,000",
    portfolioSize: "3 Properties"
  },
  {
    id: "2",
    name: "Priya Patel",
    role: "Management Consultant",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
    rating: 5,
    text: "I was skeptical about fractional ownership, but the transparency and KYC process cleared all doubts. I own fractions of two luxury residential apartments in Marina and Downtown. 10/10 service.",
    investmentAmount: "₹5,00,000",
    portfolioSize: "2 Properties"
  },
  {
    id: "3",
    name: "Vikram Malhotra",
    role: "Business Owner",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
    rating: 5,
    text: "Selling shares on the secondary marketplace is incredibly fast. I exited one of my assets in under 24 hours to secure capital gains. The liquidity feature is a game-changer.",
    investmentAmount: "₹12,00,000",
    portfolioSize: "5 Properties"
  }
];

export function TestimonialsSection({
  testimonialsConfig
}: {
  testimonialsConfig?: TestimonialsConfig;
}) {
  const items = testimonialsConfig?.items && testimonialsConfig.items.length > 0 
    ? testimonialsConfig.items 
    : DEFAULT_TESTIMONIALS;

  const googleUrl = testimonialsConfig?.googleReviewUrl || "https://g.page/r/plotsnhomes/review";

  const [currentIndex, setCurrentIndex] = useState(0);

  // Maximum starting index so exactly 3 cards remain in view at the end
  const maxIndex = Math.max(0, items.length - 3);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
  };

  return (
    <section className="relative bg-white py-20 border-t border-slate-100 overflow-hidden">
      {/* Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a03_1px,transparent_1px),linear-gradient(to_bottom,#0f172a03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold text-gold-dark tracking-widest uppercase mb-2">INVESTOR VOICES</p>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-950 leading-tight">
              Trusted by 5,00,000+ Smart Investors
            </h2>
            <p className="mt-3 text-slate-500 text-sm sm:text-base leading-relaxed">
              See how our co-owners are building wealth through transparent, high-yield fractional real estate investments.
            </p>

            {/* Google Review External Link Button */}
            {googleUrl && (
              <div className="mt-4 inline-flex items-center gap-2">
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm transition-all hover:scale-[1.03]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Read Verified Google Reviews</span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </a>
              </div>
            )}
          </div>

          {/* Slider Controls (Shown when more than 3 items exist) */}
          {items.length > 3 && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={prevSlide}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-gold hover:bg-gold hover:text-slate-950 transition-all cursor-pointer active:scale-95"
                title="Previous Reviews"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-gold hover:bg-gold hover:text-slate-950 transition-all cursor-pointer active:scale-95"
                title="Next Reviews"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Carousel Container */}
        <div className="overflow-hidden py-2">
          <div
            className="flex transition-transform duration-500 ease-out gap-6"
            style={{
              transform: `translateX(calc(-${currentIndex} * (33.333% + 16px)))`,
            }}
          >
            {items.map((t, idx) => (
              <div
                key={t.id || idx}
                className="w-full md:w-[calc(33.333%-16px)] shrink-0 group relative bg-white border border-slate-100 hover:border-gold/30 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-lg shadow-slate-100"
              >
                <div>
                  {/* Star rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="h-4.5 w-4.5 fill-gold text-gold" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-slate-600 text-sm leading-relaxed mb-6 italic">
                    "{t.text}"
                  </p>
                </div>

                {/* Author & Stats info */}
                <div className="border-t border-slate-100 pt-6 mt-auto">
                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={t.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80"}
                      alt={t.name}
                      className="h-11 w-11 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-sm">{t.name}</span>
                        <CheckCircle className="h-4 w-4 text-emerald-500 fill-emerald-50" />
                      </div>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                  </div>

                  {/* Financial details */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Invested</span>
                      <span className="font-bold text-slate-800 text-xs mt-0.5 block">{t.investmentAmount}</span>
                    </div>
                    <div className="border-l border-slate-200">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Portfolio</span>
                      <span className="font-bold text-slate-800 text-xs mt-0.5 block">{t.portfolioSize}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots indicator when more than 3 items exist */}
        {items.length > 3 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setCurrentIndex(dotIdx)}
                className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === dotIdx ? "w-8 bg-gold" : "w-2.5 bg-slate-200 hover:bg-slate-300"
                }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
