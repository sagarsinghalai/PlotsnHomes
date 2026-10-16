"use client";

import { useState } from "react";
import { FeaturedArea, TestimonialsConfig, TeamMemberItem } from "@/lib/site-settings";
import { updateFrontendSettingsAction } from "./actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { 
  Building2, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  Plus, 
  Star, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  ExternalLink,
  Sparkles,
  Image as ImageIcon
} from "lucide-react";

const WORLD_COUNTRY_CODES = [
  { code: "+91", label: "🇮🇳 India (+91)" },
  { code: "+1", label: "🇺🇸/🇨🇦 USA / Canada (+1)" },
  { code: "+44", label: "🇬🇧 UK (+44)" },
  { code: "+971", label: "🇦🇪 UAE (+971)" },
  { code: "+65", label: "🇸🇬 Singapore (+65)" },
  { code: "+61", label: "🇦🇺 Australia (+61)" },
  { code: "+49", label: "🇩🇪 Germany (+49)" },
  { code: "+33", label: "🇫🇷 France (+33)" },
  { code: "+81", label: "🇯🇵 Japan (+81)" },
  { code: "+86", label: "🇨🇳 China (+86)" },
  { code: "+966", label: "🇸🇦 Saudi Arabia (+966)" },
  { code: "+974", label: "🇶🇦 Qatar (+974)" },
  { code: "+968", label: "🇴🇲 Oman (+968)" },
  { code: "+965", label: "🇰🇼 Kuwait (+965)" },
  { code: "+973", label: "🇧🇭 Bahrain (+973)" },
  { code: "+60", label: "🇲🇾 Malaysia (+60)" },
  { code: "+62", label: "🇮🇩 Indonesia (+62)" },
  { code: "+63", label: "🇵🇭 Philippines (+63)" },
  { code: "+82", label: "🇰🇷 South Korea (+82)" },
  { code: "+27", label: "🇿🇦 South Africa (+27)" },
  { code: "+55", label: "🇧🇷 Brazil (+55)" },
  { code: "+52", label: "🇲🇽 Mexico (+52)" },
  { code: "+39", label: "🇮🇹 Italy (+39)" },
  { code: "+34", label: "🇪🇸 Spain (+34)" },
  { code: "+31", label: "🇳🇱 Netherlands (+31)" },
  { code: "+41", label: "🇨🇭 Switzerland (+41)" },
  { code: "+46", label: "🇸🇪 Sweden (+46)" },
  { code: "+47", label: "🇳🇴 Norway (+47)" },
  { code: "+45", label: "🇩🇰 Denmark (+45)" },
  { code: "+353", label: "🇮🇪 Ireland (+353)" },
  { code: "+64", label: "🇳🇿 New Zealand (+64)" },
  { code: "+7", label: "🇷🇺 Russia (+7)" },
  { code: "+90", label: "🇹🇷 Turkey (+90)" },
  { code: "+20", label: "🇪🇬 Egypt (+20)" },
  { code: "+234", label: "🇳🇬 Nigeria (+234)" },
  { code: "+254", label: "🇰🇪 Kenya (+254)" },
  { code: "+84", label: "🇻🇳 Vietnam (+84)" },
  { code: "+66", label: "🇹🇭 Thailand (+66)" },
  { code: "+94", label: "🇱🇰 Sri Lanka (+94)" },
  { code: "+880", label: "🇧🇩 Bangladesh (+880)" },
  { code: "+977", label: "🇳🇵 Nepal (+977)" },
  { code: "+92", label: "🇵🇰 Pakistan (+92)" },
];

export function FrontendSettingsClient({
  initialFeaturedAreas,
  initialTestimonials,
  initialTeamMembers,
}: {
  initialFeaturedAreas: FeaturedArea[];
  initialTestimonials: TestimonialsConfig;
  initialTeamMembers: TeamMemberItem[];
}) {
  const [activeTab, setActiveTab] = useState<"prime_locations" | "reviews" | "team">("prime_locations");
  const [featuredAreas, setFeaturedAreas] = useState<FeaturedArea[]>(initialFeaturedAreas);
  const [testimonials, setTestimonials] = useState<TestimonialsConfig>(initialTestimonials);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>(initialTeamMembers);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

  // Helper for uploading image files to /api/upload
  async function handleFileUpload(file: File, onComplete: (url: string) => void, uploadKey: string) {
    if (!file) return;
    setUploadingState((prev) => ({ ...prev, [uploadKey]: true }));
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "image");

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        onComplete(data.url);
      } else {
        alert(data.error || "Image upload failed");
      }
    } catch (err: any) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setUploadingState((prev) => ({ ...prev, [uploadKey]: false }));
    }
  }

  // Validations for Team Members
  function validateTeamMember(member: TeamMemberItem) {
    const errors: { name?: string; phone?: string } = {};

    // Name Validation: Strictly no numbers, max 30 words
    if (/\d/.test(member.name)) {
      errors.name = "❌ Numbers are not allowed in names";
    } else {
      const wordCount = member.name.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount > 30) {
        errors.name = `❌ Maximum 30 words allowed (current: ${wordCount} words)`;
      }
    }

    // Phone Validation: Strictly 10 digits
    const cleanedPhone = member.phone.trim();
    if (!/^\d{10}$/.test(cleanedPhone)) {
      errors.phone = "❌ Phone number must be strictly 10 digits (numbers only)";
    }

    return errors;
  }

  async function handleSave() {
    // Validate Team Members first
    for (let i = 0; i < teamMembers.length; i++) {
      const errs = validateTeamMember(teamMembers[i]);
      if (errs.name || errs.phone) {
        setActiveTab("team");
        setErrorMessage(`Validation error on Team Member #${i + 1}: ${errs.name || errs.phone}`);
        return;
      }
    }

    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage("");

    const res = await updateFrontendSettingsAction({
      featuredAreas,
      testimonials,
      teamMembers,
    });

    setSaving(false);
    if (res.ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      setErrorMessage(res.error || "Failed to save settings");
    }
  }

  return (
    <div className="space-y-6 font-sans text-slate-900 dark:text-white">
      {/* Sleek Page Header with Save Button in Action Slot */}
      <AdminPageHeader
        title="Frontend Settings"
        description="Customize homepage location cards, investor reviews, Google review link, and team directory."
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Frontend Settings" },
        ]}
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-dark text-slate-950 px-5 py-2.5 font-bold shadow-sm transition-all cursor-pointer text-sm disabled:opacity-50"
          >
            {saving ? (
              <div className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>{saving ? "Saving..." : "Save All Changes"}</span>
          </button>
        }
      />

      {/* Notifications */}
      {saveSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-emerald-700 dark:text-emerald-300 text-sm font-medium shadow-2xs">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Frontend settings updated successfully! Changes are live on the homepage.</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 p-4 text-rose-700 dark:text-rose-300 text-sm font-medium shadow-2xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Clean Pill Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: "prime_locations", label: "Explore Prime Locations", count: featuredAreas.length, icon: Building2 },
          { id: "reviews", label: "Investor Voices (Reviews)", count: testimonials.items.length, icon: Star },
          { id: "team", label: "Meet Our Team", count: teamMembers.length, icon: Users },
        ].map((t) => {
          const isSel = activeTab === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                isSel
                  ? "bg-slate-900 text-white dark:bg-[#b58a18] dark:text-slate-950 shadow-md"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isSel
                  ? "bg-white/20 text-white dark:bg-slate-950/20 dark:text-slate-950"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Explore Prime Locations Cards */}
      {activeTab === "prime_locations" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Explore Prime Locations Cards</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure featured location cards for homepage (Photo, location name, and listing count).
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFeaturedAreas((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    area: "New Location",
                    count: 12,
                    imageUrl: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80",
                  },
                ]);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-extrabold hover:bg-slate-800 transition cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Location Card</span>
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredAreas.map((areaItem, index) => (
              <div
                key={areaItem.id}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-md transition space-y-4 relative group"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-mono">
                    CARD #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFeaturedAreas((prev) => prev.filter((_, idx) => idx !== index));
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Remove location card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Card Image Preview */}
                <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 group">
                  <img
                    src={areaItem.imageUrl || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80"}
                    alt={areaItem.area}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as any).src = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-[11px] font-bold bg-slate-950/70 px-3 py-1 rounded-full backdrop-blur-sm">
                      {areaItem.area || "Preview"}
                    </span>
                  </div>
                </div>

                {/* Image URL & Upload Row */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Image Source
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={areaItem.imageUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFeaturedAreas((prev) =>
                          prev.map((item, idx) => (idx === index ? { ...item, imageUrl: val } : item))
                        );
                      }}
                      className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:border-gold outline-none"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shrink-0">
                      {uploadingState[`area_${index}`] ? (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-900 dark:border-white border-t-transparent animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5 text-slate-500" />
                      )}
                      <span>{uploadingState[`area_${index}`] ? "..." : "Upload"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(
                              file,
                              (uploadedUrl) => {
                                setFeaturedAreas((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index ? { ...item, imageUrl: uploadedUrl } : item
                                  )
                                );
                              },
                              `area_${index}`
                            );
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                {/* Location Name & Listings Count */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Location Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Downtown"
                      value={areaItem.area}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFeaturedAreas((prev) =>
                          prev.map((item, idx) => (idx === index ? { ...item, area: val } : item))
                        );
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-extrabold text-slate-900 dark:text-white focus:border-gold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Listings Count</label>
                    <input
                      type="number"
                      placeholder="e.g. 29"
                      value={areaItem.count}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setFeaturedAreas((prev) =>
                          prev.map((item, idx) => (idx === index ? { ...item, count: val } : item))
                        );
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-extrabold text-slate-900 dark:text-white focus:border-gold outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Investor Voices (Reviews & Google Review Link) */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          {/* Google Review Link Section */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm">
              <ExternalLink className="h-4 w-4 text-gold-dark dark:text-gold" />
              <h3>Google Review Link (Company Reviews)</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Provide your official company Google Review URL where investors can add or view verified Google reviews.
            </p>
            <input
              type="url"
              placeholder="https://g.page/r/plotsnhomes/review"
              value={testimonials.googleReviewUrl}
              onChange={(e) => {
                const val = e.target.value;
                setTestimonials((prev) => ({ ...prev, googleReviewUrl: val }));
              }}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs text-slate-900 dark:text-white focus:border-gold outline-none font-mono"
            />
          </div>

          {/* Testimonial Cards */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Investor Voices Cards</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Edit review stars, reviewer details, photo, quote, and financial box stats.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTestimonials((prev) => ({
                  ...prev,
                  items: [
                    ...prev.items,
                    {
                      id: Date.now().toString(),
                      name: "New Investor",
                      role: "Verified Co-owner",
                      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
                      rating: 5,
                      text: "PlotsnHomes provided an exceptional investment experience with high transparency.",
                      investmentAmount: "₹3,00,000",
                      portfolioSize: "2 Properties",
                    },
                  ],
                }));
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-extrabold hover:bg-slate-800 transition cursor-pointer shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Review Card</span>
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-mono">
                      REVIEW #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setTestimonials((prev) => ({
                          ...prev,
                          items: prev.items.filter((_, idx) => idx !== index),
                        }));
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Remove review"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Rating Stars Dropdown */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Rating Stars
                    </label>
                    <select
                      value={item.rating}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setTestimonials((prev) => ({
                          ...prev,
                          items: prev.items.map((r, idx) => (idx === index ? { ...r, rating: val } : r)),
                        }));
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:border-gold outline-none"
                    >
                      <option value={5}>⭐⭐⭐⭐⭐ (5 / 5 Stars)</option>
                      <option value={4}>⭐⭐⭐⭐ (4 / 5 Stars)</option>
                      <option value={3}>⭐⭐⭐ (3 / 5 Stars)</option>
                      <option value={2}>⭐⭐ (2 / 5 Stars)</option>
                      <option value={1}>⭐ (1 / 5 Stars)</option>
                    </select>
                  </div>

                  {/* Review Text */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Review Quote Text
                    </label>
                    <textarea
                      rows={3}
                      value={item.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTestimonials((prev) => ({
                          ...prev,
                          items: prev.items.map((r, idx) => (idx === index ? { ...r, text: val } : r)),
                        }));
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white focus:border-gold outline-none italic"
                    />
                  </div>

                  {/* Reviewer Photo & Details */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80"}
                        alt={item.name}
                        className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                      />
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          placeholder="Reviewer Name"
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTestimonials((prev) => ({
                              ...prev,
                              items: prev.items.map((r, idx) => (idx === index ? { ...r, name: val } : r)),
                            }));
                          }}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white focus:border-gold outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Role / Designation"
                          value={item.role}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTestimonials((prev) => ({
                              ...prev,
                              items: prev.items.map((r, idx) => (idx === index ? { ...r, role: val } : r)),
                            }));
                          }}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] text-slate-500 dark:text-slate-400 focus:border-gold outline-none"
                        />
                      </div>
                    </div>

                    {/* Photo URL & Upload inline */}
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="Photo URL..."
                        value={item.image}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTestimonials((prev) => ({
                            ...prev,
                            items: prev.items.map((r, idx) => (idx === index ? { ...r, image: val } : r)),
                          }));
                        }}
                        className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-[11px] font-mono text-slate-900 dark:text-white focus:border-gold outline-none"
                      />
                      <label className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shrink-0">
                        {uploadingState[`rev_${index}`] ? (
                          <div className="h-3 w-3 rounded-full border-2 border-slate-900 dark:border-white border-t-transparent animate-spin" />
                        ) : (
                          <Upload className="h-3 w-3 text-slate-500" />
                        )}
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(
                                file,
                                (uploadedUrl) => {
                                  setTestimonials((prev) => ({
                                    ...prev,
                                    items: prev.items.map((r, idx) =>
                                      idx === index ? { ...r, image: uploadedUrl } : r
                                    ),
                                  }));
                                },
                                `rev_${index}`
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Financial Stats Box */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2 mt-3">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Card Stats
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400">Invested</label>
                        <input
                          type="text"
                          placeholder="₹2,50,000"
                          value={item.investmentAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTestimonials((prev) => ({
                              ...prev,
                              items: prev.items.map((r, idx) => (idx === index ? { ...r, investmentAmount: val } : r)),
                            }));
                          }}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:border-gold outline-none bg-white dark:bg-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400">Portfolio</label>
                        <input
                          type="text"
                          placeholder="3 Properties"
                          value={item.portfolioSize}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTestimonials((prev) => ({
                              ...prev,
                              items: prev.items.map((r, idx) => (idx === index ? { ...r, portfolioSize: val } : r)),
                            }));
                          }}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-800 px-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:border-gold outline-none bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Meet Our Team Cards */}
      {activeTab === "team" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Meet Our Team Cards</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure team member cards. Enforces clean name & 10-digit phone verification.
              </p>
            </div>
            {teamMembers.length < 4 && (
              <button
                type="button"
                onClick={() => {
                  setTeamMembers((prev) => [
                    ...prev,
                    {
                      id: Date.now().toString(),
                      name: "New Team Member",
                      designation: "Real estate agent",
                      countryCode: "+91",
                      phone: "9820134567",
                    },
                  ]);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-extrabold hover:bg-slate-800 transition cursor-pointer shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Team Member</span>
              </button>
            )}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {teamMembers.map((member, index) => {
              const errors = validateTeamMember(member);

              return (
                <div
                  key={member.id}
                  className={`rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4 ${
                    errors.name || errors.phone
                      ? "border-rose-400 ring-2 ring-rose-100 dark:ring-rose-950"
                      : "border-slate-200/90 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-mono">
                      TEAM CARD #{index + 1}
                    </span>
                    {teamMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTeamMembers((prev) => prev.filter((_, idx) => idx !== index));
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Remove member card"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Name Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                      <span className="text-[10px] text-slate-400 font-normal ml-2">
                        (No numbers · Max 30 words)
                      </span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Mitchell"
                      value={member.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeamMembers((prev) =>
                          prev.map((item, idx) => (idx === index ? { ...item, name: val } : item))
                        );
                      }}
                      className={`w-full rounded-xl border px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none bg-white dark:bg-slate-900 ${
                        errors.name
                          ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30"
                          : "border-slate-200 dark:border-slate-800 focus:border-gold"
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs font-semibold text-rose-600 mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Designation Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Designation</label>
                    <input
                      type="text"
                      placeholder="e.g. Real estate agent"
                      value={member.designation}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeamMembers((prev) =>
                          prev.map((item, idx) => (idx === index ? { ...item, designation: val } : item))
                        );
                      }}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-gold outline-none font-medium"
                    />
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                      <span className="text-[10px] text-slate-400 font-normal ml-2">
                        (Strictly 10 digits)
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={member.countryCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTeamMembers((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, countryCode: val } : item))
                          );
                        }}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2 text-xs font-bold text-slate-900 dark:text-white focus:border-gold outline-none shrink-0 max-w-[130px]"
                      >
                        {WORLD_COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="10 digit number"
                        value={member.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setTeamMembers((prev) =>
                            prev.map((item, idx) => (idx === index ? { ...item, phone: val } : item))
                          );
                        }}
                        className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold font-mono text-slate-900 dark:text-white outline-none bg-white dark:bg-slate-900 ${
                          errors.phone
                            ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/30"
                            : "border-slate-200 dark:border-slate-800 focus:border-gold"
                        }`}
                      />
                    </div>
                    {errors.phone ? (
                      <p className="text-xs font-semibold text-rose-600 mt-1">{errors.phone}</p>
                    ) : (
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        Formatted: {member.countryCode} {member.phone}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
