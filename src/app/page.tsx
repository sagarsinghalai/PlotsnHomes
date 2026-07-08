import Link from "next/link";
import { Suspense } from "react";
import { PropertyCard } from "@/components/property/property-card";
import { WpHeroSearch } from "@/components/property/wp-hero-search";
import { prisma } from "@/lib/prisma";
import { getBhkConfigurations } from "@/lib/system-settings";

export default async function HomePage() {
  const [featured, totalCount, priceRange, citiesRaw, areasRaw, areaCounts, bhkOptions] = await Promise.all([
    prisma.property.findMany({
      where: { status: "ACTIVE", featured: true },
      take: 6,
      include: { agent: { select: { name: true, email: true } } },
      orderBy: { volumeScore: "desc" },
    }),
    prisma.property.count({ where: { status: "ACTIVE" } }),
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
    prisma.property.groupBy({
      by: ["area"],
      where: { status: "ACTIVE", area: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { area: "desc" } },
      take: 8,
    }),
    getBhkConfigurations(),
  ]);

  const fallback =
    featured.length >= 6
      ? featured
      : await prisma.property.findMany({
          where: { status: "ACTIVE" },
          take: 6,
          include: { agent: { select: { name: true, email: true } } },
          orderBy: { changeYtd: "desc" },
        });

  const areas = areasRaw.map((a) => a.area).filter(Boolean) as string[];
  const agents = await prisma.user.findMany({
    where: { role: "AGENT", active: true },
    take: 4,
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <section className="relative bg-slate-900 text-white py-16 lg:py-24">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1600&q=80')] bg-cover bg-center opacity-25" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase tracking-widest text-gold">
            Luxury Marketplace
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-center sm:text-5xl">
            Dubai Real Estate
          </h1>
          <p className="mt-2 text-center text-slate-300">
            {totalCount.toLocaleString()} listings · Sales &amp; Rentals · KYC &amp; loans
          </p>
          <div className="mt-10">
            <Suspense fallback={<div className="h-48 bg-white/10 rounded-2xl animate-pulse" />}>
              <WpHeroSearch
                priceMin={priceRange._min.price ?? 0}
                priceMax={priceRange._max.price ?? 2000000}
                cities={citiesRaw}
                areas={areas}
                bhkOptions={bhkOptions}
              />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">Our portfolio</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-slate-900">Properties by area</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {areaCounts.map((row) => (
            <Link
              key={row.area ?? "unknown"}
              href={`/properties?area=${encodeURIComponent(row.area ?? "")}`}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:border-gold hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-900">{row.area}</h3>
              <p className="mt-1 text-sm text-slate-500">{row._count._all} listings</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">Exclusive deals</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-slate-900">Featured listings</h2>
            </div>
            <Link href="/properties" className="text-sm font-medium text-gold-dark hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {fallback.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { title: "List your property", desc: "Upload photos, videos, PDFs — admin reviews and publishes.", href: "/dashboard/list-property" },
            { title: "KYC verification", desc: "Submit ID and address proof for secure transactions.", href: "/dashboard/kyc" },
            { title: "Apply for a loan", desc: "Finance your purchase with flexible terms.", href: "/dashboard/loans" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:border-gold"
            >
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-slate-600">{item.desc}</p>
              <span className="mt-4 inline-block text-sm font-medium text-gold-dark">Get started →</span>
            </Link>
          ))}
        </div>
      </section>

      {agents.length > 0 && (
        <section className="bg-slate-900 py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">Our agents</p>
            <h2 className="mt-2 font-display text-3xl font-bold">Meet our team</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {agents.map((a) => (
                <div key={a.id} className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
                  <p className="font-semibold">{a.name}</p>
                  <p className="mt-1 text-sm text-slate-400">Real estate agent</p>
                  {a.phone && <p className="mt-3 text-sm text-gold">{a.phone}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
