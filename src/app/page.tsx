import Link from "next/link";
import { Suspense } from "react";
import { PropertyCard } from "@/components/property/property-card";
import { WpHeroSearch } from "@/components/property/wp-hero-search";
import { CityLandmarkSlider } from "@/components/property/city-landmark-slider";
import { TestimonialsSection } from "@/components/property/testimonials-section";
import { prisma } from "@/lib/prisma";
import { getBhkConfigurations } from "@/lib/system-settings";
import { getSiteSetting, SITE_SETTING_KEYS, HeroStat, HeroCard, FeaturedArea, HeroContent, HowItWorksStep, TestimonialsConfig, TeamMemberItem } from "@/lib/site-settings";
import { formatCurrency, parseImages } from "@/lib/utils";
import { ShieldCheck, CreditCard, Home, Coins, TrendingUp, ArrowRight, Check, ArrowDownLeft, ArrowUpRight, BarChart3, Search, Activity, Landmark, Smartphone, Zap, Sparkles, CheckCircle, Wallet } from "lucide-react";
import { BodyThemeSync } from "@/components/layout/body-theme-sync";
import { LeadCaptureForm } from "@/components/public/lead-capture-form";

export default async function HomePage() {
  const [
    featured, 
    totalCount, 
    priceRange, 
    citiesRaw, 
    areasRaw, 
    areaCounts, 
    bhkOptions, 
    siteHeroStats, 
    siteHeroCards, 
    siteFeaturedAreas, 
    siteHeroContent, 
    siteHowItWorks, 
    suggestions,
    siteTestimonials,
    siteTeamMembers
  ] = await Promise.all([
    prisma.property.findMany({
      where: { status: "ACTIVE", featured: true },
      take: 6,
      include: { agent: { select: { name: true, email: true, phone: true } } },
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
    getSiteSetting<HeroStat[]>(SITE_SETTING_KEYS.HERO_STATS),
    getSiteSetting<HeroCard[]>(SITE_SETTING_KEYS.HERO_CARDS),
    getSiteSetting<FeaturedArea[]>(SITE_SETTING_KEYS.FEATURED_AREAS),
    getSiteSetting<HeroContent>(SITE_SETTING_KEYS.HERO_CONTENT),
    getSiteSetting<HowItWorksStep[]>(SITE_SETTING_KEYS.HOW_IT_WORKS),
    prisma.property.findMany({
      where: { status: "ACTIVE" },
      select: { title: true, symbol: true },
      orderBy: { title: "asc" },
      take: 200,
    }),
    getSiteSetting<TestimonialsConfig>(SITE_SETTING_KEYS.TESTIMONIALS),
    getSiteSetting<TeamMemberItem[]>(SITE_SETTING_KEYS.TEAM_MEMBERS),
  ]);

  const fallback =
    featured.length >= 6
      ? featured
      : await prisma.property.findMany({
          where: { status: "ACTIVE" },
          take: 6,
          include: { agent: { select: { name: true, email: true, phone: true } } },
          orderBy: { changeYtd: "desc" },
        });

  const areas = areasRaw.map((a) => a.area).filter(Boolean) as string[];
  const agents = await prisma.user.findMany({
    where: { role: "AGENT", active: true },
    take: 4,
    orderBy: { createdAt: "asc" },
  });

  // Extract top 3 properties to populate dynamic floating cards
  const card1Prop = siteHeroCards && siteHeroCards.length > 0 ? siteHeroCards[0] : (fallback[0] || null);
  const card2Prop = siteHeroCards && siteHeroCards.length > 1 ? siteHeroCards[1] : (fallback[1] || fallback[0] || null);
  const card3Prop = siteHeroCards && siteHeroCards.length > 2 ? siteHeroCards[2] : (fallback[2] || fallback[1] || fallback[0] || null);

  const heroStatsToUse = siteHeroStats && siteHeroStats.length > 0 ? siteHeroStats : [
    { label: "Assets Under Management", value: "₹12.4 Cr" },
    { label: "Active Investors", value: "2,841" },
    { label: "Properties Listed", value: "48" },
  ];

  return (
    <>
      <BodyThemeSync theme="dark" />
      <section className="relative bg-slate-950 text-white py-20 lg:py-28 overflow-hidden min-h-[calc(100vh-40px)] flex items-center justify-center">
        {/* Background Video (Increased brightness via opacity-60 and brightness utility) */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 brightness-95 pointer-events-none"
        >
          <source src={siteHeroContent?.videoUrl || "/hero-bg.mp4"} type="video/mp4" />
        </video>
        {/* Overlay to ensure high contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/70 pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center z-10 w-full">
          <div className="flex items-center justify-center gap-3">
            <span className="h-[2px] w-8 bg-gold" />
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">
              Fractional Real Estate Investment
            </p>
            <span className="h-[2px] w-8 bg-gold" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-white leading-tight max-w-4xl">
            {siteHeroContent?.title1 || "Own a Piece of the"} <br className="hidden sm:inline" />
            {siteHeroContent?.highlightedText && (
              <span className="italic font-serif text-gold font-normal">{siteHeroContent.highlightedText} </span>
            )}
            {siteHeroContent?.title2 || "Properties"}
          </h1>
          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            {siteHeroContent?.subtitle || "Invest in premium real estate across London, New York, Dubai and more — starting from just ₹40,000. Trade your shares anytime, earn rental income, and build a global property portfolio."}
          </p>

          <div className="mt-10 w-full text-left">
            <Suspense fallback={<div className="h-24 bg-slate-100/10 rounded-xl animate-pulse" />}>
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

      <div className="w-full relative overflow-hidden">
        <CityLandmarkSlider
          slides={(siteFeaturedAreas && siteFeaturedAreas.length > 0
            ? siteFeaturedAreas
            : areaCounts.map((r) => ({ area: r.area ?? "", count: r._count._all, imageUrl: "" }))
          ).map((row: any) => ({ area: row.area ?? "", count: row.count ?? 0, imageUrl: row.imageUrl ?? "" }))}
        />
      </div>

      <section id="featured-listings" className="relative bg-slate-50 py-20 overflow-hidden border-t border-slate-200/40">
        {/* Decorative Grid and Blurs */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000003_1px,transparent_1px),linear-gradient(to_bottom,#00000003_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-gold-dark">Exclusive deals</p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold text-slate-950">Featured listings</h2>
            </div>
            <Link href="/properties" className="text-sm font-semibold text-gold-dark hover:underline">
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

      <TestimonialsSection testimonialsConfig={siteTestimonials} />

      {/* How PlotsnHomes Works Section */}
      <section id="how-it-works" className="relative bg-[#fbfbf9] py-20 border-t border-slate-100 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-2">
            <p className="text-xs font-bold text-gold-dark tracking-widest uppercase mb-2">GETTING STARTED</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold text-slate-950">How PlotsnHomes Works</h2>
          </div>

          <div className="mt-12 grid lg:gap-x-16 gap-y-10 lg:grid-cols-12 items-start">
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
                    <div key={idx} className="group relative flex gap-5 border-b border-slate-200/60 pt-8 pb-8 first:pt-0 last:pb-0 last:border-b-0 hover:bg-slate-50/50 px-4 -mx-4 rounded-2xl transition-all duration-300">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 font-display text-sm font-bold text-gold border border-gold/20 shrink-0 mt-0.5 shadow-md shadow-gold/5 group-hover:scale-110 group-hover:border-gold/60 group-hover:bg-slate-900 transition-all duration-300">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 text-lg leading-tight group-hover:text-gold-dark transition-colors duration-300">{step.title}</h3>
                        <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Right Column: Visual Flow Diagram in Navbar Color */}
            <div className="lg:col-span-5 self-start">
              <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl text-white hover:border-gold/20 transition-all duration-500">
                  <p className="text-[10px] font-bold text-gold tracking-widest uppercase mb-6">
                    Your Investment Flow
                  </p>

                  <div className="space-y-4">
                    {[
                      {
                        icon: <ShieldCheck className="h-5 w-5 text-gold" />,
                        title: "KYC Verification",
                        sub: "Identity verified in ~5 minutes",
                        end: <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 group-hover/row:translate-x-1 transition-transform duration-300" />
                      },
                      {
                        icon: <CreditCard className="h-5 w-5 text-gold" />,
                        title: "Deposit Funds",
                        sub: "UPI, bank transfer, Net banking",
                        end: <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 group-hover/row:translate-x-1 transition-transform duration-300" />
                      },
                      {
                        icon: <Home className="h-5 w-5 text-gold" />,
                        title: "Buy Property Shares",
                        sub: "From ₹40,000 · Legal ownership",
                        end: <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 group-hover/row:translate-x-1 transition-transform duration-300" />
                      },
                      {
                        icon: <Coins className="h-5 w-5 text-gold" />,
                        title: "Earn Monthly Dividends",
                        sub: "Auto-paid to your wallet",
                        end: <ArrowRight className="h-4 w-4 text-slate-500 shrink-0 group-hover/row:translate-x-1 transition-transform duration-300" />
                      },
                      {
                        icon: <TrendingUp className="h-5 w-5 text-gold" />,
                        title: "Sell Shares & Realise Profit",
                        sub: "Trade anytime · Instant settlement",
                        end: <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      }
                    ].map((flow, i) => (
                      <div key={i} className="flex items-center gap-4 py-1.5 border-b border-slate-900/60 pb-3.5 last:border-0 last:pb-0 group/row hover:bg-white/5 px-3 -mx-3 rounded-xl transition-all duration-200 cursor-pointer">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800/80 text-gold shrink-0 transition-transform duration-300 group-hover/row:scale-105 group-hover/row:border-gold/40">
                          {flow.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate group-hover/row:text-gold transition-colors duration-200">{flow.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{flow.sub}</p>
                        </div>
                        {flow.end}
                      </div>
                    ))}
                  </div>

                  {/* Localized P&L example box */}
                  <div className="mt-6 rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/5 via-gold/[0.02] to-transparent p-5 text-xs shadow-inner">
                    <p className="font-bold text-gold tracking-wide uppercase text-[10px] mb-3">
                      Example: ₹5,00,000 Investment
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-300">
                        <span>Delhi Heights · 50 shares</span>
                        <span className="font-semibold text-white">₹5,00,000</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Annual yield (8.4%)</span>
                        <span className="font-semibold text-emerald-400">+₹42,000/yr</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Capital gain (12 months)</span>
                        <span className="font-semibold text-emerald-400">+₹60,000</span>
                      </div>
                      <div className="border-t border-gold/30 pt-3.5 mt-3.5 flex justify-between font-bold text-white text-sm">
                        <span>Total Return</span>
                        <span className="text-gold">+₹1,02,000 (20.4%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Payments Section */}
      <section id="payments" className="relative bg-white py-20 border-t border-slate-100 overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a04_1px,transparent_1px),linear-gradient(to_bottom,#0f172a04_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-2">
            <p className="text-xs font-bold text-gold-dark tracking-widest uppercase mb-2">PAYMENT OPTIONS</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-extrabold text-slate-950">Global Payment Gateways</h2>
            <p className="mt-4 text-slate-600 max-w-3xl leading-relaxed">
              Deposit and withdraw in your local currency using the payment method you trust most. We support 8+ gateways across 140+ countries.
            </p>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-12 items-start">
            {/* Left Side: Gateways Grid & Security Badges */}
            <div className="lg:col-span-7 space-y-8">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Supported Payment Gateways
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  {
                    name: "Stripe",
                    desc: "Cards · Wallets · Global",
                    logo: <CreditCard className="h-6 w-auto text-[#635BFF]" />
                  },
                  {
                    name: "PayPal",
                    desc: "200+ countries",
                    logo: (
                      <svg viewBox="0 0 24 28" className="h-6 w-auto" fill="currentColor">
                        <path d="M20.083 8.3c-.63 3.64-3.11 5.96-6.85 5.96h-3.41l-2.03 11.72H3.3l4.2-24.26h8.04c3.55 0 5.8 1.76 5.8 5.16 0 .42-.03.88-.1 1.42z" fill="#003087"/>
                        <path d="M16.883 14.3c-.63 3.64-3.11 5.96-6.85 5.96H6.62l-2.03 11.72h4.49l2.03-11.72h3.41c3.74 0 6.22-2.32 6.85-5.96.07-.54.1-.96.1-1.42 0-3.4-2.25-5.16-5.8-5.16h-4.49l-2.03 11.72h3.41z" fill="#0079C1"/>
                      </svg>
                    )
                  },
                  {
                    name: "Razorpay",
                    desc: "UPI · Net Banking · India",
                    logo: (
                      <svg viewBox="0 0 24 24" className="h-6 w-auto" fill="currentColor">
                        <path d="M22 2L10 14l-4-8L2 22h20z" fill="#3395FF" />
                      </svg>
                    )
                  },
                  {
                    name: "Paytm",
                    desc: "UPI · Wallets",
                    logo: (
                      <div className="flex items-baseline font-sans font-black text-sm">
                        <span className="text-[#00B9F5]">pay</span>
                        <span className="text-[#002E6E]">tm</span>
                      </div>
                    )
                  },
                  {
                    name: "Wise",
                    desc: "Multi-currency · Low fee",
                    logo: (
                      <svg viewBox="0 0 32 32" className="h-6 w-auto text-[#9FE870]" fill="currentColor">
                        <path d="M17.1 2L8 16.5h9.1L8 30l16-16.5h-9.1z" />
                      </svg>
                    )
                  },
                  {
                    name: "Bank Wire",
                    desc: "SWIFT · SEPA · ACH",
                    logo: (
                      <svg viewBox="0 0 24 24" className="h-6 w-auto text-slate-700" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="22" x2="21" y2="22"></line>
                        <line x1="6" y1="18" x2="6" y2="11"></line>
                        <line x1="10" y1="18" x2="10" y2="11"></line>
                        <line x1="14" y1="18" x2="14" y2="11"></line>
                        <line x1="18" y1="18" x2="18" y2="11"></line>
                        <polygon points="12 2 2 7 22 7"></polygon>
                      </svg>
                    )
                  },
                  {
                    name: "Crypto",
                    desc: "BTC · ETH · USDT",
                    logo: (
                      <svg viewBox="0 0 32 32" className="h-6 w-auto text-[#F7931A]" fill="currentColor">
                        <path d="M16 0C7.16 0 0 7.16 0 16s7.16 16 16 16 16-7.16 16-16S24.84 0 16 0zm4.5 19.5c0 3.3-2.7 4.5-6 4.5h-4v-12h4c3.3 0 5.5 1.2 5.5 4v3.5z" />
                        <text x="10.5" y="21" fontFamily="Georgia, serif" fontWeight="bold" fontSize="15" fill="#FFF">₿</text>
                      </svg>
                    )
                  },
                  {
                    name: "Affirm",
                    desc: "Buy now · Pay later",
                    logo: (
                      <div className="font-sans font-bold italic text-sm text-[#4A4AFF] tracking-tight">
                        affirm
                      </div>
                    )
                  },
                  {
                    name: "Apple Pay",
                    desc: "1-tap · Secure",
                    logo: (
                      <div className="flex items-center gap-1">
                        <svg viewBox="0 0 16 16" className="h-5 w-5 text-slate-800" fill="currentColor">
                          <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.899s1.219.386 1.843.067c.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758q.52-1.185.473-1.282" />
                        </svg>
                        <span className="font-sans font-bold text-sm text-slate-800 tracking-tight">Pay</span>
                      </div>
                    )
                  }
                ].map((gw) => (
                  <div key={gw.name} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-200 min-h-[110px] cursor-pointer">
                    <div className="flex items-center h-8 mb-2">
                      {gw.logo}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-xs">{gw.name}</h4>
                      <p className="text-[9px] text-slate-500 mt-0.5 leading-normal">{gw.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Security badges */}
              <div className="flex flex-wrap gap-3 pt-2">
                {[
                  "🔒 256-bit SSL",
                  "🛡️ PCI DSS Level 1",
                  "🏛️ FCA Regulated",
                  "🔐 2FA Protected",
                  "✅ Insured Deposits"
                ].map((badge) => (
                  <span key={badge} className="rounded-full bg-slate-100 px-3.5 py-1 text-xs font-medium text-slate-600 border border-slate-200/60 shadow-sm">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Side: Deposits & Withdrawals Flow (Navbar styled dark box) */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl text-white">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                  How Deposits & Withdrawals Work
                </p>

                <div className="space-y-4">
                  {[
                    {
                      icon: <CreditCard className="h-5 w-5 text-gold" />,
                      title: "Debit / Credit Card",
                      desc: "Visa, Mastercard, Amex accepted. Instant deposit. 0.5% processing fee. Max ₹40L/day.",
                      badge: <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 whitespace-nowrap">Instant</span>
                    },
                    {
                      icon: <Landmark className="h-5 w-5 text-gold" />,
                      title: "Bank Transfer (SWIFT / SEPA / NEFT)",
                      desc: "Zero fee for transfers above ₹4L. Ideal for large deposits. Arrives within 1-3 business days.",
                      badge: <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400 whitespace-nowrap">1-3 days</span>
                    },
                    {
                      icon: <Smartphone className="h-5 w-5 text-gold" />,
                      title: "UPI / Razorpay (India)",
                      desc: "Instant UPI payments for Indian investors. Zero fee. Supports GPay, PhonePe, Paytm, BHIM.",
                      badge: <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 whitespace-nowrap">Instant</span>
                    },
                    {
                      icon: <Coins className="h-5 w-5 text-gold" />,
                      title: "Cryptocurrency",
                      desc: "BTC, ETH, USDT, USDC accepted. Auto-converted to INR at live market rate. 0.3% fee.",
                      badge: <span className="rounded bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 text-[10px] font-semibold text-sky-400 whitespace-nowrap">~15 min</span>
                    },
                    {
                      icon: <Zap className="h-5 w-5 text-gold" />,
                      title: "Withdrawals",
                      desc: "Withdraw profits to your bank account anytime. Processed within 24 hours. 0.2% fee. Min ₹8,000.",
                      badge: <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400 whitespace-nowrap">&lt;24 hrs</span>
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 py-1 border-b border-slate-900/60 pb-3 last:border-0 last:pb-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 border border-slate-800/80 text-gold shrink-0 mt-0.5">
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                          {item.badge}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trading Guide Section (Dark background matching navbar) */}
      <section id="trading" className="bg-slate-950 text-white py-20 border-t border-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-2 text-center max-w-3xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">TRADE LIKE A PRO</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-white">How to Trade Properties</h2>
            <p className="mt-4 text-slate-400 text-sm sm:text-base leading-relaxed">
              PlotsnHomes' marketplace lets you buy and sell property shares like stocks — with real-time pricing, instant execution, and transparent P&L tracking.
            </p>
          </div>

          {/* 3 columns */}
          <div className="grid gap-8 md:grid-cols-3 mt-16">
            {[
              {
                icon: <ArrowDownLeft className="h-6 w-6 text-gold" />,
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
                icon: <ArrowUpRight className="h-6 w-6 text-gold" />,
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
                icon: <BarChart3 className="h-6 w-6 text-gold" />,
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
              <div key={col.title} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 hover:border-gold/40 hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 shadow-xl flex flex-col cursor-pointer">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-gold mb-6 shrink-0 shadow-inner">
                  {col.icon}
                </div>
                <h3 className="text-lg font-semibold text-white">{col.title}</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed min-h-[50px]">{col.desc}</p>
                
                <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-4 flex-1">
                  {col.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-3 text-xs leading-normal">
                      <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-gold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Trade Timeline */}
          <div className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/20 p-6 sm:p-8">
            <p className="text-center text-sm font-bold text-gold tracking-widest uppercase mb-8">
              A Typical Trade in Under 60 Seconds
            </p>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-2">
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
                <div key={idx} className="flex flex-col lg:flex-row items-center w-full lg:w-auto">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 border border-gold/40 text-gold shadow-md">
                      {step.icon}
                    </div>
                    <p className="text-xs font-semibold text-white mt-2.5">{step.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{step.sub}</p>
                  </div>
                  {idx < arr.length - 1 && (
                    <div className="hidden lg:block h-[1px] w-12 sm:w-16 bg-gradient-to-r from-gold/50 to-slate-800 mx-4 shrink-0" />
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
              className="group rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:border-gold/50 hover:shadow-xl hover:-translate-y-1"
            >
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-gold-dark transition-colors">{item.title}</h3>
              <p className="mt-2 text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              <span className="mt-4 inline-block text-sm font-medium text-gold-dark group-hover:underline">Get started →</span>
            </Link>
          ))}
        </div>
      </section>

      {((siteTeamMembers && siteTeamMembers.length > 0) || agents.length > 0) && (
        <section className="bg-slate-900 py-16 text-white border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-gold">OUR AGENTS</p>
            <h2 className="mt-2 font-display text-3xl font-bold">Meet our team</h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {(siteTeamMembers && siteTeamMembers.length > 0
                ? siteTeamMembers
                : agents.map((a) => ({
                    id: a.id,
                    name: a.name || "Agent",
                    designation: "Real estate agent",
                    countryCode: "+91",
                    phone: a.phone || "9820134567",
                  }))
              ).map((m) => (
                <div key={m.id} className="rounded-2xl border border-slate-700/80 bg-slate-800/50 p-6 hover:border-gold/30 hover:bg-slate-800 transition-all">
                  <p className="font-bold text-lg text-white">{m.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{m.designation || "Real estate agent"}</p>
                  {m.phone && (
                    <p className="mt-3 text-sm font-semibold text-gold tracking-wide">
                      {m.countryCode ? `${m.countryCode} ` : ""}{m.phone}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lead-gen CTA — captures Name + Phone straight into the CRM */}
      <section id="get-in-touch" className="relative bg-slate-50 py-20 border-t border-slate-200/60 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a03_1px,transparent_1px),linear-gradient(to_bottom,#0f172a03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-60" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">Talk to an expert</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              Ready to find your next property?
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Share your name and phone number and our property advisors will call you back to
              understand your requirements — whether you&apos;re buying, renting, or investing.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-gold-dark" /> No spam — one quick, friendly call</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-gold-dark" /> Personalised property recommendations</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4 text-gold-dark" /> Guidance on payments, loans &amp; KYC</li>
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
