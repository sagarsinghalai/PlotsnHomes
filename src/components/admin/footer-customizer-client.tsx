"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Plus,
  Save,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  FooterBadge,
  FooterSettings,
  NavItemLink,
} from "@/lib/webpage-editor-store";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export function FooterCustomizerClient({ initialFooter }: { initialFooter: FooterSettings }) {
  const [footer, setFooter] = useState<FooterSettings>(initialFooter);
  const [activeTab, setActiveTab] = useState<"description" | "social" | "columns" | "copyright">("description");
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  }

  async function handleSaveFooter() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/webpage-editor/footer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(footer),
      });

      setSaving(false);
      if (res.ok) {
        showToast("Footer settings saved & updated in real-time across the frontend!");
      }
    } catch {
      setSaving(false);
    }
  }

  // Section 1 Helpers: Badges
  function addBadge() {
    const newBadge: FooterBadge = {
      id: `bdg-${Date.now()}`,
      label: "New Trust Badge",
      url: "/properties",
    };
    setFooter({ ...footer, badges: [...(footer.badges || []), newBadge] });
    showToast("Added new trust badge");
  }

  function deleteBadge(id: string) {
    setFooter({
      ...footer,
      badges: (footer.badges || []).filter((b) => b.id !== id),
    });
  }

  // Section 2 Helpers: Social Links
  function addSocialLink() {
    const newSocial = {
      id: `soc-${Date.now()}`,
      platform: "Twitter / X",
      url: "https://twitter.com",
      icon: "Send",
    };
    setFooter({ ...footer, socialLinks: [...footer.socialLinks, newSocial] });
    showToast("Added social link");
  }

  function deleteSocialLink(id: string) {
    setFooter({
      ...footer,
      socialLinks: footer.socialLinks.filter((s) => s.id !== id),
    });
  }

  // Section 3 Helpers: Nav Columns & Links
  function addColumn() {
    const newCol = {
      id: `fc-${Date.now()}`,
      columnTitle: "NEW COLUMN",
      links: [
        { id: `fl-${Date.now()}-1`, label: "Sample Page Link", url: "/properties", order: 1 },
      ],
    };
    setFooter({ ...footer, columns: [...footer.columns, newCol] });
    showToast("Added new footer column");
  }

  function deleteColumn(colId: string) {
    setFooter({ ...footer, columns: footer.columns.filter((c) => c.id !== colId) });
  }

  function addLinkToColumn(colId: string) {
    const updated = footer.columns.map((c) => {
      if (c.id === colId) {
        return {
          ...c,
          links: [
            ...c.links,
            { id: `fl-${Date.now()}`, label: "New Page Link", url: "/properties", order: c.links.length + 1 },
          ],
        };
      }
      return c;
    });
    setFooter({ ...footer, columns: updated });
    showToast("Added new link to column");
  }

  function deleteLinkFromColumn(colId: string, linkId: string) {
    const updated = footer.columns.map((c) => {
      if (c.id === colId) {
        return { ...c, links: c.links.filter((l) => l.id !== linkId) };
      }
      return c;
    });
    setFooter({ ...footer, columns: updated });
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-2xl text-xs font-semibold border border-brand/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="h-4 w-4 text-brand" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with inline Save Button */}
      <AdminPageHeader
        title="Footer Customizer"
        description="Customize brand tagline, social media links, navigation columns (INVEST, ACCOUNT, COMPANY), and legal notices."
        breadcrumb={[
          { label: "ADMIN", href: "/admin" },
          { label: "SETTINGS", href: "/admin/settings" },
          { label: "FOOTER" },
        ]}
        actions={
          <button
            type="button"
            onClick={handleSaveFooter}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold shadow-sm transition cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Save Footer Changes</span>
          </button>
        }
      />

      {/* REAL-TIME LIVE FOOTER PREVIEW BOX MATCHING SCREENSHOT 1 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-brand-hover" />
            REAL-TIME LIVE RENDERED FOOTER PREVIEW
          </span>
          <span className="text-[11px] text-slate-400">Updates live as you edit controls below</span>
        </div>

        <footer className="bg-[#030712] text-slate-300 rounded-3xl p-8 border border-slate-800/80 shadow-2xl space-y-8 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 justify-between">
            {/* Brand Column — Left side */}
            <div className="w-full lg:w-[36%] space-y-4 shrink-0">
              <div className="flex items-center gap-2.5 font-display text-xl font-bold" style={{ color: "#ffffff" }}>
                <Building2 className="h-6 w-6 text-brand" />
                <span style={{ color: "#ffffff" }}>{footer.brandName || "PlotsnHomes"}</span>
              </div>

              <p className="text-xs leading-relaxed max-w-sm font-medium" style={{ color: "#e2e8f0" }}>
                {footer.boilerplateText || "India's premier fractional real estate investment platform. Own verified property shares from ₹40,000. Earn rental income monthly."}
              </p>

              {/* Trust Badges */}
              {footer.badges && footer.badges.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {footer.badges.map((b, idx) => (
                    <span
                      key={b.id || idx}
                      className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 text-[11px] font-medium"
                      style={{ color: "#e2e8f0" }}
                    >
                      <span className="text-brand">
                        {idx === 0 ? <Shield className="h-3.5 w-3.5" /> : idx === 1 ? <TrendingUp className="h-3.5 w-3.5" /> : <Wallet className="h-3.5 w-3.5" />}
                      </span>
                      <span style={{ color: "#e2e8f0" }}>{b.label}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Social Media Links */}
              {footer.socialLinks && footer.socialLinks.length > 0 && (
                <div className="flex items-center gap-2.5 pt-2">
                  {footer.socialLinks.map((s) => {
                    const platLower = (s.platform || "").toLowerCase();
                    return (
                      <span
                        key={s.id}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-800 bg-slate-900/60"
                        style={{ color: "#e2e8f0" }}
                      >
                        {platLower.includes("twitter") || platLower.includes("x") ? (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                        ) : platLower.includes("linkedin") ? (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
                          </svg>
                        ) : platLower.includes("instagram") ? (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                          </svg>
                        ) : platLower.includes("youtube") ? (
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.52 3.5 12 3.5 12 3.5s-7.52 0-9.388.555A3.002 3.002 0 0 0 .502 6.163C0 8.03 0 12 0 12s0 3.97.502 5.837a3.003 3.003 0 0 0 2.11 2.108C4.48 20.5 12 20.5 12 20.5s7.52 0 9.388-.555a3.002 3.002 0 0 0 2.11-2.108C24 15.97 24 12 24 12s0-3.97-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                          </svg>
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Nav Columns — Right side (INVEST, ACCOUNT, COMPANY, TEST, etc.) */}
            {footer.columns && footer.columns.length > 0 && (
              <div
                className="w-full lg:w-[60%] grid gap-6 min-w-0"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(1, footer.columns.length)}, minmax(0, 1fr))`,
                }}
              >
                {footer.columns.map((col) => (
                  <div key={col.id} className="min-w-0 space-y-3">
                    <h4 className="font-extrabold text-xs uppercase tracking-widest truncate" style={{ color: "#ffffff" }}>
                      {col.columnTitle}
                    </h4>
                    <ul className="space-y-2 text-xs font-medium" style={{ color: "#cbd5e1" }}>
                      {col.links.map((link) => (
                        <li key={link.id} className="truncate">
                          <span className="hover:text-white cursor-pointer transition" style={{ color: "#cbd5e1" }}>
                            {link.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-800/80 pt-5 flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2" style={{ color: "#94a3b8" }}>
            <p style={{ color: "#94a3b8" }}>{footer.copyrightText || "© 2026 PlotsnHomes Pvt. Ltd. · CIN: U70200DL2024PTC000001"}</p>
            <p style={{ color: "#94a3b8" }}>{footer.disclaimerText || "Investment in real estate is subject to market risks. Read all documents carefully."}</p>
          </div>
        </footer>
      </div>

      {/* 4 EXACT EDITOR SECTIONS REQUESTED */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("description")}
            className={`pb-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition ${
              activeTab === "description"
                ? "border-brand-hover text-brand-hover"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            1. Brand &amp; Tagline Description
          </button>
          <button
            onClick={() => setActiveTab("social")}
            className={`pb-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition ${
              activeTab === "social"
                ? "border-brand-hover text-brand-hover"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            2. Social Links ({footer.socialLinks.length})
          </button>
          <button
            onClick={() => setActiveTab("columns")}
            className={`pb-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition ${
              activeTab === "columns"
                ? "border-brand-hover text-brand-hover"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            3. Nav Columns (INVEST, ACCOUNT, COMPANY) ({footer.columns.length})
          </button>
          <button
            onClick={() => setActiveTab("copyright")}
            className={`pb-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 whitespace-nowrap transition ${
              activeTab === "copyright"
                ? "border-brand-hover text-brand-hover"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            4. Copyright &amp; Legal Notice
          </button>
        </div>

        {/* SECTION 1: BRAND & TAGLINE DESCRIPTION SETTINGS */}
        {activeTab === "description" && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6 max-w-3xl">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-1">
                1st Section: Brand Name &amp; Description Text
              </h3>
              <p className="text-xs text-slate-500">
                Edit the main platform tagline and trust badges shown on the left of the footer.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Brand Name
              </label>
              <input
                type="text"
                value={footer.brandName}
                onChange={(e) => setFooter({ ...footer, brandName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-bold outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description Paragraph Text
              </label>
              <textarea
                rows={3}
                value={footer.boilerplateText}
                onChange={(e) => setFooter({ ...footer, boilerplateText: e.target.value })}
                placeholder="India's premium fractional real estate investment platform..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-xs font-medium outline-none focus:border-brand"
              />
            </div>

            {/* Trust Pill Badges */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Trust Pill Badges (SEBI Compliant, 8–14% Returns, Instant Withdrawal)
                </label>
                <button
                  type="button"
                  onClick={addBadge}
                  className="px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Badge
                </button>
              </div>

              <div className="space-y-2">
                {(footer.badges || []).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <input
                      type="text"
                      value={b.label}
                      onChange={(e) => {
                        const updated = (footer.badges || []).map((item) =>
                          item.id === b.id ? { ...item, label: e.target.value } : item
                        );
                        setFooter({ ...footer, badges: updated });
                      }}
                      placeholder="Badge Label (e.g. SEBI Compliant)"
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold outline-none"
                    />
                    <input
                      type="text"
                      value={b.url}
                      onChange={(e) => {
                        const updated = (footer.badges || []).map((item) =>
                          item.id === b.id ? { ...item, url: e.target.value } : item
                        );
                        setFooter({ ...footer, badges: updated });
                      }}
                      placeholder="Target Link URL (/properties)"
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 font-mono text-[11px] text-slate-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => deleteBadge(b.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: SOCIAL LINKS */}
        {activeTab === "social" && (
          <div className="space-y-4 max-w-3xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-0.5">
                  2nd Section: Social Links Editor
                </h3>
                <p className="text-xs text-slate-500">
                  Manage social links (X/Twitter, LinkedIn, Instagram, YouTube) with live links and options to add/delete.
                </p>
              </div>
              <button
                type="button"
                onClick={addSocialLink}
                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" /> Add Social Link
              </button>
            </div>

            <div className="space-y-2.5">
              {footer.socialLinks.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                >
                  <input
                    type="text"
                    value={s.platform}
                    onChange={(e) => {
                      const updated = footer.socialLinks.map((item) =>
                        item.id === s.id ? { ...item, platform: e.target.value } : item
                      );
                      setFooter({ ...footer, socialLinks: updated });
                    }}
                    placeholder="Platform Name (e.g. LinkedIn)"
                    className="w-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
                  />

                  <input
                    type="text"
                    value={s.url}
                    onChange={(e) => {
                      const updated = footer.socialLinks.map((item) =>
                        item.id === s.id ? { ...item, url: e.target.value } : item
                      );
                      setFooter({ ...footer, socialLinks: updated });
                    }}
                    placeholder="https://..."
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => deleteSocialLink(s.id)}
                    className="text-rose-500 hover:text-rose-700 p-1 shrink-0"
                    title="Delete Social Link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: NAVIGATION COLUMNS (INVEST, ACCOUNT, COMPANY) */}
        {activeTab === "columns" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-0.5">
                  3rd Section: Navigation Columns &amp; Clickable Links
                </h3>
                <p className="text-xs text-slate-500">
                  Manage INVEST, ACCOUNT, COMPANY columns. All added page links automatically become live clickable links on the frontend.
                </p>
              </div>
              <button
                type="button"
                onClick={addColumn}
                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" /> Add Column
              </button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {footer.columns.map((col) => (
                <div
                  key={col.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <input
                      type="text"
                      value={col.columnTitle}
                      onChange={(e) => {
                        const updated = footer.columns.map((c) =>
                          c.id === col.id ? { ...c, columnTitle: e.target.value } : c
                        );
                        setFooter({ ...footer, columns: updated });
                      }}
                      className="font-extrabold text-slate-900 dark:text-white text-xs uppercase tracking-widest bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 outline-none focus:border-brand px-1"
                    />
                    <button
                      type="button"
                      onClick={() => deleteColumn(col.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                      title="Delete Column"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {col.links.map((link) => (
                      <div
                        key={link.id}
                        className="space-y-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => {
                              const updatedLinks = col.links.map((l) =>
                                l.id === link.id ? { ...l, label: e.target.value } : l
                              );
                              const updatedCols = footer.columns.map((c) =>
                                c.id === col.id ? { ...c, links: updatedLinks } : c
                              );
                              setFooter({ ...footer, columns: updatedCols });
                            }}
                            placeholder="Link Label (e.g. Browse Properties)"
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-bold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => deleteLinkFromColumn(col.id, link.id)}
                            className="text-rose-400 hover:text-rose-600 p-1 shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => {
                            const updatedLinks = col.links.map((l) =>
                              l.id === link.id ? { ...l, url: e.target.value } : l
                            );
                            const updatedCols = footer.columns.map((c) =>
                              c.id === col.id ? { ...c, links: updatedLinks } : c
                            );
                            setFooter({ ...footer, columns: updatedCols });
                          }}
                          placeholder="Link URL (/properties)"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 font-mono text-[10px] text-slate-500 outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addLinkToColumn(col.id)}
                    className="w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:border-brand hover:text-brand flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Link
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 4: COPYRIGHT & LEGAL NOTICE */}
        {activeTab === "copyright" && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-5 max-w-3xl">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-1">
                4th Section: Copyright Line &amp; Legal Notice
              </h3>
              <p className="text-xs text-slate-500">
                Completely edit the bottom copyright notice line and legal risk disclaimer text.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Copyright Line (Left Side)
              </label>
              <input
                type="text"
                value={footer.copyrightText}
                onChange={(e) => setFooter({ ...footer, copyrightText: e.target.value })}
                placeholder="© 2026 PlotsnHomes Pvt. Ltd. · CIN: U70200DL2024PTC000001"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Legal Disclaimer &amp; Notice (Right Side)
              </label>
              <textarea
                rows={3}
                value={footer.disclaimerText || ""}
                onChange={(e) => setFooter({ ...footer, disclaimerText: e.target.value })}
                placeholder="Investment in real estate is subject to market risks. Read all documents carefully."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-xs font-medium outline-none focus:border-brand"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
