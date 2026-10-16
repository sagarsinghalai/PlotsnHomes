"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Crown,
  Globe,
  Loader2,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { COUNTRIES } from "@/lib/locale-defaults";

export default function BecomeWhiteLabelPage() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    companyName: "",
    businessType: "Real Estate Developer",
    operatingRegion: "",
    customDomain: "",
    expectedVolume: "₹10 Cr - ₹50 Cr",
    portfolioUnits: "50-200 Units",
    propertyTypes: ["Residential Plots", "Commercial Assets"],
    requestedModules: ["WhatsApp Hub", "Loan Processing", "Webpage Editor"],
    notes: "",
  });

  const togglePropertyType = (type: string) => {
    setForm((prev) => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter((t) => t !== type)
        : [...prev.propertyTypes, type],
    }));
  };

  const toggleModule = (mod: string) => {
    setForm((prev) => ({
      ...prev,
      requestedModules: prev.requestedModules.includes(mod)
        ? prev.requestedModules.filter((m) => m !== mod)
        : [...prev.requestedModules, mod],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};

    // Name Validation: no numbers, max 30 words
    const nameTrimmed = form.name.trim();
    if (!nameTrimmed) {
      newErrors.name = "Full Name is required.";
    } else {
      if (/\d/.test(nameTrimmed)) {
        newErrors.name = "Full Name must not contain numbers.";
      }
      const words = nameTrimmed.split(/\s+/).filter((w) => w.length > 0);
      if (words.length > 30) {
        newErrors.name = `Full Name cannot exceed 30 words (currently ${words.length}).`;
      }
    }

    // Email Validation: must contain @
    const emailTrimmed = form.email.trim();
    if (!emailTrimmed) {
      newErrors.email = "Email address is required.";
    } else if (!emailTrimmed.includes("@")) {
      newErrors.email = "Email address must contain '@'.";
    } else if (!/.+@.+\..+/.test(emailTrimmed)) {
      newErrors.email = "Please enter a valid email address (e.g. user@domain.com).";
    }

    // Phone Validation: exactly 10 digits
    const cleanDigits = phoneDigits.replace(/\D/g, "");
    if (cleanDigits.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (!form.companyName) {
      newErrors.companyName = "Company/Agency Name is required.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Please fix the validation errors before submitting.");
      return;
    }

    setErrors({});
    setLoading(true);
    setSuccessMsg(null);

    const fullPhone = `${countryCode} ${cleanDigits}`;

    try {
      const res = await fetch("/api/partners/white-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: fullPhone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Application submitted! Our White Label Onboarding Lead will contact you within 2 hours.");
        setForm({
          name: "",
          email: "",
          phone: "",
          companyName: "",
          businessType: "Real Estate Developer",
          operatingRegion: "",
          customDomain: "",
          expectedVolume: "₹10 Cr - ₹50 Cr",
          portfolioUnits: "50-200 Units",
          propertyTypes: ["Residential Plots", "Commercial Assets"],
          requestedModules: ["WhatsApp Hub", "Loan Processing", "Webpage Editor"],
          notes: "",
        });
        setPhoneDigits("");
      } else {
        alert(data.error || "Submission failed.");
      }
    } catch {
      alert("An error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-gold selection:text-slate-950">
      {/* HERO SECTION */}
      <section className="relative py-24 lg:py-32 overflow-hidden bg-slate-950 border-b border-slate-900">
        {/* Background Image with Dark Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-luminosity scale-105 pointer-events-none"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/50 to-slate-950 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-extrabold uppercase tracking-widest mb-6">
            <Crown className="h-4 w-4" />
            <span>White Label Partner Program</span>
          </div>

          <h1
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight"
            style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", fontWeight: 400, textTransform: "none" }}
          >
            Become a White Label Partner
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
            Launch your own fully co-branded real estate &amp; fractional property platform on your custom domain.
            Retain 100% brand control, manage agent hierarchies, and scale your investor marketplace.
          </p>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            {[
              { icon: <Globe className="h-5 w-5 text-gold" />, title: "Custom Website URL", desc: "Your own domain & branding" },
              { icon: <ShieldCheck className="h-5 w-5 text-gold" />, title: "Full SPV Legal Structure", desc: "SEBI/RERA compliant setup" },
              { icon: <Users className="h-5 w-5 text-gold" />, title: "Multi-Tier Hierarchy", desc: "Franchises, Brokers & Agents" },
              { icon: <Wallet className="h-5 w-5 text-gold" />, title: "Integrated Gateway", desc: "UPI, SWIFT, Cards & Escrow" },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xs">
                <div className="mb-2">{card.icon}</div>
                <div className="font-bold text-sm text-white">{card.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORM CONTAINER SECTION */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-10 shadow-2xl space-y-8 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-gold" /> Partner Registration &amp; Portfolio Application
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Complete the essential partner details below. Our onboarding team will set up your dedicated White Label instance.
            </p>
          </div>

          {successMsg && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-emerald-400 text-sm font-semibold flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* STEP 1: USER & COMPANY DETAILS */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gold border-b border-slate-800 pb-2">
                1. User Registration &amp; Company Details
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Sagar Singhal"
                    className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none focus:border-gold font-medium ${
                      errors.name ? "border-rose-500 focus:border-rose-500" : "border-slate-800"
                    }`}
                  />
                  {errors.name ? (
                    <p className="text-[10px] text-rose-450 mt-1 font-semibold">{errors.name}</p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">No numbers allowed. Max 30 words.</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Official Email *</label>
                  <input
                    type="text"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="sagar@company.com"
                    className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none focus:border-gold font-medium ${
                      errors.email ? "border-rose-500 focus:border-rose-500" : "border-slate-800"
                    }`}
                  />
                  {errors.email ? (
                    <p className="text-[10px] text-rose-450 mt-1 font-semibold">{errors.email}</p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">Must contain "@".</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Phone Number *</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-3 text-white outline-none focus:border-gold font-medium cursor-pointer w-[110px] shrink-0 text-xs"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={`${c.code}-${c.dial}`} value={c.dial}>
                          {c.flag} {c.code} ({c.dial})
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      required
                      value={phoneDigits}
                      onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98201 34567"
                      className={`flex-1 rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none focus:border-gold font-medium ${
                        errors.phone ? "border-rose-500 focus:border-rose-500" : "border-slate-800"
                      }`}
                    />
                  </div>
                  {errors.phone ? (
                    <p className="text-[10px] text-rose-450 mt-1 font-semibold">{errors.phone}</p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-1">Exactly 10 digits.</p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Company / Agency Name *</label>
                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    placeholder="Apex Premier Developers Pvt. Ltd."
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-gold font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Business Category *</label>
                  <select
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-gold font-medium cursor-pointer"
                  >
                    <option value="Real Estate Developer">Real Estate Developer / Builder</option>
                    <option value="Property Brokerage Agency">Property Brokerage Agency</option>
                    <option value="Institutional Investor">Institutional Investment Firm</option>
                    <option value="Asset Management Company">Asset Management Company</option>
                    <option value="Franchise Network">Regional Franchise Network</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Operating Region / City *</label>
                  <input
                    type="text"
                    value={form.operatingRegion}
                    onChange={(e) => setForm({ ...form, operatingRegion: e.target.value })}
                    placeholder="Indore, Mumbai, NCR, SW Florida"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-gold font-medium"
                  />
                </div>
              </div>
            </div>

            {/* STEP 2: WHITE LABEL DOMAIN & PLATFORM PREFERENCES */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gold border-b border-slate-800 pb-2">
                2. Custom Domain &amp; Platform Setup Details
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Requested Custom Domain / Subdomain</label>
                  <input
                    type="text"
                    value={form.customDomain}
                    onChange={(e) => setForm({ ...form, customDomain: e.target.value })}
                    placeholder="invest.yourcompany.com"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-gold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Expected Annual Transaction Volume</label>
                  <select
                    value={form.expectedVolume}
                    onChange={(e) => setForm({ ...form, expectedVolume: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-gold font-medium cursor-pointer"
                  >
                    <option value="< ₹10 Cr">Under ₹10 Crore</option>
                    <option value="₹10 Cr - ₹50 Cr">₹10 Crore - ₹50 Crore</option>
                    <option value="₹50 Cr - ₹200 Cr">₹50 Crore - ₹200 Crore</option>
                    <option value="> ₹200 Cr">Over ₹200 Crore</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-2">Requested Core Modules</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "WhatsApp Hub Integration",
                    "Loan Processing Engine",
                    "Webpage Visual Editor",
                    "Multi-Tier Agent Hierarchy",
                    "Payment Escrow Gateway",
                    "Custom Mobile App Build",
                  ].map((mod) => {
                    const isSelected = form.requestedModules.includes(mod);
                    return (
                      <button
                        key={mod}
                        type="button"
                        onClick={() => toggleModule(mod)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                          isSelected
                            ? "bg-gold text-slate-950 border-gold font-extrabold"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "} {mod}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* STEP 3: PROPERTY PORTFOLIO DETAILS */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-gold border-b border-slate-800 pb-2">
                3. Property Portfolio &amp; Inventory Details
              </h3>

              <div>
                <label className="block text-slate-300 font-bold mb-2">Property Asset Types</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Residential Plots",
                    "Commercial Retail Shops",
                    "Fractional Property Shares",
                    "Luxury Townships & Villas",
                    "High-Yield Rental Units",
                  ].map((type) => {
                    const isSelected = form.propertyTypes.includes(type);
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => togglePropertyType(type)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                          isSelected
                            ? "bg-amber-500 text-slate-950 border-amber-500 font-extrabold"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "} {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Additional Notes / Special Requirements</label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Mention any custom integrations, API requirements, or specific SPV structures you require..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-white outline-none focus:border-gold font-medium leading-relaxed"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-gold hover:bg-gold-dark text-slate-950 font-extrabold text-sm shadow-xl shadow-gold/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Submitting Partner Application...
                </>
              ) : (
                <>
                  <span>Submit White Label Partner Application</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
