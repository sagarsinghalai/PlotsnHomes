import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { WpHeroSearch } from "@/components/property/wp-hero-search";
import { PortfolioShowcase } from "@/components/public/portfolio-showcase";
import { TestimonialsSection } from "@/components/property/testimonials-section";
import { prisma } from "@/lib/prisma";
import { getBhkConfigurations } from "@/lib/system-settings";
import { getPublishedPageForRoute, getNavSettings, getFooterSettings } from "@/lib/webpage-editor-store";
import { BuilderPageView } from "@/components/public/builder-page-view";
import { getPublicTenantId } from "@/lib/public-tenant";
import { getSiteSetting, SITE_SETTING_KEYS, HeroStat, FeaturedArea, HeroContent, HowItWorksStep, TestimonialsConfig, TeamMemberItem } from "@/lib/site-settings";
import { formatCurrency, parseImages } from "@/lib/utils";
import { ShieldCheck, CreditCard, Home, Coins, TrendingUp, ArrowRight, Check, ArrowDownLeft, ArrowUpRight, BarChart3, Search, Activity, Sparkles, CheckCircle, Wallet, BadgeCheck, Headphones } from "lucide-react";
import { BodyThemeSync } from "@/components/layout/body-theme-sync";
import { LeadCaptureForm } from "@/components/public/lead-capture-form";
import { ProjectsShowcase, type ShowcaseProject } from "@/components/public/projects-showcase";
import { TeamSection } from "@/components/public/team-section";
import { EditorialShowcase } from "@/components/public/editorial-showcase";
import { LandingScroll } from "@/components/public/landing-scroll";

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
    priceRange, 
    citiesRaw, 
    areasRaw, 
    areaCounts, 
    bhkOptions, 
    siteHeroStats, 
    siteFeaturedAreas, 
    siteHeroContent, 
    siteHowItWorks, 
    suggestions,
    siteTestimonials,
    siteTeamMembers
  ] = await Promise.all([
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
    prisma.property.groupBy({
      by: ["area"],
      where: { status: "ACTIVE", area: { not: null }, tenantId },
      _count: { _all: true },
      orderBy: { _count: { area: "desc" } },
      take: 8,
    }),
    getBhkConfigurations(),
    getSiteSetting<HeroStat[]>(SITE_SETTING_KEYS.HERO_STATS),
    getSiteSetting<FeaturedArea[]>(SITE_SETTING_KEYS.FEATURED_AREAS),
    getSiteSetting<HeroContent>(SITE_SETTING_KEYS.HERO_CONTENT),
    getSiteSetting<HowItWorksStep[]>(SITE_SETTING_KEYS.HOW_IT_WORKS),
    prisma.property.findMany({
      where: { status: "ACTIVE", tenantId },
      select: { title: true, symbol: true },
      orderBy: { title: "asc" },
      take: 200,
    }),
    getSiteSetting<TestimonialsConfig>(SITE_SETTING_KEYS.TESTIMONIALS),
    getSiteSetting<TeamMemberItem[]>(SITE_SETTING_KEYS.TEAM_MEMBERS),
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

  return (
    <>
      <BodyThemeSync theme="light" />
      <LandingScroll />
      <section className="bg-white px-4 pb-6 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative min-h-[460px] overflow-hidden rounded-[2rem] md:min-h-[540px]">
            <div data-parallax className="absolute inset-[-8%] will-change-transform">
              <Image
                src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=2000&q=80"
                alt="Modern home with a pool and garden"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1280px) 100vw, 1280px"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/88 to-white/15" />
            <div data-reveal className="relative z-10 flex min-h-[460px] max-w-xl flex-col justify-center px-6 py-14 sm:px-12 md:min-h-[540px]">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Premium properties. Better living.
              </p>
              <h1 className="mt-4 font-display text-[clamp(2.6rem,5.4vw,4.4rem)] font-medium leading-[1.02] text-slate-950">
                {siteHeroContent?.title1 || "Find Your Dream Home"}
                <span className="mt-1 block italic">
                  {[siteHeroContent?.highlightedText, siteHeroContent?.title2].filter(Boolean).join(" ") || "with PlotsnHomes"}
                </span>
              </h1>
              <span className="mt-4 h-1.5 w-24 rounded-full bg-[#B4F06B]" />
              <p className="mt-5 max-w-md text-base leading-relaxed text-slate-600 sm:text-lg">
                {siteHeroContent?.subtitle || "Discover verified homes, plots and projects — clear titles, real photos, and honest pricing in one place."}
              </p>
            </div>
          </div>

          <div data-reveal className="relative z-20 -mt-10 px-1 sm:-mt-14 sm:px-6">
            <Suspense fallback={<div className="h-24 animate-pulse rounded-2xl bg-slate-100" />}>
              <WpHeroSearch
                priceMin={priceRange._min.price ?? 0}
                priceMax={priceRange._max.price ?? 2000000}
                cities={citiesRaw}
                areas={areas}
                suggestions={suggestions}
                bhkOptions={bhkOptions}
              />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div data-reveal-group className="mx-auto grid max-w-7xl gap-4 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { icon: BadgeCheck, title: "Verified listings", text: "Every home is checked for a clear title, real photos, and an honest price." },
            { icon: ShieldCheck, title: "Trusted and secure", text: "KYC, escrow-style payments, and a team that stays with you after the visit." },
            { icon: Headphones, title: "Expert support", text: "A property advisor helps you shortlist, compare, and close without the runaround." },
            { icon: Home, title: "Better living", text: "Homes, plots, and projects chosen for how you actually want to live." },
          ].map((item) => (
            <div key={item.title} data-reveal-item className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#B4F06B] text-slate-950">
                <item.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

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

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
          <div data-reveal className="relative min-h-[380px] overflow-hidden rounded-[2rem]">
            <div data-parallax className="absolute inset-[-8%] will-change-transform">
              <Image
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80"
                alt="Bright living room in a modern home"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 640px"
              />
            </div>
            <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-white/95 p-5 shadow-sm backdrop-blur">
              <p className="font-display text-3xl italic leading-tight text-slate-950">More than just a home</p>
              <p className="mt-1 text-sm text-slate-600">A place that fits the way you want to live.</p>
            </div>
          </div>
          <div data-reveal>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Why choose PlotsnHomes</p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight text-slate-950 sm:text-5xl">
              More than properties. We build futures.
            </h2>
            <p className="mt-4 max-w-lg leading-relaxed text-slate-600">
              Whether you are buying, renting, or investing, the shortlist stays clear: verified homes, transparent pricing, and someone who picks up the phone.
            </p>
            <div data-reveal-group className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7">
              {(heroStatsToUse.length >= 4
                ? heroStatsToUse.slice(0, 4)
                : [
                    ...heroStatsToUse,
                    { label: "Cities covered", value: "25+" },
                    { label: "Families guided", value: "1,200+" },
                  ]
              ).slice(0, 4).map((s) => (
                <div key={s.label} data-reveal-item className="border-t-2 border-[#B4F06B] pt-3">
                  <p className="font-display text-3xl text-slate-950 sm:text-4xl">{s.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Developer Projects showcase (filterable + lead capture) */}
      <ProjectsShowcase projects={showcaseProjects} />

      <TestimonialsSection testimonialsConfig={siteTestimonials} />

      {/* How PlotsnHomes Works Section */}
      <section id="how-it-works" className="relative bg-white py-20 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div data-reveal className="mb-2">
            <p className="mb-2 inline-flex rounded-full bg-[#B4F06B] px-3 py-1 text-xs font-bold uppercase tracking-widest text-slate-950">Getting started</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold text-slate-950">How PlotsnHomes Works</h2>
          </div>

          <div className="mt-8 grid items-start gap-10 lg:grid-cols-12 lg:gap-x-12">
            {/* Left Column: Steps list */}
            <div className="lg:col-span-7">
              <div className="space-y-0">
                {(siteHowItWorks && siteHowItWorks.length > 0 ? siteHowItWorks : [
                  {
                    title: "Create & Verify Your Account",
                    desc: "Sign up in under 3 minutes. Complete our secure KYC verification (PAN, Aadhaar + selfie) powered by secure providers. Once approved, your account goes live with full trading access."
                  },
                  {
                    title: "Fund Your Wallet",
                    desc: "Deposit funds via bank transfer, Net Banking, UPI, or any of our supported instant payment gateways. Funds are held in segregated, regulated escrow accounts — your money is always safe."
                  },
                  {
                    title: "Choose a Property & Buy Shares",
                    desc: "Browse our curated listings. Use advanced filters to find properties matching your budget, yield target, and location. Buy any number of shares from ₹40,000 minimum — you own a real, legal fraction of the property."
                  },
                  {
                    title: "Earn Rental Income Monthly",
                    desc: "Rental income from tenants is distributed to your wallet proportional to your share ownership. Receive monthly or quarterly dividend payouts automatically — no paperwork."
                  },
                  {
                    title: "Trade & Exit Anytime",
                    desc: "Unlike traditional real estate, you can sell your shares anytime on our live marketplace. Receive your capital gains + profits instantly in your wallet. No lock-up periods, no agents, no delays."
                  }
                ])
                  .filter((step) => step.title.toLowerCase().trim() !== "test" && step.desc.toLowerCase().trim() !== "test")
                  .map((step, idx) => (
                    <div key={idx} className="group relative flex gap-5 border-b border-slate-200/60 pt-8 pb-8 first:pt-0 last:pb-0 last:border-b-0 hover:bg-slate-50 px-4 -mx-4 rounded-2xl transition-all duration-300">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#B4F06B] font-display text-sm font-bold text-slate-950 shrink-0 mt-0.5 shadow-sm group-hover:scale-110 transition-all duration-300">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-950 text-lg leading-tight">{step.title}</h3>
                        <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right Column: Visual Flow Diagram in Navbar Color */}
            <div data-reveal className="lg:col-span-5 self-start">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm text-slate-950">
                  <p className="mb-6 inline-flex rounded-full bg-[#B4F06B] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-950">
                    Your Investment Flow
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        icon: <ShieldCheck className="h-5 w-5 text-slate-950" />,
                        title: "KYC Verification",
                        sub: "Identity verified in ~5 minutes",
                        end: <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 group-hover/row:translate-x-1 transition-transform duration-300" />
                      },
                      {
                        icon: <CreditCard className="h-5 w-5 text-slate-950" />,
                        title: "Deposit Funds",
                        sub: "UPI, bank transfer, Net banking",
                        end: <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 group-hover/row:translate-x-1 transition-transform duration-300" />
                      },
                      {
                        icon: <Home className="h-5 w-5 text-slate-950" />,
                        title: "Buy Property Shares",
                        sub: "From ₹40,000 · Legal ownership",
                        end: <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 group-hover/row:translate-x-1 transition-transform duration-300" />
                      },
                      {
                        icon: <Coins className="h-5 w-5 text-slate-950" />,
                        title: "Earn Monthly Dividends",
                        sub: "Auto-paid to your wallet",
                        end: <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 group-hover/row:translate-x-1 transition-transform duration-300" />
                      },
                      {
                        icon: <TrendingUp className="h-5 w-5 text-slate-950" />,
                        title: "Sell Shares & Realise Profit",
                        sub: "Trade anytime · Instant settlement",
                        end: <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      }
                    ].map((flow, i) => (
                      <div key={i} className="flex items-center gap-4 py-1.5 border-b border-slate-100 pb-3.5 last:border-0 last:pb-0 group/row hover:bg-slate-50 px-3 -mx-3 rounded-xl transition-all duration-200 cursor-pointer">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B4F06B] text-slate-950 shrink-0 transition-transform duration-300 group-hover/row:scale-105">
                          {flow.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-950 truncate">{flow.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">{flow.sub}</p>
                        </div>
                        {flow.end}
                      </div>
                    ))}
                  </div>

                  {/* Localized P&L example box */}
                  <div className="mt-6 rounded-2xl border border-[#B4F06B] bg-[#B4F06B]/25 p-5 text-xs">
                    <p className="mb-3 inline-flex rounded-full bg-[#B4F06B] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-950">
                      Example: ₹5,00,000 Investment
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-600">
                        <span>Delhi Heights · 50 shares</span>
                        <span className="font-semibold text-slate-950">₹5,00,000</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Annual yield (8.4%)</span>
                        <span className="font-semibold text-slate-950">+₹42,000/yr</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Capital gain (12 months)</span>
                        <span className="font-semibold text-slate-950">+₹60,000</span>
                      </div>
                      <div className="border-t border-[#B4F06B] pt-3.5 mt-3.5 flex justify-between font-bold text-slate-950 text-sm">
                        <span>Total Return</span>
                        <span className="rounded-md bg-[#B4F06B] px-2">+₹1,02,000 (20.4%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>

      <section id="trading" data-reveal className="bg-white text-slate-950 py-20 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-2 text-center max-w-3xl mx-auto">
            <p className="inline-flex rounded-full bg-[#B4F06B] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-950">Trade like a pro</p>
            <h2 className="mt-4 font-display text-3xl sm:text-4xl font-bold text-slate-950">How to Trade Properties</h2>
            <p className="mt-4 text-slate-600 text-sm sm:text-base leading-relaxed">
              PlotsnHomes' marketplace lets you buy and sell property shares like stocks — with real-time pricing, instant execution, and transparent P&L tracking.
            </p>
          </div>

          {/* 3 columns */}
          <div className="grid gap-8 md:grid-cols-3 mt-16">
            {[
              {
                icon: <ArrowDownLeft className="h-6 w-6 text-slate-950" />,
                title: "Buying Shares",
                desc: "Purchase fractional ownership in any listed property. Set how many shares you want, review the cost, and confirm with one tap.",
                steps: [
                  "Browse properties and select one",
                  "Enter number of shares or investment amount",
                  "Review cost breakdown + platform fee (0.5%)",
                  "Confirm purchase — shares added to your portfolio instantly",
                  "Start earning rental income from next payout cycle"
                ]
              },
              {
                icon: <ArrowUpRight className="h-6 w-6 text-slate-950" />,
                title: "Selling Shares",
                desc: "Exit any position partially or fully at any time. Our live marketplace matches your sell order with buyers within seconds.",
                steps: [
                  "Go to My Portfolio → select property",
                  "Choose how many shares to sell (or sell all)",
                  "See live P&L: capital gain + dividends earned",
                  "Review sell fee (0.3%) and confirm",
                  "Proceeds credited to wallet within minutes"
                ]
              },
              {
                icon: <BarChart3 className="h-6 w-6 text-slate-950" />,
                title: "Portfolio Management",
                desc: "Track your entire property portfolio in real-time. Monitor price movements, dividend income, and overall returns from one dashboard.",
                steps: [
                  "View real-time value of each holding",
                  "Track unrealized vs realised P&L",
                  "Receive dividend payouts automatically",
                  "Set price alerts for properties you're watching",
                  "Download tax certificates and trade history"
                ]
              }
            ].map((col) => (
              <div key={col.title} className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 hover:border-[#B4F06B] hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 shadow-sm flex flex-col">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B4F06B] text-slate-950 mb-6 shrink-0">
                  {col.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-950">{col.title}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed min-h-[50px]">{col.desc}</p>
                
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-4 flex-1">
                  {col.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-xs leading-normal">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-[#B4F06B] text-[10px] font-mono font-bold text-slate-950 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Trade Timeline */}
          <div className="mt-16 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <p className="mb-8 text-center">
              <span className="inline-flex rounded-full bg-[#B4F06B] px-3 py-1 text-sm font-bold uppercase tracking-widest text-slate-950">
                A Typical Trade in Under 60 Seconds
              </span>
            </p>

            <div className="mx-auto flex max-w-xs flex-col lg:max-w-none lg:flex-row lg:items-center lg:justify-between gap-0 lg:gap-2">
              {[
                { icon: <Search className="h-4 w-4" />, label: "Browse", sub: "Find property" },
                { icon: <Activity className="h-4 w-4" />, label: "Select", sub: "Choose shares" },
                { icon: <Coins className="h-4 w-4" />, label: "Review", sub: "Cost & fee" },
                { icon: <CheckCircle className="h-4 w-4" />, label: "Confirm", sub: "One tap" },
                { icon: <Home className="h-4 w-4" />, label: "Owned", sub: "Instantly" },
                { icon: <Sparkles className="h-4 w-4" />, label: "Income", sub: "Monthly" },
                { icon: <ArrowUpRight className="h-4 w-4" />, label: "Sell", sub: "Anytime" },
                { icon: <Wallet className="h-4 w-4" />, label: "Profit", sub: "In wallet" }
              ].map((step, idx, arr) => (
                <div key={idx} className="flex w-full items-start gap-4 lg:w-auto lg:flex-row lg:items-center lg:gap-0">
                  {/* Node: circle + label. On mobile the circle carries a vertical connector to the next step. */}
                  <div className="flex items-start gap-4 lg:block">
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#B4F06B] text-slate-950 shadow-sm">
                        {step.icon}
                      </div>
                      {idx < arr.length - 1 && (
                        <div className="my-1 h-10 w-[1.5px] bg-[#B4F06B] lg:hidden" />
                      )}
                    </div>
                    <div className="pt-1 text-left lg:mt-2.5 lg:pt-0 lg:text-center">
                      <p className="text-xs font-semibold text-slate-950">{step.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{step.sub}</p>
                    </div>
                  </div>
                  {/* Desktop horizontal connector */}
                  {idx < arr.length - 1 && (
                    <div className="hidden lg:block h-[1px] w-12 sm:w-16 bg-[#B4F06B] mx-4 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a02_1px,transparent_1px),linear-gradient(to_bottom,#0f172a02_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />
        
        <div className="relative z-10 grid gap-8 md:grid-cols-3">
          {[
            { title: "List your property", desc: "Upload photos, videos, PDFs — admin reviews and publishes.", href: "/dashboard/list-property" },
            { title: "KYC verification", desc: "Submit ID and address proof for secure transactions.", href: "/dashboard/kyc" },
            { title: "Apply for a loan", desc: "Finance your purchase with flexible terms.", href: "/dashboard/loans" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-[#B4F06B] hover:shadow-xl hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              <span className="mt-4 inline-flex rounded-full bg-[#B4F06B] px-3 py-1 text-sm font-semibold text-slate-950">Get started →</span>
            </Link>
          ))}
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
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[#B4F06B] px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-95"
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
            <p className="inline-flex rounded-full bg-[#B4F06B] px-3 py-1 text-sm font-semibold uppercase tracking-widest text-slate-950">Talk to an expert</p>
            <h2 className="mt-4 font-display text-3xl font-bold text-slate-950 sm:text-4xl">
              Ready to find your next property?
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Share your name and phone number and our property advisors will call you back to
              understand your requirements — whether you&apos;re buying, renting, or investing.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 rounded-full bg-[#B4F06B] p-0.5 text-slate-950" /> No spam — one quick, friendly call</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 rounded-full bg-[#B4F06B] p-0.5 text-slate-950" /> Personalised property recommendations</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 rounded-full bg-[#B4F06B] p-0.5 text-slate-950" /> Guidance on payments, loans &amp; KYC</li>
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
