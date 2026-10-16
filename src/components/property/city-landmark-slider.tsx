"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export interface CitySlide {
  area: string;
  count: number;
  imageUrl: string;
}

const AREA_FALLBACK_IMAGES: Record<string, string> = {
  "downtown": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
  "marina": "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=80",
  "business bay": "https://images.unsplash.com/photo-1546412414-8035e1776c9a?auto=format&fit=crop&w=1600&q=80",
  "dubai hills estate": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80",
  "palm jumeirah": "https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?auto=format&fit=crop&w=1600&q=80",
  "al furjan": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
  "jumeirah": "https://images.unsplash.com/photo-1549294413-26f195afcbce?auto=format&fit=crop&w=1600&q=80",
  "difc": "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1600&q=80",
};

const GENERIC_FALLBACK_IMAGE = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80";

function isValidImageURL(url: string | null | undefined): boolean {
  if (!url) return false;
  const cleaned = url.trim().toLowerCase();
  if (
    cleaned.includes("google.com/search") ||
    cleaned.includes("istockphoto.com") ||
    cleaned.includes("dubai.it") ||
    cleaned.includes("/things-to-do")
  ) return false;
  if (cleaned.startsWith("/") || cleaned.startsWith(".")) return true;
  if (cleaned.includes("images.unsplash.com") || cleaned.includes("cloudinary.com")) return true;
  const pathWithoutQuery = cleaned.split("?")[0];
  if (
    pathWithoutQuery.endsWith(".jpg") ||
    pathWithoutQuery.endsWith(".jpeg") ||
    pathWithoutQuery.endsWith(".png") ||
    pathWithoutQuery.endsWith(".webp") ||
    pathWithoutQuery.endsWith(".gif") ||
    pathWithoutQuery.endsWith(".svg")
  ) return true;
  return false;
}

function getSlideImage(slide: CitySlide) {
  if (isValidImageURL(slide.imageUrl)) return slide.imageUrl;
  const key = slide.area.toLowerCase().trim();
  return AREA_FALLBACK_IMAGES[key] || GENERIC_FALLBACK_IMAGE;
}

export function CityLandmarkSlider({
  slides,
  intervalMs = 4500,
}: {
  slides: CitySlide[];
  intervalMs?: number;
}) {
  const usable = slides.filter((s) => s.area);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drag/swipe state
  const dragStartX = useRef<number | null>(null);
  const isDragging = useRef(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const advance = useCallback(() => {
    setIndex((i) => (usable.length ? (i + 1) % usable.length : 0));
  }, [usable.length]);

  const prev = useCallback(() => {
    setIndex((i) => (usable.length ? (i - 1 + usable.length) % usable.length : 0));
  }, [usable.length]);

  useEffect(() => {
    if (paused || usable.length <= 1) return;
    timerRef.current = setInterval(advance, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, advance, intervalMs, usable.length]);

  if (usable.length === 0) return null;

  const current = usable[index];
  const resolvedImg = getSlideImage(current);

  // Build a looped display: show 5 cards (prev-prev, prev, active, next, next-next)
  const getWrapped = (offset: number) =>
    usable[(index + offset + usable.length * 10) % usable.length];

  const displayCards = usable.length >= 3
    ? [
        { slide: getWrapped(-2), offset: -2 },
        { slide: getWrapped(-1), offset: -1 },
        { slide: getWrapped(0), offset: 0 },
        { slide: getWrapped(1), offset: 1 },
        { slide: getWrapped(2), offset: 2 },
      ]
    : usable.length === 2
    ? [
        { slide: getWrapped(-1), offset: -1 },
        { slide: getWrapped(0), offset: 0 },
        { slide: getWrapped(1), offset: 1 },
      ]
    : [{ slide: getWrapped(0), offset: 0 }];

  // Position/scale/opacity based on offset from center
  function cardStyles(offset: number) {
    const abs = Math.abs(offset);
    if (abs === 0) {
      return {
        zIndex: 30,
        transform: "translateX(0%) scale(1)",
        opacity: 1,
        pointerEvents: "auto" as const,
        filter: "brightness(1)",
      };
    }
    if (abs === 1) {
      const dir = offset < 0 ? -1 : 1;
      return {
        zIndex: 20,
        transform: `translateX(${dir * 70}%) scale(0.82)`,
        opacity: 0.75,
        pointerEvents: "auto" as const,
        filter: "brightness(0.6)",
      };
    }
    // abs === 2
    const dir = offset < 0 ? -1 : 1;
    return {
      zIndex: 10,
      transform: `translateX(${dir * 118}%) scale(0.65)`,
      opacity: 0.35,
      pointerEvents: "none" as const,
      filter: "brightness(0.4)",
    };
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-slate-950 py-16 text-white border-t border-white/5"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Cities we operate in"
    >
      {/* Top Divider Separator */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold/50 to-transparent z-20" />

      {/* Immersive Crossfading Background Image */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.area}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.75, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full"
          >
            <img
              src={resolvedImg}
              alt=""
              className="h-full w-full object-cover blur-[5px] brightness-[0.5]"
            />
          </motion.div>
        </AnimatePresence>
        {/* Shadow overlays for smooth edge transitions */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-transparent to-slate-950/90" />
      </div>

      {/* Section heading */}
      <div className="relative z-10 text-center mb-8 px-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Our Portfolio</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
          Explore Prime Locations
        </h2>
        <p className="mt-2 text-slate-300 text-sm max-w-md mx-auto">
          Browse our curated collection of premium real estate across sought-after areas.
        </p>
      </div>

      {/* Card track */}
      <div
        className={`relative z-10 mx-auto flex items-center justify-center ${
          isMouseDown ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{ height: "420px", maxWidth: "900px" }}
        onMouseDown={(e) => {
          dragStartX.current = e.clientX;
          isDragging.current = false;
          setIsMouseDown(true);
        }}
        onMouseMove={(e) => {
          if (dragStartX.current !== null && Math.abs(e.clientX - dragStartX.current) > 5) {
            isDragging.current = true;
          }
        }}
        onMouseUp={(e) => {
          if (dragStartX.current !== null) {
            const delta = e.clientX - dragStartX.current;
            if (Math.abs(delta) > 40) {
              delta < 0 ? advance() : prev();
            }
            dragStartX.current = null;
          }
          setIsMouseDown(false);
        }}
        onMouseLeave={() => {
          setPaused(false);
          setIsMouseDown(false);
        }}
        onTouchStart={(e) => {
          dragStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (dragStartX.current !== null) {
            const delta = e.changedTouches[0].clientX - dragStartX.current;
            if (Math.abs(delta) > 40) {
              delta < 0 ? advance() : prev();
            }
            dragStartX.current = null;
          }
        }}
      >
        {displayCards.map(({ slide, offset }) => {
          const img = getSlideImage(slide);
          const styles = cardStyles(offset);
          const isActive = offset === 0;
          return (
            <div
              key={slide.area + offset}
              className="absolute group select-none"
              style={{
                width: "360px",
                height: "400px",
                borderRadius: "20px",
                overflow: "hidden",
                transition: "all 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: isActive ? (isMouseDown ? "grabbing" : "grab") : "pointer",
                willChange: "transform, opacity",
                ...styles,
              }}
              onClick={() => {
                if (!isDragging.current && !isActive) {
                  setIndex((i) => (usable.length ? (i + offset + usable.length) % usable.length : 0));
                }
              }}
            >
              {/* Background image */}
              <img
                src={img}
                alt={slide.area}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                draggable={false}
                style={{ filter: styles.filter }}
              />

              {/* Dark gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: isActive
                    ? "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.15) 100%)"
                    : "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.2) 100%)",
                  transition: "background 0.55s ease",
                }}
              />

              {/* Content — only fully shown on active card */}
              <div
                className="absolute inset-0 flex flex-col justify-end p-7"
                style={{
                  transition: "opacity 0.4s ease",
                  opacity: isActive ? 1 : 0.4,
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold mb-1.5">
                  Our Portfolio
                </p>
                <h3 className="font-display text-3xl sm:text-4xl font-bold text-white leading-tight">
                  {slide.area}
                </h3>
                <p className="mt-1.5 text-sm text-slate-200/80">
                  {slide.count} {slide.count === 1 ? "listing" : "listings"} available
                </p>

                {isActive && (
                  <Link
                    href={`/properties?area=${encodeURIComponent(slide.area)}`}
                    className="group mt-5 inline-flex w-fit items-center gap-2.5 rounded-full bg-[#C9A94B] px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg transition-all duration-300 hover:bg-[#b5932e] hover:scale-[1.04] active:scale-[0.97]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>View Properties</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation arrows */}
      {usable.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-2 sm:left-8 top-1/2 z-40 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/50 text-white hover:text-slate-950 shadow-lg border border-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-gold hover:scale-115 active:scale-95 cursor-pointer"
            style={{ marginTop: "20px" }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={advance}
            aria-label="Next slide"
            className="absolute right-2 sm:right-8 top-1/2 z-40 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/50 text-white hover:text-slate-950 shadow-lg border border-white/10 backdrop-blur-sm transition-all duration-200 hover:bg-gold hover:scale-115 active:scale-95 cursor-pointer"
            style={{ marginTop: "20px" }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {usable.length > 1 && (
        <div className="relative z-10 mt-6 flex justify-center gap-2">
          {usable.map((s, i) => (
            <button
              key={s.area + i}
              onClick={() => setIndex(i)}
              aria-label={`Show ${s.area}`}
              className="transition-all duration-300"
              style={{
                height: "6px",
                borderRadius: "3px",
                background: i === index ? "#C9A94B" : "#CBD5E1",
                width: i === index ? "32px" : "6px",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
