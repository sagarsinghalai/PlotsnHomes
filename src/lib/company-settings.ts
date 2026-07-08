import { DEFAULT_COUNTRY_CODE, DEFAULT_CURRENCY, DEFAULT_TIMEZONE } from "@/lib/locale-defaults";
import { getSetting, setSetting } from "@/lib/system-settings";

export const COMPANY_KEYS = {
  BUSINESS_NAME: "company_business_name",
  WEBSITE: "company_website",
  EMAIL: "company_email",
  PHONE: "company_phone",
  COUNTRY: "company_country",
  TIMEZONE: "company_timezone",
  CURRENCY: "company_currency",
  LOGO_URL: "company_logo_url",
  SHOW_LEAD_PHONE_TO_SALES: "company_show_lead_phone_sales",
  SHOW_ACCESSIBLE_LEADS: "company_show_accessible_leads",
} as const;

export type CompanySettings = {
  businessName: string;
  website: string;
  email: string;
  phone: string;
  country: string;
  timezone: string;
  currency: string;
  logoUrl: string;
  showLeadPhoneToSales: boolean;
  showAccessibleLeads: boolean;
};

export async function getCompanyCurrency(): Promise<string> {
  const v = await getSetting(COMPANY_KEYS.CURRENCY);
  return (v || DEFAULT_CURRENCY).toUpperCase();
}

export async function getCompanyCountry(): Promise<string> {
  const v = await getSetting(COMPANY_KEYS.COUNTRY);
  return v || DEFAULT_COUNTRY_CODE;
}

export async function getCompanySettings(): Promise<CompanySettings> {
  const keys = Object.values(COMPANY_KEYS);
  const values = await Promise.all(keys.map((k) => getSetting(k)));
  const m = Object.fromEntries(keys.map((k, i) => [k, values[i] ?? ""]));

  return {
    businessName: m[COMPANY_KEYS.BUSINESS_NAME] || "PlotsnHomes",
    website: m[COMPANY_KEYS.WEBSITE] || "",
    email: m[COMPANY_KEYS.EMAIL] || "admin@plotsnhomes.com",
    phone: m[COMPANY_KEYS.PHONE] || "",
    country: m[COMPANY_KEYS.COUNTRY] || DEFAULT_COUNTRY_CODE,
    timezone: m[COMPANY_KEYS.TIMEZONE] || DEFAULT_TIMEZONE,
    currency: m[COMPANY_KEYS.CURRENCY] || DEFAULT_CURRENCY,
    logoUrl: m[COMPANY_KEYS.LOGO_URL] || "",
    showLeadPhoneToSales: m[COMPANY_KEYS.SHOW_LEAD_PHONE_TO_SALES] !== "false",
    showAccessibleLeads: m[COMPANY_KEYS.SHOW_ACCESSIBLE_LEADS] !== "false",
  };
}

export async function saveCompanySettings(data: Partial<CompanySettings>) {
  const entries: [string, string][] = [];
  if (data.businessName !== undefined) entries.push([COMPANY_KEYS.BUSINESS_NAME, data.businessName]);
  if (data.website !== undefined) entries.push([COMPANY_KEYS.WEBSITE, data.website]);
  if (data.email !== undefined) entries.push([COMPANY_KEYS.EMAIL, data.email]);
  if (data.phone !== undefined) entries.push([COMPANY_KEYS.PHONE, data.phone]);
  if (data.country !== undefined) entries.push([COMPANY_KEYS.COUNTRY, data.country]);
  if (data.timezone !== undefined) entries.push([COMPANY_KEYS.TIMEZONE, data.timezone]);
  if (data.currency !== undefined) entries.push([COMPANY_KEYS.CURRENCY, data.currency]);
  if (data.logoUrl !== undefined) entries.push([COMPANY_KEYS.LOGO_URL, data.logoUrl]);
  if (data.showLeadPhoneToSales !== undefined) {
    entries.push([COMPANY_KEYS.SHOW_LEAD_PHONE_TO_SALES, String(data.showLeadPhoneToSales)]);
  }
  if (data.showAccessibleLeads !== undefined) {
    entries.push([COMPANY_KEYS.SHOW_ACCESSIBLE_LEADS, String(data.showAccessibleLeads)]);
  }
  await Promise.all(entries.map(([k, v]) => setSetting(k, v)));
}
