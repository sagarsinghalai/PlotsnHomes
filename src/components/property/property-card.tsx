import { Bed, Bath, MapPin, Maximize2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { RateBadge } from "@/components/market/rate-badge";
import { Sparkline } from "@/components/market/sparkline";
import { marketRatingColor } from "@/lib/market";
import { formatCurrency, parseImages } from "@/lib/utils";
import type { Property, User } from "@prisma/client";

type PropertyWithAgent = Property & { agent?: Pick<User, "name" | "email"> };

export function PropertyCard({ property }: { property: PropertyWithAgent }) {
  const images = parseImages(property.images);
  const img = images[0] ?? "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700"
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
            <p className="text-xl font-bold text-white">
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

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          {property.bhk && (
            <span className="rounded-md bg-gold/10 px-2 py-0.5 text-xs font-bold text-gold-dark border border-gold/20">
              {property.bhk}
            </span>
          )}
          {property.bedrooms > 0 && (
            <span className="flex items-center gap-1"><Bed className="h-4 w-4" />{property.bedrooms}</span>
          )}
          {property.bathrooms > 0 && (
            <span className="flex items-center gap-1"><Bath className="h-4 w-4" />{property.bathrooms}</span>
          )}
          {property.sqft ? (
            <span className="flex items-center gap-1"><Maximize2 className="h-4 w-4" />{property.sqft} sqft</span>
          ) : null}
          {property.garages > 0 ? <span>{property.garages} cars</span> : null}
          {property.lotSize ? <span>{property.lotSize} lot</span> : null}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 text-sm">
          <div>
            <span className="text-slate-500">Yield </span>
            <span className="font-mono font-semibold text-emerald-600">{property.yieldRate.toFixed(2)}%</span>
            <span className="mx-2 text-slate-300">·</span>
            <span className="text-slate-500">Cap </span>
            <span className="font-mono font-semibold text-slate-800">{property.capRate.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
