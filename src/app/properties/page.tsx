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

export const dynamic = "force-dynamic";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: PropertySearchParams;
}) {
  const filters = parsePropertySearch(searchParams);
  const where = buildPropertyWhere(filters);
  const orderBy = buildPropertyOrderBy(filters.sort);

  const [total, properties, priceRange, citiesRaw, areasRaw, suggestionsRaw, bhkOptions] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy,
      skip: filters.skip,
      take: filters.perPage,
      include: { agent: { select: { name: true, email: true } } },
    }),
    prisma.property.aggregate({
      where: { status: "ACTIVE" },
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.property.findMany({
      where: { status: "ACTIVE" },
      select: { city: true, state: true },
      distinct: ["city", "state"],
      orderBy: { city: "asc" },
      take: 40,
    }),
    prisma.property.findMany({
      where: { status: "ACTIVE", area: { not: null } },
      select: { area: true },
      distinct: ["area"],
      take: 30,
    }),
    prisma.property.findMany({
      where: { status: "ACTIVE" },
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
      <section className="relative bg-slate-900 text-white py-12 sm:py-14">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80')] bg-cover bg-center opacity-30" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-center">Find your property</h1>
          <p className="mt-1.5 text-center text-sm text-slate-300">{total.toLocaleString()} listings · Buy &amp; rent</p>
          <div className="mt-6 sm:mt-8">
            <Suspense fallback={<div className="h-36 bg-white/10 rounded-xl animate-pulse" />}>
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
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-slate-600">
                {total.toLocaleString()} properties
                {filters.listingType ? ` · ${filters.listingType === "RENT" ? "Rentals" : "Sales"}` : ""}
              </p>
              <Link href="/dashboard/list-property" className="text-sm font-medium text-gold-dark hover:underline">
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
