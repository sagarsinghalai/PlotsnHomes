import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { PortfolioShowcase } from "@/components/public/portfolio-showcase";
import { prisma } from "@/lib/prisma";
import { getPublishedPageForRoute, getNavSettings, getFooterSettings } from "@/lib/webpage-editor-store";
import { BuilderPageView } from "@/components/public/builder-page-view";
import { getPublicTenantId } from "@/lib/public-tenant";
import { getSiteSetting, SITE_SETTING_KEYS, HeroStat, FeaturedArea, HowItWorksStep, TeamMemberItem } from "@/lib/site-settings";
import { Home, Coins, ArrowRight, Check, ArrowUpRight, Search, Activity, Sparkles, CheckCircle, Wallet } from "lucide-react";
import { BodyThemeSync } from "@/components/layout/body-theme-sync";
import { LeadCaptureForm } from "@/components/public/lead-capture-form";
import { ProjectsShowcase, type ShowcaseProject } from "@/components/public/projects-showcase";
import { TeamSection } from "@/components/public/team-section";
import { EditorialShowcase } from "@/components/public/editorial-showcase";
import { LandingScroll } from "@/components/public/landing-scroll";
import { FractionalLanding } from "@/components/public/fractional-landing";
import { WpHeroSearch } from "@/components/property/wp-hero-search";
import { PropertyCard } from "@/components/property/property-card";
import { getBhkConfigurations } from "@/lib/system-settings";

export default async function HomePage() {
  // If an admin has published a builder page that takes over the homepage, render
  // that instead of the coded home. Unpublish it to fall back to this page.
  {
    const override = await getPublishedPageForRoute("/");
    if (override) {
      const [nav, footer] = await Promise.all([getNavSettings(), getFooterSettings()]);
      return <BuilderPageView page={override} nav={nav} footer={footer} />;
    }
  }

  const tenantId = await getPublicTenantId();
  const [
    areaCounts,
    siteHeroStats,
    siteFeaturedAreas,
    siteHowItWorks,
    siteTeamMembers,
    priceRange,
    citiesRaw,
    areasRaw,
    suggestionsRaw,
    bhkOptions,
    listedProperties,
  ] = await Promise.all([
    prisma.property.groupBy({
      by: ["area"],
      where: { status: "ACTIVE", area: { not: null }, tenantId },
      _count: { _all: true },
      orderBy: { _count: { area: "desc" } },
      take: 8,
    }),
    getSiteSetting<HeroStat[]>(SITE_SETTING_KEYS.HERO_STATS),
    getSiteSetting<FeaturedArea[]>(SITE_SETTING_KEYS.FEATURED_AREAS),
    getSiteSetting<HowItWorksStep[]>(SITE_SETTING_KEYS.HOW_IT_WORKS),
    getSiteSetting<TeamMemberItem[]>(SITE_SETTING_KEYS.TEAM_MEMBERS),
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
    prisma.property.findMany({
      where: { status: "ACTIVE", tenantId },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 6,
      include: { agent: { select: { name: true, email: true, phone: true } } },
    }),
  ]);

  // Developer projects shown on the public home page (lead-gen showcase).
  const projectRows = await prisma.project.findMany({
    where: { showOnWebsite: true, tenantId },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    take: 60,
    select: {
      id: true, name: true, code: true, slug: true, projectType: true, projectCategory: true,
      status: true, city: true, area: true, state: true, minPrice: true, maxPrice: true,
      coverImage: true, bannerImage: true, galleryImagesJson: true, builderName: true,
      shortDescription: true, isSoldOut: true,
      developer: { select: { name: true } },
    },
  });
  const showcaseProjects: ShowcaseProject[] = projectRows.map((p) => ({
    id: p.id, name: p.name, code: p.code, slug: p.slug, projectType: p.projectType,
    projectCategory: p.projectCategory, status: p.status, city: p.city, area: p.area, state: p.state,
    minPrice: p.minPrice, maxPrice: p.maxPrice, coverImage: p.coverImage, bannerImage: p.bannerImage,
    galleryImagesJson: p.galleryImagesJson, developerName: p.developer?.name ?? p.builderName ?? null,
    shortDescription: p.shortDescription, isSoldOut: p.isSoldOut,
  }));
  const areas = areasRaw.map((a) => a.area).filter(Boolean) as string[];
  const agents = await prisma.user.findMany({
    where: { role: "AGENT", active: true, tenantId },
    take: 6,
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, phone: true, countryCode: true, image: true },
  });

  const heroStatsToUse = siteHeroStats && siteHeroStats.length > 0 ? siteHeroStats : [
    { label: "Assets Under Management", value: "₹12.4 Cr" },
    { label: "Active Investors", value: "2,841" },
    { label: "Properties Listed", value: "48" },
  ];
  const whyStats = (heroStatsToUse.length >= 4
    ? heroStatsToUse
    : [
        ...heroStatsToUse,
        { label: "Avg. target yield", value: "8.6%" },
        { label: "Minimum ticket", value: "₹50,000" },
      ]
  ).slice(0, 4);
  const whyReasons = [
    { title: "From ₹50,000", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80" },
    { title: "Rent, in your wallet", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80" },
    { title: "Sell when you want", image: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=900&q=80" },
    { title: "Yield on the card", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80" },
  ];
  const howImages = [
    "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80",
  ];
  const howFallback = [
    { title: "Verify your account", desc: "PAN, Aadhaar and a selfie. Most accounts are approved in a few minutes." },
    { title: "Fund your wallet", desc: "Add money by UPI, net banking or bank transfer. It stays in escrow until you buy." },
    { title: "Buy property shares", desc: "Choose a listing and buy from ₹50,000. You own a legal fraction of that asset." },
    { title: "Earn monthly rent", desc: "Tenant income is split by your shares and paid into your wallet each cycle." },
    { title: "Sell when you want", desc: "List some or all of your shares. Proceeds come back with no lock-in." },
  ];
  const cmsHowSteps = (siteHowItWorks ?? []).filter(
    (step) => step.title.toLowerCase().trim() !== "test" && (step.desc ?? "").toLowerCase().trim() !== "test"
  );
  const howSource = cmsHowSteps.length > 0 && cmsHowSteps.every((step) => (step.desc ?? "").length <= 140)
    ? cmsHowSteps
    : howFallback;
  const howSteps = howSource
    .filter((step) => step.title.toLowerCase().trim() !== "test" && step.desc.toLowerCase().trim() !== "test")
    .slice(0, 5)
    .map((step, index) => ({
      title: step.title,
      desc: step.desc.length <= 140 ? step.desc : "",
      image: howImages[index % howImages.length],
    }));
  const tradeCards = [
    { title: "Buy shares", line: "Pick a listing. Confirm.", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80" },
    { title: "Sell shares", line: "Exit in one tap.", image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1000&q=80" },
    { title: "Your portfolio", line: "Value, yield, payouts.", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80" },
  ];

  return (
    <>
      <BodyThemeSync theme="light" />
      <LandingScroll />
      <FractionalLanding part="hero" />

      <section className="relative overflow-hidden bg-slate-950 py-14 sm:py-16">
        <Image
          src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1800&q=80"
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-950/50" />
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6">
          <Suspense fallback={<div className="mx-auto h-64 max-w-4xl animate-pulse rounded-2xl bg-white/80" />}>
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
      </section>

      {listedProperties.length > 0 && (
        <section id="listings" className="scroll-mt-24 bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#2563EB]">Browse</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-slate-950 sm:text-4xl">Property lists</h2>
              </div>
              <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:underline">
                View all properties <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {listedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </div>
        </section>
      )}

      <FractionalLanding part="opportunities" />

      <PortfolioShowcase
        slides={(siteFeaturedAreas && siteFeaturedAreas.length > 0
          ? siteFeaturedAreas
          : areaCounts.map((r) => ({ area: r.area ?? "", count: r._count._all, imageUrl: "" }))
        ).map((row: { area?: string; count?: number; imageUrl?: string }) => ({
          area: row.area ?? "",
          count: row.count ?? 0,
          imageUrl: row.imageUrl ?? "",
        }))}
      />

      <EditorialShowcase />
      <section id="why-choose" className="scroll-mt-24 bg-[#F5F7FB] py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div data-reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#2563EB]">Why choose PlotsnHomes</p>
            <h2 className="mt-3 max-w-xl font-display text-4xl font-medium leading-tight text-slate-950 sm:text-5xl">
              A building share, with the yield on the label.
            </h2>
          </div>

          <div data-reveal-group className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-white/10 lg:grid-cols-4">
            {whyStats.map((s) => (
              <div key={s.label} data-reveal-item className="bg-[#0B1220] px-5 py-6 sm:px-6 lg:py-7">
                <p className="font-display text-3xl text-white sm:text-4xl">{s.value}</p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93C5FD]">{s.label}</p>
              </div>
            ))}
          </div>

          <div data-reveal-group className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {whyReasons.map((reason) => (
              <article key={reason.title} data-reveal-item className="group relative h-64 overflow-hidden rounded-2xl sm:h-72">
                <Image
                  src={reason.image}
                  alt={reason.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                <h3 className="absolute inset-x-0 bottom-0 p-4 text-base font-semibold text-white">{reason.title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Projects showcase (filterable + lead capture) */}
      <ProjectsShowcase projects={showcaseProjects} />

      {/* How PlotsnHomes Works Section */}
      <section id="how-it-works" className="relative scroll-mt-24 border-t border-slate-100 bg-white py-16">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div data-reveal className="mb-8 max-w-2xl">
            <p className="mb-2 inline-flex rounded-full bg-[#2563EB] px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">Getting started</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-slate-950 sm:text-4xl">How PlotsnHomes Works</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">Five steps from a verified account to rent in your wallet. Each one takes minutes, not a property deal.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {howSteps.map((step, idx) => (
              <article key={step.title} className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="relative h-40">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 50vw, 20vw"
                  />
                  <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-sm font-bold text-white">
                    {idx + 1}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-base font-semibold text-slate-950">{step.title}</h3>
                  {step.desc ? <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.desc}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="trading" className="border-t border-slate-100 bg-[#F5F7FB] py-16 text-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div data-reveal className="mb-8">
            <p className="inline-flex rounded-full bg-[#2563EB] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white">Trade like a pro</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-slate-950 sm:text-4xl">How to Trade Properties</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {tradeCards.map((card) => (
              <article key={card.title} className="group relative h-80 overflow-hidden rounded-3xl">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-1 text-sm text-white/80">{card.line}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <p className="mb-5 text-center">
              <span className="inline-flex rounded-full bg-[#2563EB] px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                A trade, under 60 seconds
              </span>
            </p>
            <div className="mx-auto flex max-w-xs flex-col gap-0 lg:max-w-none lg:flex-row lg:items-center lg:justify-between lg:gap-2">
              {[
                { icon: <Search className="h-4 w-4" />, label: "Browse" },
                { icon: <Activity className="h-4 w-4" />, label: "Select" },
                { icon: <Coins className="h-4 w-4" />, label: "Review" },
                { icon: <CheckCircle className="h-4 w-4" />, label: "Confirm" },
                { icon: <Home className="h-4 w-4" />, label: "Owned" },
                { icon: <Sparkles className="h-4 w-4" />, label: "Income" },
                { icon: <ArrowUpRight className="h-4 w-4" />, label: "Sell" },
                { icon: <Wallet className="h-4 w-4" />, label: "Profit" },
              ].map((step, idx, arr) => (
                <div key={step.label} className="flex w-full items-start gap-4 lg:w-auto lg:flex-row lg:items-center lg:gap-0">
                  <div className="flex items-start gap-4 lg:block">
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white">
                        {step.icon}
                      </div>
                      {idx < arr.length - 1 && <div className="my-1 h-8 w-px bg-[#2563EB] lg:hidden" />}
                    </div>
                    <p className="pt-1.5 text-xs font-semibold text-slate-950 lg:mt-2 lg:pt-0 lg:text-center">{step.label}</p>
                  </div>
                  {idx < arr.length - 1 && <div className="mx-3 hidden h-px w-8 shrink-0 bg-[#2563EB] lg:block" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <TeamSection
        members={
          siteTeamMembers && siteTeamMembers.length > 0
            ? siteTeamMembers
            : agents.map((a) => ({
                id: a.id,
                name: a.name || "Agent",
                designation: "Real estate agent",
                countryCode: a.countryCode || "+91",
                phone: a.phone || "",
                image: a.image || undefined,
              }))
        }
      />

      <section className="bg-white px-4 pb-4 sm:px-6 lg:px-8">
        <div className="relative mx-auto min-h-[300px] max-w-7xl overflow-hidden rounded-[2rem]">
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80"
            alt="City residences at dusk"
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/55 to-slate-950/20" />
          <div data-reveal className="relative z-10 flex min-h-[300px] max-w-lg flex-col justify-center px-8 py-12 sm:px-12">
            <h2 className="font-display text-4xl font-medium text-white sm:text-5xl">Let&apos;s make it happen</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">
              Tell us what you are looking for. We&apos;ll line up homes that fit and walk you through the next step.
            </p>
            <Link
              href="#get-in-touch"
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#2563EB] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Lead-gen CTA — captures Name + Phone straight into the CRM */}
      <section id="get-in-touch" data-reveal className="relative bg-white py-20 border-t border-slate-200 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a03_1px,transparent_1px),linear-gradient(to_bottom,#0f172a03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="inline-flex rounded-full bg-[#2563EB] px-3 py-1 text-sm font-semibold uppercase tracking-widest text-white">Talk to an expert</p>
            <h2 className="mt-4 font-display text-3xl font-bold text-slate-950 sm:text-4xl">
              Ready to find your next property?
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Share your name and phone number and our property advisors will call you back to
              understand your requirements — whether you&apos;re buying, renting, or investing.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 rounded-full bg-[#2563EB] p-0.5 text-white" /> No spam — one quick, friendly call</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 rounded-full bg-[#2563EB] p-0.5 text-white" /> Personalised property recommendations</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 rounded-full bg-[#2563EB] p-0.5 text-white" /> Guidance on payments, loans &amp; KYC</li>
            </ul>
          </div>
          <div className="mx-auto w-full max-w-md">
            <LeadCaptureForm
              source="Home Page"
              title="Request a callback"
              subtitle="Fill in your details and we'll reach out shortly."
            />
          </div>
        </div>
      </section>
    </>
  );
}
