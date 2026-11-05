"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Building, Home, Store, Warehouse, Car, Trees, Factory, Hotel,
  Square, MapPin, Landmark, Mountain, Package, Tent, Castle, CheckCircle2,
  Loader2, Upload, X, ArrowRight, Sofa, Armchair, Bed,
} from "lucide-react";
import { COUNTRIES } from "@/lib/locale-defaults";
import {
  getAssetClasses, getSubtypes, getCategory, resolveCategoryFields, groupBySection,
  BOX_FIELDS, BHK_OPTIONS, type ResolvedField, type SpecField,
} from "@/lib/listing-spec";

// Base control styles WITHOUT a width, so flex-row fields (area+unit, phone) can
// size each part explicitly without a `w-full` conflict.
const inputBase =
  "rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium text-xs";
const darkInput = `${inputBase} w-full`;

// Map a category slug/name to an icon.
function catIcon(slugOrName: string) {
  const s = slugOrName.toLowerCase();
  if (/penthouse/.test(s)) return Building;
  if (/apartment|flat|studio|duplex|triplex|builder|room|serviced/.test(s)) return Building2;
  if (/villa|house|bungalow|mansion|cottage|row|town/.test(s)) return Home;
  if (/farm/.test(s)) return Tent;
  if (/agri|orchard|dairy|poultry|aqua/.test(s)) return Trees;
  if (/plot|land|redevelop|leasehold|mixed/.test(s)) return Square;
  if (/office|sco|cowork|commercial-building/.test(s)) return Landmark;
  if (/retail|shop|showroom|mall|restaurant|cafe|food/.test(s)) return Store;
  if (/warehouse|godown|logistics|cold/.test(s)) return Warehouse;
  if (/factory|industrial|workshop|data/.test(s)) return Factory;
  if (/hotel|resort|homestay|hospitality/.test(s)) return Hotel;
  if (/parking|garage|locker|storage/.test(s)) return Car;
  if (/school|hospital|clinic|religious|sports|cinema|govt|institutional/.test(s)) return Landmark;
  if (/mountain|hill/.test(s)) return Mountain;
  if (/mansion|estate/.test(s)) return Castle;
  return Package;
}

const furnishIcon = (v: string) => (/^fully/.test(v) ? Sofa : /^semi/.test(v) ? Armchair : Bed);

type Values = Record<string, any>;

export function DynamicListingForm() {
  const router = useRouter();
  const assetClasses = getAssetClasses();
  const [assetClass, setAssetClass] = useState(assetClasses[0]?.id || "RES");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [values, setValues] = useState<Values>({ listing_intent: "sale", country_code: "IN" });
  const [phoneCc, setPhoneCc] = useState("+91");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [resume, setResume] = useState<null | { assetClass: string; categoryId: string; values: Values }>(null);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (k: string, v: any) => setValues((p) => ({ ...p, [k]: v }));

  // Load any saved draft.
  useEffect(() => {
    fetch("/api/seller/listing-draft")
      .then((r) => r.json())
      .then((d) => {
        const data = d?.draft?.data;
        if (data && data.categoryId) {
          setResume({ assetClass: data.assetClass || "RES", categoryId: data.categoryId, values: data.values || {} });
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  function saveDraft(next: { assetClass: string; categoryId: string | null; values: Values }) {
    if (!next.categoryId) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/seller/listing-draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 0, data: next }),
      }).catch(() => {});
    }, 500);
  }

  function pickCategory(id: string) {
    setCategoryId(id);
    setErrors({});
    const next = { assetClass, categoryId: id, values };
    saveDraft(next);
  }

  function setValue(k: string, v: any) {
    setValues((prev) => {
      const nv = { ...prev, [k]: v };
      saveDraft({ assetClass, categoryId, values: nv });
      return nv;
    });
  }

  const resolved = categoryId ? resolveCategoryFields(categoryId) : [];
  const sections = groupBySection(resolved);
  const category = categoryId ? getCategory(categoryId) : null;

  function validateAndBuild(): { ok: boolean; payload?: any } {
    const e: Record<string, string> = {};
    const title = String(values.listing_title || "").trim();
    const desc = String(values.description || "").trim();
    const price = Number(values.asking_price || 0);
    const intent = String(values.listing_intent || "sale");
    const isRent = ["rent", "lease", "lease_out"].includes(intent);

    if (title.length < 3) e.listing_title = "Enter a title (min 3 characters).";
    if (desc.length < 10) e.description = "Enter a description (min 10 characters).";
    if (!(price > 0)) e.asking_price = isRent ? "Enter the lease/premium amount." : "Enter a valid price.";
    if (isRent && !(Number(values.monthly_rent || 0) > 0)) e.monthly_rent = "Enter a valid rent amount.";
    if (!String(values.locality || "").trim()) e.locality = "Please enter a valid locality.";

    setErrors(e);
    if (Object.keys(e).length) return { ok: false };

    const payload = {
      title,
      description: desc,
      price,
      rentMonthly: isRent ? Number(values.monthly_rent || 0) || null : null,
      city: String(values.city_id || values.locality || ""),
      state: String(values.state_code || ""),
      address: String(values.address_line || values.locality || ""),
      zip: String(values.postal_code || ""),
      category: category?.name,
      listingType: isRent ? "RENT" : "SALE",
      bedrooms: parseInt(values.bedrooms ?? "0", 10) || 0,
      bathrooms: Number(values.bathrooms || 0) || 0,
      sqft: values.area_value ? parseInt(values.area_value, 10) : null,
      images: Array.isArray(values.media_photos) ? values.media_photos : [],
      videos: [],
      pdfs: [],
      balconies: parseInt(values.balconies ?? "0", 10) || 0,
      availabilityStatus: values.possession_status ? prettyVal(values.possession_status) : "Available",
    };
    return { ok: true, payload };
  }

  async function submit() {
    const { ok, payload } = validateAndBuild();
    if (!ok) {
      // scroll to first error
      const first = document.querySelector("[data-err='1']");
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/properties/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ _form: data.error || "Submission failed." });
        setSubmitting(false);
        return;
      }
      await fetch("/api/seller/listing-draft", { method: "DELETE" }).catch(() => {});
      setDone(true);
    } catch {
      setErrors({ _form: "Something went wrong submitting your listing." });
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const current: string[] = Array.isArray(values.media_photos) ? values.media_photos : [];
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "image");
      fd.append("currentCount", String(current.length + added.length));
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (r.ok && d.url) added.push(d.url);
    }
    setValue("media_photos", [...current, ...added]);
    e.target.value = "";
  }

  // ---- Resume popup ----
  if (resume) {
    const cat = getCategory(resume.categoryId);
    return (
      <Modal>
        <h3 className="text-lg font-extrabold">Continue your listing?</h3>
        <p className="mt-1 text-sm text-slate-500">
          You have a {cat?.name || "listing"} draft in progress. Pick up where you left off, or start fresh.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => {
              setAssetClass(resume.assetClass);
              setCategoryId(resume.categoryId);
              setValues({ listing_intent: "sale", country_code: "IN", ...resume.values });
              setResume(null);
            }}
            className="flex-1 rounded-xl bg-brand hover:bg-brand-hover py-3 text-sm font-bold text-white"
          >
            Continue
          </button>
          <button
            onClick={async () => {
              await fetch("/api/seller/listing-draft", { method: "DELETE" }).catch(() => {});
              setResume(null);
            }}
            className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Start fresh
          </button>
        </div>
      </Modal>
    );
  }

  if (!hydrated) {
    return <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-8 text-center shadow-2xl">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
        <h2 className="mt-4 text-2xl font-extrabold text-white">Listing submitted!</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">Our team will verify and publish it shortly.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="rounded-xl bg-brand hover:bg-brand-hover px-6 py-3 text-sm font-bold text-white">Go to dashboard</button>
          <button onClick={() => { setDone(false); setCategoryId(null); setValues({ listing_intent: "sale", country_code: "IN" }); }} className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">List another</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 sm:p-8 shadow-2xl">
      {/* Asset class tabs */}
      <h2 className="text-lg sm:text-xl font-extrabold text-white">What are you listing?</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {assetClasses.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => { setAssetClass(a.id); setCategoryId(null); }}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${assetClass === a.id ? "bg-amber-400 text-slate-950" : "bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-600"}`}
          >
            {a.name}
          </button>
        ))}
      </div>

      {/* Subtype icon boxes */}
      <p className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-amber-400">Property type</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {getSubtypes(assetClass).map((c) => {
          const Icon = catIcon(c.slug || c.name);
          const active = categoryId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => pickCategory(c.id)}
              className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-4 text-center transition ${active ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/30" : "border-slate-800 bg-slate-950 hover:border-slate-600"}`}
            >
              <Icon className={`h-6 w-6 ${active ? "text-amber-400" : "text-slate-400"}`} />
              <span className={`text-[11px] font-semibold leading-tight ${active ? "text-white" : "text-slate-300"}`}>{c.name}</span>
            </button>
          );
        })}
      </div>

      {/* Dynamic fields */}
      {category && (
        <div className="mt-8 space-y-8">
          {errors._form && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{errors._form}</div>}
          {sections.map(({ section, fields }) => (
            <div key={section}>
              <h3 className="mb-4 border-b border-slate-800 pb-2 text-sm font-extrabold uppercase tracking-wider text-amber-400">{section}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                {renderSection(fields)}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand hover:bg-brand-hover py-4 text-sm font-extrabold text-white shadow-xl shadow-brand/20 transition disabled:opacity-50"
          >
            {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</> : <>Submit listing <ArrowRight className="h-5 w-5" /></>}
          </button>
        </div>
      )}
    </div>
  );

  // Render the fields of a section, folding area_unit inline with area_value.
  function renderSection(fields: ResolvedField[]) {
    const nodes: React.ReactNode[] = [];
    for (const rf of fields) {
      const key = rf.field.key;
      if (key === "area_unit") continue; // rendered inline with area_value
      if (key === "area_value") {
        nodes.push(renderAreaValueWithUnit(rf, fields.find((f) => f.field.key === "area_unit")));
        continue;
      }
      const isWide = BOX_FIELDS.has(key) || ["textarea"].includes(rf.field.control) || key === "media_photos";
      nodes.push(
        <div key={key} className={isWide ? "sm:col-span-2" : ""} data-err={errors[key] ? "1" : undefined}>
          {renderField(rf)}
          {errors[key] && <p className="mt-1 text-[10px] font-semibold text-rose-400">{errors[key]}</p>}
        </div>
      );
    }
    return nodes;
  }

  function label(rf: ResolvedField) {
    return (
      <label className="mb-1.5 block text-xs font-bold text-slate-300">
        {rf.field.label}{rf.required && <span className="text-amber-400"> *</span>}
      </label>
    );
  }

  function renderAreaValueWithUnit(areaRf: ResolvedField, unitRf?: ResolvedField) {
    const units = unitRf?.field.options || [];
    return (
      <div key="area_value" className="sm:col-span-2">
        {label(areaRf)}
        <div className="flex gap-2">
          <input type="number" min={0} value={values.area_value ?? ""} onChange={(e) => setValue("area_value", e.target.value)} placeholder="Enter area" className={`${inputBase} min-w-0 flex-1`} />
          <select value={values.area_unit ?? (units[0]?.value || "sqft")} onChange={(e) => setValue("area_unit", e.target.value)} className={`${inputBase} w-24 shrink-0 px-2`}>
            {units.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
    );
  }

  function renderField(rf: ResolvedField) {
    const f = rf.field;
    const key = f.key;
    const v = values[key];

    // --- Box-selection fields ---
    if (key === "bedrooms") {
      return (
        <>
          {label(rf)}
          <div className="flex flex-wrap gap-2">
            {BHK_OPTIONS.map((o) => (
              <Box key={o.value} active={String(v) === String(o.value)} onClick={() => setValue("bedrooms", o.value)}>{o.label}</Box>
            ))}
          </div>
        </>
      );
    }
    if (key === "furnishing_status") {
      return (
        <>
          {label(rf)}
          <div className="flex flex-wrap gap-2">
            {f.options.map((o) => {
              const Icon = furnishIcon(o.value);
              return (
                <Box key={o.value} active={v === o.value} onClick={() => setValue(key, o.value)}>
                  <Icon className="h-4 w-4" /> {o.label}
                </Box>
              );
            })}
          </div>
        </>
      );
    }
    if (BOX_FIELDS.has(key)) {
      return (
        <>
          {label(rf)}
          <div className="flex flex-wrap gap-2">
            {f.options.map((o) => (
              <Box key={o.value} active={v === o.value} onClick={() => setValue(key, o.value)}>{o.label}</Box>
            ))}
          </div>
        </>
      );
    }

    // --- Generic controls ---
    switch (f.control) {
      case "textarea":
        return (<>{label(rf)}<textarea rows={4} value={v ?? ""} onChange={(e) => setValue(key, e.target.value)} placeholder={placeholderFor(f)} className={`${darkInput} leading-relaxed`} /></>);
      case "select":
        // An enum with no option list (e.g. state_code) degrades to a text input.
        if (f.options.length === 0) {
          return (<>{label(rf)}<input type="text" value={v ?? ""} onChange={(e) => setValue(key, e.target.value)} placeholder={placeholderFor(f)} className={darkInput} /></>);
        }
        return (<>{label(rf)}<select value={v ?? ""} onChange={(e) => setValue(key, e.target.value)} className={darkInput}><option value="">Select…</option>{f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></>);
      case "multiselect":
        return (
          <>{label(rf)}
            <div className="flex flex-wrap gap-2">
              {f.options.map((o) => {
                const arr: string[] = Array.isArray(v) ? v : [];
                const on = arr.includes(o.value);
                return <Box key={o.value} active={on} onClick={() => setValue(key, on ? arr.filter((x) => x !== o.value) : [...arr, o.value])}>{o.label}</Box>;
              })}
            </div>
          </>
        );
      case "country_select":
        return (<>{label(rf)}<select value={v ?? "IN"} onChange={(e) => setValue(key, e.target.value)} className={darkInput}>{COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}</select></>);
      case "toggle":
      case "checkbox":
        return (<label className="mt-5 inline-flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={!!v} onChange={(e) => setValue(key, e.target.checked)} className="h-4 w-4 accent-amber-400" />{f.label}{rf.required && <span className="text-amber-400"> *</span>}</label>);
      case "number":
      case "stepper":
        return (<>{label(rf)}<input type="number" value={v ?? ""} onChange={(e) => setValue(key, e.target.value)} placeholder={placeholderFor(f)} className={darkInput} /></>);
      case "currency_input":
        return (<>{label(rf)}<div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span><input type="number" value={v ?? ""} onChange={(e) => setValue(key, e.target.value)} placeholder="0" className={`${darkInput} pl-7`} /></div></>);
      case "date_picker":
        return (<>{label(rf)}<input type="date" value={v ?? ""} onChange={(e) => setValue(key, e.target.value)} className={darkInput} /></>);
      case "phone_input":
        return (
          <>{label(rf)}
            <div className="flex gap-2">
              <select value={phoneCc} onChange={(e) => setPhoneCc(e.target.value)} className={`${inputBase} w-20 shrink-0`}>{COUNTRIES.slice(0, 12).map((c) => <option key={`${c.code}-${c.dial}`} value={c.dial}>{c.dial}</option>)}</select>
              <input type="tel" value={v ?? ""} onChange={(e) => setValue(key, e.target.value.replace(/\D/g, "").slice(0, 12))} placeholder="Phone number" className={`${inputBase} min-w-0 flex-1`} />
            </div>
          </>
        );
      case "email_input":
        return (<>{label(rf)}<input type="email" value={v ?? ""} onChange={(e) => setValue(key, e.target.value)} placeholder="you@example.com" className={darkInput} /></>);
      case "uploader":
      case "secure_uploader":
        if (key === "media_photos") {
          const imgs: string[] = Array.isArray(v) ? v : [];
          return (
            <>{label(rf)}
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950 py-4 text-xs text-slate-400 hover:border-amber-400/60">
                <Upload className="h-4 w-4" /> Upload photos
                <input type="file" accept="image/*" multiple className="hidden" onChange={uploadPhotos} />
              </label>
              {imgs.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {imgs.map((u, i) => (
                    <div key={i} className="relative h-14 w-14 overflow-hidden rounded-lg border border-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" className="h-full w-full object-cover" />
                      <button type="button" onClick={() => setValue("media_photos", imgs.filter((_, j) => j !== i))} className="absolute top-0 right-0 bg-slate-950/80 p-0.5 text-white"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        }
        return (<>{label(rf)}<div className="rounded-xl border border-dashed border-slate-800 bg-slate-950 px-3 py-3 text-[11px] text-slate-500">Document upload ({f.label}) — available after submission review.</div></>);
      case "autocomplete":
      case "text":
      default:
        return (<>{label(rf)}<input type="text" value={v ?? ""} onChange={(e) => setValue(key, e.target.value)} placeholder={placeholderFor(f)} className={darkInput} /></>);
    }
  }
}

function Box({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${active ? "border-amber-400 bg-amber-500/10 text-amber-300" : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600"}`}
    >
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

function placeholderFor(f: SpecField): string {
  if (f.key === "listing_title") return "e.g. Spacious 3 BHK near metro";
  if (f.key === "locality") return "Locality / neighbourhood";
  if (f.key === "project_name") return "Building / project / society (optional)";
  if (f.key === "city_id") return "City";
  if (f.key === "district") return "District";
  if (f.key === "sub_locality") return "Sector / block / phase (optional)";
  return "";
}

function prettyVal(v: string): string {
  return String(v).replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
