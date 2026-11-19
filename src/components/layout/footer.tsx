"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Shield, TrendingUp, Wallet, Globe } from "lucide-react";
import { DEFAULT_FOOTER_SETTINGS, FooterSettings } from "@/lib/webpage-editor-store";
import { BrandLogo } from "@/components/ui/brand-logo";

function isDeadPaymentLink(label?: string, url?: string) {
  const text = `${label || ""} ${url || ""}`.toLowerCase();
  return text.includes("payment option") || text.includes("#payments");
}

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

  const columns = useMemo(
    () =>
      (footer.columns || [])
        .map((col) => ({
          ...col,
          links: (col.links || []).filter((link) => !isDeadPaymentLink(link.label, link.url)),
        }))
        .filter((col) => col.links.length > 0),
    [footer.columns],
  );

  const badges = useMemo(
    () =>
      (footer.badges || []).map((badge) =>
        badge.url?.includes("#payments") ? { ...badge, url: "/#get-in-touch" } : badge,
      ),
    [footer.badges],
  );

  return (
    <footer className="bg-[#f7f6f2] font-sans text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(240px,320px)_1fr] lg:gap-16">
          <div>
            <BrandLogo
              brandName={footer.brandName || "PlotsnHomes"}
              iconClassName="border-transparent bg-[#2563EB] text-white shadow-none"
              textClassName="text-slate-950"
            />
            {footer.boilerplateText && (
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-600">
                {footer.boilerplateText}
              </p>
            )}

            {badges.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {badges.map((badge, idx) => (
                  <Link
                    key={badge.id || idx}
                    href={badge.url || "#"}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-[#2563EB]"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2563EB] text-white">
                      {idx === 0 ? <Shield className="h-3 w-3" /> : idx === 1 ? <TrendingUp className="h-3 w-3" /> : <Wallet className="h-3 w-3" />}
                    </span>
                    {badge.label}
                  </Link>
                ))}
              </div>
            )}

            {footer.socialLinks && footer.socialLinks.length > 0 && (
              <div className="mt-5 flex gap-2">
                {footer.socialLinks.map((s) => {
                  const platformLower = (s.platform || "").toLowerCase();
                  return (
                    <a
                      key={s.id}
                      href={s.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-transparent hover:bg-[#2563EB] hover:text-white"
                      aria-label={s.platform}
                    >
                      {platformLower.includes("twitter") || platformLower === "x" || platformLower.includes("x.com") ? (
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

          {columns.length > 0 && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
              {columns.map((col) => (
                <div key={col.id}>
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-950">
                    {col.columnTitle}
                  </h4>
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {col.links.map((link) => (
                      <li key={link.id}>
                        <Link href={link.url || "#"} className="leading-snug transition hover:text-slate-950">
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

      <div className="border-t border-slate-200/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>{footer.copyrightText || "© 2026 PlotsnHomes Pvt. Ltd."}</p>
          <p className="max-w-xl sm:text-right">
            {footer.disclaimerText || footer.poweredByText || "Investment in real estate is subject to market risks. Read all documents carefully."}
          </p>
        </div>
      </div>
    </footer>
  );
}
