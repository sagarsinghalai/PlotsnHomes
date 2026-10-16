"use client";

import { Bed, Bath, MapPin, Maximize2, Car, Ruler, Phone, Mail } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { RateBadge } from "@/components/market/rate-badge";
import { Sparkline } from "@/components/market/sparkline";
import { marketRatingColor } from "@/lib/market";
import { formatCurrency, parseImages } from "@/lib/utils";
import { buildPropertyWhatsAppMessage, whatsAppWebUrl } from "@/lib/messaging-settings";
import type { Property, User } from "@prisma/client";

type PropertyWithAgent = Property & { agent?: { name: string; email: string; phone?: string | null } };

export function PropertyCard({ property }: { property: PropertyWithAgent }) {
  const router = useRouter();
  const images = parseImages(property.images);
  const img = images[0] ?? "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";

  return (
    <div
      onClick={() => router.push(`/properties/${property.slug}`)}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={img}
          alt={property.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-md bg-slate-900/90 px-2 py-1 font-mono text-xs font-bold text-gold backdrop-blur">
            {property.symbol}
          </span>
          {property.category && (
            <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-800">
              {property.category}
            </span>
          )}
          <span className="rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-slate-800">
            {property.listingType === "RENT" ? "Rent" : "Sale"}
          </span>
          {property.featured && (
            <span className="rounded-md bg-gold px-2 py-1 text-xs font-bold text-slate-900">Featured</span>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <span className={`rounded-md bg-slate-900/80 px-2 py-1 text-xs font-bold backdrop-blur ${marketRatingColor(property.marketRating)}`}>
            {property.marketRating}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <p className="text-xl font-bold text-white" suppressHydrationWarning>
              {property.listingType === "RENT" && property.rentMonthly
                ? `${formatCurrency(property.rentMonthly)} / mo`
                : formatCurrency(property.price)}
            </p>
            {property.pricePerSqft && (
              <p className="text-xs text-slate-300">${property.pricePerSqft.toFixed(0)}/sqft</p>
            )}
          </div>
          <Sparkline priceHistory={property.priceHistory} width={88} height={28} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-2">
          {!!property.change24h && <RateBadge value={property.change24h} label="24h" />}
          {!!property.changeYtd && <RateBadge value={property.changeYtd} label="YTD" />}
        </div>

        <h3 className="mt-3 font-semibold text-slate-900 line-clamp-1">{property.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {property.city}, {property.state}
        </p>

        {/* Detailed Amenities Section (Borders Removed) */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2 py-1 text-xs text-slate-500 font-medium">
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1"><Bed className="h-4 w-4 text-slate-400" /> {property.bedrooms}</span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1"><Bath className="h-4 w-4 text-slate-400" /> {property.bathrooms}</span>
          )}
          {property.sqft ? (
            <span className="flex items-center gap-1"><Maximize2 className="h-4 w-4 text-slate-400" /> {property.sqft.toLocaleString()} ft²</span>
          ) : null}
          {property.garages > 0 ? (
            <span className="flex items-center gap-1"><Car className="h-4 w-4 text-slate-400" /> {property.garages} cars</span>
          ) : null}
          {property.lotSize ? (
            <span className="flex items-center gap-1"><Ruler className="h-4 w-4 text-slate-400" /> {property.lotSize.toLocaleString()} ft²</span>
          ) : null}
        </div>

        <div className="mt-3 pt-1 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Yield </span>
            <span className="font-mono font-semibold text-emerald-600">
              {(() => {
                const preRate = (property as any).preLaunchRate;
                const cRate = property.pricePerSqft || (property.sqft ? property.price / property.sqft : 0);
                const calculated = preRate && cRate > 0 ? ((cRate - preRate) / preRate) * 100 : property.yieldRate;
                return calculated.toFixed(2);
              })()}%
            </span>
            <span className="mx-2 text-slate-300">·</span>
            <span className="text-slate-500">Cap </span>
            <span className="font-mono font-semibold text-slate-800">{property.capRate.toFixed(2)}%</span>
          </div>
        </div>

        {/* Contact CTA buttons for Phone, Email and WhatsApp (Border Removed) */}
        <div className="mt-4 flex gap-2 w-full text-xs font-semibold">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const phone = (property as any).contactPhone || property.agent?.phone || "+919958343556";
              window.location.href = `tel:${phone}`;
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gold/5 border border-gold/25 py-2.5 text-gold-dark hover:bg-gold/10 transition duration-200"
          >
            <Phone className="h-3.5 w-3.5" /> Call
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const email = (property as any).contactEmail || property.agent?.email || "info@plotsnhomes.com";
              window.location.href = `mailto:${email}`;
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gold/5 border border-gold/25 py-2.5 text-gold-dark hover:bg-gold/10 transition duration-200"
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const whatsapp = (property as any).contactWhatsapp || property.agent?.phone || "+919958343556";
              const waMsg = buildPropertyWhatsAppMessage(property);
              window.open(whatsAppWebUrl(whatsapp, waMsg), "_blank");
            }}
            className="w-10 flex items-center justify-center rounded-lg bg-gold/5 border border-gold/25 text-gold-dark hover:bg-gold/10 transition duration-200 shrink-0"
            title="Contact via WhatsApp with Property Info & Link"
          >
            <svg
              className="h-4 w-4 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.857.002-2.636-1.023-5.11-2.884-6.974C16.586 1.91 14.112.883 11.476.883c-5.447 0-9.873 4.42-9.877 9.86-.001 1.733.453 3.424 1.316 4.919l-.97 3.547 3.634-.954zM17.15 13.9c-.29-.145-1.72-.85-1.985-.947-.267-.097-.461-.145-.656.145-.194.29-.754.947-.923 1.14-.17.194-.339.218-.63.073-.29-.145-1.229-.453-2.34-1.445-.865-.772-1.45-1.725-1.619-2.016-.17-.29-.018-.447.127-.592.13-.13.29-.339.436-.509.145-.17.194-.29.291-.485.097-.194.049-.364-.024-.509-.073-.145-.656-1.58-.9-2.167-.236-.57-.478-.49-.656-.5-.17-.008-.364-.01-.558-.01-.194 0-.509.073-.777.364-.267.29-1.02 1.02-1.02 2.487 0 1.467 1.067 2.885 1.213 3.08.145.194 2.1 3.21 5.09 4.51.71.31 1.266.49 1.698.63.714.227 1.36.195 1.871.118.571-.085 1.72-.704 1.96-1.385.24-.68.24-1.26.17-1.38-.07-.12-.26-.19-.55-.335z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
