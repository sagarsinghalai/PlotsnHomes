import Link from "next/link";
import { Suspense } from "react";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyPagination } from "@/components/property/pagination";
import { WpHeroSearch } from "@/components/property/wp-hero-search";
import {
  buildPropertyOrderBy,
  buildPropertyWhere,
  parsePropertySearch,
  type PropertySearchParams,
} from "@/lib/property-search";
import { prisma } from "@/lib/prisma";
import { getBhkConfigurations } from "@/lib/system-settings";
import { getPublicTenantId } from "@/lib/public-tenant";

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: PropertySearchParams;
}) {
  const tenantId = await getPublicTenantId();
  const filters = parsePropertySearch(searchParams);
  const where = { ...buildPropertyWhere(filters), tenantId };
  const orderBy = buildPropertyOrderBy(filters.sort);

  const [total, properties, priceRange, citiesRaw, areasRaw, suggestionsRaw, bhkOptions] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy,
      skip: filters.skip,
      take: filters.perPage,
      include: { agent: { select: { name: true, email: true, phone: true } } },
    }),
    prisma.property.aggregate({
      where: { status: "ACTIVE", tenantId },
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.property.findMany({
      where: { status: "ACTIVE", tenantId },
      select: { city: true, state: true },
      distinct: ["city", "state"],
      orderBy: { city: "asc" },
      take: 40,
    }),
    prisma.property.findMany({
      where: { status: "ACTIVE", area: { not: null }, tenantId },
      select: { area: true },
      distinct: ["area"],
      take: 30,
    }),
    prisma.property.findMany({
      where: { status: "ACTIVE", tenantId },
      select: { title: true, symbol: true },
      orderBy: { title: "asc" },
      take: 200,
    }),
    getBhkConfigurations(),
  ]);

  const totalPages = Math.ceil(total / filters.perPage);
  const areas = areasRaw.map((a) => a.area).filter(Boolean) as string[];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Compact page header — no hero image */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-hover">PlotsnHomes</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-slate-900">All Properties</h1>
          </div>
          <p className="text-sm text-slate-500">{total.toLocaleString()} listings · Buy &amp; rent</p>
        </div>

        {/* Search filters directly under the header */}
        <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <Suspense fallback={<div className="h-24 bg-slate-100 rounded-xl animate-pulse" />}>
            <WpHeroSearch
              priceMin={priceRange._min.price ?? 0}
              priceMax={priceRange._max.price ?? 2000000}
              cities={citiesRaw}
              areas={areas}
              suggestions={suggestionsRaw}
              bhkOptions={bhkOptions}
            />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              {total.toLocaleString()} properties
              {filters.listingType ? ` · ${filters.listingType === "RENT" ? "Rentals" : "Sales"}` : ""}
            </p>
            <Link href="/dashboard/list-property" className="text-sm font-medium text-brand-hover hover:underline">
              + List your property
            </Link>
          </div>

          {properties.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
              <p className="text-lg font-medium text-slate-700">No properties match your filters</p>
            </div>
          )}

          <PropertyPagination page={filters.page} totalPages={totalPages} searchParams={searchParams} />
        </div>
      </div>
    </div>
  );
}

