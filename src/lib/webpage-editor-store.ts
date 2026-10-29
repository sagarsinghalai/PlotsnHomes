import { getSetting, setSetting } from "@/lib/system-settings";

export type SectionType =
  | "hero"
  | "text"
  | "features"
  | "properties"
  | "cta"
  | "faq"
  | "testimonials"
  | "stats"
  | "gallery"
  | "columns"
  | "form"
  | "rawHtml";

/** One column inside a "columns" (row) section. Holds its own HTML/content. */
export type GridColumn = {
  id: string;
  html?: string;
};

export type SectionBlock = {
  id: string;
  type: SectionType;
  title: string;
  subtitle?: string;
  content?: string;
  bgGradient?: string;
  bgColor?: string;
  textColor?: string;
  bgImage?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  alignment?: "left" | "center" | "right";
  columns?: number;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: "normal" | "italic";
  paddingY?: string;
  borderRadius?: string;
  borderColor?: string;
  borderWidth?: number;
  items?: Array<{
    id: string;
    title: string;
    description: string;
    icon?: string;
    image?: string;
    link?: string;
    badge?: string;
    author?: string;
    role?: string;
    rating?: number;
    statValue?: string;
    statLabel?: string;
  }>;
  rawCode?: string;
  grid?: GridColumn[];
  formSlug?: string; // for type "form" — which built form to embed
  propertyQuery?: {
    type?: string;
    category?: string;
    featuredOnly?: boolean;
    limit?: number;
  };
};

export type CustomPage = {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft";
  seoTitle?: string;
  seoDescription?: string;
  showInNavbar?: boolean;
  showInFooter?: boolean;
  // When set, this page OVERRIDES (takes over) an existing real route — e.g. "/"
  // or "/pricing" — whenever it is published. Empty = a normal /p/<slug> page.
  targetRoute?: string;
  sections: SectionBlock[];
  createdAt: string;
  updatedAt: string;
};

/** Real routes an admin may take over with a builder page. */
export const OVERRIDABLE_ROUTES: { route: string; label: string }[] = [
  { route: "/", label: "Homepage ( / )" },
  { route: "/pricing", label: "Pricing ( /pricing )" },
];

export type NavItemLink = {
  id: string;
  label: string;
  url: string;
  isExternal?: boolean;
  isButton?: boolean;
  order: number;
};

export type NavSettings = {
  headerLinks: NavItemLink[];
  footerLinks: {
    columnTitle: string;
    links: NavItemLink[];
  }[];
};

export type FooterCustomButton = {
  id: string;
  label: string;
  url: string;
  openInNewTab?: boolean;
  icon?: string;
  fontFamily?: string;
  fontSize?: "xs" | "sm" | "base" | "lg";
  fontWeight?: "normal" | "medium" | "semibold" | "bold" | "extrabold";
  fontStyle?: "normal" | "italic";
  textColor?: string;
  bgColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  paddingSize?: "compact" | "normal" | "large";
};

export type FooterSocialLink = {
  id: string;
  platform: string;
  url: string;
  icon: string;
};

export type FooterColumn = {
  id: string;
  columnTitle: string;
  links: NavItemLink[];
};

export type FooterBadge = {
  id: string;
  label: string;
  url: string;
};

export type FooterSettings = {
  brandName: string;
  brandTagline?: string;
  boilerplateText: string;
  copyrightText: string;
  disclaimerText?: string;
  poweredByText?: string;
  badges?: FooterBadge[];
  columns: FooterColumn[];
  socialLinks: FooterSocialLink[];
  customButtons: FooterCustomButton[];
};

const PAGES_KEY = "webpage_editor_pages_v2";
const NAV_KEY = "webpage_editor_nav_v2";
const FOOTER_KEY = "webpage_editor_footer_v2";

export const DEFAULT_PAGES: CustomPage[] = [
  {
    id: "page-home-landing",
    title: "Homepage (Main Landing)",
    slug: "/",
    status: "published",
    seoTitle: "PlotsnHomes — Fractional Real Estate & Verified Land Shares",
    seoDescription: "Invest in premium real estate across London, New York, Dubai and more starting from just ₹40,000.",
    showInNavbar: true,
    showInFooter: true,
    createdAt: "2026-08-12T10:00:00.000Z",
    updatedAt: "2026-08-12T10:00:00.000Z",
    sections: [
      {
        id: "sec-hero-home",
        type: "hero",
        title: "Own a Piece of the World's Finest Properties",
        subtitle: "Invest in premium real estate across London, New York, Dubai and more — starting from just ₹40,000. Trade your shares anytime, earn rental income, and build a global property portfolio.",
        bgImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80",
        ctaText: "Buy Properties",
        ctaLink: "/properties",
        secondaryCtaText: "Rent / Lease",
        secondaryCtaLink: "/properties?mode=rent",
        alignment: "center",
      },
      {
        id: "sec-how-it-works-home",
        type: "features",
        title: "How PlotsnHomes Works",
        subtitle: "GETTING STARTED",
        columns: 3,
        items: [
          { id: "step-1", title: "1. Create & Verify Account", description: "Sign up in 3 minutes. Complete secure KYC verification (PAN, Aadhaar) for full trading access.", icon: "UserCheck" },
          { id: "step-2", title: "2. Fund Your Wallet", description: "Deposit via UPI, Net Banking, SWIFT or Crypto. Funds held in segregated regulated escrow.", icon: "Wallet" },
          { id: "step-3", title: "3. Buy Property Shares", description: "Browse curated listings. Own real legal fractions starting from ₹40,000 minimum.", icon: "Building2" },
          { id: "step-4", title: "4. Earn Monthly Income", description: "Rental income distributed directly to your wallet proportional to your share ownership.", icon: "TrendingUp" },
          { id: "step-5", title: "5. Trade & Exit Anytime", description: "Sell shares on live secondary marketplace anytime. Instant wallet payouts.", icon: "Sparkles" },
        ],
      },
      {
        id: "sec-testimonials-home",
        type: "testimonials",
        title: "Investor Voices — Trusted by 5,00,000+ Smart Investors",
        subtitle: "See how our co-owners are building wealth through transparent, high-yield fractional real estate investments.",
      },
      {
        id: "sec-payments-home",
        type: "cta",
        title: "Global Payment Gateways & 24/7 Liquidity",
        subtitle: "Stripe, PayPal, Razorpay, Paytm, Wise, Crypto, SWIFT. Deposit, trade, and withdraw profits instantly in your local currency.",
        ctaText: "Explore Gateways",
        ctaLink: "/#payments",
        bgGradient: "linear-gradient(135deg, #030712 0%, #0f172a 100%)",
      },
      {
        id: "sec-faq-home",
        type: "faq",
        title: "Frequently Asked Questions",
        subtitle: "Everything you need to know about fractional land & property ownership.",
        items: [
          { id: "fq-1", title: "How does fractional real estate ownership work?", description: "Properties are acquired under an SPV entity. You own legal shares corresponding to your investment amount starting from ₹40,000." },
          { id: "fq-2", title: "How do I receive monthly rental payouts?", description: "Rental payouts are collected from tenants and credited directly to your PlotsnHomes wallet every month." },
          { id: "fq-3", title: "Can I sell my property shares whenever I want?", description: "Yes! Our live secondary marketplace enables 24/7 trading where you can sell shares to other investors anytime." },
        ],
      },
    ],
  },
  {
    id: "page-luxury-guide",
    title: "Luxury Homes & Plots Guide",
    slug: "luxury-guide",
    status: "published",
    seoTitle: "Exclusive Real Estate & Plot Investment Guide 2026",
    seoDescription: "Explore premium residential plots, luxury villas, and high-yield commercial real estate opportunities.",
    showInNavbar: true,
    showInFooter: true,
    createdAt: "2026-08-12T10:00:00.000Z",
    updatedAt: "2026-08-12T10:00:00.000Z",
    sections: [
      {
        id: "sec-hero-1",
        type: "hero",
        title: "Find Your Dream Plot & High-Yield Property",
        subtitle: "Verified plots, luxury townships, and commercial assets with guaranteed RERA compliance.",
        bgImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
        ctaText: "Explore Properties",
        ctaLink: "/properties",
        secondaryCtaText: "Book Site Visit",
        secondaryCtaLink: "/showings",
        alignment: "left",
      },
    ],
  },
];

export const DEFAULT_NAV_SETTINGS: NavSettings = {
  headerLinks: [
    { id: "nl-1", label: "Properties", url: "/admin/properties", order: 1 },
    { id: "nl-2", label: "Projects", url: "/admin/projects", order: 2 },
    { id: "nl-3", label: "Luxury Guide", url: "/p/luxury-guide", order: 3 },
    { id: "nl-4", label: "About Us", url: "/p/about-us", order: 4 },
  ],
  footerLinks: [
    {
      columnTitle: "Company",
      links: [
        { id: "fl-1", label: "About Us", url: "/p/about-us", order: 1 },
        { id: "fl-2", label: "Luxury Guide", url: "/p/luxury-guide", order: 2 },
        { id: "fl-3", label: "Live Markets", url: "/markets", order: 3 },
      ],
    },
    {
      columnTitle: "Listings",
      links: [
        { id: "fl-4", label: "Residential Plots", url: "/admin/properties?type=RESIDENTIAL", order: 1 },
        { id: "fl-5", label: "Commercial Assets", url: "/admin/properties?type=COMMERCIAL", order: 2 },
        { id: "fl-6", label: "New Launch Projects", url: "/admin/projects", order: 3 },
      ],
    },
  ],
};

export async function getCustomPages(): Promise<CustomPage[]> {
  const raw = await getSetting(PAGES_KEY);
  if (!raw) return DEFAULT_PAGES;
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) return list;
    return DEFAULT_PAGES;
  } catch {
    return DEFAULT_PAGES;
  }
}

export async function getCustomPageBySlug(slug: string): Promise<CustomPage | null> {
  const pages = await getCustomPages();
  const cleanSlug = slug.toLowerCase().replace(/^\/+|\/+$/g, "");
  return pages.find((p) => p.slug.toLowerCase() === cleanSlug) || null;
}

/**
 * The published builder page that currently overrides `route`, or null. Used by
 * real pages (home, pricing, …) to render admin-built content in place of their
 * coded version when an override exists and is published.
 */
export async function getPublishedPageForRoute(route: string): Promise<CustomPage | null> {
  const pages = await getCustomPages();
  return (
    pages.find((p) => p.targetRoute === route && p.status === "published") || null
  );
}

export async function saveCustomPage(pageData: Partial<CustomPage> & { title: string; slug: string }): Promise<CustomPage> {
  const currentList = await getCustomPages();
  const now = new Date().toISOString();
  const cleanSlug = pageData.slug.toLowerCase().replace(/[^a-z0-9-/]/g, "-").replace(/-+/g, "-").replace(/^\/+|\/+$/g, "");

  let target: CustomPage;
  if (pageData.id) {
    const idx = currentList.findIndex((p) => p.id === pageData.id);
    if (idx >= 0) {
      target = {
        ...currentList[idx],
        ...pageData,
        slug: cleanSlug,
        updatedAt: now,
      } as CustomPage;
      currentList[idx] = target;
    } else {
      target = {
        id: pageData.id,
        title: pageData.title,
        slug: cleanSlug,
        status: pageData.status || "published",
        seoTitle: pageData.seoTitle,
        seoDescription: pageData.seoDescription,
        showInNavbar: pageData.showInNavbar ?? true,
        showInFooter: pageData.showInFooter ?? true,
        targetRoute: pageData.targetRoute,
        sections: pageData.sections || [],
        createdAt: now,
        updatedAt: now,
      };
      currentList.push(target);
    }
  } else {
    target = {
      id: `page-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title: pageData.title,
      slug: cleanSlug,
      status: pageData.status || "published",
      seoTitle: pageData.seoTitle,
      seoDescription: pageData.seoDescription,
      showInNavbar: pageData.showInNavbar ?? true,
      showInFooter: pageData.showInFooter ?? true,
      targetRoute: pageData.targetRoute,
      sections: pageData.sections || [],
      createdAt: now,
      updatedAt: now,
    };
    currentList.push(target);
  }

  await setSetting(PAGES_KEY, JSON.stringify(currentList));
  return target;
}

export async function deleteCustomPage(id: string): Promise<boolean> {
  const currentList = await getCustomPages();
  const filtered = currentList.filter((p) => p.id !== id);
  await setSetting(PAGES_KEY, JSON.stringify(filtered));
  return true;
}

export async function getNavSettings(): Promise<NavSettings> {
  const raw = await getSetting(NAV_KEY);
  if (!raw) return DEFAULT_NAV_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.headerLinks)) return parsed;
    return DEFAULT_NAV_SETTINGS;
  } catch {
    return DEFAULT_NAV_SETTINGS;
  }
}

export async function saveNavSettings(navData: NavSettings): Promise<NavSettings> {
  await setSetting(NAV_KEY, JSON.stringify(navData));
  return navData;
}

export const DEFAULT_FOOTER_SETTINGS: FooterSettings = {
  brandName: "PlotsnHomes",
  brandTagline: "",
  boilerplateText: "India's premium fractional real estate investment platform. Own verified property shares from ₹40,000. Earn rental income monthly.",
  copyrightText: "© 2026 PlotsnHomes Pvt. Ltd. · CIN: U70200DL2024PTC000001",
  disclaimerText: "Investment in real estate is subject to market risks. Read all documents carefully.",
  poweredByText: "",
  badges: [
    { id: "bdg-1", label: "SEBI Compliant", url: "/properties" },
    { id: "bdg-2", label: "8–14% Returns", url: "/calculators" },
    { id: "bdg-3", label: "Instant Withdrawal", url: "/#payments" },
  ],
  columns: [
    {
      id: "fc-invest",
      columnTitle: "INVEST",
      links: [
        { id: "fl-inv-1", label: "Browse Properties", url: "/properties", order: 1 },
        { id: "fl-inv-2", label: "How It Works", url: "/#how-it-works", order: 2 },
        { id: "fl-inv-3", label: "Payment Options", url: "/#payments", order: 3 },
        { id: "fl-inv-4", label: "Trading Guide", url: "/#trading", order: 4 },
        { id: "fl-inv-5", label: "ROI Calculator", url: "/calculators", order: 5 },
      ],
    },
    {
      id: "fc-account",
      columnTitle: "ACCOUNT",
      links: [
        { id: "fl-acc-1", label: "Create Account", url: "/register", order: 1 },
        { id: "fl-acc-2", label: "Log In", url: "/login", order: 2 },
        { id: "fl-acc-3", label: "My Dashboard", url: "/dashboard", order: 3 },
        { id: "fl-acc-4", label: "KYC Verification", url: "/dashboard/kyc", order: 4 },
        { id: "fl-acc-5", label: "Market Overview", url: "/markets", order: 5 },
      ],
    },
    {
      id: "fc-company",
      columnTitle: "COMPANY",
      links: [
        { id: "fl-com-1", label: "About Us", url: "/about", order: 1 },
        { id: "fl-com-2", label: "Contact", url: "/contact", order: 2 },
        { id: "fl-com-3", label: "Privacy Policy", url: "/privacy", order: 3 },
        { id: "fl-com-4", label: "Terms of Use", url: "/terms", order: 4 },
      ],
    },
    {
      id: "fc-joinus",
      columnTitle: "JOIN US",
      links: [
        { id: "fl-join-wl", label: "Become a White Label Partner", url: "/become-white-label", order: 1 },
        { id: "fl-join-sel", label: "Become a Seller", url: "/become-seller", order: 2 },
      ],
    },
  ],
  socialLinks: [
    { id: "soc-1", platform: "Twitter / X", url: "https://twitter.com", icon: "Send" },
    { id: "soc-2", platform: "LinkedIn", url: "https://linkedin.com", icon: "MessageCircle" },
    { id: "soc-3", platform: "Instagram", url: "https://instagram.com", icon: "Globe" },
    { id: "soc-4", platform: "YouTube", url: "https://youtube.com", icon: "Share2" },
  ],
  customButtons: [],
};

export async function getFooterSettings(): Promise<FooterSettings> {
  const raw = await getSetting(FOOTER_KEY);
  if (!raw) return DEFAULT_FOOTER_SETTINGS;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.columns)) {
      const hasJoinUs = parsed.columns.some((col: any) => col.id === "fc-joinus");
      if (!hasJoinUs) {
        parsed.columns.push({
          id: "fc-joinus",
          columnTitle: "JOIN US",
          links: [
            { id: "fl-join-wl", label: "Become a White Label Partner", url: "/become-white-label", order: 1 },
            { id: "fl-join-sel", label: "Become a Seller", url: "/become-seller", order: 2 },
          ],
        });
        await setSetting(FOOTER_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    return DEFAULT_FOOTER_SETTINGS;
  } catch {
    return DEFAULT_FOOTER_SETTINGS;
  }
}

export async function saveFooterSettings(footerData: FooterSettings): Promise<FooterSettings> {
  await setSetting(FOOTER_KEY, JSON.stringify(footerData));
  return footerData;
}

