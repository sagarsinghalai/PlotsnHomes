"use client";

import type { Property, PropertyStatus, PropertyType, ListingType, User } from "@prisma/client";
import { Plus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/ui/country-select";
import { DEFAULT_COUNTRY_CODE, currencySymbol } from "@/lib/locale-defaults";
import { MEDIA_LIMITS, mediaLimitLabel } from "@/lib/media-limits";
import { PROPERTY_CATEGORIES } from "@/lib/property-categories";
import { parseImages, parseJsonArray } from "@/lib/utils";
import { computeAnnualYield, computeRatingFromSlabs, computeSlabForValue, type RatingSlabInput } from "@/lib/calculations";

type Agent = Pick<User, "id" | "name" | "email">;

type PropertyFormProps = {
  agents: Agent[];
  property?: Property & { agent?: Agent | null };
  bhkConfigurations?: string[];
};

export function PropertyForm({ agents, property, bhkConfigurations = [] }: PropertyFormProps) {
  const router = useRouter();
  const isEdit = Boolean(property);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slabsMap, setSlabsMap] = useState<Record<string, RatingSlabInput[]>>({});

  // Custom specifications state
  const [customFields, setCustomFields] = useState<{
    id: string;
    section: string;
    label: string;
    value: string;
  }[]>(
    property && property.customFields ? JSON.parse(property.customFields) : []
  );

  // Custom field creation state
  const [addingFieldInSection, setAddingFieldInSection] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  async function loadAllSlabs() {
    const slabTypes = [
      "yieldRate",
      "capRate",
      "interestRate",
      "brokerageRate",
      "change7d",
      "change1m",
      "change6m",
      "changeYtd",
    ];

    try {
      const results = await Promise.all(
        slabTypes.map((type) =>
          fetch(`/api/admin/rating-slabs?type=${type}`)
            .then((res) => res.json())
            .then((data) => ({ type, data }))
        )
      );
      const map: Record<string, RatingSlabInput[]> = {};
      results.forEach((r) => {
        map[r.type] = r.data;
      });
      setSlabsMap(map);
    } catch (err) {
      console.error("Failed to load rating slabs:", err);
    }
  }

  useEffect(() => {
    loadAllSlabs();
  }, []);

  // Custom Fields Actions
  function startAddCustomField(section: string) {
    setAddingFieldInSection(section);
    setNewFieldLabel("");
    setNewFieldValue("");
  }

  function cancelAddCustomField() {
    setAddingFieldInSection(null);
    setNewFieldLabel("");
    setNewFieldValue("");
  }

  function saveCustomField(section: string) {
    if (!newFieldLabel.trim()) return;
    const newField = {
      id: Math.random().toString(36).substring(2, 9),
      section,
      label: newFieldLabel.trim(),
      value: newFieldValue.trim(),
    };
    setCustomFields((prev) => [...prev, newField]);
    cancelAddCustomField();
  }

  function updateCustomFieldValue(id: string, value: string) {
    setCustomFields((prev) =>
      prev.map((cf) => (cf.id === id ? { ...cf, value } : cf))
    );
  }

  function removeCustomField(id: string) {
    setCustomFields((prev) => prev.filter((cf) => cf.id !== id));
  }

  function renderCustomFieldsSection(sectionKey: string) {
    const fields = customFields.filter((cf) => cf.section === sectionKey);

    return (
      <div className="sm:col-span-2 space-y-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Custom Specifications</h3>
          {addingFieldInSection !== sectionKey && (
            <button
              type="button"
              onClick={() => startAddCustomField(sectionKey)}
              className="inline-flex items-center gap-1 text-xs font-bold text-gold-dark hover:text-gold transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add custom detail
            </button>
          )}
        </div>
        
        {fields.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((cf) => (
              <div key={cf.id} className="block text-sm space-y-1 relative group">
                <span className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">{cf.label}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomField(cf.id)}
                    className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </span>
                <input
                  type="text"
                  value={cf.value}
                  onChange={(e) => updateCustomFieldValue(cf.id, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white transition"
                />
              </div>
            ))}
          </div>
        )}

        {addingFieldInSection === sectionKey && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">New Custom Detail</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs space-y-1">
                <span className="text-slate-600">Detail Name / Label</span>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="e.g. Balcony Facing or Servant Room Size"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                />
              </label>
              <label className="block text-xs space-y-1">
                <span className="text-slate-600">Value</span>
                <input
                  type="text"
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  placeholder="e.g. East Facing or 6x8 ft"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={cancelAddCustomField}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveCustomField(sectionKey)}
                disabled={!newFieldLabel.trim()}
                className="rounded-lg bg-gold-dark hover:bg-gold px-3 py-1.5 font-semibold text-white disabled:opacity-50"
              >
                Add Field
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
  const [images, setImages] = useState<string[]>(
    property ? parseImages(property.images) : []
  );
  const [videos, setVideos] = useState<string[]>(
    property ? parseJsonArray(property.videos) : []
  );
  const [pdfs, setPdfs] = useState<{ name: string; url: string }[]>(() => {
    if (!property) return [];
    try {
      const arr = JSON.parse(property.pdfs || "[]");
      if (!Array.isArray(arr)) return [];
      return arr.map((x: string | { name?: string; url: string }) =>
        typeof x === "string" ? { name: "Document", url: x } : { name: x.name ?? "Document", url: x.url }
      );
    } catch {
      return [];
    }
  });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: property?.title ?? "",
    symbol: property?.symbol ?? "",
    description: property?.description ?? "",
    price: property?.price?.toString() ?? "",
    listedPrice: property?.listedPrice?.toString() ?? "",
    currentPrice: property?.currentPrice?.toString() ?? "",
    rentMonthly: property?.rentMonthly?.toString() ?? "",
    city: property?.city ?? "",
    state: property?.state ?? "",
    address: property?.address ?? "",
    zip: property?.zip ?? "",
    country: property?.country ?? DEFAULT_COUNTRY_CODE,
    type: (property?.type ?? "RESIDENTIAL") as PropertyType,
    status: (property?.status ?? "ACTIVE") as PropertyStatus,
    listingType: (property?.listingType ?? "SALE") as ListingType,
    category: property?.category ?? "",
    area: property?.area ?? "",
    bhk: (property as any)?.bhk ?? "",
    bedrooms: property?.bedrooms?.toString() ?? "0",
    bathrooms: property?.bathrooms?.toString() ?? "0",
    rooms: property?.rooms?.toString() ?? "",
    garages: property?.garages?.toString() ?? "0",
    sqft: property?.sqft?.toString() ?? "",
    lotSize: property?.lotSize?.toString() ?? "",
    totalFloors: property?.totalFloors?.toString() ?? "",
    floorNumber: property?.floorNumber?.toString() ?? "",
    furnishingStatus: property?.furnishingStatus ?? "",
    hasServantRoom: property?.hasServantRoom ?? false,
    hasPujaRoom: property?.hasPujaRoom ?? false,
    hasStudyRoom: property?.hasStudyRoom ?? false,
    balconies: property?.balconies?.toString() ?? "0",
    liftType: property?.liftType ?? "",
    flatsPerFloor: property?.flatsPerFloor?.toString() ?? "",
    availabilityStatus: property?.availabilityStatus ?? "",
    features: property ? parseJsonArray(property.features).join(", ") : "",
    videoUrl: property?.videoUrl ?? "",
    virtualTourUrl: property?.virtualTourUrl ?? "",
    mapLat: property?.mapLat?.toString() ?? "",
    mapLng: property?.mapLng?.toString() ?? "",
    agentId: property?.agentId ?? agents[0]?.id ?? "",
    yieldRate: property?.yieldRate?.toString() ?? "5.5",
    capRate: property?.capRate?.toString() ?? "5.0",
    interestRate: property?.interestRate?.toString() ?? "6.5",
    brokerageRate: property?.brokerageRate?.toString() ?? "3.0",
    change24h: property?.change24h?.toString() ?? "0",
    change7d: property?.change7d?.toString() ?? "0",
    change1m: property?.change1m?.toString() ?? "0",
    change6m: property?.change6m?.toString() ?? "0",
    changeYtd: property?.changeYtd?.toString() ?? "0",
    marketRating: property?.marketRating ?? "B",
    volumeScore: property?.volumeScore?.toString() ?? "50",
    featured: property?.featured ?? false,
    yearBuilt: property?.yearBuilt?.toString() ?? "",
  });

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Auto-calculate yield and market rating based on Listed vs Current price
  useEffect(() => {
    const lPrice = parseFloat(form.listedPrice);
    const cPrice = parseFloat(form.currentPrice);
    if (lPrice > 0 && cPrice > 0) {
      const annYield = computeAnnualYield(lPrice, cPrice);
      const mRating = computeRatingFromSlabs(annYield, slabsMap.yieldRate);
      setForm((f) => {
        if (f.yieldRate === annYield.toFixed(2) && f.marketRating === mRating) return f;
        return { ...f, yieldRate: annYield.toFixed(2), marketRating: mRating };
      });
    }
  }, [form.listedPrice, form.currentPrice, slabsMap.yieldRate]);

  function addImage() {
    const url = newImageUrl.trim();
    if (!url) return;
    setImages((prev) => [...prev, url]);
    setNewImageUrl("");
  }

  function addVideo() {
    const url = newVideoUrl.trim();
    if (!url) return;
    setVideos((prev) => [...prev, url]);
    setNewVideoUrl("");
  }

  async function uploadFiles(files: FileList | null, kind: "images" | "videos" | "pdfs") {
    if (!files?.length) return;
    const limits = { images: MEDIA_LIMITS.images, videos: MEDIA_LIMITS.videos, pdfs: MEDIA_LIMITS.pdfs };
    const counts = { images: images.length, videos: videos.length, pdfs: pdfs.length };
    const mediaKind = kind === "images" ? "image" : kind === "videos" ? "video" : "pdf";

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (counts[kind] >= limits[kind]) {
          throw new Error(`Maximum ${limits[kind]} ${kind} allowed.`);
        }
        const fd = new FormData();
        fd.append("file", file);
        fd.append("kind", mediaKind);
        fd.append("currentCount", String(counts[kind]));
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        if (kind === "images") {
          setImages((prev) => [...prev, data.url]);
          counts.images++;
        } else if (kind === "videos") {
          setVideos((prev) => [...prev, data.url]);
          counts.videos++;
        } else {
          setPdfs((prev) => [...prev, { name: data.name || file.name, url: data.url }]);
          counts.pdfs++;
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      title: form.title,
      symbol: form.symbol,
      description: form.description,
      price: parseFloat(form.price),
      listedPrice: form.listedPrice ? parseFloat(form.listedPrice) : null,
      currentPrice: form.currentPrice ? parseFloat(form.currentPrice) : null,
      rentMonthly:
        form.listingType === "RENT" && form.rentMonthly
          ? parseFloat(form.rentMonthly)
          : null,
      city: form.city,
      state: form.state,
      address: form.address,
      zip: form.zip,
      country: form.country,
      type: form.type,
      status: form.status,
      listingType: form.listingType,
      category: form.category || null,
      area: form.area || null,
      bhk: form.bhk || null,
      bedrooms: parseInt(form.bedrooms, 10) || 0,
      bathrooms: parseFloat(form.bathrooms) || 0,
      rooms: form.rooms ? parseInt(form.rooms, 10) : null,
      garages: parseInt(form.garages, 10) || 0,
      sqft: form.sqft ? parseInt(form.sqft, 10) : null,
      lotSize: form.lotSize ? parseInt(form.lotSize, 10) : null,
      totalFloors: form.totalFloors ? parseInt(form.totalFloors, 10) : null,
      floorNumber: form.floorNumber ? parseInt(form.floorNumber, 10) : null,
      furnishingStatus: form.furnishingStatus || null,
      hasServantRoom: form.hasServantRoom,
      hasPujaRoom: form.hasPujaRoom,
      hasStudyRoom: form.hasStudyRoom,
      balconies: parseInt(form.balconies, 10) || 0,
      liftType: form.liftType || null,
      flatsPerFloor: form.flatsPerFloor ? parseInt(form.flatsPerFloor, 10) : null,
      availabilityStatus: form.availabilityStatus || null,
      images,
      videos,
      pdfs,
      features: form.features.split(",").map((f) => f.trim()).filter(Boolean),
      videoUrl: form.videoUrl || null,
      virtualTourUrl: form.virtualTourUrl || null,
      mapLat: form.mapLat ? parseFloat(form.mapLat) : null,
      mapLng: form.mapLng ? parseFloat(form.mapLng) : null,
      agentId: form.agentId,
      yieldRate: parseFloat(form.yieldRate),
      capRate: parseFloat(form.capRate),
      interestRate: parseFloat(form.interestRate),
      brokerageRate: parseFloat(form.brokerageRate) || 3.0,
      change24h: parseFloat(form.change24h),
      change7d: parseFloat(form.change7d),
      change1m: parseFloat(form.change1m) || 0,
      change6m: parseFloat(form.change6m) || 0,
      changeYtd: parseFloat(form.changeYtd),
      marketRating: form.marketRating,
      volumeScore: parseInt(form.volumeScore, 10) || 0,
      featured: form.featured,
      yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt, 10) : null,
      customFields: JSON.stringify(customFields),
    };

    const url = isEdit
      ? `/api/admin/properties/${property!.id}`
      : "/api/admin/properties";
    const res = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }

    router.push("/admin/properties");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-4xl space-y-8">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Listing details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-600">Title</span>
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Symbol</span>
            <input
              required
              disabled={isEdit}
              value={form.symbol}
              onChange={(e) => set("symbol", e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono disabled:bg-slate-100"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Description</span>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-slate-600">Listed Price ({currencySymbol("INR")})</span>
              <input
                type="number"
                value={form.listedPrice}
                onChange={(e) => set("listedPrice", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Current Price ({currencySymbol("INR")})</span>
              <input
                type="number"
                value={form.currentPrice}
                onChange={(e) => set("currentPrice", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-slate-600">Final Price ({currencySymbol("INR")})</span>
            <input
              required
              type="number"
              min={1}
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Listing type</span>
            <select
              value={form.listingType}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({
                  ...f,
                  listingType: v as ListingType,
                  ...(v !== "RENT" ? { rentMonthly: "" } : {}),
                }));
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="SALE">Sales</option>
              <option value="RENT">Rentals</option>
            </select>
          </label>
          {form.listingType === "RENT" && (
            <label className="block text-sm">
              <span className="text-slate-600">Monthly rental value ({currencySymbol("INR")})</span>
              <input
                type="number"
                min={1}
                required
                value={form.rentMonthly}
                onChange={(e) => set("rentMonthly", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="e.g. 2500"
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="text-slate-600">Category</span>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">Select category</option>
              {PROPERTY_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Area / neighborhood</span>
            <input
              value={form.area}
              onChange={(e) => set("area", e.target.value)}
              placeholder="e.g. Downtown, Marina"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Type</span>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {["RESIDENTIAL", "COMMERCIAL", "LAND", "RENTAL"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Status</span>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {["ACTIVE", "DRAFT", "PENDING", "SOLD", "RENTED"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Agent</span>
            <select
              value={form.agentId}
              onChange={(e) => set("agentId", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.email})
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm pt-6">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured", e.target.checked)}
            />
            Featured listing
          </label>
          {renderCustomFieldsSection("listing_details")}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Photos &amp; media</h2>
        <p className="text-sm text-slate-500">
          {mediaLimitLabel("images")} · {mediaLimitLabel("videos")} · {mediaLimitLabel("pdfs")}
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            className="flex-1 min-w-[200px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <Button type="button" variant="secondary" onClick={addImage} disabled={images.length >= MEDIA_LIMITS.images}>
            <Plus className="h-4 w-4" />
            Add URL
          </Button>
          <label className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm ${images.length >= MEDIA_LIMITS.images ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-slate-50"}`}>
            <Upload className="h-4 w-4" />
            Upload images ({images.length}/{MEDIA_LIMITS.images})
            <input type="file" accept="image/*" multiple className="hidden" disabled={images.length >= MEDIA_LIMITS.images} onChange={(e) => uploadFiles(e.target.files, "images")} />
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-24 w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 rounded bg-red-600 p-1 text-white opacity-90"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        {images.length === 0 && (
          <p className="text-sm text-slate-500">No images yet — add URLs or upload files.</p>
        )}

        <div className="border-t pt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Videos</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="url"
              placeholder="https://player.vimeo.com/video/... or YouTube link"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              className="flex-1 min-w-[200px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addVideo}
              disabled={videos.length >= MEDIA_LIMITS.videos}
            >
              <Plus className="h-4 w-4" />
              Add URL
            </Button>
            <label className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm ${videos.length >= MEDIA_LIMITS.videos ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-slate-50"}`}>
              <Upload className="h-4 w-4" /> Upload video ({videos.length}/{MEDIA_LIMITS.videos})
              <input type="file" accept="video/*" multiple className="hidden" disabled={videos.length >= MEDIA_LIMITS.videos} onChange={(e) => uploadFiles(e.target.files, "videos")} />
            </label>
          </div>
          {videos.length > 0 && (
            <div className="space-y-2">
              {videos.map((url, i) => (
                <div key={i} className="flex items-center justify-between rounded border px-3 py-2 text-xs">
                  <span className="truncate font-mono text-slate-600">{url}</span>
                  <button type="button" onClick={() => setVideos((p) => p.filter((_, j) => j !== i))} className="text-red-600 font-medium hover:underline">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700">PDF documents</span>
            <label className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${pdfs.length >= MEDIA_LIMITS.pdfs ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-slate-50"}`}>
              <Upload className="h-3 w-3" /> Upload PDF ({pdfs.length}/{MEDIA_LIMITS.pdfs})
              <input type="file" accept="application/pdf" multiple className="hidden" disabled={pdfs.length >= MEDIA_LIMITS.pdfs} onChange={(e) => uploadFiles(e.target.files, "pdfs")} />
            </label>
          </div>
          {pdfs.map((pdf, i) => (
            <div key={i} className="flex items-center justify-between rounded border px-3 py-2 text-xs">
              <a href={pdf.url} target="_blank" rel="noreferrer" className="truncate text-gold-dark underline">{pdf.name}</a>
              <button type="button" onClick={() => setPdfs((p) => p.filter((_, j) => j !== i))} className="text-red-600">Remove</button>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 border-t pt-4">
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Features (comma-separated)</span>
            <input
              value={form.features}
              onChange={(e) => set("features", e.target.value)}
              placeholder="Pool, Gym, Sea View, Gated Community"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">YouTube / video URL</span>
            <input value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Virtual tour URL</span>
            <input value={form.virtualTourUrl} onChange={(e) => set("virtualTourUrl", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          {renderCustomFieldsSection("media")}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Rates & market</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["yieldRate", "Yield %"],
            ["capRate", "Cap rate %"],
            ["interestRate", "Interest rate %"],
            ["brokerageRate", "Brokerage rate %"],
            ["change7d", "7d change %"],
            ["change1m", "1m change %"],
            ["change6m", "6m change %"],
            ["changeYtd", "YTD change %"],
          ].map(([key, label]) => {
            const val = parseFloat(form[key as keyof typeof form] as string) || 0;
            const matchingSlab = computeSlabForValue(val, key, slabsMap[key]);

            return (
              <label key={key} className="block text-sm space-y-1">
                <span className="flex items-center justify-between text-slate-600">
                  <span className="font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    {matchingSlab && (
                      <span
                        className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold text-white shadow-sm transition"
                        style={{ backgroundColor: matchingSlab.color ?? "#64748b" }}
                      >
                        {matchingSlab.label}
                      </span>
                    )}
                  </div>
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={form[key as keyof typeof form] as string}
                  onChange={(e) => set(key, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            );
          })}
          <label className="block text-sm space-y-1">
            <span className="flex items-center justify-between text-slate-600">
              <span className="font-medium">Market rating</span>
            </span>
            <select
              value={form.marketRating}
              onChange={(e) => set("marketRating", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {(slabsMap.yieldRate && slabsMap.yieldRate.length > 0
                ? slabsMap.yieldRate.map((s) => s.label)
                : ["A+", "A", "B+", "B", "C"]
              ).map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm space-y-1">
            <span className="text-slate-600 font-medium">Volume score</span>
            <input
              type="number"
              value={form.volumeScore}
              onChange={(e) => set("volumeScore", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          {renderCustomFieldsSection("rates_market")}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Location & specs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="text-slate-600">Address</span>
            <input
              required
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">City</span>
            <input
              required
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">State</span>
            <input
              required
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">ZIP / PIN</span>
            <input
              required
              value={form.zip}
              onChange={(e) => set("zip", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Country</span>
            <div className="mt-1">
              <CountrySelect
                value={form.country}
                onChange={(code) => set("country", code)}
              />
            </div>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Configuration (BHK / Layout)</span>
            <select
              value={form.bhk}
              onChange={(e) => set("bhk", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white"
            >
              <option value="">— Select BHK —</option>
              {(bhkConfigurations.length > 0
                ? bhkConfigurations
                : [
                    "1BHK",
                    "1.5BHK",
                    "2BHK",
                    "2.5BHK",
                    "3BHK",
                    "3.5BHK",
                    "4BHK",
                    "4.5BHK",
                    "5BHK",
                    "6BHK",
                    "7BHK",
                    "7+BHK",
                    "Simplex",
                    "Duplex",
                    "Triplex",
                    "Penthouse",
                  ]
              ).map((cfg) => (
                <option key={cfg} value={cfg}>
                  {cfg}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Bedrooms</span>
            <input
              type="number"
              value={form.bedrooms}
              onChange={(e) => set("bedrooms", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Bathrooms</span>
            <input
              type="number"
              step="0.5"
              value={form.bathrooms}
              onChange={(e) => set("bathrooms", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Sq ft</span>
            <input
              type="number"
              value={form.sqft}
              onChange={(e) => set("sqft", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Rooms</span>
            <input type="number" value={form.rooms} onChange={(e) => set("rooms", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Garages</span>
            <input type="number" value={form.garages} onChange={(e) => set("garages", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Lot size (sq ft)</span>
            <input type="number" value={form.lotSize} onChange={(e) => set("lotSize", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Total floors</span>
            <input
              type="number"
              value={form.totalFloors}
              onChange={(e) => set("totalFloors", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Flats per floor</span>
            <input
              type="number"
              value={form.flatsPerFloor}
              onChange={(e) => set("flatsPerFloor", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Floor number</span>
            <input
              type="number"
              value={form.floorNumber}
              onChange={(e) => set("floorNumber", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Balconies</span>
            <input
              type="number"
              value={form.balconies}
              onChange={(e) => set("balconies", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Lift Type</span>
            <select
              value={form.liftType}
              onChange={(e) => set("liftType", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">None</option>
              <option value="Common Lift">Common Lift</option>
              <option value="Personal Lift">Personal Lift</option>
              <option value="No Lift">No Lift</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Furnishing Status</span>
            <select
              value={form.furnishingStatus}
              onChange={(e) => set("furnishingStatus", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">None</option>
              <option value="Fully Furnished">Fully Furnished</option>
              <option value="Semi Furnished">Semi Furnished</option>
              <option value="Unfurnished">Unfurnished</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Availability</span>
            <select
              value={form.availabilityStatus}
              onChange={(e) => set("availabilityStatus", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">None</option>
              <option value="Available">Available</option>
              <option value="Sold">Sold</option>
              <option value="Rented">Rented</option>
            </select>
          </label>
          <div className="col-span-2 grid grid-cols-3 gap-2 mt-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.hasServantRoom} onChange={(e) => set("hasServantRoom", e.target.checked)} />
              Servant Room
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.hasPujaRoom} onChange={(e) => set("hasPujaRoom", e.target.checked)} />
              Puja Ghar
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.hasStudyRoom} onChange={(e) => set("hasStudyRoom", e.target.checked)} />
              Study Room
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-slate-600">Map latitude</span>
            <input type="number" step="any" value={form.mapLat} onChange={(e) => set("mapLat", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Map longitude</span>
            <input type="number" step="any" value={form.mapLng} onChange={(e) => set("mapLng", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Year built</span>
            <input
              type="number"
              value={form.yearBuilt}
              onChange={(e) => set("yearBuilt", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          {renderCustomFieldsSection("location_specs")}
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" variant="gold" loading={loading || uploading}>
          {isEdit ? "Save property" : "Create property"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
