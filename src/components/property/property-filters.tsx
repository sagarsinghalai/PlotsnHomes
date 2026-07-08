"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PROPERTY_CATEGORIES } from "@/lib/property-categories";
import { searchParamsToQuery, type PropertySearchParams } from "@/lib/property-search";

const SORT_OPTIONS = [
  { value: "featured",        label: "Featured" },
  { value: "price_asc",       label: "Price: Low → High" },
  { value: "price_desc",      label: "Price: High → Low" },
  { value: "yield_desc",      label: "Yield: Highest" },
  { value: "change_ytd_desc", label: "YTD gain: Highest" },
  { value: "change_24h_desc", label: "24h movers" },
  { value: "newest",          label: "Newest" },
];

const FURNISHING_OPTIONS = ["Fully Furnished", "Semi Furnished", "Unfurnished"];
const LIFT_OPTIONS       = ["Common Lift", "Personal Lift", "No Lift"];
const AVAIL_OPTIONS      = [
  { value: "Available", label: "Available" },
  { value: "Sold",      label: "Sold" },
  { value: "Rented",    label: "Rented" },
];

type Props = {
  priceMin: number;
  priceMax: number;
  cities: { city: string; state: string }[];
  areas?: string[];
  total: number;
};

const CATEGORIES = [...PROPERTY_CATEGORIES];

const pillBase =
  "rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150 cursor-pointer";
const pillActive =
  "border-gold bg-gold text-slate-900 shadow-sm";
const pillInactive =
  "border-slate-200 bg-white text-slate-600 hover:border-gold/50 hover:bg-gold/10";

const selectClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all";

export function PropertyFilters({ priceMin, priceMax, cities, areas = [], total }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const get = (key: string) => searchParams.get(key) ?? "";

  const apply = useCallback(
    (updates: Record<string, string | null>) => {
      const next: PropertySearchParams = {};
      searchParams.forEach((v, k) => {
        (next as Record<string, string>)[k] = v;
      });
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === "") delete (next as Record<string, string>)[k];
        else (next as Record<string, string>)[k] = v;
      });
      if (!updates.page) next.page = "1";

      startTransition(() => {
        router.push(`/properties?${searchParamsToQuery(next)}`);
      });
    },
    [router, searchParams]
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const updates: Record<string, string | null> = {};
    [
      "q", "city", "state", "type", "listingType", "category", "area",
      "minPrice", "maxPrice", "minBeds", "maxBeds", "minBaths", "minRooms",
      "minYield", "maxYield", "sort",
      "furnishing", "liftType", "availabilityStatus",
      "minBalconies", "flatsPerFloor", "bhk"
    ].forEach((key) => {
      const v = fd.get(key)?.toString() ?? "";
      updates[key] = v || null;
    });
    // Checkboxes
    updates.servantRoom = fd.get("servantRoom") ? "1" : null;
    updates.pujaRoom    = fd.get("pujaRoom") ? "1" : null;
    updates.studyRoom   = fd.get("studyRoom") ? "1" : null;
    updates.page = "1";
    apply(updates);
  }

  function togglePill(key: string, value: string) {
    const current = get(key);
    apply({ [key]: current === value ? null : value });
  }

  const currentFurnishing = get("furnishing");
  const currentLift = get("liftType");
  const currentAvail = get("availabilityStatus");
  const currentListingType = get("listingType");

  return (
    <aside className="lg:sticky lg:top-24 h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900">Filters</h2>
        <span className="text-sm text-slate-500">{total} results</span>
      </div>

      {/* Clear Filters */}
      <button
        type="button"
        onClick={() => startTransition(() => router.push("/properties"))}
        className="w-full mb-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-150"
      >
        <span>✕</span> Clear All Filters
      </button>

      {/* Furnishing quick-picks (always visible when RENT or no type set) */}
      {(currentListingType === "" || currentListingType === "RENT") && (
        <div className="pb-4 border-b border-slate-100">
          <Label className="mb-2 block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Furnishing
          </Label>
          <div className="flex flex-wrap gap-2">
            {FURNISHING_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => togglePill("furnishing", opt)}
                className={`${pillBase} ${currentFurnishing === opt ? pillActive : pillInactive}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-5 space-y-5">
        <input type="hidden" name="furnishing" value={currentFurnishing} />
        <input type="hidden" name="liftType" value={currentLift} />
        <input type="hidden" name="availabilityStatus" value={currentAvail} />
        <input type="hidden" name="bhk" value={get("bhk")} />

        <div>
          <Label>Search</Label>
          <Input name="q" placeholder="City, symbol, address..." defaultValue={get("q")} />
        </div>

        {/* Price */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Min price</Label>
            <Input
              name="minPrice"
              type="number"
              placeholder={String(Math.round(priceMin))}
              defaultValue={get("minPrice")}
            />
          </div>
          <div>
            <Label>Max price</Label>
            <Input
              name="maxPrice"
              type="number"
              placeholder={String(Math.round(priceMax))}
              defaultValue={get("maxPrice")}
            />
          </div>
        </div>

        {/* Listing Type */}
        <div>
          <Label>Listing type</Label>
          <select name="listingType" defaultValue={get("listingType")} className={selectClass}>
            <option value="">Sales &amp; Rentals</option>
            <option value="SALE">Sales</option>
            <option value="RENT">Rentals</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <Label>Category</Label>
          <select name="category" defaultValue={get("category")} className={selectClass}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {areas.length > 0 && (
          <div>
            <Label>Area</Label>
            <select name="area" defaultValue={get("area")} className={selectClass}>
              <option value="">All areas</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        )}

        {/* City */}
        <div>
          <Label>City</Label>
          <select
            name="city"
            defaultValue={get("city")}
            className={selectClass}
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={`${c.city}-${c.state}`} value={c.city}>
                {c.city}, {c.state}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div>
          <Label>State</Label>
          <Input name="state" placeholder="e.g. MH" maxLength={2} defaultValue={get("state")} />
        </div>

        {/* Property Type */}
        <div>
          <Label>Property type</Label>
          <select name="type" defaultValue={get("type")} className={selectClass}>
            <option value="">All types</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="RENTAL">Rental / STR</option>
            <option value="LAND">Land</option>
          </select>
        </div>

        {/* Rooms / Beds / Baths */}
        <div>
          <Label>Min rooms</Label>
          <Input name="minRooms" type="number" min={0} defaultValue={get("minRooms")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Min beds</Label>
            <Input name="minBeds" type="number" min={0} defaultValue={get("minBeds")} />
          </div>
          <div>
            <Label>Max beds</Label>
            <Input name="maxBeds" type="number" min={0} defaultValue={get("maxBeds")} />
          </div>
        </div>
        <div>
          <Label>Min baths</Label>
          <Input name="minBaths" type="number" step="0.5" min={0} defaultValue={get("minBaths")} />
        </div>

        {/* Yield */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Min yield %</Label>
            <Input name="minYield" type="number" step="0.1" defaultValue={get("minYield")} />
          </div>
          <div>
            <Label>Max yield %</Label>
            <Input name="maxYield" type="number" step="0.1" defaultValue={get("maxYield")} />
          </div>
        </div>

        {/* ── NEW FILTERS ─────────────────────────────────── */}
        <div className="border-t border-slate-100 pt-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
            Property Extras
          </p>

          {/* Availability */}
          <div className="mb-3">
            <Label className="mb-1.5 block">Availability</Label>
            <div className="flex flex-wrap gap-2">
              {AVAIL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => togglePill("availabilityStatus", opt.value)}
                  className={`${pillBase} ${currentAvail === opt.value ? pillActive : pillInactive}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rooms checklist */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            {[
              { name: "servantRoom", label: "Servant Room" },
              { name: "pujaRoom",    label: "Puja Ghar" },
              { name: "studyRoom",   label: "Study Room" },
            ].map((item) => (
              <label
                key={item.name}
                className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none hover:text-slate-900"
              >
                <input
                  type="checkbox"
                  name={item.name}
                  value="1"
                  defaultChecked={get(item.name) === "1"}
                  className="h-4 w-4 rounded border-slate-300 text-gold focus:ring-gold/30"
                />
                {item.label}
              </label>
            ))}
          </div>

          {/* Balconies */}
          <div className="mb-3">
            <Label>Min Balconies</Label>
            <select name="minBalconies" defaultValue={get("minBalconies")} className={selectClass}>
              <option value="">Any</option>
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>{n}+</option>
              ))}
            </select>
          </div>

          {/* Lift Type */}
          <div className="mb-3">
            <Label className="mb-1.5 block">Lift</Label>
            <div className="flex flex-wrap gap-2">
              {LIFT_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => togglePill("liftType", opt)}
                  className={`${pillBase} ${currentLift === opt ? pillActive : pillInactive}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Flats per floor */}
          <div className="mb-3">
            <Label>Flats per Floor</Label>
            <Input
              name="flatsPerFloor"
              type="number"
              min={1}
              placeholder="Any"
              defaultValue={get("flatsPerFloor")}
            />
          </div>
        </div>

        {/* Sort */}
        <div>
          <Label>Sort by</Label>
          <select name="sort" defaultValue={get("sort") || "featured"} className={selectClass}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="submit" variant="gold" className="flex-1" loading={pending}>
            Apply filters
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => startTransition(() => router.push("/properties"))}
          >
            Reset
          </Button>
        </div>
      </form>
    </aside>
  );
}
