import { getSetting, setSetting, getTenantSetting, setTenantSetting } from "@/lib/system-settings";
import { prisma } from "@/lib/prisma";

export type WhiteLabelProfile = {
  customDomain: string;        // e.g. "https://invest.apexrealestate.com"
  companyName: string;         // e.g. "Apex Real Estate Group"
  tagline: string;             // e.g. "India's Premier Fractional Land & Property Platform"
  logoUrl: string;             // e.g. "https://example.com/logo.png"
  primaryColor: string;        // e.g. "#f59e0b"
  secondaryColor: string;      // e.g. "#0f172a"
  supportPhone: string;        // e.g. "+91 98201 34567"
  supportEmail: string;        // e.g. "partner@apexrealestate.com"
  officeAddress: string;       // e.g. "Suite 402, Apex Tower, Indore"
  gstCinNumber: string;        // e.g. "23AABCP1234H1Z5"
  copyrightNotice: string;     // e.g. "© 2026 Apex Real Estate Group Pvt. Ltd. All rights reserved."
  isWhiteLabelActive: boolean;
};

export type SubscriptionTierLevel = "STARTER_PARTNER" | "GROWTH_FRANCHISE" | "WHITE_LABEL_PRO" | "ENTERPRISE_CUSTOM";

export type PartnerSubscriptionRecord = {
  id: string;
  orgId?: string;
  orgName: string;
  adminName: string;
  adminEmail: string;
  roleLevel: string;
  customDomain: string;
  domainStatus: "VERIFIED" | "PENDING_DNS" | "FAILED" | "NOT_CONFIGURED";
  tierLevel: SubscriptionTierLevel;
  status: "ACTIVE" | "TRIALING" | "PAST_DUE" | "EXPIRED" | "SUSPENDED";
  monthlyPrice: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  enabledModules: string[];
};

const WL_PROFILE_KEY = "white_label_profile_config_v1";
const WL_SUBSCRIPTIONS_KEY = "white_label_subscriptions_list_v1";

export const DEFAULT_WL_PROFILE: WhiteLabelProfile = {
  customDomain: "https://plotsnhomes.com",
  companyName: "PlotsnHomes",
  tagline: "India's premium fractional real estate & verified property platform",
  logoUrl: "/logo.png",
  primaryColor: "#f59e0b",
  secondaryColor: "#0f172a",
  supportPhone: "+91 98201 34567",
  supportEmail: "support@plotsnhomes.com",
  officeAddress: "Suite 402, Apex Tower, M.G. Road, Indore",
  gstCinNumber: "CIN: U70200DL2024PTC000001",
  copyrightNotice: "© 2026 PlotsnHomes Pvt. Ltd. All rights reserved.",
  isWhiteLabelActive: true,
};

export const DEFAULT_PARTNER_SUBSCRIPTIONS: PartnerSubscriptionRecord[] = [
  {
    id: "sub-org-1",
    orgId: "org-1",
    orgName: "Apex Premier Developers",
    adminName: "Sagar Singhal",
    adminEmail: "sagar@apexpremier.com",
    roleLevel: "WHITE_LABEL_ADMIN",
    customDomain: "invest.apexpremier.com",
    domainStatus: "VERIFIED",
    tierLevel: "WHITE_LABEL_PRO",
    status: "ACTIVE",
    monthlyPrice: 4999,
    currency: "INR",
    periodStart: "2026-01-01",
    periodEnd: "2026-12-31",
    enabledModules: ["WhatsApp Hub", "Loan Engine", "Webpage Editor", "Multi-Tier Hierarchy"],
  },
  {
    id: "sub-org-2",
    orgId: "org-2",
    orgName: "MetroLand Franchise Group",
    adminName: "Bhavya Pandey",
    adminEmail: "bhavya@metroland.in",
    roleLevel: "FRANCHISE_ADMIN",
    customDomain: "portal.metroland.in",
    domainStatus: "PENDING_DNS",
    tierLevel: "GROWTH_FRANCHISE",
    status: "ACTIVE",
    monthlyPrice: 2499,
    currency: "INR",
    periodStart: "2026-03-15",
    periodEnd: "2027-03-14",
    enabledModules: ["WhatsApp Hub", "Loan Engine"],
  },
  {
    id: "sub-org-3",
    orgId: "org-3",
    orgName: "Heritage Realty Agency",
    adminName: "Rohan Verma",
    adminEmail: "rohan@heritagerealty.com",
    roleLevel: "BRANCH_MANAGER",
    customDomain: "heritagerealty.com",
    domainStatus: "NOT_CONFIGURED",
    tierLevel: "STARTER_PARTNER",
    status: "TRIALING",
    monthlyPrice: 999,
    currency: "INR",
    periodStart: "2026-08-01",
    periodEnd: "2026-08-31",
    enabledModules: ["Standard CRM"],
  },
];

/**
 * White-label branding. With a tenantId it returns that tenant's own brand
 * (falling back to the platform's global profile, then the default) — used for
 * the PARTNER'S PUBLIC SITE. With no tenantId it returns the platform's global
 * profile (used as the merchant-of-record identity on invoices/emails).
 */
export async function getWhiteLabelProfile(tenantId?: string | null): Promise<WhiteLabelProfile> {
  const raw = await getTenantSetting(WL_PROFILE_KEY, tenantId);
  if (!raw) return DEFAULT_WL_PROFILE;
  try {
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_WL_PROFILE, ...parsed };
  } catch {
    return DEFAULT_WL_PROFILE;
  }
}

export async function saveWhiteLabelProfile(data: Partial<WhiteLabelProfile>, tenantId?: string | null): Promise<WhiteLabelProfile> {
  let current: WhiteLabelProfile;
  if (tenantId) {
    // Read the tenant's OWN row directly (getTenantSetting would fall back to the
    // global profile), so a partner's first save starts clean — never inheriting
    // the platform's "PlotsnHomes" brand.
    const row = await prisma.tenantSetting.findUnique({ where: { tenantId_key: { tenantId, key: WL_PROFILE_KEY } } });
    current = row ? { ...DEFAULT_WL_PROFILE, ...safeParse(row.value) } : { ...DEFAULT_WL_PROFILE };
  } else {
    current = await getWhiteLabelProfile(null);
  }
  const updated = { ...current, ...data };
  await setTenantSetting(WL_PROFILE_KEY, JSON.stringify(updated), tenantId);
  return updated;
}

function safeParse(raw: string): Partial<WhiteLabelProfile> {
  try { return JSON.parse(raw) as Partial<WhiteLabelProfile>; } catch { return {}; }
}

/**
 * The tenant's OWN saved brand, or null when they have none (no global/default
 * fallback). Used to brand the public site only for partners who configured it,
 * leaving the default platform site untouched.
 */
export async function getTenantBrandOverride(tenantId: string | null | undefined): Promise<WhiteLabelProfile | null> {
  if (!tenantId) return null;
  try {
    const row = await prisma.tenantSetting.findUnique({ where: { tenantId_key: { tenantId, key: WL_PROFILE_KEY } } });
    if (!row) return null;
    return { ...DEFAULT_WL_PROFILE, ...safeParse(row.value) };
  } catch {
    return null;
  }
}

export async function getPartnerSubscriptions(): Promise<PartnerSubscriptionRecord[]> {
  const raw = await getSetting(WL_SUBSCRIPTIONS_KEY);
  if (!raw) return DEFAULT_PARTNER_SUBSCRIPTIONS;
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) return list;
    return DEFAULT_PARTNER_SUBSCRIPTIONS;
  } catch {
    return DEFAULT_PARTNER_SUBSCRIPTIONS;
  }
}

export async function savePartnerSubscriptions(subscriptions: PartnerSubscriptionRecord[]): Promise<PartnerSubscriptionRecord[]> {
  await setSetting(WL_SUBSCRIPTIONS_KEY, JSON.stringify(subscriptions));
  return subscriptions;
}
