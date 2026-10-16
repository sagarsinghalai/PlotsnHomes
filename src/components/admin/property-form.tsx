"use client";

import type { Property, PropertyStatus, PropertyType, ListingType, User } from "@prisma/client";
import { MapPin, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/ui/country-select";
import { DEFAULT_COUNTRY_CODE, currencySymbol } from "@/lib/locale-defaults";
import { MEDIA_LIMITS, mediaLimitLabel } from "@/lib/media-limits";
import { PROPERTY_CATEGORIES } from "@/lib/property-categories";
import { parseImages, parseJsonArray } from "@/lib/utils";
import { computeAnnualYield, computeRatingFromSlabs, computeSlabForValue, type RatingSlabInput } from "@/lib/calculations";
import { logActivity } from "@/lib/activity-logs";

import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

type Agent = Pick<User, "id" | "name" | "email">;
type DeveloperOption = { id: string; name: string };
type ProjectOption = { id: string; name: string; developerId: string | null };

type PropertyFormProps = {
  agents: Agent[];
  property?: Property & { agent?: Agent | null };
  bhkConfigurations?: string[];
  developers?: DeveloperOption[];
  projects?: ProjectOption[];
};

export function PropertyForm({
  agents,
  property,
  bhkConfigurations = [],
  developers = [],
  projects = [],
}: PropertyFormProps) {
  const router = useRouter();
  const { hasAddPermission, hasEditPermission } = useAdminPermissions();
  const canAdd = hasAddPermission("/admin/properties");
  const canEdit = hasEditPermission("/admin/properties");
  const isEdit = Boolean(property);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slabsMap, setSlabsMap] = useState<Record<string, RatingSlabInput[]>>({});

  const [gmapUrl, setGmapUrl] = useState("");
  const [gmapLoading, setGmapLoading] = useState(false);
  const [gmapStatus, setGmapStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const parseGoogleMapsLink = async (inputUrl: string) => {
    const url = inputUrl.trim();
    if (!url) return;
    setGmapLoading(true);
    setGmapStatus(null);

    try {
      const res = await fetch(`/api/admin/parse-maps-url?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      setGmapLoading(false);

      if (res.ok && data.lat && data.lng) {
        setForm((f) => ({
          ...f,
          mapLat: data.lat,
          mapLng: data.lng,
        }));
        setGmapStatus({
          type: "success",
          message: `✓ Extracted: Lat ${data.lat}, Lng ${data.lng}`,
        });
      } else {
        setGmapStatus({
          type: "error",
          message: data.error || "Could not extract coordinates from link",
        });
      }
    } catch {
      setGmapLoading(false);
      setGmapStatus({
        type: "error",
        message: "Failed to parse Google Maps link",
      });
    }
  };

const PRICING_KEYS = [
  "sharePrice",
  "totalShares",
  "sharesSold",
  "buyFee",
  "sellFee",
  "mgmtFee",
  "wdrFee",
  "listingFee",
  "specs",
];

function parseCustomFieldsObject(raw: any): Record<string, any> {
  if (!raw) return {};
  try {
    let parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (typeof parsed === "string") {
      parsed = JSON.parse(parsed);
    }
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch (err) {
    console.error("Failed to parse customFields object:", err);
  }
  return {};
}

function safeParseCustomFields(raw: any): Array<{ id: string; section: string; label: string; value: string }> {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item && typeof item === "object");
    }
    if (typeof parsed === "object" && parsed !== null) {
      if (Array.isArray(parsed.specs)) {
        return parsed.specs;
      }
      return Object.entries(parsed)
        .filter(([label]) => !PRICING_KEYS.includes(label))
        .map(([label, value]) => ({
          id: Math.random().toString(36).substring(2, 9),
          section: "location_specs",
          label,
          value: typeof value === "object" ? JSON.stringify(value) : String(value ?? ""),
        }));
    }
  } catch (err) {
    console.error("Failed to parse property customFields:", err);
  }
  return [];
}

  // Custom specifications state
  const [customFields, setCustomFields] = useState<{
    id: string;
    section: string;
    label: string;
    value: string;
  }[]>(() => safeParseCustomFields(property?.customFields));

  // Custom field creation state
  const [addingFieldInSection, setAddingFieldInSection] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const [dynamicCategories, setDynamicCategories] = useState<string[]>([...PROPERTY_CATEGORIES]);
  const [dynamicListingTypes, setDynamicListingTypes] = useState<Array<{ value: string; label: string }>>([
    { value: "SALE", label: "Sales" },
    { value: "RENT", label: "Rentals" },
    { value: "LEASE", label: "Lease" },
    { value: "PG", label: "PG / Hostel" },
  ]);
  const [dynamicTypes, setDynamicTypes] = useState<string[]>(["RESIDENTIAL", "COMMERCIAL", "LAND", "RENTAL", "INDUSTRIAL", "HOSPITALITY"]);
  const [dynamicStatuses, setDynamicStatuses] = useState<string[]>(["ACTIVE", "DRAFT", "PENDING", "SOLD", "RENTED", "UNDER_OFFER"]);

  const [propertyDropdownsMap, setPropertyDropdownsMap] = useState<Record<string, Array<{ label: string; value: string }>>>({});

  async function loadAllCategoriesAndOptions() {
    try {
      // First fetch custom site settings dropdowns for properties
      const settingsRes = await fetch("/api/settings/dropdowns");
      if (settingsRes.ok) {
        const sData = await settingsRes.json();
        if (sData.sections && Array.isArray(sData.sections)) {
          const propSec = sData.sections.find((s: any) => s.sectionKey === "properties");
          if (propSec && Array.isArray(propSec.fields)) {
            const map: Record<string, Array<{ label: string; value: string }>> = {};
            propSec.fields.forEach((field: any) => {
              map[field.key] = (field.options || [])
                .filter((o: any) => o.enabled !== false)
                .map((o: any) => ({ label: o.label, value: o.value }));
            });
            setPropertyDropdownsMap(map);

            if (map.listing_type?.length) {
              setDynamicListingTypes(map.listing_type.map((o) => ({ value: o.value, label: o.label })));
            }
            if (map.property_category?.length) {
              setDynamicCategories(map.property_category.map((o) => o.label));
            }
            if (map.property_type?.length) {
              setDynamicTypes(map.property_type.map((o) => o.value));
            }
            if (map.property_status?.length) {
              setDynamicStatuses(map.property_status.map((o) => o.value));
            }
          }
        }
      }

      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          const catNames = data.categories.map((c: any) => c.name);
          setDynamicCategories((prev) => Array.from(new Set([...prev, ...PROPERTY_CATEGORIES, ...catNames])));
        }
      }
    } catch (err) {
      console.error("Failed to load categories options:", err);
    }
  }

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
    loadAllCategoriesAndOptions();
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
    return (
      <div className="col-span-2 space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 mt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Custom Specifications
          </h3>
          {addingFieldInSection !== sectionKey && (
            <button
              type="button"
              onClick={() => startAddCustomField(sectionKey)}
              className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add custom detail
            </button>
          )}
        </div>

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

  const initialPriceVal = property?.price ? property.price : 1200000;
  const initialCustomObj = parseCustomFieldsObject(property?.customFields);
  const initialSharePrice = initialCustomObj.sharePrice ?? (initialPriceVal ? Math.round(initialPriceVal / 2500) : 480);
  const initialTotalShares = initialCustomObj.totalShares ?? (initialPriceVal && initialSharePrice ? Math.round(initialPriceVal / initialSharePrice) : 2500);
  const initialSharesSold = initialCustomObj.sharesSold ?? Math.round(initialTotalShares * 0.68);
  const initialBuyFee = initialCustomObj.buyFee ?? property?.brokerageRate ?? 0.5;
  const initialSellFee = initialCustomObj.sellFee ?? 0.3;
  const initialMgmtFee = initialCustomObj.mgmtFee ?? 1.2;
  const initialWdrFee = initialCustomObj.wdrFee ?? 0.2;
  const initialListingFee = initialCustomObj.listingFee ?? 2.5;

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
    developerId: (property as any)?.developerId ?? "",
    projectId: (property as any)?.projectId ?? "",
    yieldRate: property?.yieldRate?.toString() ?? "5.5",
    capRate: property?.capRate?.toString() ?? "5.0",
    interestRate: property?.interestRate?.toString() ?? "6.5",
    brokerageRate: property?.brokerageRate?.toString() ?? initialBuyFee.toString(),
    sharePrice: initialSharePrice.toString(),
    totalShares: initialTotalShares.toString(),
    sharesSold: initialSharesSold.toString(),
    buyFee: initialBuyFee.toString(),
    sellFee: initialSellFee.toString(),
    mgmtFee: initialMgmtFee.toString(),
    wdrFee: initialWdrFee.toString(),
    listingFee: initialListingFee.toString(),
    change24h: property?.change24h?.toString() ?? "0",
    change7d: property?.change7d?.toString() ?? "0",
    change1m: property?.change1m?.toString() ?? "0",
    change6m: property?.change6m?.toString() ?? "0",
    changeYtd: property?.changeYtd?.toString() ?? "0",
    marketRating: property?.marketRating ?? "B",
    volumeScore: property?.volumeScore?.toString() ?? "50",
    featured: property?.featured ?? false,
    yearBuilt: property?.yearBuilt?.toString() ?? "",
    basePriceRate: (property as any)?.basePriceRate?.toString() ?? "",
    softLaunchRate: (property as any)?.softLaunchRate?.toString() ?? "",
    preLaunchRate: (property as any)?.preLaunchRate?.toString() ?? "",
    launchRate: (property as any)?.launchRate?.toString() ?? "",
  });

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Auto-calculate yield and market rating based on Pre-Launch / Soft Launch Rate vs Current Price
  useEffect(() => {
    const softRate = parseFloat(form.softLaunchRate) || 0;
    const preRate = parseFloat(form.preLaunchRate) || 0;
    const launchRate = parseFloat(form.launchRate) || parseFloat(form.basePriceRate) || 0;
    const lPrice = parseFloat(form.listedPrice) || 0;
    const cRate = parseFloat(form.currentPrice) || 0;

    const baseVal = softRate > 0 ? softRate : (preRate > 0 ? preRate : (launchRate > 0 ? launchRate : lPrice));
    const currentVal = cRate > 0 ? cRate : parseFloat(form.price) || 0;

    if (baseVal > 0 && currentVal > 0) {
      const annYield = computeAnnualYield(baseVal, currentVal);
      const mRating = computeRatingFromSlabs(annYield, slabsMap.yieldRate);
      setForm((f) => {
        if (f.yieldRate === annYield.toFixed(2) && f.marketRating === mRating) return f;
        return { ...f, yieldRate: annYield.toFixed(2), marketRating: mRating };
      });
    }
  }, [form.softLaunchRate, form.preLaunchRate, form.launchRate, form.basePriceRate, form.currentPrice, form.listedPrice, form.price, slabsMap.yieldRate]);

  useEffect(() => {
    if (property) {
      const pVal = property.price ?? 1200000;
      const cObj = parseCustomFieldsObject(property.customFields);
      const sPrice = cObj.sharePrice ?? (pVal ? Math.round(pVal / 2500) : 480);
      const tShares = cObj.totalShares ?? (pVal && sPrice ? Math.round(pVal / sPrice) : 2500);
      const sSold = cObj.sharesSold ?? Math.round(tShares * 0.68);
      const bFee = cObj.buyFee ?? property.brokerageRate ?? 0.5;

      setForm((f) => ({
        ...f,
        price: property.price?.toString() ?? f.price,
        yieldRate: property.yieldRate?.toString() ?? f.yieldRate,
        brokerageRate: property.brokerageRate?.toString() ?? bFee.toString(),
        sharePrice: sPrice.toString(),
        totalShares: tShares.toString(),
        sharesSold: sSold.toString(),
        buyFee: bFee.toString(),
        sellFee: (cObj.sellFee ?? 0.3).toString(),
        mgmtFee: (cObj.mgmtFee ?? 1.2).toString(),
        wdrFee: (cObj.wdrFee ?? 0.2).toString(),
        listingFee: (cObj.listingFee ?? 2.5).toString(),
      }));
    }
  }, [property]);

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
    if (isEdit && !canEdit) {
      setError("Permission denied: You do not have permission to edit properties.");
      return;
    }
    if (!isEdit && !canAdd) {
      setError("Permission denied: You do not have permission to add properties.");
      return;
    }
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
      developerId: form.developerId || null,
      projectId: form.projectId || null,
      yieldRate: parseFloat(form.yieldRate),
      capRate: parseFloat(form.capRate),
      interestRate: parseFloat(form.interestRate),
      brokerageRate: parseFloat(form.buyFee) || parseFloat(form.brokerageRate) || 0.5,
      change24h: parseFloat(form.change24h),
      change7d: parseFloat(form.change7d),
      change1m: parseFloat(form.change1m) || 0,
      change6m: parseFloat(form.change6m) || 0,
      changeYtd: parseFloat(form.changeYtd),
      marketRating: form.marketRating,
      volumeScore: parseInt(form.volumeScore, 10) || 0,
      featured: form.featured,
      yearBuilt: form.yearBuilt ? parseInt(form.yearBuilt, 10) : null,
      customFields: JSON.stringify({
        specs: customFields,
        sharePrice: parseFloat(form.sharePrice) || 0,
        totalShares: parseInt(form.totalShares, 10) || 0,
        sharesSold: parseInt(form.sharesSold, 10) || 0,
        buyFee: parseFloat(form.buyFee) || 0,
        sellFee: parseFloat(form.sellFee) || 0,
        mgmtFee: parseFloat(form.mgmtFee) || 0,
        wdrFee: parseFloat(form.wdrFee) || 0,
        listingFee: parseFloat(form.listingFee) || 0,
      }),
      basePriceRate: form.basePriceRate ? parseFloat(form.basePriceRate) : null,
      softLaunchRate: form.softLaunchRate ? parseFloat(form.softLaunchRate) : null,
      preLaunchRate: form.preLaunchRate ? parseFloat(form.preLaunchRate) : null,
      launchRate: form.launchRate ? parseFloat(form.launchRate) : null,
    };

    const url = isEdit
      ? `/api/admin/properties/${property!.id}`
      : "/api/admin/properties";
    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        window.location.href = "/login?error=SessionExpired";
        return;
      }

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error ?? "Save failed");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (res.ok) {
        logActivity({
          category: "agent",
          action: isEdit ? "Property Listing Modified" : "New Property Listing Created",
          actorName: "Bhavya",
          actorRole: "SUPERADMIN",
          actorEmail: "bhavya@gmail.com",
          target: form.title.trim(),
          details: isEdit
            ? `Updated property specs, pricing, and media assets for ${form.title.trim()}.`
            : `Created new property listing for ${form.title.trim()} priced at ₹${form.price} in ${form.city || form.country}.`,
        });

        router.push("/admin/properties");
        router.refresh();
      }
    } catch (err) {
      setLoading(false);
      setError("An unexpected error occurred while saving.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
                min="0"
                value={form.listedPrice}
                onChange={(e) => set("listedPrice", e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-600">Current Price ({currencySymbol("INR")})</span>
              <input
                type="number"
                min="0"
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

          {/* Launch Stage Pricing & Appreciation Section (PriceFilters.xlsx) */}
          <div className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-4 space-y-4 my-2">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Launch Stage Pricing & Appreciation (Price Filters)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Configured as per PriceFilters.xlsx formula logic (Rate/sqft, Area, Appreciation % & Amount)</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Formula Sync
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <label className="block text-xs space-y-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Soft Launch Rate (₹/sqft)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 6000"
                  value={form.softLaunchRate}
                  onChange={(e) => set("softLaunchRate", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5 text-sm focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </label>

              <label className="block text-xs space-y-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Pre-Launch Rate (₹/sqft)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 6500"
                  value={form.preLaunchRate}
                  onChange={(e) => set("preLaunchRate", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5 text-sm focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </label>

              <label className="block text-xs space-y-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Launch Price (₹/sqft)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 7000"
                  value={form.launchRate}
                  onChange={(e) => set("launchRate", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5 text-sm focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </label>

              <label className="block text-xs space-y-1">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">Current Price (₹/sqft)</span>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 7300"
                  value={form.currentPrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((f) => {
                      const cRate = parseFloat(val) || 0;
                      const areaSq = parseFloat(f.sqft) || 1000;
                      const calcPrice = cRate > 0 ? (cRate * areaSq).toString() : f.price;
                      return {
                        ...f,
                        currentPrice: val,
                        price: calcPrice,
                      };
                    });
                  }}
                  className="w-full rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/40 px-3 py-1.5 text-sm font-bold text-emerald-950 dark:text-emerald-200 focus:border-gold focus:ring-1 focus:ring-gold"
                />
              </label>
            </div>

            {/* PriceFilters.xlsx Exact Calculations Table */}
            {(() => {
              const sqft = parseFloat(form.sqft) || 1000;
              const soft = parseFloat(form.softLaunchRate) || 0;
              const pre = parseFloat(form.preLaunchRate) || 0;
              const launch = parseFloat(form.launchRate) || 0;
              const current = parseFloat(form.currentPrice) || 0;

              const softTotal = soft * sqft;
              const preTotal = pre * sqft;
              const launchTotal = launch * sqft;
              const currentTotal = current * sqft;

              const baseRate = soft > 0 ? soft : (pre > 0 ? pre : (launch > 0 ? launch : 0));
              const baseTotal = baseRate * sqft;

              const appAmount = current > 0 && baseRate > 0 ? current - baseRate : 0;
              const appTotalAmount = currentTotal > 0 && baseTotal > 0 ? currentTotal - baseTotal : 0;
              const appPct = baseRate > 0 && current > 0 ? ((current - baseRate) / baseRate) * 100 : 0;

              return (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    PriceFilters.xlsx Data Matrix
                  </h4>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                        <th className="pb-2">Stage / Parameter</th>
                        <th className="pb-2 text-emerald-700 dark:text-emerald-400">rate/sqft</th>
                        <th className="pb-2 text-slate-700 dark:text-slate-300">Area (sqft)</th>
                        <th className="pb-2 text-gold-dark dark:text-gold">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      <tr>
                        <td className="py-2 font-semibold text-slate-900 dark:text-white">Soft Launch</td>
                        <td className="py-2 font-mono text-slate-800 dark:text-slate-200">{soft}</td>
                        <td className="py-2 font-mono text-slate-800 dark:text-slate-200">{sqft}</td>
                        <td className="py-2 font-mono font-bold text-slate-900 dark:text-white">₹{softTotal.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-900 dark:text-white">Pre Launch</td>
                        <td className="py-2 font-mono text-slate-800 dark:text-slate-200">{pre}</td>
                        <td className="py-2 font-mono text-slate-800 dark:text-slate-200">{sqft}</td>
                        <td className="py-2 font-mono font-bold text-slate-900 dark:text-white">₹{preTotal.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-semibold text-slate-900 dark:text-white">Launch Price</td>
                        <td className="py-2 font-mono text-slate-800 dark:text-slate-200">{launch}</td>
                        <td className="py-2 font-mono text-slate-800 dark:text-slate-200">{sqft}</td>
                        <td className="py-2 font-mono font-bold text-slate-900 dark:text-white">₹{launchTotal.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr className="bg-emerald-50/80 dark:bg-emerald-950/60 font-bold">
                        <td className="py-2 text-emerald-900 dark:text-emerald-200 px-1">Current Price</td>
                        <td className="py-2 font-mono text-emerald-800 dark:text-emerald-300">{current}</td>
                        <td className="py-2 font-mono text-slate-900 dark:text-slate-200">{sqft}</td>
                        <td className="py-2 font-mono text-emerald-800 dark:text-emerald-300">₹{currentTotal.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr className="bg-amber-50/80 dark:bg-amber-950/60 font-bold border-t-2 border-slate-200 dark:border-slate-800">
                        <td className="py-2 text-amber-900 dark:text-amber-200 px-1">Appreciation (%)</td>
                        <td className="py-2 font-mono text-emerald-700 dark:text-emerald-400">+{appPct.toFixed(2)}%</td>
                        <td className="py-2 text-slate-400">—</td>
                        <td className="py-2 font-mono text-emerald-700 dark:text-emerald-400">+{appPct.toFixed(2)}%</td>
                      </tr>
                      <tr className="bg-amber-50/80 dark:bg-amber-950/60 font-bold">
                        <td className="py-2 text-amber-900 dark:text-amber-200 px-1">Appreciation (amount)</td>
                        <td className="py-2 font-mono text-emerald-700 dark:text-emerald-400">+{appAmount.toLocaleString("en-IN")}</td>
                        <td className="py-2 font-mono text-slate-800 dark:text-slate-200">{sqft}</td>
                        <td className="py-2 font-mono text-emerald-700 dark:text-emerald-400">+{appTotalAmount.toLocaleString("en-IN")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
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
              {dynamicListingTypes.map((lt) => (
                <option key={lt.value} value={lt.value}>
                  {lt.label}
                </option>
              ))}
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
              {dynamicCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
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
              {dynamicTypes.map((t) => (
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
              {dynamicStatuses.map((s) => (
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
          <label className="block text-sm">
            <span className="text-slate-600">Builder / developer</span>
            <select
              name="developerId"
              value={form.developerId}
              onChange={(e) => {
                const dev = e.target.value;
                setForm((f) => {
                  // Clear the project if it no longer belongs to the chosen builder.
                  const proj = projects.find((p) => p.id === f.projectId);
                  const keepProject = proj && proj.developerId === dev;
                  return { ...f, developerId: dev, projectId: keepProject ? f.projectId : "" };
                });
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">— None —</option>
              {developers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Project</span>
            <select
              name="projectId"
              value={form.projectId}
              onChange={(e) => set("projectId", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="">— None —</option>
              {(form.developerId
                ? projects.filter((p) => p.developerId === form.developerId)
                : projects
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
                className="absolute top-1 right-1 rounded-md bg-slate-900/80 hover:bg-rose-600 p-1 text-white opacity-90 transition"
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
                  onChange={(e) => {
                    const val = e.target.value;
                    if (key === "brokerageRate") {
                      setForm((f) => ({ ...f, brokerageRate: val, buyFee: val }));
                    } else {
                      set(key, val);
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
            );
          })}

          {/* Share Price */}
          <label className="block text-sm space-y-1">
            <span className="text-slate-600 font-medium">Share price (₹)</span>
            <input
              type="number"
              value={form.sharePrice}
              onChange={(e) => {
                const sp = parseFloat(e.target.value) || 0;
                const price = parseFloat(form.price) || 0;
                const derivedShares = sp > 0 && price > 0 ? Math.round(price / sp) : form.totalShares;
                setForm((f) => ({ ...f, sharePrice: e.target.value, totalShares: derivedShares.toString() }));
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-semibold"
            />
          </label>

          {/* Total Shares */}
          <label className="block text-sm space-y-1">
            <span className="text-slate-600 font-medium">Total shares</span>
            <input
              type="number"
              value={form.totalShares}
              onChange={(e) => {
                const ts = parseInt(e.target.value, 10) || 0;
                const price = parseFloat(form.price) || 0;
                const derivedSp = ts > 0 && price > 0 ? Math.round(price / ts) : form.sharePrice;
                setForm((f) => ({ ...f, totalShares: e.target.value, sharePrice: derivedSp.toString() }));
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-semibold"
            />
          </label>

          {/* Shares Sold */}
          <label className="block text-sm space-y-1">
            <span className="text-slate-600 font-medium">Shares sold</span>
            <input
              type="number"
              value={form.sharesSold}
              onChange={(e) => set("sharesSold", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>

          {/* Sell Fee % */}
          <label className="block text-sm space-y-1">
            <span className="text-slate-600 font-medium">Sell fee %</span>
            <input
              type="number"
              step="0.05"
              value={form.sellFee}
              onChange={(e) => set("sellFee", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>

          {/* Management Fee % */}
          <label className="block text-sm space-y-1">
            <span className="text-slate-600 font-medium">Management fee %</span>
            <input
              type="number"
              step="0.05"
              value={form.mgmtFee}
              onChange={(e) => set("mgmtFee", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>

          {/* Withdrawal Fee % */}
          <label className="block text-sm space-y-1">
            <span className="text-slate-600 font-medium">Withdrawal fee %</span>
            <input
              type="number"
              step="0.05"
              value={form.wdrFee}
              onChange={(e) => set("wdrFee", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>

          {/* Listing Fee % */}
          <label className="block text-sm space-y-1">
            <span className="text-slate-600 font-medium">Listing fee %</span>
            <input
              type="number"
              step="0.05"
              value={form.listingFee}
              onChange={(e) => set("listingFee", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>

          {/* Market Rating */}
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

          {/* Volume Score */}
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
              {(propertyDropdownsMap.configuration?.length
                ? propertyDropdownsMap.configuration.map((o) => o.label)
                : bhkConfigurations.length > 0
                ? bhkConfigurations
                : ["1BHK", "2BHK", "3BHK", "4BHK", "5BHK", "Studio", "Duplex", "Penthouse"]
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
              {(propertyDropdownsMap.lift_type?.length
                ? propertyDropdownsMap.lift_type.map((o) => o.label)
                : ["Common Lift", "Personal Lift", "No Lift", "Service Lift"]
              ).map((lt) => (
                <option key={lt} value={lt}>
                  {lt}
                </option>
              ))}
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
              {(propertyDropdownsMap.furnishing_status?.length
                ? propertyDropdownsMap.furnishing_status.map((o) => o.label)
                : ["Fully Furnished", "Semi Furnished", "Unfurnished"]
              ).map((fs) => (
                <option key={fs} value={fs}>
                  {fs}
                </option>
              ))}
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
              {(propertyDropdownsMap.availability?.length
                ? propertyDropdownsMap.availability.map((o) => o.label)
                : ["Available", "Sold", "Rented", "Under Offer", "Reserved"]
              ).map((av) => (
                <option key={av} value={av}>
                  {av}
                </option>
              ))}
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
          {/* Google Maps Link / Auto-Fetch Latitude & Longitude */}
          <div className="col-span-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-4 space-y-3 mt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Google Maps Link / Share URL</span>
                </span>
              </label>
              {gmapStatus && (
                <span className={`text-xs font-bold ${gmapStatus.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {gmapStatus.message}
                </span>
              )}
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-2">
              <input
                type="text"
                placeholder="Paste Google Maps URL (e.g. https://maps.google.com/?q=33.749,-84.388 or https://goo.gl/maps/...)"
                value={gmapUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setGmapUrl(val);
                  if (val.includes("@") || val.includes("q=") || val.includes("!3d") || val.includes(",")) {
                    parseGoogleMapsLink(val);
                  }
                }}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm focus:border-gold focus:ring-1 focus:ring-gold"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => parseGoogleMapsLink(gmapUrl)}
                loading={gmapLoading}
                className="gap-1.5 text-xs font-bold border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-100"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Fetch Coords</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <label className="block text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Map latitude</span>
                <input
                  type="number"
                  step="any"
                  value={form.mapLat}
                  onChange={(e) => set("mapLat", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white"
                  placeholder="e.g. 33.749"
                />
              </label>
              <label className="block text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">Map longitude</span>
                <input
                  type="number"
                  step="any"
                  value={form.mapLng}
                  onChange={(e) => set("mapLng", e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white"
                  placeholder="e.g. -84.388"
                />
              </label>
            </div>
          </div>
          <label className="block text-sm">
            <span className="text-slate-600">Year built</span>
            <input
              type="number"
              value={form.yearBuilt}
              onChange={(e) => set("yearBuilt", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>

          {/* Dynamically added custom fields appear immediately after Year built */}
          {Array.isArray(customFields) && customFields.map((cf) => (
            <label key={cf.id} className="block text-sm relative group">
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-700 font-semibold">{cf.label}</span>
                <button
                  type="button"
                  onClick={() => removeCustomField(cf.id)}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium transition flex items-center gap-0.5"
                  title={`Remove ${cf.label}`}
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
              <input
                type="text"
                value={cf.value}
                onChange={(e) => updateCustomFieldValue(cf.id, e.target.value)}
                placeholder={`Enter ${cf.label}...`}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white text-slate-900 transition text-sm"
              />
            </label>
          ))}

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
