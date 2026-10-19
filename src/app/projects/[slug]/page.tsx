import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  Building2, MapPin, CalendarClock, BadgeCheck, Layers, Sparkles, FileText, Phone, Mail,
  MessageCircle, Globe, Award, TrendingUp, CheckCircle2, Clock, Landmark, Film, Link2,
  Download, Home, ShieldCheck, Hammer, Users2, IndianRupee, Image as ImageIcon,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { PropertyGallery } from "@/components/property/property-gallery";
import { LeadCaptureForm } from "@/components/public/lead-capture-form";

export const dynamic = "force-dynamic";

/* ───────────────────────── helpers ───────────────────────── */
function parseArr(json: string | null | undefined): any[] {
  if (!json) return [];
  try { const a = JSON.parse(json); return Array.isArray(a) ? a : []; } catch { return []; }
}
function parseObj(json: string | null | undefined): Record<string, any> {
  if (!json) return {};
  try { const o = JSON.parse(json); return o && typeof o === "object" && !Array.isArray(o) ? o : {}; } catch { return {}; }
}
function humanize(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).replace(/\s+/g, " ").trim();
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
function progressTone(s: string): string {
  const l = (s || "").toLowerCase();
  if (l.includes("complete")) return "bg-emerald-100 text-emerald-700";
  if (l.includes("ongoing")) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}
function fmtDate(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "numeric", day: "numeric" });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await prisma.project.findUnique({
    where: { slug: params.slug },
    select: { name: true, seoTitle: true, seoDescription: true, shortDescription: true, description: true, coverImage: true, bannerImage: true, ogImageUrl: true },
  });
  if (!p) return {};
  const title = p.seoTitle || `${p.name} | PlotsnHomes`;
  const desc = (p.seoDescription || p.shortDescription || p.description || "").slice(0, 160);
  const img = p.ogImageUrl || p.coverImage || p.bannerImage || "";
  return {
    title,
    description: desc,
    openGraph: { title, description: desc, images: img ? [{ url: img }] : [], type: "website" },
    twitter: { card: "summary_large_image", title, description: desc, images: img ? [img] : [] },
  };
}

/* ───────────────────────── small presentational bits ───────────────────────── */
function SectionCard({ id, icon: Icon, title, children }: { id?: string; icon: any; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm scroll-mt-24">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon className="h-4 w-4" /></span>
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

/* ───────────────────────── page ───────────────────────── */
export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
    include: { developer: true, _count: { select: { properties: true } } },
  });
  if (!project || project.showOnWebsite === false) notFound();

  const p = project;
  const dev = p.developer;

  // Media
  const gallery: string[] = [
    p.coverImage, p.bannerImage,
    ...parseArr(p.galleryImagesJson).filter((x) => typeof x === "string"),
    ...parseArr(p.floorPlansJson).filter((x) => typeof x === "string"),
  ].filter(Boolean) as string[];
  const videoLinks = [p.youtubeUrl, p.walkthroughVideoUrl, p.droneVideoUrl, p.virtualTourUrl, p.tour360Url].filter(Boolean) as string[];

  // Sections
  const highlights = [...parseArr(p.highlightsJson), ...parseArr(p.whyInvestJson), ...parseArr(p.projectUspJson)]
    .filter((x) => typeof x === "string" && x.trim());
  const configs = parseArr(p.configurationsJson);
  const towers = parseArr(p.towersJson);
  const inventory = parseArr(p.unitsJson);
  const amenitiesMap = parseObj(p.amenitiesJson);
  const amenities = Object.keys(amenitiesMap).filter((k) => amenitiesMap[k]);
  const nearby = parseArr(p.nearbyPlacesJson);
  const specs = parseObj(p.specificationsJson);
  const specEntries = Object.entries(specs).filter(([, v]) => v && String(v).trim());
  const docsMap = parseObj(p.documentsJson);
  const docEntries = Object.entries(docsMap).filter(([, v]) => v && String(v).trim());
  const tagsMap = parseObj(p.tagsJson);
  const tags = Object.keys(tagsMap).filter((k) => tagsMap[k]);
  const pricingExtra = parseArr(p.pricingExtraJson);
  const assets = parseArr(p.assetsJson);
  const salesManagers = parseArr(p.salesManagersJson);
  const fin = parseObj(p.financialInfoJson);
  const paymentPlans = Array.isArray(fin.paymentPlans) ? fin.paymentPlans : [];
  const bankApprovals = Array.isArray(fin.bankApprovals) ? fin.bankApprovals : [];
  const loanPartners = Array.isArray(fin.loanPartners) ? fin.loanPartners : [];
  const timeline = parseObj(p.timelineJson);
  const milestones = Array.isArray(timeline.milestones) ? timeline.milestones : [];
  const progressImages = Array.isArray(timeline.progressImages) ? timeline.progressImages : [];
  const progressVideos = Array.isArray(timeline.videos) ? timeline.videos : [];
  const timelineVideoLinks = Array.isArray(timeline.videoLinks) ? timeline.videoLinks : [];

  const description = p.fullDescription || p.description || p.shortDescription || "";
  const location = [p.area, p.locality, p.city, p.state].filter(Boolean).join(", ");
  const developerName = dev?.name || p.builderName || "";
  const priceLabel = (() => {
    const min = p.minPrice || 0, max = p.maxPrice || 0;
    if (!min && !max) return "Price on request";
    if (min && max && max > min) return `${formatCurrency(min)} – ${formatCurrency(max)}`;
    return formatCurrency(min || max);
  })();

  const charges: { label: string; value: string }[] = [
    p.pricePerSqft ? { label: "Price / sq.ft", value: formatCurrency(p.pricePerSqft) } : null,
    p.bookingAmount ? { label: "Booking Amount", value: formatCurrency(p.bookingAmount) } : null,
    p.maintenanceCharges ? { label: "Maintenance", value: `${formatCurrency(p.maintenanceCharges)}/sq.ft/mo` } : null,
    p.plcCharges ? { label: "PLC Charges", value: `${formatCurrency(p.plcCharges)}/sq.ft` } : null,
    (p.gstPct ?? 0) ? { label: "GST", value: `${p.gstPct}%` } : null,
    (p.stampDutyPct ?? 0) ? { label: "Stamp Duty", value: `${p.stampDutyPct}%` } : null,
    p.registrationCharges ? { label: "Registration", value: formatCurrency(p.registrationCharges) } : null,
    ...pricingExtra.filter((r: any) => r?.label).map((r: any) => ({ label: r.label, value: String(r.value ?? "") })),
  ].filter(Boolean) as { label: string; value: string }[];

  const heroImg = p.bannerImage || p.coverImage || (gallery[0] ?? null);

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span>/</span>
          <Link href="/#projects" className="hover:text-brand">Projects</Link>
          {developerName && (<><span>/</span><span className="text-slate-600">{developerName}</span></>)}
          <span>/</span>
          <span className="font-bold text-slate-800">{p.name}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="relative">
        <div className="h-64 sm:h-80 lg:h-[26rem] w-full overflow-hidden bg-slate-200">
          {heroImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroImg} alt={`${p.name} banner`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
              <Building2 className="h-20 w-20 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              {p.status && <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(p.status)}`}>{p.status}</span>}
              {p.isNewLaunch && !(p.status || "").toLowerCase().includes("launch") && <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">New Launch</span>}
              {p.featured && <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">Featured</span>}
              {p.isSoldOut && <span className="rounded-full bg-rose-600 px-3 py-1 text-xs font-bold text-white">Sold Out</span>}
              {p.reraNumber && <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> RERA</span>}
            </div>
            <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-white drop-shadow">{p.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
              {developerName && <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" /> by {developerName}</span>}
              {location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {location}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Quick facts bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 -mt-2">
          <Fact label="Price Range" value={priceLabel} />
          {p.projectType && <Fact label="Type" value={p.projectType} />}
          {p.projectCategory && <Fact label="Category" value={p.projectCategory} />}
          {p.possessionDate && <Fact label="Possession" value={fmtDate(p.possessionDate)} />}
          {(p.availableUnitsCount ?? 0) > 0 && <Fact label="Units Available" value={p.availableUnitsCount} />}
          {p.reraNumber && <Fact label="RERA No." value={<span className="font-mono text-xs">{p.reraNumber}</span>} />}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            {gallery.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <PropertyGallery images={gallery} title={p.name} />
              </div>
            )}

            {/* Overview */}
            {(description || highlights.length > 0 || p.lifestyleDescription) && (
              <SectionCard id="overview" icon={Sparkles} title="Project Overview">
                {description && <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{description}</p>}
                {p.lifestyleDescription && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">{p.lifestyleDescription}</p>}
                {highlights.length > 0 && (
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span key={t} className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">{humanize(t)}</span>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {/* Unit configurations */}
            {configs.length > 0 && (
              <SectionCard id="configurations" icon={Layers} title="Unit Configurations">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[480px]">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                        <th className="py-2 pr-4">Type</th>
                        <th className="py-2 pr-4">Size</th>
                        <th className="py-2 pr-4">Carpet Area</th>
                        <th className="py-2">Starting Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {configs.map((c: any, i: number) => (
                        <tr key={i}>
                          <td className="py-2.5 pr-4 font-bold text-slate-900">{c.type || "—"}</td>
                          <td className="py-2.5 pr-4 text-slate-600">{c.size || "—"}</td>
                          <td className="py-2.5 pr-4 text-slate-600">{c.carpetArea || "—"}</td>
                          <td className="py-2.5 font-extrabold text-brand">{c.startingPrice ? formatCurrency(Number(c.startingPrice) || 0) : "On request"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <SectionCard id="amenities" icon={Home} title="Amenities & Features">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> {humanize(a)}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Towers */}
            {towers.length > 0 && (
              <SectionCard id="towers" icon={Building2} title="Towers & Buildings">
                <div className="grid gap-3 sm:grid-cols-2">
                  {towers.map((t: any, i: number) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="font-bold text-slate-900">{t.name || `Tower ${i + 1}`}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                        {t.floors ? <span>{t.floors} Floors</span> : null}
                        {t.liftCount ? <span>{t.liftCount} Lifts</span> : null}
                        {t.status ? <span className="font-semibold text-slate-700">{t.status}</span> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Specifications */}
            {specEntries.length > 0 && (
              <SectionCard id="specifications" icon={Hammer} title="Specifications">
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {specEntries.map(([k, v]) => (
                    <div key={k} className="border-b border-slate-50 pb-2">
                      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">{humanize(k)}</dt>
                      <dd className="mt-0.5 text-sm text-slate-700">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </SectionCard>
            )}

            {/* Pricing & charges */}
            {charges.length > 0 && (
              <SectionCard id="pricing" icon={IndianRupee} title="Pricing & Charges">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {charges.map((c, i) => (
                    <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{c.label}</p>
                      <p className="mt-0.5 text-sm font-extrabold text-slate-900">{c.value}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Financial plans */}
            {(paymentPlans.length > 0 || bankApprovals.length > 0 || loanPartners.length > 0) && (
              <SectionCard id="financial" icon={Landmark} title="Payment Plans & Bank Approvals">
                {paymentPlans.filter((pp: any) => pp.enabled !== false && pp.name).length > 0 && (
                  <div className="space-y-2">
                    {paymentPlans.filter((pp: any) => pp.enabled !== false && pp.name).map((pp: any, i: number) => (
                      <div key={i} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{pp.name}</span>
                          {pp.type && <span className="rounded bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">{pp.type}</span>}
                        </div>
                        {pp.details && <p className="mt-1 text-xs text-slate-600">{pp.details}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {bankApprovals.filter((b: any) => b.bankName).length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Approved Banks</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[420px]">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                            <th className="py-2 pr-4">Bank</th><th className="py-2 pr-4">Loan Type</th><th className="py-2 pr-4">Rate</th><th className="py-2">Max LTV</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {bankApprovals.filter((b: any) => b.bankName).map((b: any, i: number) => (
                            <tr key={i}>
                              <td className="py-2 pr-4 font-semibold text-slate-800">{b.bankName}</td>
                              <td className="py-2 pr-4 text-slate-600">{b.loanType || "—"}</td>
                              <td className="py-2 pr-4 text-slate-600">{b.interestRate ? `${b.interestRate}%` : "—"}</td>
                              <td className="py-2 text-slate-600">{b.maxFundingPct ? `${b.maxFundingPct}%` : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                {loanPartners.filter((lp: any) => lp.name).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {loanPartners.filter((lp: any) => lp.name).map((lp: any, i: number) => (
                      <span key={i} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">{lp.name}</span>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {/* Construction timeline */}
            {(timeline.foundationStatus || milestones.length > 0 || progressImages.length > 0 || progressVideos.length > 0 || timelineVideoLinks.length > 0) && (
              <SectionCard id="timeline" icon={Clock} title="Construction Progress">
                <div className="flex flex-wrap gap-2">
                  {[["Foundation", timeline.foundationStatus], ["Structure", timeline.structureStatus], ["Finishing", timeline.finishingStatus]]
                    .filter(([, v]) => v).map(([label, v]) => (
                      <span key={label as string} className={`rounded-full px-3 py-1 text-xs font-bold ${progressTone(v as string)}`}>{label}: {v as string}</span>
                    ))}
                  {timeline.possessionDateText && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"><CalendarClock className="h-3.5 w-3.5" /> Possession: {timeline.possessionDateText}</span>
                  )}
                </div>
                {milestones.filter((m: any) => m.label).length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {milestones.filter((m: any) => m.label).map((m: any, i: number) => (
                      <li key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                        <span className="font-medium text-slate-700">{m.label}</span>
                        <span className="flex items-center gap-2 text-xs">
                          {m.date && <span className="text-slate-400">{m.date}</span>}
                          <span className={`rounded-full px-2 py-0.5 font-bold ${progressTone(m.status)}`}>{m.status || "Pending"}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                {progressImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {progressImages.map((img: string, i: number) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={i} href={img} target="_blank" rel="noreferrer" className="group block aspect-square overflow-hidden rounded-lg border border-slate-100">
                        <img src={img} alt={`Progress ${i + 1}`} className="h-full w-full object-cover transition group-hover:scale-105" />
                      </a>
                    ))}
                  </div>
                )}
                {(progressVideos.length > 0 || timelineVideoLinks.length > 0) && (
                  <div className="mt-4 space-y-1.5">
                    {[...progressVideos, ...timelineVideoLinks].map((v: string, i: number) => (
                      <a key={i} href={v} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-brand hover:underline">
                        <Film className="h-4 w-4 shrink-0" /> <span className="truncate">{v}</span>
                      </a>
                    ))}
                  </div>
                )}
              </SectionCard>
            )}

            {/* Nearby */}
            {nearby.length > 0 && (
              <SectionCard id="nearby" icon={MapPin} title="Location & Connectivity">
                <div className="grid gap-2 sm:grid-cols-2">
                  {nearby.map((n: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-700"><span className="font-semibold">{n.name || "—"}</span> {n.category ? <span className="text-xs text-slate-400">· {n.category}</span> : null}</span>
                      <span className="text-xs font-bold text-slate-500">{n.distance || n.travelTime || ""}</span>
                    </div>
                  ))}
                </div>
                {p.googleMapsUrl && (
                  <a href={p.googleMapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                    <MapPin className="h-4 w-4" /> View on Google Maps
                  </a>
                )}
              </SectionCard>
            )}

            {/* Documents & assets */}
            {(docEntries.length > 0 || assets.length > 0 || p.brochurePdfUrl || p.priceSheetPdfUrl) && (
              <SectionCard id="documents" icon={FileText} title="Documents & Downloads">
                <div className="grid gap-2 sm:grid-cols-2">
                  {p.brochurePdfUrl && <DocLink href={p.brochurePdfUrl} label="Project Brochure" />}
                  {p.priceSheetPdfUrl && <DocLink href={p.priceSheetPdfUrl} label="Price Sheet" />}
                  {p.masterPlanUrl && <DocLink href={p.masterPlanUrl} label="Master Plan" />}
                  {docEntries.map(([k, v]) => <DocLink key={k} href={String(v)} label={humanize(k)} />)}
                  {assets.map((a: any, i: number) => <DocLink key={`a-${i}`} href={a.url} label={a.name || "Asset"} kind={a.kind} />)}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-24 self-start">
            {/* Price + CTA */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Starting from</p>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">{priceLabel}</p>
              {p.launchOffer && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">🎉 {p.launchOffer}</p>}
              <div className="mt-4 flex flex-col gap-2">
                <a href="#interest" className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-bold text-white hover:bg-brand-hover">Show Interest</a>
                {p.enableDownloadBrochure !== false && p.brochurePdfUrl && (
                  <a href={p.brochurePdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                    <Download className="h-4 w-4" /> Download Brochure
                  </a>
                )}
              </div>
            </div>

            {/* Lead form */}
            <div id="interest" className="scroll-mt-24">
              <LeadCaptureForm
                source={`Project: ${p.name}`.slice(0, 60)}
                title="Interested in this project?"
                subtitle="Share your details and our team will call you back with offers, floor plans and pricing."
              />
            </div>

            {/* Builder card */}
            {developerName && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">About the Developer</p>
                <div className="mt-2 flex items-center gap-3">
                  {(dev?.logo || p.builderLogo) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(dev?.logo || p.builderLogo) as string} alt={developerName} className="h-12 w-12 rounded-lg object-contain border border-slate-100 bg-white p-1" />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-soft text-brand"><Award className="h-6 w-6" /></span>
                  )}
                  <div>
                    <p className="font-bold text-slate-900">{developerName}</p>
                    {(dev?.city || dev?.state) && <p className="text-xs text-slate-500">{[dev?.city, dev?.state].filter(Boolean).join(", ")}</p>}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat icon={BadgeCheck} label="Experience" value={(dev?.experienceYears ?? p.yearsExperience) ? `${dev?.experienceYears ?? p.yearsExperience} yrs` : "—"} />
                  <Stat icon={CheckCircle2} label="Delivered" value={(dev?.projectsDelivered ?? p.projectsDelivered) ?? "—"} />
                  <Stat icon={TrendingUp} label="Ongoing" value={(dev?.ongoingProjectsCount ?? p.ongoingProjectsCount) ?? "—"} />
                </div>
                {(dev?.description || p.aboutBuilder) && (
                  <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-5">{dev?.description || p.aboutBuilder}</p>
                )}
                {(dev?.website || p.website) && (
                  <a href={(dev?.website || p.website) as string} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                    <Globe className="h-4 w-4" /> Visit website
                  </a>
                )}
              </div>
            )}

            {/* Sales contact */}
            {(p.address || p.salesPhone || p.salesEmail || p.salesWhatsapp || salesManagers.length > 0) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Sales Contact</p>
                {p.address && <p className="mt-2 flex items-start gap-2 text-sm text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {p.address}</p>}
                <div className="mt-3 space-y-1.5">
                  {p.salesPhone && <a href={`tel:${p.salesPhone}`} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-brand"><Phone className="h-4 w-4 text-brand" /> {p.salesPhone}</a>}
                  {p.salesWhatsapp && <a href={`https://wa.me/${p.salesWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-brand"><MessageCircle className="h-4 w-4 text-emerald-600" /> {p.salesWhatsapp}</a>}
                  {p.salesEmail && <a href={`mailto:${p.salesEmail}`} className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-brand"><Mail className="h-4 w-4 text-brand" /> {p.salesEmail}</a>}
                </div>
                {salesManagers.filter((m: any) => m.name).length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Sales Managers</p>
                    {salesManagers.filter((m: any) => m.name).map((m: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-bold text-brand">{(m.name || "?").slice(0, 2).toUpperCase()}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{m.name}{m.role ? <span className="font-normal text-slate-400"> · {m.role}</span> : null}</p>
                          <p className="text-xs text-slate-500 truncate">{[m.phone, m.email].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <Icon className="mx-auto h-4 w-4 text-brand" />
      <p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function DocLink({ href, label, kind }: { href: string; label: string; kind?: string }) {
  const isImg = kind === "image";
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-brand/40 hover:bg-brand-soft/40 transition">
      {isImg ? <ImageIcon className="h-4 w-4 shrink-0 text-brand" /> : <FileText className="h-4 w-4 shrink-0 text-brand" />}
      <span className="truncate">{label}</span>
      <Download className="ml-auto h-4 w-4 shrink-0 text-slate-400" />
    </a>
  );
}
