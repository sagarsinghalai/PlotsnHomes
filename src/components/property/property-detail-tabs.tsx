"use client";

import { useState } from "react";
import { buildInvestmentSummary } from "@/lib/calculations";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ScheduleTourForm } from "@/components/property/schedule-tour-form";
import { PriceChart } from "@/components/market/price-chart";

type PropertyData = {
  id: string;
  slug: string;
  title: string;
  symbol: string;
  description: string;
  price: number;
  rentMonthly: number | null;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  lotSize: number | null;
  totalFloors: number | null;
  floorNumber: number | null;
  rooms: number | null;
  garages: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  category: string | null;
  area: string | null;
  listingType: string;
  yearBuilt: number | null;
  yieldRate: number;
  capRate: number;
  interestRate: number;
  pricePerSqft: number | null;
  priceHistory: string;
  listedPrice: number | null;
  currentPrice: number | null;
  basePriceRate?: number | null;
  softLaunchRate?: number | null;
  preLaunchRate?: number | null;
  launchRate?: number | null;
  furnishingStatus: string | null;
  hasServantRoom: boolean;
  hasPujaRoom: boolean;
  hasStudyRoom: boolean;
  balconies: number;
  liftType: string | null;
  flatsPerFloor: number | null;
  availabilityStatus?: string;
  videoUrl?: string | null;
  virtualTourUrl?: string | null;
  mapLat?: number | null;
  mapLng?: number | null;
  status?: string;
  type?: string;
  developerName?: string | null;
  developer?: { id: string; name: string; city?: string | null } | null;
  project?: { id: string; name: string } | null;
  customFields?: string | null;
  features: string[];
  pdfs: { name: string; url: string }[];
  videos: string[];
  agent: {
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
  };
  transactions?: {
    id: string;
    amount: number;
    status: string;
    type: string;
    paymentPlan: string | null;
    paymentMethod: string | null;
    createdAt: string;
    brokerageRate?: number;
    brokerageAmount?: number;
    sellerAmount?: number;
    user: {
      name: string;
      email: string;
    };
  }[];
};

function getYouTubeId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com")) {
      const v = urlObj.searchParams.get("v");
      if (v) return v;
      const paths = urlObj.pathname.split("/");
      if (paths.includes("embed") || paths.includes("shorts")) {
        return paths[paths.length - 1];
      }
    } else if (urlObj.hostname.includes("youtu.be")) {
      return urlObj.pathname.slice(1);
    }
  } catch {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
  }
  return null;
}

function getVimeoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("vimeo.com")) {
      const paths = urlObj.pathname.split("/");
      for (let i = paths.length - 1; i >= 0; i--) {
        if (/^\d+$/.test(paths[i])) {
          return paths[i];
        }
      }
    }
  } catch {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (match) return match[1];
  }
  return null;
}

function isEmbedUrl(url: string): boolean {
  return !!(getYouTubeId(url) || getVimeoId(url));
}

function getEmbedMapUrl(property: PropertyData): string {
  if (property.customFields) {
    try {
      const arr = typeof property.customFields === "string" ? JSON.parse(property.customFields) : property.customFields;
      if (Array.isArray(arr)) {
        const found = arr.find((cf: any) =>
          cf.value && (cf.value.includes("maps.google.com") || cf.value.includes("google.com/maps") || cf.value.includes("maps.app.goo.gl") || cf.label?.toLowerCase().includes("map"))
        );
        if (found?.value) {
          const val = found.value.trim();
          const match = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || val.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/) || val.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || val.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
          if (match) {
            return `https://maps.google.com/maps?q=${match[1]},${match[2]}&z=16&output=embed`;
          }
          if (val.includes("output=embed") || val.includes("/embed")) {
            return val;
          }
        }
      }
    } catch {}
  }

  if (property.mapLat !== null && property.mapLat !== undefined && property.mapLng !== null && property.mapLng !== undefined) {
    return `https://maps.google.com/maps?q=${property.mapLat},${property.mapLng}&z=16&output=embed`;
  }

  return `https://maps.google.com/maps?q=${encodeURIComponent(`${property.address}, ${property.city}`)}&z=15&output=embed`;
}

function getEmbedUrl(url: string): string {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return `https://www.youtube.com/embed/${ytId}`;
  }
  const vimeoId = getVimeoId(url);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }
  return url;
}

import { PropertyPriceHistoryCard } from "@/components/property/property-price-history-card";

const TABS = [
  "Overview",
  "Description",
  "Address & Map",
  "Details",
  "Features",
  "Video",
  "Virtual Tour",
  "Calculator",
  "Price History & Appreciation",
  "Statistics",
  "Transactions",
  "Schedule a tour",
] as const;

export function PropertyDetailTabs({ property }: { property: PropertyData }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);

  const allVideos: string[] = [];
  if (property.videoUrl) {
    allVideos.push(property.videoUrl);
  }
  if (property.videos && property.videos.length > 0) {
    property.videos.forEach((v) => {
      if (v && !allVideos.includes(v)) {
        allVideos.push(v);
      }
    });
  }

  const rent = property.rentMonthly ?? property.price * 0.006;
  const summary = buildInvestmentSummary({
    price: property.price,
    downPaymentPercent: 20,
    annualRatePercent: property.interestRate,
    loanYears: 30,
    monthlyRent: rent,
    monthlyExpenses: 450,
    closingCosts: 8000,
  });

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition ${
              tab === t
                ? "border-brand text-brand-hover"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="py-8">
        {tab === "Overview" && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ["Bedrooms", property.bedrooms],
                ["Bathrooms", property.bathrooms],
                ["Garages", property.garages],
                ["Sq ft", property.sqft ?? "—"],
              ].map(([l, v]) => (
                <div key={l as string} className="rounded-xl border p-4">
                  <p className="text-xs text-slate-500 uppercase">{l}</p>
                  <p className="text-xl font-bold mt-1">{v}</p>
                </div>
              ))}
            </div>

            {/* Launch Stage Pricing & Appreciation Breakdown (PriceFilters.xlsx) */}
            {(property.softLaunchRate || property.preLaunchRate || property.launchRate || property.currentPrice || property.price) && (() => {
              const sqft = property.sqft || 1000;
              const soft = property.softLaunchRate ?? 6000;
              const pre = property.preLaunchRate ?? 6500;
              const launch = property.launchRate ?? 7000;
              const current = property.currentPrice ?? (property.price ? property.price / sqft : 7300);

              const softTotal = soft * sqft;
              const preTotal = pre * sqft;
              const launchTotal = launch * sqft;
              const currentTotal = current * sqft;

              // Excel Formula: Base price (D14) is Soft Launch / Pre-Launch rate (soft if > 0, else pre, else launch)
              const baseRate = soft > 0 ? soft : (pre > 0 ? pre : (launch > 0 ? launch : 0));
              const baseTotal = baseRate * sqft;

              // Appreciation (amount) = Current Price - Prelaunch Price (=(D17-D14))
              const appAmount = current - baseRate;
              const appTotalAmount = currentTotal - baseTotal;
              // Appreciation (%) = (Current Price - Prelaunch Price) / Prelaunch Price * 100 (=(D17-D14)/D14)
              const appPct = baseRate > 0 ? ((current - baseRate) / baseRate) * 100 : 0;

              return (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Price Filters & Stage Appreciation Matrix</h3>
                      <p className="text-xs text-slate-500">Historical launch stage progression & calculated capital appreciation (PriceFilters.xlsx)</p>
                    </div>
                    <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800">
                      Excel Formula Sync
                    </span>
                  </div>

                  {/* 4 Distinct Boxes (Soft Launch, Pre Launch, Launch Price, Current Price) */}
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-white p-3.5 border border-slate-200 space-y-0.5">
                      <span className="text-xs text-slate-500 font-medium block">Soft Launch</span>
                      <span className="text-base font-bold text-slate-900 block">
                        ₹{soft.toLocaleString("en-IN")} / sqft
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Total: ₹{softTotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-3.5 border border-slate-200 space-y-0.5">
                      <span className="text-xs text-slate-500 font-medium block">Pre Launch</span>
                      <span className="text-base font-bold text-slate-900 block">
                        ₹{pre.toLocaleString("en-IN")} / sqft
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Total: ₹{preTotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="rounded-xl bg-white p-3.5 border border-slate-200 space-y-0.5">
                      <span className="text-xs text-slate-500 font-medium block">Launch Price</span>
                      <span className="text-base font-bold text-slate-900 block">
                        ₹{launch.toLocaleString("en-IN")} / sqft
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Total: ₹{launchTotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-300 space-y-0.5">
                      <span className="text-xs text-emerald-700 font-bold block">Current Price</span>
                      <span className="text-base font-extrabold text-emerald-900 block">
                        ₹{current.toLocaleString("en-IN")} / sqft
                      </span>
                      <span className="text-[11px] text-emerald-700 font-semibold block">
                        Total: ₹{currentTotal.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* PriceFilters.xlsx Exact Table Matrix */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Stage / Parameter</th>
                          <th className="px-4 py-3 text-emerald-700">rate/sqft</th>
                          <th className="px-4 py-3 text-slate-700">Area (sqft)</th>
                          <th className="px-4 py-3 text-brand-hover">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                        <tr>
                          <td className="px-4 py-2.5 font-bold text-slate-900">Soft Launch</td>
                          <td className="px-4 py-2.5 font-mono">{soft}</td>
                          <td className="px-4 py-2.5 font-mono">{sqft}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-900">₹{softTotal.toLocaleString("en-IN")}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 font-bold text-slate-900">Pre Launch</td>
                          <td className="px-4 py-2.5 font-mono">{pre}</td>
                          <td className="px-4 py-2.5 font-mono">{sqft}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-900">₹{preTotal.toLocaleString("en-IN")}</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2.5 font-bold text-slate-900">Launch Price</td>
                          <td className="px-4 py-2.5 font-mono">{launch}</td>
                          <td className="px-4 py-2.5 font-mono">{sqft}</td>
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-900">₹{launchTotal.toLocaleString("en-IN")}</td>
                        </tr>
                        <tr className="bg-emerald-50/70 font-bold">
                          <td className="px-4 py-2.5 text-emerald-900">Current Price</td>
                          <td className="px-4 py-2.5 font-mono text-emerald-800">{current}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-900">{sqft}</td>
                          <td className="px-4 py-2.5 font-mono text-emerald-800">₹{currentTotal.toLocaleString("en-IN")}</td>
                        </tr>
                        <tr className="bg-amber-50/60 font-bold border-t-2 border-slate-200">
                          <td className="px-4 py-2.5 text-amber-900">Appreciation (%)</td>
                          <td className="px-4 py-2.5 font-mono text-emerald-700">+{appPct.toFixed(2)}%</td>
                          <td className="px-4 py-2.5 text-slate-400">—</td>
                          <td className="px-4 py-2.5 font-mono text-emerald-700">+{appPct.toFixed(2)}%</td>
                        </tr>
                        <tr className="bg-amber-100/60 font-extrabold">
                          <td className="px-4 py-2.5 text-amber-950">Appreciation (amount)</td>
                          <td className="px-4 py-2.5 font-mono text-amber-900">+{appAmount}</td>
                          <td className="px-4 py-2.5 font-mono text-slate-800">{sqft}</td>
                          <td className="px-4 py-2.5 font-mono text-amber-900">+₹{appTotalAmount.toLocaleString("en-IN")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {tab === "Description" && (
          <div className="space-y-6">
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {property.description}
            </p>

            {/* Backend Listing Information Matrix */}
            <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Property Listing Overview
              </h3>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <dt className="text-slate-500 font-medium mb-0.5">Listing type</dt>
                  <dd className="font-bold text-slate-900 capitalize">{property.listingType === "SALE" ? "Sales" : property.listingType}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium mb-0.5">Category</dt>
                  <dd className="font-bold text-slate-900">{property.category || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium mb-0.5">Area / neighborhood</dt>
                  <dd className="font-bold text-slate-900">{property.area || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium mb-0.5">Type</dt>
                  <dd className="font-bold text-slate-900">{property.type || "RESIDENTIAL"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium mb-0.5">Status</dt>
                  <dd className="font-bold text-slate-900">{property.status || "ACTIVE"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium mb-0.5">Agent</dt>
                  <dd className="font-bold text-slate-900 truncate" title={property.agent ? `${property.agent.name} (${property.agent.email})` : "Representative"}>
                    {property.agent?.name || "Representative"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium mb-0.5">Builder / developer</dt>
                  <dd className="font-bold text-slate-900">{property.developer?.name || property.developerName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 font-medium mb-0.5">Project</dt>
                  <dd className="font-bold text-slate-900">{property.project?.name || "—"}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {tab === "Address & Map" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="font-semibold text-slate-800 mb-4 text-base">
                Location Details
              </h3>
              <dl className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  ["Address", property.address],
                  ["City", property.city],
                  ["Area", property.area ?? "—"],
                  ["State", property.state],
                  ["Zip", property.zip],
                  ["Country", property.country],
                  ["Map latitude", property.mapLat !== null && property.mapLat !== undefined ? String(property.mapLat) : "—"],
                  ["Map longitude", property.mapLng !== null && property.mapLng !== undefined ? String(property.mapLng) : "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium text-slate-900 mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <div className="rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-slate-50">
                <iframe
                  title="Map"
                  className="w-full h-80 border-0"
                  src={getEmbedMapUrl(property)}
                />
              </div>
            </div>
          </div>
        )}

        {tab === "Details" && (
          <div>
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              {(() => {
                const customItems: [string, string][] = [];
                if (property.customFields) {
                  try {
                    const arr = typeof property.customFields === "string" ? JSON.parse(property.customFields) : property.customFields;
                    if (Array.isArray(arr)) {
                      arr.forEach((cf: any) => {
                        if (cf && typeof cf === "object" && cf.label) {
                          customItems.push([cf.label, cf.value || "—"]);
                        }
                      });
                    } else if (typeof arr === "object" && arr !== null) {
                      Object.entries(arr).forEach(([k, v]) => {
                        customItems.push([k, typeof v === "object" ? JSON.stringify(v) : String(v ?? "—")]);
                      });
                    }
                  } catch {}
                }

                const allItems: [string, string][] = [
                  ["Symbol", property.symbol],
                  ["Category", property.category ?? property.listingType],
                  ["Price", formatCurrency(property.price)],
                  [
                    "Listed Price",
                    property.listedPrice
                      ? formatCurrency(property.listedPrice)
                      : "—",
                  ],
                  [
                    "Current Price",
                    property.currentPrice
                      ? formatCurrency(property.currentPrice)
                      : "—",
                  ],
                  [
                    "Price/sqft",
                    property.pricePerSqft
                      ? `$${property.pricePerSqft.toFixed(0)}`
                      : "—",
                  ],
                  ["Property size", property.sqft ? `${property.sqft} sqft` : "—"],
                  ["Lot size", property.lotSize ? `${property.lotSize} sqft` : "—"],
                  ["Furnishing", property.furnishingStatus || "—"],
                  ["Total floors", property.totalFloors ? String(property.totalFloors) : "—"],
                  ["Floor number", property.floorNumber ? String(property.floorNumber) : "—"],
                  ["Flats per floor", property.flatsPerFloor ? String(property.flatsPerFloor) : "—"],
                  ["Rooms", property.rooms ? String(property.rooms) : "—"],
                  ["Balconies", property.balconies > 0 ? String(property.balconies) : "—"],
                  ["Lift", property.liftType || "—"],
                  ["Availability", property.availabilityStatus || "—"],
                  ["Year built", property.yearBuilt ? String(property.yearBuilt) : "—"],
                  ["Yield", `${property.yieldRate.toFixed(2)}%`],
                  ["Cap rate", `${property.capRate.toFixed(2)}%`],
                  ...customItems,
                ];

                return allItems.map(([k, v], idx) => (
                  <div key={k + idx} className="flex justify-between border-b py-2">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-medium text-slate-900 break-all pl-2">{v}</span>
                  </div>
                ));
              })()}
            </dl>
          </div>
        )}

        {tab === "Features" && (
          <div className="flex flex-wrap gap-2">
            {[
              ...property.features,
              ...(property.hasServantRoom ? ["Servant Room"] : []),
              ...(property.hasPujaRoom ? ["Puja Ghar"] : []),
              ...(property.hasStudyRoom ? ["Study Room"] : []),
            ].length > 0 ? (
              [
                ...property.features,
                ...(property.hasServantRoom ? ["Servant Room"] : []),
                ...(property.hasPujaRoom ? ["Puja Ghar"] : []),
                ...(property.hasStudyRoom ? ["Study Room"] : []),
              ].map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                >
                  {f}
                </span>
              ))
            ) : (
              <p className="text-slate-500">No features listed.</p>
            )}
          </div>
        )}

        {tab === "Video" &&
          (allVideos.length > 0 ? (
            <div className="space-y-4">
              <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-md">
                {isEmbedUrl(allVideos[activeVideoIndex]) ? (
                  <iframe
                    src={getEmbedUrl(allVideos[activeVideoIndex])}
                    title={`Property video ${activeVideoIndex + 1}`}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                ) : (
                  <video
                    key={allVideos[activeVideoIndex]}
                    src={allVideos[activeVideoIndex]}
                    controls
                    className="w-full h-full object-cover rounded-xl"
                  />
                )}
              </div>
              {allVideos.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {allVideos.map((url, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setActiveVideoIndex(index)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                        activeVideoIndex === index
                          ? "bg-amber-100 text-brand-hover border-brand shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      Video {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500">No video available.</p>
          ))}

        {tab === "Virtual Tour" &&
          (property.virtualTourUrl ? (
            <iframe
              src={property.virtualTourUrl}
              title="Virtual tour"
              className="w-full h-[500px] rounded-xl border"
            />
          ) : (
            <p className="text-slate-500">
              Virtual tour not available for this listing.
            </p>
          ))}

        {tab === "Calculator" && (
          <div className="max-w-lg space-y-4">
            <p className="text-3xl font-bold">
              {formatCurrency(summary.monthlyMortgage)}
              <span className="text-base font-normal text-slate-500">
                /month
              </span>
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Principal & interest</p>
                <p className="font-bold">
                  {formatCurrency(summary.monthlyMortgage)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Cap rate</p>
                <p className="font-bold">{formatNumber(summary.capRate, 2)}%</p>
              </div>
              <div>
                <p className="text-slate-500">Cash flow/mo</p>
                <p className="font-bold">
                  {formatCurrency(summary.monthlyCashFlow)}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Cash-on-cash</p>
                <p className="font-bold">
                  {formatNumber(summary.cashOnCash, 2)}%
                </p>
              </div>
            </div>
            <a
              href="/calculators"
              className="text-brand-hover text-sm font-medium hover:underline"
            >
              Open full loan calculator →
            </a>
          </div>
        )}

        {tab === "Price History & Appreciation" && (
          <PropertyPriceHistoryCard
            propertyId={property.id}
            initialPrice={property.price}
            sqft={property.sqft}
          />
        )}

        {tab === "Statistics" && (
          <div className="space-y-6">
            <PriceChart
              priceHistory={property.priceHistory}
              currentPrice={property.price}
            />
            <PropertyPriceHistoryCard
              propertyId={property.id}
              initialPrice={property.price}
              sqft={property.sqft}
            />
          </div>
        )}

        {tab === "Schedule a tour" && (
          <ScheduleTourForm
            propertyId={property.id}
            propertyTitle={property.title}
          />
        )}

        {tab === "Transactions" && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800 text-base">Property Transaction Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">Payment history, split payouts & platform broker fees</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/70 text-slate-500 font-semibold text-[11px] uppercase tracking-wider border-b">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Buyer</th>
                    <th className="px-6 py-3">Method</th>
                    <th className="px-6 py-3">Gross Paid</th>
                    <th className="px-6 py-3">Platform Share</th>
                    <th className="px-6 py-3">Seller Share</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {property.transactions && property.transactions.length > 0 ? (
                    property.transactions.map((tx) => {
                      const isOffline = tx.paymentMethod === "cheque" || tx.paymentMethod === "neft_rtgs";
                      const rate = tx.brokerageRate ?? (isOffline ? 0.0 : 3.0);
                      const platShare = tx.brokerageAmount ?? (isOffline ? 0.0 : tx.amount * (rate / 100));
                      const sellerPayout = tx.sellerAmount ?? (tx.amount - platShare);
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/35 transition-colors text-slate-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-xs text-slate-600">{new Date(tx.createdAt).toLocaleDateString()}</span>
                            <br />
                            <span className="text-[10px] text-slate-400 font-mono">{new Date(tx.createdAt).toLocaleTimeString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900 block leading-tight">{tx.user?.name ?? "—"}</span>
                            <span className="text-slate-400 text-xs font-mono">{tx.user?.email ?? "—"}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">
                            {tx.paymentMethod ? tx.paymentMethod.toUpperCase().replace("_", " ") : "—"}
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(tx.amount)}</td>
                          <td className="px-6 py-4 text-amber-700 font-semibold">
                            {formatCurrency(platShare)} {platShare > 0 ? `(${rate.toFixed(1)}%)` : ""}
                          </td>
                          <td className="px-6 py-4 text-emerald-700 font-semibold">{formatCurrency(sellerPayout)}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                tx.status === "COMPLETED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : tx.status === "PENDING"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-500 font-medium">
                        No transactions recorded for this property yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {property.pdfs.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="font-semibold mb-3">Documents (PDF)</h3>
          <ul className="space-y-2">
            {property.pdfs.map((p) => (
              <li key={p.url}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-hover hover:underline text-sm"
                >
                  {p.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
