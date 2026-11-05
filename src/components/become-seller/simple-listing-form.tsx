"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Building, Home, Store, Square, Tent, Trees, Landmark,
  CheckCircle2, Loader2, Upload, X, ArrowRight, Sofa, Armchair, Bed, Download,
} from "lucide-react";
import {
  SELLER_ASSET_CLASSES, getSellerSubtypes, getCategory, kindOf, BHK_OPTIONS,
  type SpecCategory,
} from "@/lib/listing-spec";

const inputBase =
  "rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium text-xs";
const darkInput = `${inputBase} w-full`;

const AREA_UNITS = [
  { v: "sqft", l: "Sq.ft" }, { v: "sqm", l: "Sq.m" }, { v: "sqyd", l: "Sq.yd" },
  { v: "acre", l: "Acre" }, { v: "hectare", l: "Hectare" }, { v: "cent", l: "Cent" },
  { v: "gunta", l: "Gunta" }, { v: "bigha", l: "Bigha" },
];

const FURNISHING = [
  { v: "unfurnished", l: "Unfurnished", Icon: Bed },
  { v: "semi_furnished", l: "Semi-furnished", Icon: Armchair },
  { v: "fully_furnished", l: "Fully furnished", Icon: Sofa },
];

function catIcon(id: string, slug: string) {
  const s = (slug || "").toLowerCase();
  if (/penthouse/.test(s)) return Building;
  if (/apartment|flat|studio|builder/.test(s)) return Building2;
  if (/villa|house|row|town/.test(s)) return Home;
  if (/farm/.test(s)) return Tent;
  if (/agri/.test(s)) return Trees;
  if (/plot|land/.test(s)) return Square;
  if (/office|sco|building/.test(s)) return Landmark;
  if (/retail|shop|showroom/.test(s)) return Store;
  return Building2;
}

type Form = {
  intent: "sale" | "rent";
  bedrooms: number | null;
  furnishing: string;
  area_value: string;
  area_unit: string;
  bathrooms: string;
  parking: string;
  possession: "ready" | "under_construction";
  locality: string;
  city: string;
  price: string;
  description: string;
  photos: string[];
};

const EMPTY: Form = {
  intent: "sale", bedrooms: null, furnishing: "", area_value: "", area_unit: "sqft",
  bathrooms: "", parking: "", possession: "ready", locality: "", city: "", price: "",
  description: "", photos: [],
};

export function SimpleListingForm() {
  const router = useRouter();
  const [assetClass, setAssetClass] = useState(SELLER_ASSET_CLASSES[0]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [resume, setResume] = useState<null | { assetClass: string; categoryId: string; form: Form }>(null);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/seller/listing-draft")
      .then((r) => r.json())
      .then((d) => {
        const data = d?.draft?.data;
        if (data && data.categoryId && data.form) {
          setResume({ assetClass: data.assetClass || "RES", categoryId: data.categoryId, form: { ...EMPTY, ...data.form } });
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  function saveDraft(next: { assetClass: string; categoryId: string | null; form: Form }) {
    if (!next.categoryId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/seller/listing-draft", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 0, data: next }),
      }).catch(() => {});
    }, 500);
  }

  function pickCategory(id: string) {
    setCategoryId(id);
    setErrors({});
    saveDraft({ assetClass, categoryId: id, form });
  }
  function set<K extends keyof Form>(k: K, v: Form[K]) {
    setForm((prev) => {
      const nf = { ...prev, [k]: v };
      saveDraft({ assetClass, categoryId, form: nf });
      return nf;
    });
  }

  const kind = categoryId ? kindOf(categoryId) : "RESIDENTIAL";
  const category = categoryId ? getCategory(categoryId) : null;
  const isRes = kind === "RESIDENTIAL";
  const isLand = kind === "LAND";

  async function uploadPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const current = [...form.photos];
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file); fd.append("kind", "image"); fd.append("currentCount", String(current.length + added.length));
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (r.ok && d.url) added.push(d.url);
    }
    set("photos", [...current, ...added]);
    e.target.value = "";
  }

  function autoTitle(): string {
    const typeName = category?.name || "Property";
    const bhk = isRes && form.bedrooms != null ? BHK_OPTIONS.find((b) => b.value === form.bedrooms)?.label : "";
    const loc = form.locality.trim();
    return [bhk, typeName, loc ? `in ${loc}` : ""].filter(Boolean).join(" ").trim();
  }

  async function submit() {
    const e: Record<string, string> = {};
    if (!categoryId) e._type = "Please choose a property type.";
    if (!form.locality.trim()) e.locality = "Please enter a valid locality.";
    if (!form.city.trim()) e.city = "City is required.";
    if (!(Number(form.price) > 0)) e.price = form.intent === "rent" ? "Enter a valid monthly rent." : "Enter a valid price.";
    setErrors(e);
    if (Object.keys(e).length) return;

    const typeName = category?.name || "Property";
    const title = autoTitle() || typeName;
    const description = form.description.trim() ||
      `${typeName} for ${form.intent === "rent" ? "rent" : "sale"} in ${form.locality.trim()}, ${form.city.trim()}.`;
    const priceNum = Number(form.price);

    const attributes: Record<string, any> = {
      listing_intent: form.intent,
      asset_category_id: categoryId,
      property_slug: category?.slug,
      area_value: form.area_value || null,
      area_unit: form.area_unit,
      possession_status: form.possession,
      locality: form.locality.trim(),
      city_id: form.city.trim(),
      ...(isRes ? { bedrooms: form.bedrooms, furnishing_status: form.furnishing, bathrooms: form.bathrooms, parking_count: form.parking } : {}),
      ...(kind === "COMMERCIAL" ? { bathrooms: form.bathrooms, parking_count: form.parking } : {}),
    };

    const payload = {
      title, description,
      price: priceNum,
      rentMonthly: form.intent === "rent" ? priceNum : null,
      city: form.city.trim(), state: "", address: form.locality.trim(), zip: "",
      category: typeName,
      categorySlug: category?.slug,
      listingType: form.intent === "rent" ? "RENT" : "SALE",
      bedrooms: isRes && form.bedrooms != null ? form.bedrooms : 0,
      bathrooms: isLand ? 0 : Number(form.bathrooms || 0) || 0,
      sqft: form.area_value ? parseInt(form.area_value, 10) : null,
      images: form.photos, videos: [], pdfs: [],
      balconies: 0,
      garages: isLand ? 0 : parseInt(form.parking || "0", 10) || 0,
      furnishingStatus: isRes ? form.furnishing || null : null,
      availabilityStatus: form.possession === "under_construction" ? "Under Construction" : "Ready to move",
      attributes,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/properties/submit", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ _form: data.error || "Submission failed." }); setSubmitting(false); return; }
      await fetch("/api/seller/listing-draft", { method: "DELETE" }).catch(() => {});
      setDone(true);
    } catch {
      setErrors({ _form: "Something went wrong submitting your listing." });
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Resume ----
  if (resume) {
    const cat = getCategory(resume.categoryId);
    return (
      <Modal>
        <h3 className="text-lg font-extrabold">Continue your listing?</h3>
        <p className="mt-1 text-sm text-slate-500">You have a {cat?.name || "listing"} draft in progress. Continue, or start fresh.</p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => { setAssetClass(resume.assetClass); setCategoryId(resume.categoryId); setForm(resume.form); setResume(null); }} className="flex-1 rounded-xl bg-brand hover:bg-brand-hover py-3 text-sm font-bold text-white">Continue</button>
          <button onClick={async () => { await fetch("/api/seller/listing-draft", { method: "DELETE" }).catch(() => {}); setResume(null); }} className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">Start fresh</button>
        </div>
      </Modal>
    );
  }
  if (!hydrated) return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-8 text-center shadow-2xl">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
        <h2 className="mt-4 text-2xl font-extrabold text-white">Listing submitted!</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">Our team will verify and publish it shortly. Once approved, you can add full details.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="rounded-xl bg-brand hover:bg-brand-hover px-6 py-3 text-sm font-bold text-white">Go to dashboard</button>
          <button onClick={() => { setDone(false); setCategoryId(null); setForm(EMPTY); }} className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">List another</button>
        </div>
        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400">
          Want to add complete details? Download the full listing template, fill it in, and send it to our team — they can import every detail after your listing is approved.
          <a href="/api/listing-template" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-2 font-bold text-amber-300 hover:bg-amber-500/20">
            <Download className="h-4 w-4" /> Download detailed Excel template
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-8 shadow-2xl">
      <h2 className="text-lg sm:text-xl font-extrabold text-white">List your property</h2>
      <p className="text-xs text-slate-400 mt-1">A few quick details — our team reviews and publishes it.</p>

      {/* Asset class */}
      <div className="mt-5 flex flex-wrap gap-2">
        {SELLER_ASSET_CLASSES.map((id) => {
          const c = getCategory(id);
          return (
            <button key={id} type="button" onClick={() => { setAssetClass(id); setCategoryId(null); }}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${assetClass === id ? "bg-amber-400 text-slate-950" : "bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-600"}`}>
              {c?.name || id}
            </button>
          );
        })}
      </div>

      {/* Property type boxes */}
      <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-amber-400">Property type {errors._type && <span className="text-rose-400">— {errors._type}</span>}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
        {getSellerSubtypes(assetClass).map((c: SpecCategory) => {
          const Icon = catIcon(c.id, c.slug);
          const active = categoryId === c.id;
          return (
            <button key={c.id} type="button" onClick={() => pickCategory(c.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-4 text-center transition ${active ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/30" : "border-slate-800 bg-slate-950 hover:border-slate-600"}`}>
              <Icon className={`h-6 w-6 ${active ? "text-amber-400" : "text-slate-400"}`} />
              <span className={`text-[11px] font-semibold leading-tight ${active ? "text-white" : "text-slate-300"}`}>{c.name}</span>
            </button>
          );
        })}
      </div>

      {category && (
        <div className="mt-8 space-y-5 text-xs">
          {errors._form && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{errors._form}</div>}

          {/* Intent */}
          <Field label="I want to">
            <div className="flex gap-2">
              {(["sale", "rent"] as const).map((v) => (
                <Box key={v} active={form.intent === v} onClick={() => set("intent", v)}>{v === "sale" ? "Sell" : "Rent / Lease"}</Box>
              ))}
            </div>
          </Field>

          {isRes && (
            <Field label="BHK">
              <div className="flex flex-wrap gap-2">
                {BHK_OPTIONS.map((o) => <Box key={o.value} active={form.bedrooms === o.value} onClick={() => set("bedrooms", o.value)}>{o.label}</Box>)}
              </div>
            </Field>
          )}

          {/* Area + unit */}
          <Field label={isLand ? "Plot area" : "Built-up area"}>
            <div className="flex gap-2">
              <input type="number" min={0} value={form.area_value} onChange={(e) => set("area_value", e.target.value)} placeholder="Enter area" className={`${inputBase} min-w-0 flex-1`} />
              <select value={form.area_unit} onChange={(e) => set("area_unit", e.target.value)} className={`${inputBase} w-24 shrink-0 px-2`}>
                {AREA_UNITS.map((u) => <option key={u.v} value={u.v}>{u.l}</option>)}
              </select>
            </div>
          </Field>

          {isRes && (
            <Field label="Furnishing">
              <div className="flex flex-wrap gap-2">
                {FURNISHING.map(({ v, l, Icon }) => <Box key={v} active={form.furnishing === v} onClick={() => set("furnishing", v)}><Icon className="h-4 w-4" /> {l}</Box>)}
              </div>
            </Field>
          )}

          {!isLand && (
            <div className="grid grid-cols-2 gap-4">
              <Field label={kind === "COMMERCIAL" ? "Washrooms" : "Bathrooms"}>
                <input type="number" min={0} value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={darkInput} />
              </Field>
              <Field label="Parking spaces">
                <input type="number" min={0} value={form.parking} onChange={(e) => set("parking", e.target.value)} className={darkInput} />
              </Field>
            </div>
          )}

          {/* Possession */}
          <Field label="Possession">
            <div className="flex flex-wrap gap-2">
              <Box active={form.possession === "ready"} onClick={() => set("possession", "ready")}>Ready to move</Box>
              <Box active={form.possession === "under_construction"} onClick={() => set("possession", "under_construction")}>Under construction</Box>
            </div>
          </Field>

          {/* Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Locality *" err={errors.locality}>
              <input value={form.locality} onChange={(e) => set("locality", e.target.value)} placeholder="Locality / neighbourhood" className={darkInput} />
            </Field>
            <Field label="City *" err={errors.city}>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="City" className={darkInput} />
            </Field>
          </div>

          {/* Price */}
          <Field label={form.intent === "rent" ? "Monthly rent (₹) *" : "Asking price (₹) *"} err={errors.price}>
            <input type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0" className={darkInput} />
          </Field>

          {/* Description */}
          <Field label="Description (optional)">
            <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Add any highlights — we'll auto-generate a title if you leave this blank" className={`${darkInput} leading-relaxed`} />
          </Field>

          {/* Photos */}
          <Field label="Photos">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950 py-4 text-slate-400 hover:border-amber-400/60">
              <Upload className="h-4 w-4" /> Upload photos
              <input type="file" accept="image/*" multiple className="hidden" onChange={uploadPhotos} />
            </label>
            {form.photos.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.photos.map((u, i) => (
                  <div key={i} className="relative h-14 w-14 overflow-hidden rounded-lg border border-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => set("photos", form.photos.filter((_, j) => j !== i))} className="absolute top-0 right-0 bg-slate-950/80 p-0.5 text-white"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </Field>

          <button type="button" onClick={submit} disabled={submitting} className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand hover:bg-brand-hover py-4 text-sm font-extrabold text-white shadow-xl shadow-brand/20 transition disabled:opacity-50">
            {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</> : <>Submit listing <ArrowRight className="h-5 w-5" /></>}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, err, children }: { label: string; err?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-300">{label}</label>
      {children}
      {err && <p className="mt-1 text-[10px] font-semibold text-rose-400">{err}</p>}
    </div>
  );
}

function Box({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${active ? "border-amber-400 bg-amber-500/10 text-amber-300" : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600"}`}>
      {children}
    </button>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">{children}</div>
    </div>
  );
}
