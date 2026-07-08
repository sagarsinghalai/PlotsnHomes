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
  furnishingStatus: string | null;
  hasServantRoom: boolean;
  hasPujaRoom: boolean;
  hasStudyRoom: boolean;
  balconies: number;
  liftType: string | null;
  flatsPerFloor: number | null;
  availabilityStatus: string;
  videoUrl: string | null;
  virtualTourUrl: string | null;
  mapLat: number | null;
  mapLng: number | null;
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

const TABS = [
  "Overview",
  "Description",
  "Address & Map",
  "Details",
  "Features",
  "Video",
  "Virtual Tour",
  "Calculator",
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
                ? "border-gold text-gold-dark"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="py-8">
        {tab === "Overview" && (
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
        )}

        {tab === "Description" && (
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
            {property.description}
          </p>
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
                {property.mapLat && property.mapLng ? (
                  <iframe
                    title="Map"
                    className="w-full h-80 border-0"
                    src={`https://maps.google.com/maps?q=${property.mapLat},${property.mapLng}&z=15&output=embed`}
                  />
                ) : (
                  <iframe
                    title="Map"
                    className="w-full h-80 border-0"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(`${property.address}, ${property.city}`)}&output=embed`}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "Details" && (
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            {[
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
              ["Total floors", property.totalFloors ?? "—"],
              ["Floor number", property.floorNumber ?? "—"],
              ["Flats per floor", property.flatsPerFloor ?? "—"],
              ["Rooms", property.rooms ?? "—"],
              ["Balconies", property.balconies > 0 ? property.balconies : "—"],
              ["Lift", property.liftType || "—"],
              ["Availability", property.availabilityStatus || "—"],
              ["Year built", property.yearBuilt ?? "—"],
              ["Yield", `${property.yieldRate.toFixed(2)}%`],
              ["Cap rate", `${property.capRate.toFixed(2)}%`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b py-2">
                <span className="text-slate-500">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </dl>
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
                          ? "bg-amber-100 text-gold-dark border-gold shadow-sm"
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
              className="text-gold-dark text-sm font-medium hover:underline"
            >
              Open full loan calculator →
            </a>
          </div>
        )}

        {tab === "Statistics" && (
          <PriceChart
            priceHistory={property.priceHistory}
            currentPrice={property.price}
          />
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
                  className="text-gold-dark hover:underline text-sm"
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
