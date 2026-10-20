"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Expand, Images, Download } from "lucide-react";

/**
 * Premium project gallery: a large featured image with a centered row of
 * square thumbnails below. Clicking a thumbnail swaps the hero; clicking the
 * hero opens a full-screen lightbox with keyboard / arrow navigation.
 */
export function ProjectGallery({ images, title }: { images: string[]; title: string }) {
  const list = images.filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const go = useCallback(
    (delta: number) => setIdx((i) => (i + delta + list.length) % list.length),
    [list.length]
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, go]);

  if (list.length === 0) return null;

  return (
    <div>
      {/* Featured image */}
      <div
        className="group relative aspect-[16/9] cursor-zoom-in overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200"
        onClick={() => setLightbox(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={idx}
          src={list[idx]}
          alt={`${title} — photo ${idx + 1}`}
          className="h-full w-full animate-in fade-in duration-500 object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

        {list.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow-md opacity-0 transition hover:bg-white group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(e) => { e.stopPropagation(); go(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow-md opacity-0 transition hover:bg-white group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <Images className="h-3.5 w-3.5" /> {idx + 1} / {list.length}
        </span>
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700 opacity-0 transition group-hover:opacity-100">
          <Expand className="h-3.5 w-3.5" /> View
        </span>
      </div>

      {/* Thumbnail row (centered, like the reference) */}
      {list.length > 1 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2.5 sm:gap-3">
          {list.map((src, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl transition sm:h-20 sm:w-24 ${
                i === idx
                  ? "ring-2 ring-brand ring-offset-2"
                  : "opacity-70 ring-1 ring-slate-200 hover:opacity-100 hover:ring-slate-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photo gallery`}
          onClick={() => setLightbox(false)}
        >
          <div className="flex items-center justify-between px-5 py-4 text-white/90">
            <span className="text-sm font-semibold">{title}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm tabular-nums text-white/70">{idx + 1} / {list.length}</span>
              <a
                href={list[idx]}
                download
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Download photo"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <Download className="h-4 w-4" /> Download
              </a>
              <button type="button" aria-label="Close" onClick={() => setLightbox(false)} className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4 pb-4" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={idx} src={list[idx]} alt={`${title} — photo ${idx + 1}`} className="max-h-full max-w-full rounded-lg object-contain animate-in fade-in duration-300" />
            {list.length > 1 && (
              <>
                <button type="button" aria-label="Previous" onClick={() => go(-1)} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button type="button" aria-label="Next" onClick={() => go(1)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>

          {list.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto px-4 py-4" onClick={(e) => e.stopPropagation()}>
              {list.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Photo ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg transition ${i === idx ? "ring-2 ring-white" : "opacity-50 hover:opacity-90"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
