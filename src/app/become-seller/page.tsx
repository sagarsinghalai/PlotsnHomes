"use client";

import { useState } from "react";
import {
  Building,
  CheckCircle2,
  FileCheck,
  Home,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  ArrowRight,
} from "lucide-react";
import { COUNTRIES } from "@/lib/locale-defaults";

export default function BecomeSellerPage() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    sellerType: "Individual Owner",
    cityState: "",
    propertyTitle: "",
    propertyType: "RESIDENTIAL",
    askingPrice: "",
    areaSqft: "",
    bedrooms: "3",
    reraApproved: true,
    photoDocumentUrl: "",
    notes: "",
  });

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

    if (!form.propertyTitle) {
      newErrors.propertyTitle = "Property/Project Title is required.";
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
      const res = await fetch("/api/partners/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          phone: fullPhone,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg("Property listing request submitted! Our listing verification team will inspect and activate your listing.");
        setForm({
          name: "",
          email: "",
          phone: "",
          sellerType: "Individual Owner",
          cityState: "",
          propertyTitle: "",
          propertyType: "RESIDENTIAL",
          askingPrice: "",
          areaSqft: "",
          bedrooms: "3",
          reraApproved: true,
          photoDocumentUrl: "",
          notes: "",
        });
        setPhoneDigits("");
      } else {
        alert(data.error || "Submission failed.");
      }
    } catch {
      alert("An error occurred during seller listing submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-brand selection:text-white">
      {/* HERO SECTION */}
      <section className="relative py-24 lg:py-32 overflow-hidden bg-slate-950 border-b border-slate-900">
        {/* Background Image with Dark Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 mix-blend-luminosity scale-105 pointer-events-none"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/50 to-slate-950 pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-widest mb-6">
            <Home className="h-4 w-4" />
            <span>Verified Seller Network</span>
          </div>

          <h1
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight"
            style={{ fontFamily: "'Impact', 'Arial Black', sans-serif", fontWeight: 400, textTransform: "none" }}
          >
            Become a Seller
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
            List your verified plots, luxury homes, commercial towers, or fractional property shares directly to 50,000+ accredited investors &amp; homebuyers.
          </p>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            {[
              { icon: <TrendingUp className="h-5 w-5 text-amber-400" />, title: "Zero Listing Commission", desc: "Keep 100% of your asset value" },
              { icon: <ShieldCheck className="h-5 w-5 text-amber-400" />, title: "Verified Buyer Network", desc: "KYC cleared high net-worth investors" },
              { icon: <FileCheck className="h-5 w-5 text-amber-400" />, title: "Instant Legal Clearance", desc: "Automated title search assistance" },
              { icon: <Building className="h-5 w-5 text-amber-400" />, title: "Rapid Liquidity", desc: "Fast-track fractional syndication" },
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
              <Sparkles className="h-6 w-6 text-amber-400" /> Property Seller Application &amp; Listing Details
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Provide essential property specifications below to feature your asset on PlotsnHomes marketplace.
            </p>
          </div>

          {successMsg && (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-emerald-400 text-sm font-semibold flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* STEP 1: SELLER CONTACT DETAILS */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                1. Seller Contact &amp; Category
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Bhavya Pandey"
                    className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium ${
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
                  <label className="block text-slate-300 font-bold mb-1.5">Email Address *</label>
                  <input
                    type="text"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="seller@plotsnhomes.com"
                    className={`w-full rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium ${
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
                  <label className="block text-slate-300 font-bold mb-1.5">Phone / WhatsApp Number *</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="rounded-xl border border-slate-800 bg-slate-950 px-2 py-3 text-white outline-none focus:border-amber-400 font-medium cursor-pointer w-[110px] shrink-0 text-xs"
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
                      className={`flex-1 rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium ${
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
                  <label className="block text-slate-300 font-bold mb-1.5">Seller Category *</label>
                  <select
                    value={form.sellerType}
                    onChange={(e) => setForm({ ...form, sellerType: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium cursor-pointer"
                  >
                    <option value="Individual Owner">Individual Property Owner</option>
                    <option value="Agent Broker">Real Estate Broker / Channel Partner</option>
                    <option value="Builder Developer">Builder / Real Estate Developer</option>
                    <option value="Institutional Investor">Institutional Asset Holder</option>
                  </select>
                </div>
              </div>
            </div>

            {/* STEP 2: PROPERTY LISTING DETAILS */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                2. Property Specifications
              </h3>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Property / Project Title *</label>
                  <input
                    type="text"
                    required
                    value={form.propertyTitle}
                    onChange={(e) => setForm({ ...form, propertyTitle: e.target.value })}
                    placeholder="Emerald Luxury Plots, Super Corridor"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">City &amp; State Location *</label>
                  <input
                    type="text"
                    value={form.cityState}
                    onChange={(e) => setForm({ ...form, cityState: e.target.value })}
                    placeholder="Indore, Madhya Pradesh"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Property Type *</label>
                  <select
                    value={form.propertyType}
                    onChange={(e) => setForm({ ...form, propertyType: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium cursor-pointer"
                  >
                    <option value="RESIDENTIAL">Residential (Plots, Flats, Villas)</option>
                    <option value="COMMERCIAL">Commercial (Shops, Office Spaces)</option>
                    <option value="LAND">Land / Agricultural Plot</option>
                    <option value="RENTAL">Fractional / Rental Asset</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Asking Price / Valuation (₹) *</label>
                  <input
                    type="number"
                    value={form.askingPrice}
                    onChange={(e) => setForm({ ...form, askingPrice: e.target.value })}
                    placeholder="4500000"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Super Builtup Area (Sq.Ft)</label>
                  <input
                    type="number"
                    value={form.areaSqft}
                    onChange={(e) => setForm({ ...form, areaSqft: e.target.value })}
                    placeholder="1500"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1.5">Bedrooms / BHK Config</label>
                  <select
                    value={form.bedrooms}
                    onChange={(e) => setForm({ ...form, bedrooms: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium cursor-pointer"
                  >
                    <option value="1">1 BHK / Plot</option>
                    <option value="2">2 BHK</option>
                    <option value="3">3 BHK</option>
                    <option value="4">4+ BHK / Villa</option>
                  </select>
                </div>
              </div>
            </div>

            {/* STEP 3: DOCUMENTS & DESCRIPTION */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2">
                3. Documents &amp; Property Highlights
              </h3>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Photos &amp; Ownership Document Link (Google Drive / Dropbox)</label>
                <input
                  type="url"
                  value={form.photoDocumentUrl}
                  onChange={(e) => setForm({ ...form, photoDocumentUrl: e.target.value })}
                  placeholder="https://drive.google.com/folder/..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Property Description &amp; Highlights</label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Provide key features (e.g. Corner Plot, Facing East, Metro Station 500m, Gated Community)..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-white outline-none focus:border-amber-400 font-medium leading-relaxed"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-brand hover:bg-brand-hover text-white font-extrabold text-sm shadow-xl shadow-brand/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Submitting Seller Listing...
                </>
              ) : (
                <>
                  <span>Submit Property for Review</span>
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
