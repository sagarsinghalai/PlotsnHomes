"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2, MapPin, Search, X, Loader2, CheckCircle2, User, Phone, Mail, Sparkles, ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { COUNTRY_DIAL_CODES } from "@/lib/country-codes";

export type ShowcaseProject = {
  id: string;
  name: string;
  code: string | null;
  slug: string | null;
  projectType: string | null;
  projectCategory: string | null;
  status: string | null;
  city: string | null;
  area: string | null;
  state: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  coverImage: string | null;
  bannerImage: string | null;
  galleryImagesJson: string | null;
  developerName: string | null;
  shortDescription: string | null;
  isSoldOut: boolean;
};

const ALL = "ALL";

function firstImage(p: ShowcaseProject): string | null {
  if (p.coverImage) return p.coverImage;
  if (p.bannerImage) return p.bannerImage;
  if (p.galleryImagesJson) {
    try {
      const arr = JSON.parse(p.galleryImagesJson);
      if (Array.isArray(arr) && typeof arr[0] === "string" && arr[0]) return arr[0];
    } catch { /* ignore */ }
  }
  return null;
}

function priceLabel(p: ShowcaseProject): string {
  const min = p.minPrice || 0;
  const max = p.maxPrice || 0;
  if (!min && !max) return "Price on request";
  if (min && max && max > min) return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  return formatCurrency(min || max);
}

function statusTone(status: string | null): string {
  const s = (status || "").toLowerCase();
  if (s.includes("new") || s.includes("launch")) return "bg-brand-soft text-brand border-brand/20";
  if (s.includes("ongoing") || s.includes("construction")) return "bg-amber-50 text-amber-700 border-amber-200";
  if (s.includes("ready") || s.includes("complete")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s.includes("upcoming")) return "bg-indigo-50 text-indigo-700 border-indigo-200";
  if (s.includes("sold")) return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function ProjectsShowcase({ projects }: { projects: ShowcaseProject[] }) {
  const [category, setCategory] = useState(ALL);
  const [ptype, setPtype] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [city, setCity] = useState(ALL);
  const [search, setSearch] = useState("");
  const [interest, setInterest] = useState<ShowcaseProject | null>(null);

  const opts = useMemo(() => {
    const uniq = (vals: (string | null)[]) => Array.from(new Set(vals.filter(Boolean) as string[])).sort();
    return {
      categories: uniq(projects.map((p) => p.projectCategory)),
      types: uniq(projects.map((p) => p.projectType)),
      statuses: uniq(projects.map((p) => p.status)),
      cities: uniq(projects.map((p) => p.city)),
    };
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (category !== ALL && p.projectCategory !== category) return false;
      if (ptype !== ALL && p.projectType !== ptype) return false;
      if (status !== ALL && p.status !== status) return false;
      if (city !== ALL && p.city !== city) return false;
      if (q && !`${p.name} ${p.developerName ?? ""} ${p.city ?? ""} ${p.area ?? ""} ${p.code ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [projects, category, ptype, status, city, search]);

  const hasFilters = category !== ALL || ptype !== ALL || status !== ALL || city !== ALL || search.trim() !== "";
  const clear = () => { setCategory(ALL); setPtype(ALL); setStatus(ALL); setCity(ALL); setSearch(""); };

  const selectCls = "h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  if (projects.length === 0) return null;

  return (
    <section id="projects" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand">
            <Sparkles className="h-4 w-4" /> Developer Projects
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-slate-900">Explore new &amp; upcoming projects</h2>
          <p className="mt-3 text-base text-slate-600">
            Browse verified developer projects across cities. Filter by category, type, status and location — and register your interest in one click.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search project, developer, city…"
              aria-label="Search projects"
              className="w-full h-11 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className={selectCls}>
            <option value={ALL}>All categories</option>
            {opts.categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={ptype} onChange={(e) => setPtype(e.target.value)} aria-label="Type" className={selectCls}>
            <option value={ALL}>All types</option>
            {opts.types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className={selectCls}>
            <option value={ALL}>All statuses</option>
            {opts.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City" className={selectCls}>
            <option value={ALL}>All cities</option>
            {opts.cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <span><b className="text-slate-900">{filtered.length}</b> project{filtered.length !== 1 ? "s" : ""}</span>
          {hasFilters && (
            <button type="button" onClick={clear} className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-2 text-sm font-semibold text-slate-700">No projects match your filters</p>
            <p className="text-xs text-slate-500">Try clearing a filter or searching a different city.</p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => {
              const img = firstImage(p);
              const loc = [p.area, p.city, p.state].filter(Boolean).join(", ");
              const href = p.slug ? `/projects/${p.slug}` : null;
              const Media = (
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={`${p.name} project`} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                      <Building2 className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    {p.status && (
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusTone(p.status)}`}>{p.status}</span>
                    )}
                    {p.isSoldOut && (
                      <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">Sold out</span>
                    )}
                  </div>
                </div>
              );
              return (
                <article key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card hover:border-slate-300 hover:shadow-md transition">
                  {href ? <Link href={href} aria-label={`View ${p.name}`}>{Media}</Link> : Media}

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                      {p.projectCategory && <span className="rounded bg-slate-100 px-2 py-0.5">{p.projectCategory}</span>}
                      {p.projectType && <span className="rounded bg-slate-100 px-2 py-0.5">{p.projectType}</span>}
                    </div>
                    {href ? (
                      <Link href={href} className="mt-2 text-base font-bold text-slate-900 line-clamp-1 hover:text-brand">{p.name}</Link>
                    ) : (
                      <h3 className="mt-2 text-base font-bold text-slate-900 line-clamp-1">{p.name}</h3>
                    )}
                    {p.developerName && <p className="text-xs font-semibold text-slate-500 mt-0.5">by {p.developerName}</p>}
                    {loc && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-brand shrink-0" /> <span className="truncate">{loc}</span>
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Price</p>
                        <p className="text-sm font-extrabold text-slate-900">{priceLabel(p)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInterest(p)}
                        className="inline-flex items-center justify-center rounded-lg bg-brand px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                      >
                        Show Interest
                      </button>
                    </div>
                    {href && (
                      <Link href={href} className="mt-3 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-bold text-slate-700 hover:border-brand/40 hover:text-brand transition">
                        View full details <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {interest && <InterestModal project={interest} onClose={() => setInterest(null)} />}
    </section>
  );
}

/* ───────────────────────── Show-interest lead modal ───────────────────────── */
function InterestModal({ project, onClose }: { project: ShowcaseProject; onClose: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (name.trim().length < 2) { setState("error"); setErr("Please enter your full name."); return; }
    if (phone.replace(/\D/g, "").length < 6) { setState("error"); setErr("Please enter a valid phone number."); return; }
    setState("loading");
    const loc = [project.area, project.city, project.state].filter(Boolean).join(", ");
    const message = [
      `Interested in project: ${project.name}${project.code ? ` (${project.code})` : ""}`,
      loc ? `Location: ${loc}` : "",
      project.developerName ? `Developer: ${project.developerName}` : "",
      note.trim() ? `Note: ${note.trim()}` : "",
    ].filter(Boolean).join("\n");
    try {
      const res = await fetch("/api/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: `${code} ${phone.trim()}`,
          email: email.trim() || "",
          message,
          source: `Project: ${project.name}`.slice(0, 60),
        }),
      });
      const d = await res.json();
      if (!res.ok) { setState("error"); setErr(d.error || "Could not submit. Please try again."); return; }
      setState("ok");
    } catch {
      setState("error"); setErr("Could not submit. Please try again.");
    }
  }

  const input = "w-full h-11 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Register interest in ${project.name}`}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-brand">Register interest</p>
            <h3 className="text-base font-bold text-slate-900">{project.name}</h3>
            <p className="text-xs text-slate-500">{[project.area, project.city].filter(Boolean).join(", ")}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded-md text-slate-400 hover:bg-slate-200"><X className="h-5 w-5" /></button>
        </div>

        {state === "ok" ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Thank you!</h4>
            <p className="mt-1 text-sm text-slate-500">Our team will reach out to you shortly about <b>{project.name}</b>.</p>
            <button type="button" onClick={onClose} className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name *" aria-label="Full name" className={input} />
            </div>
            <div className="flex gap-2">
              <select value={code} onChange={(e) => setCode(e.target.value)} aria-label="Country code" className="h-11 rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-brand">
                {COUNTRY_DIAL_CODES.map((c, i) => <option key={`${c.code}-${i}`} value={c.code}>{c.code}</option>)}
              </select>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number *" inputMode="tel" aria-label="Phone number" className={input} />
              </div>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" type="email" aria-label="Email" className={input} />
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Anything specific you're looking for? (optional)" aria-label="Note" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none" />
            {err && <p className="text-xs font-semibold text-rose-600">{err}</p>}
            <button type="submit" disabled={state === "loading"} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60">
              {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit interest
            </button>
            <p className="text-[11px] text-center text-slate-400">By submitting, you agree to be contacted about this project.</p>
          </form>
        )}
      </div>
    </div>
  );
}
