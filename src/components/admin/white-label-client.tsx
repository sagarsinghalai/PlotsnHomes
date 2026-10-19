"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  Crown,
  ExternalLink,
  Globe,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Edit2,
  Trash2,
} from "lucide-react";
import {
  PartnerSubscriptionRecord,
  SubscriptionTierLevel,
  WhiteLabelProfile,
} from "@/lib/white-label-store";

export function WhiteLabelClient({
  initialProfile,
  initialSubscriptions,
}: {
  initialProfile: WhiteLabelProfile;
  initialSubscriptions: PartnerSubscriptionRecord[];
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "subscriptions">("profile");

  // Profile Form State
  const [profile, setProfile] = useState<WhiteLabelProfile>(initialProfile);
  const [savingProfile, setSavingProfile] = useState(false);

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<PartnerSubscriptionRecord[]>(initialSubscriptions);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");

  // Edit Modal State
  const [editingSub, setEditingSub] = useState<PartnerSubscriptionRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingSub, setSavingSub] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/admin/white-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (res.ok) {
        showToast("White Label branding profile & custom URL settings saved successfully!");
      } else {
        alert("Failed to save white-label profile.");
      }
    } catch {
      alert("Error saving profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveSubModal = async () => {
    if (!editingSub) return;
    setSavingSub(true);
    try {
      const updatedList = subscriptions.map((s) => (s.id === editingSub.id ? editingSub : s));
      const res = await fetch("/api/admin/white-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptions: updatedList }),
      });
      if (res.ok) {
        setSubscriptions(updatedList);
        setIsModalOpen(false);
        showToast(`Subscription level for "${editingSub.orgName}" updated successfully!`);
      } else {
        alert("Failed to update subscription level.");
      }
    } catch {
      alert("Error updating subscription level.");
    } finally {
      setSavingSub(false);
    }
  };

  const filteredSubs = subscriptions.filter((s) => {
    const matchesSearch =
      s.orgName.toLowerCase().includes(search.toLowerCase()) ||
      s.adminName.toLowerCase().includes(search.toLowerCase()) ||
      s.customDomain.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === "ALL" || s.tierLevel === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto font-sans text-slate-900 dark:text-white">
      {/* TOAST ALERT */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 rounded-2xl bg-brand text-white px-5 py-3.5 text-xs font-extrabold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1
            className="text-3xl sm:text-4xl text-slate-950 dark:text-white tracking-tight leading-tight"
            style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", fontWeight: 400, textTransform: "none" }}
          >
            White-Label &amp; Subscription Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customize company profile branding &amp; custom website URL for clients, and manage subscription levels across all White Labels, Franchises, and downline roles.
          </p>
        </div>

        {/* PRIMARY TAB TOGGLE */}
        <div className="flex items-center rounded-2xl bg-slate-100 dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-800 text-xs font-extrabold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-brand text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>1. Company Profile &amp; Custom URL</span>
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "subscriptions"
                ? "bg-brand text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Crown className="h-4 w-4" />
            <span>2. Super Admin Subscription Manager</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: WHITE-LABEL COMPANY PROFILE & CUSTOM BRANDING ───────────────── */}
      {activeTab === "profile" && (
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Left Form: Profile Settings */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-8 shadow-xl space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-amber-500" /> White Label Company Profile
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your custom website URL, company logo, and contact info shown to your customers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <button
                  type="button"
                  onClick={() => setProfile({ ...profile, isWhiteLabelActive: !profile.isWhiteLabelActive })}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer ${
                    profile.isWhiteLabelActive
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-100 text-slate-500 border border-slate-300"
                  }`}
                >
                  {profile.isWhiteLabelActive ? "ACTIVE" : "INACTIVE"}
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* CUSTOM DOMAIN URL */}
              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">
                  Custom Website URL / Domain *
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3 h-4 w-4 text-amber-500" />
                  <input
                    type="url"
                    value={profile.customDomain}
                    onChange={(e) => setProfile({ ...profile, customDomain: e.target.value })}
                    placeholder="https://invest.apexrealestate.com"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 py-3 outline-none focus:border-amber-500 font-mono text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Point your DNS CNAME / A-Record to this domain so your customers see your white label URL.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    value={profile.companyName}
                    onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                    placeholder="Apex Real Estate Group"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-amber-500 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Brand Tagline</label>
                  <input
                    type="text"
                    value={profile.tagline}
                    onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                    placeholder="India's Premier Fractional Land Platform"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-amber-500 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Brand Logo URL</label>
                <input
                  type="text"
                  value={profile.logoUrl}
                  onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                  placeholder="/logo.png or https://example.com/logo.png"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-amber-500 font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Support Phone</label>
                  <input
                    type="text"
                    value={profile.supportPhone}
                    onChange={(e) => setProfile({ ...profile, supportPhone: e.target.value })}
                    placeholder="+91 98201 34567"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-amber-500 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Support Email</label>
                  <input
                    type="email"
                    value={profile.supportEmail}
                    onChange={(e) => setProfile({ ...profile, supportEmail: e.target.value })}
                    placeholder="support@apexrealestate.com"
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-amber-500 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Head Office Address</label>
                <input
                  type="text"
                  value={profile.officeAddress}
                  onChange={(e) => setProfile({ ...profile, officeAddress: e.target.value })}
                  placeholder="Suite 402, Apex Tower, M.G. Road, Indore"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-amber-500 text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">GST / CIN Registration Number</label>
                <input
                  type="text"
                  value={profile.gstCinNumber}
                  onChange={(e) => setProfile({ ...profile, gstCinNumber: e.target.value })}
                  placeholder="CIN: U70200DL2024PTC000001"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-amber-500 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Copyright &amp; Legal Disclaimer Notice</label>
                <textarea
                  rows={2}
                  value={profile.copyrightNotice}
                  onChange={(e) => setProfile({ ...profile, copyrightNotice: e.target.value })}
                  placeholder="© 2026 Apex Real Estate Group Pvt. Ltd. All rights reserved."
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 outline-none focus:border-amber-500 text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm shadow-lg shadow-brand/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Saving Profile...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" /> Save Company Profile &amp; Custom URL
                </>
              )}
            </button>
          </div>

          {/* Right Live Preview Box */}
          <div className="lg:col-span-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white p-6 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" /> Live Website Branding Preview
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                Customer View
              </span>
            </div>

            {/* Address bar preview */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 flex items-center gap-2 text-xs font-mono text-slate-300">
              <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="truncate text-amber-400 font-bold">{profile.customDomain || "https://invest.company.com"}</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-500 ml-auto shrink-0" />
            </div>

            {/* Header Preview Box */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-white">{profile.companyName || "Your Company Name"}</div>
                    <div className="text-[10px] text-slate-400">{profile.tagline}</div>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-extrabold">
                  Partner Portal
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">Support Helpline:</span>
                  <span className="font-mono text-white font-bold">{profile.supportPhone}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">Official Email:</span>
                  <span className="font-mono text-white font-bold">{profile.supportEmail}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">Head Office:</span>
                  <span className="text-white font-medium truncate max-w-[200px]">{profile.officeAddress}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Tax / CIN Registration:</span>
                  <span className="font-mono text-amber-400 font-bold">{profile.gstCinNumber}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Seamless Domain Mapping
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                When customers log into your portal via your custom domain, all header titles, footers, invoice bills, and emails automatically display your White Label brand details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: SUPER ADMIN SUBSCRIPTION & TIER MANAGEMENT ─────────────────── */}
      {activeTab === "subscriptions" && (
        <div className="space-y-6">
          {/* STATS OVERVIEW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-1">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total White Labels</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {subscriptions.filter((s) => s.roleLevel === "WHITE_LABEL_ADMIN").length}
              </div>
              <div className="text-[10px] text-emerald-500 font-bold">100% Active Partners</div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-1">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Franchise &amp; Branch Network</div>
              <div className="text-2xl font-extrabold text-amber-500">
                {subscriptions.filter((s) => s.roleLevel !== "WHITE_LABEL_ADMIN").length}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Downline Accounts</div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-1">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Custom Domains Verified</div>
              <div className="text-2xl font-extrabold text-emerald-500">
                {subscriptions.filter((s) => s.domainStatus === "VERIFIED").length}
              </div>
              <div className="text-[10px] text-emerald-500 font-bold">DNS Active</div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 space-y-1">
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Subscription MRR</div>
              <div className="text-2xl font-extrabold text-amber-500 font-mono">
                ₹{subscriptions.reduce((acc, curr) => acc + curr.monthlyPrice, 0).toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Monthly Revenue</div>
            </div>
          </div>

          {/* SEARCH & TIER FILTER BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
              <span className="text-slate-500 mr-1 shrink-0">Tier Level:</span>
              {["ALL", "WHITE_LABEL_PRO", "GROWTH_FRANCHISE", "STARTER_PARTNER", "ENTERPRISE_CUSTOM"].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap cursor-pointer ${
                    tierFilter === tier
                      ? "bg-brand text-white font-extrabold shadow-sm"
                      : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {tier === "ALL" ? "All Tiers" : tier.replace(/_/g, " ")}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search org, partner, domain..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-10 pr-4 py-2 text-xs outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">🏢 Organization &amp; Admin</th>
                    <th className="p-4">🌐 Custom Website Domain</th>
                    <th className="p-4">👑 Subscription Tier Level</th>
                    <th className="p-4">⚡ Status &amp; Fee</th>
                    <th className="p-4">📅 Renewal End Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No subscription records found.
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition">
                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 dark:text-white text-sm">{sub.orgName}</div>
                          <div className="text-slate-500 text-[11px]">{sub.adminName} ({sub.adminEmail})</div>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] font-mono border border-slate-200 dark:border-slate-800">
                            {sub.roleLevel}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{sub.customDomain}</div>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              sub.domainStatus === "VERIFIED"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                : sub.domainStatus === "PENDING_DNS"
                                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : "bg-slate-100 text-slate-500 border border-slate-300"
                            }`}
                          >
                            {sub.domainStatus}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-extrabold text-xs">
                            <Crown className="h-3.5 w-3.5" />
                            <span>{sub.tierLevel.replace(/_/g, " ")}</span>
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 dark:text-white font-mono">
                            ₹{sub.monthlyPrice.toLocaleString("en-IN")}/mo
                          </div>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === "ACTIVE"
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>

                        <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{sub.periodEnd}</td>

                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setEditingSub(sub);
                              setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand hover:bg-brand-hover text-white font-extrabold text-xs shadow transition cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>Manage Tier</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL DIALOG: EDIT SUBSCRIPTION LEVEL & FEATURES (WHITE CARD UI) ──── */}
      {isModalOpen && editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 sm:p-8 shadow-2xl space-y-5 text-slate-900 dark:text-white">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" /> Manage Subscription Level &amp; Tier
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Updating tier for <span className="font-bold text-slate-900 dark:text-white">{editingSub.orgName}</span>
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Subscription Tier Level *</label>
                <select
                  value={editingSub.tierLevel}
                  onChange={(e) =>
                    setEditingSub({ ...editingSub, tierLevel: e.target.value as SubscriptionTierLevel })
                  }
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-amber-500 font-extrabold text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="STARTER_PARTNER">STARTER PARTNER (Basic CRM)</option>
                  <option value="GROWTH_FRANCHISE">GROWTH FRANCHISE (WhatsApp + Loans)</option>
                  <option value="WHITE_LABEL_PRO">WHITE LABEL PRO (Custom Domain &amp; Full Hierarchy)</option>
                  <option value="ENTERPRISE_CUSTOM">ENTERPRISE CUSTOM (Dedicated Instance)</option>
                </select>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Monthly Fee (₹)</label>
                  <input
                    type="number"
                    value={editingSub.monthlyPrice}
                    onChange={(e) => setEditingSub({ ...editingSub, monthlyPrice: Number(e.target.value) })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-amber-500 font-mono text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Subscription Status</label>
                  <select
                    value={editingSub.status}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, status: e.target.value as any })
                    }
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-amber-500 font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="TRIALING">TRIALING</option>
                    <option value="PAST_DUE">PAST_DUE</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Custom Domain</label>
                  <input
                    type="text"
                    value={editingSub.customDomain}
                    onChange={(e) => setEditingSub({ ...editingSub, customDomain: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-amber-500 font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-800 dark:text-slate-200 font-bold mb-1.5">Domain Verification Status</label>
                  <select
                    value={editingSub.domainStatus}
                    onChange={(e) =>
                      setEditingSub({ ...editingSub, domainStatus: e.target.value as any })
                    }
                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 outline-none focus:border-amber-500 font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="VERIFIED">VERIFIED (Active DNS)</option>
                    <option value="PENDING_DNS">PENDING DNS</option>
                    <option value="NOT_CONFIGURED">NOT CONFIGURED</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubModal}
                disabled={savingSub}
                className="px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-extrabold shadow-md shadow-brand/20 transition cursor-pointer disabled:opacity-50"
              >
                {savingSub ? "Saving Changes..." : "Save Subscription Level"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
