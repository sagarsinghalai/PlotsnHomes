"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Upload,
  X,
  ImageIcon,
  Film,
  FileText,
} from "lucide-react";
import { MEDIA_LIMITS } from "@/lib/media-limits";
import { PROPERTY_CATEGORIES } from "@/lib/property-categories";

type WizardData = {
  listingType: "SALE" | "RENT";
  category: string;
  title: string;
  description: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  balconies: string;
  hasServantRoom: boolean;
  hasPujaRoom: boolean;
  hasStudyRoom: boolean;
  availabilityStatus: string;
  liftType: string;
  flatsPerFloor: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: string;
  rentMonthly: string;
  images: string[];
  videos: string[];
  pdfs: { name: string; url: string }[];
};

const EMPTY: WizardData = {
  listingType: "SALE",
  category: "",
  title: "",
  description: "",
  bedrooms: "0",
  bathrooms: "0",
  sqft: "",
  balconies: "0",
  hasServantRoom: false,
  hasPujaRoom: false,
  hasStudyRoom: false,
  availabilityStatus: "Available",
  liftType: "",
  flatsPerFloor: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  price: "",
  rentMonthly: "",
  images: [],
  videos: [],
  pdfs: [],
};

const STEPS = ["Listing type", "Property details", "Location", "Photos & docs", "Price & review"];

type CategoryKind = "RESIDENTIAL" | "LAND" | "COMMERCIAL";

// Classify a category (built-in or custom) so step 2 only asks for relevant
// fields — e.g. a plot has no bedrooms, an office has no puja room.
function categoryKind(category: string): CategoryKind {
  const c = (category || "").toLowerCase();
  if (/plot|land|agri|farm|\bsite\b|acre/.test(c)) return "LAND";
  if (/commercial|office|shop|showroom|warehouse|retail|industrial|godown/.test(c)) return "COMMERCIAL";
  return "RESIDENTIAL";
}

const darkInput =
  "w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium";

async function uploadFile(file: File, kind: "image" | "video" | "pdf", currentCount: number) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  fd.append("currentCount", String(currentCount));
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data as { url: string; name?: string };
}

export function ListingWizard() {
  const router = useRouter();
  const [form, setForm] = useState<WizardData>(EMPTY);
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState<string[]>([...PROPERTY_CATEGORIES]);
  const [resume, setResume] = useState<{ step: number; data: WizardData } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof WizardData>(k: K, v: WizardData[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Load categories + any saved draft on mount.
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && Array.isArray(d.categories) && d.categories.length) {
          setCategories(Array.from(new Set([...PROPERTY_CATEGORIES, ...d.categories.map((c: any) => c.name)])));
        }
      })
      .catch(() => {});

    fetch("/api/seller/listing-draft")
      .then((r) => r.json())
      .then((d) => {
        if (d?.draft && d.draft.data && Object.keys(d.draft.data).length) {
          setResume({ step: d.draft.step ?? 0, data: { ...EMPTY, ...d.draft.data } });
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  function saveDraft(nextStep: number, data: WizardData) {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/seller/listing-draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: nextStep, data }),
      }).catch(() => {});
    }, 400);
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.category) return "Please choose a property category.";
    } else if (step === 1) {
      if (form.title.trim().length < 3) return "Title must be at least 3 characters.";
      if (form.description.trim().length < 10) return "Description must be at least 10 characters.";
    } else if (step === 2) {
      if (!form.address.trim()) return "Address is required.";
      if (!form.city.trim()) return "City is required.";
      if (!form.state.trim()) return "State is required.";
      if (!form.zip.trim()) return "PIN / ZIP is required.";
    } else if (step === 4) {
      if (!(Number(form.price) > 0)) return "Enter a valid price.";
      if (form.listingType === "RENT" && !(Number(form.rentMonthly) > 0)) return "Enter a valid monthly rent.";
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    const ns = Math.min(step + 1, STEPS.length - 1);
    setStep(ns);
    saveDraft(ns, form);
  }

  function back() {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleMedia(e: React.ChangeEvent<HTMLInputElement>, kind: "image" | "video" | "pdf") {
    const files = e.target.files;
    if (!files) return;
    try {
      for (const file of Array.from(files)) {
        if (kind === "image") {
          if (form.images.length >= MEDIA_LIMITS.images) break;
          const d = await uploadFile(file, "image", form.images.length);
          setForm((f) => ({ ...f, images: [...f.images, d.url] }));
        } else if (kind === "video") {
          if (form.videos.length >= MEDIA_LIMITS.videos) break;
          const d = await uploadFile(file, "video", form.videos.length);
          setForm((f) => ({ ...f, videos: [...f.videos, d.url] }));
        } else {
          if (form.pdfs.length >= MEDIA_LIMITS.pdfs) break;
          const d = await uploadFile(file, "pdf", form.pdfs.length);
          setForm((f) => ({ ...f, pdfs: [...f.pdfs, { name: d.name ?? file.name, url: d.url }] }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    e.target.value = "";
  }

  async function submit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setSubmitting(true);
    try {
      const kind = categoryKind(form.category);
      const isResidential = kind === "RESIDENTIAL";
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        rentMonthly: form.listingType === "RENT" ? Number(form.rentMonthly) || null : null,
        city: form.city.trim(),
        state: form.state.trim(),
        address: form.address.trim(),
        zip: form.zip.trim(),
        category: form.category || undefined,
        listingType: form.listingType,
        // Only send fields that apply to the chosen category.
        bedrooms: isResidential ? parseInt(form.bedrooms || "0", 10) || 0 : 0,
        bathrooms: kind === "LAND" ? 0 : Number(form.bathrooms || "0") || 0,
        sqft: form.sqft ? parseInt(form.sqft, 10) : null,
        images: form.images,
        videos: form.videos,
        pdfs: form.pdfs,
        hasServantRoom: isResidential && form.hasServantRoom,
        hasPujaRoom: isResidential && form.hasPujaRoom,
        hasStudyRoom: isResidential && form.hasStudyRoom,
        balconies: isResidential ? parseInt(form.balconies || "0", 10) || 0 : 0,
        liftType: form.liftType || null,
        flatsPerFloor: form.flatsPerFloor ? parseInt(form.flatsPerFloor, 10) : null,
        availabilityStatus: form.availabilityStatus || "Available",
      };
      const res = await fetch("/api/properties/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Submission failed.");
        setSubmitting(false);
        return;
      }
      await fetch("/api/seller/listing-draft", { method: "DELETE" }).catch(() => {});
      setDone(true);
    } catch {
      setError("Something went wrong submitting your listing.");
    } finally {
      setSubmitting(false);
    }
  }

  // --- Resume popup ---------------------------------------------------------
  if (resume) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
          <h3 className="text-lg font-extrabold">Continue your listing?</h3>
          <p className="mt-1 text-sm text-slate-500">
            You have a listing in progress (step {Math.min(resume.step + 1, STEPS.length)} of {STEPS.length}). Pick up where you left off, or start fresh.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => {
                setForm(resume.data);
                setStep(Math.min(resume.step, STEPS.length - 1));
                setResume(null);
              }}
              className="flex-1 rounded-xl bg-brand hover:bg-brand-hover py-3 text-sm font-bold text-white"
            >
              Continue
            </button>
            <button
              onClick={async () => {
                await fetch("/api/seller/listing-draft", { method: "DELETE" }).catch(() => {});
                setForm(EMPTY);
                setStep(0);
                setResume(null);
              }}
              className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel &amp; start fresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // --- Success --------------------------------------------------------------
  if (done) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-slate-900/80 p-8 text-center shadow-2xl">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
        <h2 className="mt-4 text-2xl font-extrabold text-white">Listing submitted!</h2>
        <p className="mt-2 text-sm text-slate-400 max-w-md mx-auto">
          Our verification team will review your property and publish it shortly. You can track it from your dashboard.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => router.push("/dashboard")} className="rounded-xl bg-brand hover:bg-brand-hover px-6 py-3 text-sm font-bold text-white">
            Go to dashboard
          </button>
          <button
            onClick={() => { setForm(EMPTY); setStep(0); setDone(false); }}
            className="rounded-xl border border-slate-700 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800"
          >
            List another
          </button>
        </div>
      </div>
    );
  }

  // --- Wizard ---------------------------------------------------------------
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-10 shadow-2xl">
      {/* Progress */}
      <div className="mb-8">
        {/* Compact label (keeps mobile readable; full labels show under each circle on sm+) */}
        <p className="mb-3 text-center text-xs font-bold text-amber-400 sm:hidden">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
        <div className="flex items-start justify-between gap-1 text-[10px] sm:text-xs font-semibold">
          {STEPS.map((label, i) => (
            <div key={label} className="flex min-w-0 flex-1 flex-col items-center text-center">
              <div
                className={`mb-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                  i < step
                    ? "border-emerald-400 bg-emerald-400 text-slate-950"
                    : i === step
                    ? "border-amber-400 bg-amber-400 text-slate-950"
                    : "border-slate-700 text-slate-500"
                }`}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden sm:block ${i === step ? "text-white" : "text-slate-500"}`}>{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 h-1 w-full rounded-full bg-slate-800">
          <div className="h-1 rounded-full bg-amber-400 transition-all" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      {error && <div className="mb-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}

      <div className="text-xs">{renderStep()}</div>

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 disabled:opacity-40 hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="inline-flex items-center gap-1 rounded-xl bg-brand hover:bg-brand-hover px-6 py-2.5 text-sm font-bold text-white">
            Next <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-hover px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit listing"}
          </button>
        )}
      </div>
    </div>
  );

  function renderStep() {
    if (step === 0) {
      return (
        <div className="space-y-5">
          <div>
            <label className="mb-2 block font-bold text-slate-300">I want to</label>
            <div className="grid grid-cols-2 gap-3">
              {(["SALE", "RENT"] as const).map((lt) => (
                <button
                  key={lt}
                  type="button"
                  onClick={() => set("listingType", lt)}
                  className={`rounded-xl border py-3 text-sm font-bold transition ${form.listingType === lt ? "border-amber-400 bg-amber-500/10 text-amber-300" : "border-slate-800 bg-slate-950 text-slate-300"}`}
                >
                  {lt === "SALE" ? "Sell" : "Rent / Lease"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block font-bold text-slate-300">Property category *</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={darkInput}>
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (step === 1) {
      const kind = categoryKind(form.category);
      const areaLabel = kind === "LAND" ? "Plot area (sq.ft)" : kind === "COMMERCIAL" ? "Built-up area (sq.ft)" : "Area (sq.ft)";
      const detailHint =
        kind === "LAND" ? "land / plot — no rooms needed" : kind === "COMMERCIAL" ? "commercial space" : "residential home";
      return (
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-[11px] text-slate-400">
            Showing fields for <span className="font-semibold text-amber-400">{form.category || "your property"}</span> — {detailHint}.
          </div>

          <div>
            <label className="mb-1.5 block font-bold text-slate-300">Property / Project Title *</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Emerald Luxury Plots, Super Corridor" className={darkInput} />
          </div>
          <div>
            <label className="mb-1.5 block font-bold text-slate-300">Description &amp; Highlights *</label>
            <textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Key features — corner plot, east-facing, gated community, metro 500m…" className={`${darkInput} leading-relaxed`} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {kind === "RESIDENTIAL" && (
              <div>
                <label className="mb-1.5 block font-bold text-slate-300">Bedrooms (BHK)</label>
                <input type="number" min={0} value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className={darkInput} />
              </div>
            )}
            {kind !== "LAND" && (
              <div>
                <label className="mb-1.5 block font-bold text-slate-300">{kind === "COMMERCIAL" ? "Washrooms" : "Bathrooms"}</label>
                <input type="number" min={0} value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className={darkInput} />
              </div>
            )}
            <div>
              <label className="mb-1.5 block font-bold text-slate-300">{areaLabel}</label>
              <input type="number" min={0} value={form.sqft} onChange={(e) => set("sqft", e.target.value)} placeholder="1500" className={darkInput} />
            </div>
            {kind === "RESIDENTIAL" && (
              <div>
                <label className="mb-1.5 block font-bold text-slate-300">Balconies</label>
                <input type="number" min={0} value={form.balconies} onChange={(e) => set("balconies", e.target.value)} className={darkInput} />
              </div>
            )}
          </div>

          {kind === "RESIDENTIAL" && (
            <div>
              <p className="mb-2 font-bold text-slate-300">Additional rooms</p>
              <div className="flex flex-wrap gap-4">
                {([
                  ["hasServantRoom", "Servant room"],
                  ["hasPujaRoom", "Puja room"],
                  ["hasStudyRoom", "Study room"],
                ] as const).map(([key, label]) => (
                  <label key={key} className="inline-flex items-center gap-2 text-slate-300">
                    <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 accent-amber-400" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block font-bold text-slate-300">Address *</label>
            <input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Plot 24, Super Corridor" className={darkInput} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="mb-1.5 block font-bold text-slate-300">City *</label>
              <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Indore" className={darkInput} />
            </div>
            <div>
              <label className="mb-1.5 block font-bold text-slate-300">State *</label>
              <input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="Madhya Pradesh" className={darkInput} />
            </div>
            <div>
              <label className="mb-1.5 block font-bold text-slate-300">PIN / ZIP *</label>
              <input value={form.zip} onChange={(e) => set("zip", e.target.value)} placeholder="452010" className={darkInput} />
            </div>
          </div>
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="space-y-5">
          <MediaBlock
            icon={<ImageIcon className="h-4 w-4" />}
            label={`Photos (${form.images.length}/${MEDIA_LIMITS.images})`}
            accept="image/*"
            onChange={(e) => handleMedia(e, "image")}
          >
            <div className="flex flex-wrap gap-2">
              {form.images.map((url, i) => (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => set("images", form.images.filter((_, j) => j !== i))} className="absolute top-0 right-0 bg-slate-950/80 p-0.5 text-white">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </MediaBlock>

          <MediaBlock
            icon={<Film className="h-4 w-4" />}
            label={`Videos (${form.videos.length}/${MEDIA_LIMITS.videos})`}
            accept="video/*"
            onChange={(e) => handleMedia(e, "video")}
          >
            {form.videos.length > 0 && <p className="text-[11px] text-slate-400">{form.videos.length} video(s) added.</p>}
          </MediaBlock>

          <MediaBlock
            icon={<FileText className="h-4 w-4" />}
            label={`Documents / PDFs (${form.pdfs.length}/${MEDIA_LIMITS.pdfs})`}
            accept="application/pdf"
            onChange={(e) => handleMedia(e, "pdf")}
          >
            <div className="space-y-1">
              {form.pdfs.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-300">
                  <span className="truncate">{p.name}</span>
                  <button type="button" onClick={() => set("pdfs", form.pdfs.filter((_, j) => j !== i))}><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </MediaBlock>
        </div>
      );
    }

    // step 4 — Price & review
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block font-bold text-slate-300">
              {form.listingType === "RENT" ? "Expected Sale/Deposit Value (₹) *" : "Asking Price (₹) *"}
            </label>
            <input type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="4500000" className={darkInput} />
          </div>
          {form.listingType === "RENT" && (
            <div>
              <label className="mb-1.5 block font-bold text-slate-300">Monthly Rent (₹) *</label>
              <input type="number" min={0} value={form.rentMonthly} onChange={(e) => set("rentMonthly", e.target.value)} placeholder="25000" className={darkInput} />
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-wider text-amber-400">Review</p>
          <dl className="grid grid-cols-2 gap-y-2 text-[11px]">
            <Review label="Listing" value={form.listingType === "RENT" ? "Rent / Lease" : "Sell"} />
            <Review label="Category" value={form.category || "—"} />
            <Review label="Title" value={form.title || "—"} />
            <Review label="Location" value={[form.city, form.state].filter(Boolean).join(", ") || "—"} />
            {categoryKind(form.category) === "RESIDENTIAL" && <Review label="Bedrooms" value={form.bedrooms} />}
            <Review label="Area" value={form.sqft ? `${form.sqft} sq.ft` : "—"} />
            <Review label="Photos" value={String(form.images.length)} />
            <Review label="Documents" value={String(form.pdfs.length)} />
          </dl>
        </div>
        <p className="text-[11px] text-slate-500">
          Your listing is submitted for review and goes live once our team verifies it.
        </p>
      </div>
    );
  }
}

function MediaBlock({
  icon,
  label,
  accept,
  onChange,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  accept: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 font-bold text-slate-300">{icon} {label}</label>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950 py-5 text-sm text-slate-400 hover:border-amber-400/60">
        <Upload className="h-4 w-4" /> Click to upload
        <input type="file" accept={accept} multiple className="hidden" onChange={onChange} />
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-white truncate">{value}</dd>
    </>
  );
}
