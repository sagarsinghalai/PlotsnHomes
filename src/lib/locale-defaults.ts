/** Platform defaults — India-first; users can switch country/currency in settings. */
export const DEFAULT_COUNTRY_CODE = "IN";
export const DEFAULT_DIAL_CODE = "+91";
export const DEFAULT_CURRENCY = "INR";
export const DEFAULT_TIMEZONE = "Asia/Kolkata";
export const DEFAULT_LOCALE = "en-IN";

export type CountryOption = {
  code: string;
  name: string;
  dial: string;
  flag: string;
  currency: string;
};

export const COUNTRIES: CountryOption[] = [
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳", currency: "INR" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸", currency: "USD" },
  { code: "AE", name: "UAE", dial: "+971", flag: "🇦🇪", currency: "AED" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧", currency: "GBP" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬", currency: "SGD" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺", currency: "AUD" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦", currency: "CAD" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪", currency: "EUR" },
];

export const SUPPORTED_CURRENCIES = ["INR", "USD", "AED", "GBP", "EUR", "SGD", "AUD", "CAD"] as const;

export const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "America/New_York", label: "US Eastern" },
  { value: "America/Los_Angeles", label: "US Pacific" },
  { value: "Europe/London", label: "UK (GMT)" },
  { value: "Asia/Dubai", label: "UAE (GST)" },
  { value: "Asia/Singapore", label: "Singapore" },
] as const;

export function getCountryByCode(code: string): CountryOption {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

export function getCountryByDial(dial: string): CountryOption | undefined {
  const normalized = dial.startsWith("+") ? dial : `+${dial}`;
  return [...COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => normalized.startsWith(c.dial));
}

export function currencyLocale(currency: string): string {
  const map: Record<string, string> = {
    INR: "en-IN",
    USD: "en-US",
    AED: "ar-AE",
    GBP: "en-GB",
    EUR: "de-DE",
    SGD: "en-SG",
    AUD: "en-AU",
    CAD: "en-CA",
  };
  return map[currency.toUpperCase()] ?? DEFAULT_LOCALE;
}

export function currencySymbol(currency: string): string {
  const map: Record<string, string> = {
    INR: "₹",
    USD: "$",
    AED: "AED ",
    GBP: "£",
    EUR: "€",
    SGD: "S$",
    AUD: "A$",
    CAD: "C$",
  };
  return map[currency.toUpperCase()] ?? currency;
}
