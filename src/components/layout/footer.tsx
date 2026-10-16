"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Shield, TrendingUp, Wallet, Globe } from "lucide-react";
import { DEFAULT_FOOTER_SETTINGS, FooterSettings } from "@/lib/webpage-editor-store";

export function Footer() {
  const [footer, setFooter] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);

  useEffect(() => {
    fetch("/api/admin/webpage-editor/footer?t=" + Date.now(), { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.footer) setFooter(data.footer);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/60 font-sans">
      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 justify-between">
          {/* Brand column — Left side */}
          <div className="w-full lg:w-[36%] space-y-4 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-bold text-white">
              <Building2 className="h-6 w-6 text-gold" />
              {footer.brandName || "PlotsnHomes"}
            </Link>
            
            {footer.boilerplateText && (
              <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
                {footer.boilerplateText}
              </p>
            )}
            
            {/* Trust badges */}
            {footer.badges && footer.badges.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-1">
                {footer.badges.map((b, idx) => (
                  <Link
                    key={b.id || idx}
                    href={b.url || "#"}
                    className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-all duration-300 hover:border-gold/40 hover:bg-slate-800/80 hover:text-gold"
                  >
                    <span className="text-gold">
                      {idx === 0 ? <Shield className="h-3.5 w-3.5" /> : idx === 1 ? <TrendingUp className="h-3.5 w-3.5" /> : <Wallet className="h-3.5 w-3.5" />}
                    </span>
                    {b.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Social Media Links */}
            {footer.socialLinks && footer.socialLinks.length > 0 && (
              <div className="flex gap-3 pt-2">
                {footer.socialLinks.map((s) => {
                  const platformLower = (s.platform || "").toLowerCase();
                  return (
                    <a
                      key={s.id}
                      href={s.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/60 text-slate-400 transition-all duration-300 hover:border-gold hover:text-gold hover:scale-110"
                      aria-label={s.platform}
                    >
                      {platformLower.includes("twitter") || platformLower.includes("x") ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      ) : platformLower.includes("linkedin") ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
                        </svg>
                      ) : platformLower.includes("instagram") ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                        </svg>
                      ) : platformLower.includes("youtube") ? (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.52 3.5 12 3.5 12 3.5s-7.52 0-9.388.555A3.002 3.002 0 0 0 .502 6.163C0 8.03 0 12 0 12s0 3.97.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.48 20.5 12 20.5 12 20.5s7.52 0 9.388-.555a3.002 3.002 0 0 0 2.11-2.108C24 15.97 24 12 24 12s0-3.97-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Columns — Right side (INVEST, ACCOUNT, COMPANY, TEST, etc.) */}
          {footer.columns && footer.columns.length > 0 && (
            <div
              className="w-full lg:w-[60%] grid gap-6 min-w-0"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, footer.columns.length)}, minmax(0, 1fr))`,
              }}
            >
              {footer.columns.map((col) => (
                <div key={col.id} className="min-w-0 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-4 truncate">{col.columnTitle}</h4>
                  <ul className="space-y-2.5 text-sm">
                    {col.links && col.links.map((link) => (
                      <li key={link.id} className="truncate">
                        <Link href={link.url || "#"} className="transition hover:text-white">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {footer.copyrightText || "© 2026 PlotsnHomes Pvt. Ltd. · CIN: U70200DL2024PTC000001"}
          </p>
          <p className="text-xs text-slate-600">
            {footer.disclaimerText || footer.poweredByText || "Investment in real estate is subject to market risks. Read all documents carefully."}
          </p>
        </div>
      </div>
    </footer>
  );
}
