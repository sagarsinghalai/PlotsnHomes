"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { searchParamsToQuery } from "@/lib/property-search";

const CATEGORIES = [
  "Apartment",
  "Villa",
  "Penthouse",
  "Townhouse",
  "Land/Plot",
  "Commercial",
  "Duplex",
  "Full Floor",
];

const AMENITIES: [string, string][] = [
  ["fChairAccessible", "Accessible"],
  ["fElevator", "Elevator"],
  ["fPool", "Pool"],
  ["fVentilation", "Ventilation"],
  ["fWasherDryer", "Laundry"],
  ["fWater", "Water"],
  ["fWifi", "WiFi"],
];

// ── Per screenshot: Buy min/max based on type ──────────────────────────────
const BUY_MIN_STANDARD = [
  { value: "0",         label: "Min" },
  { value: "500000",    label: "₹5 Lac" },
  { value: "1000000",   label: "₹10 Lac" },
  { value: "2000000",   label: "₹20 Lac" },
  { value: "3000000",   label: "₹30 Lac" },
  { value: "4000000",   label: "₹40 Lac" },
  { value: "5000000",   label: "₹50 Lac" },
  { value: "10000000",  label: "₹1 Cr" },
  { value: "20000000",  label: "₹2 Cr" },
  { value: "50000000",  label: "₹5 Cr" },
  { value: "100000000", label: "₹10 Cr" },
];

const BUY_MAX_STANDARD = [
  { value: "500000",    label: "₹5 Lac" },
  { value: "1000000",   label: "₹10 Lac" },
  { value: "2000000",   label: "₹20 Lac" },
  { value: "5000000",   label: "₹50 Lac" },
  { value: "10000000",  label: "₹1 Cr" },
  { value: "50000000",  label: "₹5 Cr" },
  { value: "100000000", label: "₹10 Cr" },
  { value: "200000000", label: "₹20 Cr+" },
  { value: "999999999", label: "Max" },
];

const BUY_MIN_LAND = [
  { value: "0",         label: "Min" },
  { value: "50000",     label: "₹50,000" },
  { value: "100000",    label: "₹1 Lac" },
  { value: "500000",    label: "₹5 Lac" },
  { value: "1000000",   label: "₹10 Lac" },
  { value: "5000000",   label: "₹50 Lac" },
  { value: "10000000",  label: "₹1 Cr" },
  { value: "100000000", label: "₹10 Cr" },
  { value: "500000000", label: "₹50 Cr" },
];

const BUY_MAX_LAND = [
  { value: "100000",    label: "₹1 Lac" },
  { value: "500000",    label: "₹5 Lac" },
  { value: "1000000",   label: "₹10 Lac" },
  { value: "5000000",   label: "₹50 Lac" },
  { value: "10000000",  label: "₹1 Cr" },
  { value: "100000000", label: "₹10 Cr" },
  { value: "500000000", label: "₹50 Cr" },
  { value: "1000000000",label: "₹100 Cr+" },
  { value: "999999999", label: "Max" },
];

// ── Per screenshot: Rental min/max based on type ────────────────────────────
const RENT_MIN_STANDARD = [
  { value: "0",      label: "Min" },
  { value: "5000",   label: "₹5,000" },
  { value: "10000",  label: "₹10,000" },
  { value: "20000",  label: "₹20,000" },
  { value: "50000",  label: "₹50,000" },
  { value: "100000", label: "₹1 Lac" },
  { value: "200000", label: "₹2 Lac" },
  { value: "500000", label: "₹5 Lac" },
];

const RENT_MAX_STANDARD = [
  { value: "10000",  label: "₹10,000" },
  { value: "20000",  label: "₹20,000" },
  { value: "50000",  label: "₹50,000" },
  { value: "100000", label: "₹1 Lac" },
  { value: "200000", label: "₹2 Lac" },
  { value: "500000", label: "₹5 Lac" },
  { value: "1000000", label: "₹10 Lac+" },
  { value: "999999999", label: "Max" },
];

const RENT_MAX_LAND = [
  { value: "10000",  label: "₹10,000" },
  { value: "50000",  label: "₹50,000" },
  { value: "100000", label: "₹1 Lac" },
  { value: "500000", label: "₹5 Lac" },
  { value: "1000000", label: "₹10 Lac" },
  { value: "10000000",label: "₹1 Cr" },
  { value: "100000000",label: "₹10 Cr+" },
  { value: "999999999", label: "Max" },
];

const FURNISHING_OPTIONS = [
  { value: "Fully Furnished",  label: "Fully Furnished" },
  { value: "Semi Furnished",   label: "Semi Furnished" },
  { value: "Unfurnished",      label: "Unfurnished" },
];

function formatIndianPrice(value: number) {
  if (value === 0) return "Min";
  if (value === 999999999) return "Max";
  if (value >= 10000000) {
    const cr = value / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(1)} Cr`;
  }
  if (value >= 100000) {
    const lac = value / 100000;
    return `₹${lac % 1 === 0 ? lac : lac.toFixed(1)} Lac`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

type Props = {
  priceMin: number;
  priceMax: number;
  cities: { city: string; state: string }[];
  areas: string[];
  suggestions?: { title: string; symbol: string }[];
  bhkOptions?: string[];
};

const fieldClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all duration-200 hover:border-slate-300";

export function WpHeroSearch({ priceMin, priceMax, cities, areas, suggestions = [], bhkOptions = [] }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [listingType, setListingType] = useState(params.get("listingType") || "SALE");
  const [showMore, setShowMore] = useState(
    AMENITIES.some(([k]) => params.get(k) === "1")
  );
  const [priceRange, setPriceRange] = useState([
    parseInt(params.get("minPrice") || "0", 10),
    parseInt(params.get("maxPrice") || "999999999", 10),
  ]);
  const [furnishing, setFurnishing] = useState(params.get("furnishing") || "");
  const [bhk, setBhk] = useState(params.get("bhk") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [customMinPrice, setCustomMinPrice] = useState("");
  const [customMaxPrice, setCustomMaxPrice] = useState("");

  const pMin = Math.round(priceMin);
  const pMax = Math.round(priceMax);

  const handleTabChange = (type: string) => {
    setListingType(type);
    setFurnishing("");
    setBhk("");
    if (type === "RENT") {
      setPriceRange([0, 1000000]);
    } else {
      setPriceRange([pMin, pMax]);
    }
  };

  const isLandOrCommercial = category === "Land/Plot" || category === "Commercial";
  const isRentalLarge = category === "Land/Plot" || category === "Commercial" || category === "Duplex" || category === "Full Floor";

  const minOptions = listingType === "SALE" 
    ? (isLandOrCommercial ? BUY_MIN_LAND : BUY_MIN_STANDARD)
    : RENT_MIN_STANDARD;

  const maxOptions = listingType === "SALE"
    ? (isLandOrCommercial ? BUY_MAX_LAND : BUY_MAX_STANDARD)
    : (isRentalLarge ? RENT_MAX_LAND : RENT_MAX_STANDARD);

  const currentMinVal = priceRange[0];
  const hasMinOption = minOptions.some((opt) => +opt.value === currentMinVal);
  const displayMinOptions = hasMinOption
    ? minOptions
    : [{ value: String(currentMinVal), label: formatIndianPrice(currentMinVal) }, ...minOptions].sort((a, b) => +a.value - +b.value);

  const currentMaxVal = priceRange[1];
  const hasMaxOption = maxOptions.some((opt) => +opt.value === currentMaxVal);
  const displayMaxOptions = hasMaxOption
    ? maxOptions
    : [{ value: String(currentMaxVal), label: formatIndianPrice(currentMaxVal) }, ...maxOptions].sort((a, b) => +a.value - +b.value);

  function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next: Record<string, string> = { listingType };

    // Use custom price if entered, else dropdown value
    const minP = customMinPrice.trim() || (priceRange[0] > 0 ? String(priceRange[0]) : "");
    const maxP = customMaxPrice.trim() || (priceRange[1] < 999999999 ? String(priceRange[1]) : "");
    if (minP) next.minPrice = minP;
    if (maxP) next.maxPrice = maxP;
    if (furnishing) next.furnishing = furnishing;
    if (bhk) next.bhk = bhk;

    [
      "q",
      "city",
      "area",
      "minBeds",
      "minBaths",
      "minSqft",
      "minBalconies",
      "liftType",
      "flatsPerFloor",
      "availabilityStatus",
      ...AMENITIES.map(([k]) => k),
    ].forEach((k) => {
      const v = fd.get(k)?.toString();
      if (v) next[k] = v;
    });

    ["servantRoom", "pujaRoom", "studyRoom"].forEach((k) => {
      if (fd.get(k)) next[k] = "1";
    });

    if (category) next.category = category;

    startTransition(() => {
      router.push(`/properties?${searchParamsToQuery(next)}`);
    });
  }

  return (
    <div className="mx-auto max-w-4xl rounded-xl bg-white shadow-2xl shadow-slate-950/15 border border-slate-200/80 overflow-hidden transition-all duration-300">
      {/* Sale / Rent Tabs Segmented Control */}
      <div className="flex items-center justify-between border-b border-slate-100/80 bg-slate-50/50 p-4 pb-3">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50">
          {[
            { id: "SALE", label: "Buy Properties" },
            { id: "RENT", label: "Rent / Lease" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-5 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                listingType === tab.id
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="hidden sm:block text-xs font-semibold text-slate-400 tracking-wide uppercase">
          PlotsnHomes Portal
        </div>
      </div>

      {/* Furnishing quick-pick — shown for RENT only */}
      {listingType === "RENT" && (
        <div className="flex items-center gap-2 px-5 pt-3 pb-0 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Furnishing:</span>
          {FURNISHING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFurnishing(furnishing === opt.value ? "" : opt.value)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold transition-all duration-150 ${
                furnishing === opt.value
                  ? "border-gold bg-gold text-slate-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-gold/50 hover:bg-gold/10"
              }`}
            >
              {furnishing === opt.value && <X className="h-3 w-3" />}
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* BHK Configuration quick-pick — shown when bhkOptions exist */}
      {bhkOptions.length > 0 && (
        <div className="flex items-center gap-2 px-5 pt-3 pb-0 flex-wrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BHK / Config:</span>
          {bhkOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setBhk(bhk === opt ? "" : opt)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold transition-all duration-150 ${
                bhk === opt
                  ? "border-gold bg-gold text-slate-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-gold/50 hover:bg-gold/10"
              }`}
            >
              {bhk === opt && <X className="h-3 w-3" />}
              {opt}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={search} className="p-4 sm:p-5">
        {/* Primary filters — Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Search Box */}
          <div className="lg:col-span-6 relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Search Property
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                name="q"
                type="text"
                list="property-suggestions"
                defaultValue={params.get("q") ?? ""}
                placeholder="Property name, symbol ID (e.g. BV-TN-0012), or city..."
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all duration-200 hover:border-slate-300"
              />
              {suggestions.length > 0 && (
                <datalist id="property-suggestions">
                  {suggestions.map((s) => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.title}
                    </option>
                  ))}
                </datalist>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="relative">
              <select
                name="category"
                className={fieldClass + " appearance-none"}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            </div>
          </div>

          {/* City */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              City
            </label>
            <select name="city" defaultValue={params.get("city") ?? ""} className={fieldClass}>
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={`${c.city}-${c.state}`} value={c.city}>
                  {c.city}
                </option>
              ))}
            </select>
          </div>

          {/* Area */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Area / Locality
            </label>
            <select name="area" defaultValue={params.get("area") ?? ""} className={fieldClass}>
              <option value="">All Areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Min Price */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Min Price
            </label>
            <div className="space-y-1">
              <select
                value={priceRange[0]}
                onChange={(e) =>
                  setPriceRange([Math.min(+e.target.value || 0, priceRange[1]), priceRange[1]])
                }
                className={fieldClass}
              >
                {displayMinOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Custom amount"
                value={customMinPrice}
                onChange={(e) => setCustomMinPrice(e.target.value)}
                className="w-full rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Max Price */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Max Price
            </label>
            <div className="space-y-1">
              <select
                value={priceRange[1]}
                onChange={(e) =>
                  setPriceRange([priceRange[0], Math.max(+e.target.value || 999999999, priceRange[0])])
                }
                className={fieldClass}
              >
                {displayMaxOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Custom amount"
                value={customMaxPrice}
                onChange={(e) => setCustomMaxPrice(e.target.value)}
                className="w-full rounded-lg border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="lg:col-span-3 flex flex-col justify-end">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 opacity-0 select-none hidden lg:block">
              Submit
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold px-4 py-2 text-sm font-bold text-white shadow-md shadow-gold/10 hover:shadow-lg hover:shadow-gold/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 h-[38px]"
              >
                <Search className="h-4 w-4" />
                {pending ? "Searching…" : "Search"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCategory("");
                  setFurnishing("");
                  setBhk("");
                  setCustomMinPrice("");
                  setCustomMaxPrice("");
                  setPriceRange([0, 999999999]);
                  router.push("/properties");
                }}
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all h-[38px]"
                title="Clear Filters"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Section for Advanced Filters */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 uppercase tracking-wider transition-all duration-150"
          >
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showMore ? "rotate-180" : ""}`} />
            {showMore ? "Hide Advanced Filters" : "Show Advanced Filters"}
          </button>

          {showMore && (
            <div className="mt-4 space-y-4">
              {/* Secondary Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                {/* Bedrooms */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Bedrooms
                  </label>
                  <select name="minBeds" defaultValue={params.get("minBeds") ?? ""} className={fieldClass}>
                    <option value="">Any Bedrooms</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}+ beds
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Bathrooms
                  </label>
                  <select name="minBaths" defaultValue={params.get("minBaths") ?? ""} className={fieldClass}>
                    <option value="">Any Bathrooms</option>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}+ baths
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min sq.ft */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Min sq.ft
                  </label>
                  <input
                    name="minSqft"
                    type="number"
                    defaultValue={params.get("minSqft") ?? ""}
                    placeholder="Any sq.ft"
                    className={fieldClass}
                  />
                </div>
              </div>

              {/* Property Extras */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Property Extras
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Balconies</label>
                    <select name="minBalconies" defaultValue={params.get("minBalconies") ?? ""} className={fieldClass}>
                      <option value="">Any</option>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+ balconies</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Lift Type</label>
                    <select name="liftType" defaultValue={params.get("liftType") ?? ""} className={fieldClass}>
                      <option value="">Any</option>
                      <option value="Common Lift">Common Lift</option>
                      <option value="Personal Lift">Personal Lift</option>
                      <option value="No Lift">No Lift</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Flats/Floor</label>
                    <input name="flatsPerFloor" type="number" min={1} defaultValue={params.get("flatsPerFloor") ?? ""} placeholder="Any" className={fieldClass} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Availability</label>
                    <select name="availabilityStatus" defaultValue={params.get("availabilityStatus") ?? ""} className={fieldClass}>
                      <option value="">Any</option>
                      <option value="Available">Available</option>
                      <option value="Sold">Sold</option>
                      <option value="Rented">Rented</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/60 pt-4">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800 cursor-pointer select-none py-1">
                    <input type="checkbox" name="servantRoom" value="1" defaultChecked={params.get("servantRoom") === "1"} className="h-4.5 w-4.5 rounded border-slate-300 text-gold focus:ring-gold/30 transition duration-150 cursor-pointer" />
                    <span>Servant Room</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800 cursor-pointer select-none py-1">
                    <input type="checkbox" name="pujaRoom" value="1" defaultChecked={params.get("pujaRoom") === "1"} className="h-4.5 w-4.5 rounded border-slate-300 text-gold focus:ring-gold/30 transition duration-150 cursor-pointer" />
                    <span>Puja Ghar</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800 cursor-pointer select-none py-1">
                    <input type="checkbox" name="studyRoom" value="1" defaultChecked={params.get("studyRoom") === "1"} className="h-4.5 w-4.5 rounded border-slate-300 text-gold focus:ring-gold/30 transition duration-150 cursor-pointer" />
                    <span>Study Room</span>
                  </label>
                </div>
              </div>

              {/* Amenities */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  Amenities
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {AMENITIES.map(([key, label]) => (
                    <label key={key} className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-800 cursor-pointer select-none py-1">
                      <input
                        type="checkbox"
                        name={key}
                        value="1"
                        defaultChecked={params.get(key) === "1"}
                        className="h-4.5 w-4.5 rounded border-slate-300 text-gold focus:ring-gold/30 transition duration-150 cursor-pointer"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
