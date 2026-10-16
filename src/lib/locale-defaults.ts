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
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦", currency: "SAR" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷", currency: "EUR" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹", currency: "EUR" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸", currency: "EUR" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱", currency: "EUR" },
  { code: "BE", name: "Belgium", dial: "+32", flag: "🇧🇪", currency: "EUR" },
  { code: "CH", name: "Switzerland", dial: "+41", flag: "🇨🇭", currency: "CHF" },
  { code: "AT", name: "Austria", dial: "+43", flag: "🇦🇹", currency: "EUR" },
  { code: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪", currency: "SEK" },
  { code: "NO", name: "Norway", dial: "+47", flag: "🇳🇴", currency: "NOK" },
  { code: "DK", name: "Denmark", dial: "+45", flag: "🇩🇰", currency: "DKK" },
  { code: "FI", name: "Finland", dial: "+358", flag: "🇫🇮", currency: "EUR" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹", currency: "EUR" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪", currency: "EUR" },
  { code: "PL", name: "Poland", dial: "+48", flag: "🇵🇱", currency: "PLN" },
  { code: "CZ", name: "Czech Republic", dial: "+420", flag: "🇨🇿", currency: "CZK" },
  { code: "RO", name: "Romania", dial: "+40", flag: "🇷🇴", currency: "RON" },
  { code: "HU", name: "Hungary", dial: "+36", flag: "🇭🇺", currency: "HUF" },
  { code: "GR", name: "Greece", dial: "+30", flag: "🇬🇷", currency: "EUR" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺", currency: "RUB" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷", currency: "TRY" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵", currency: "JPY" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳", currency: "CNY" },
  { code: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷", currency: "KRW" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭", currency: "THB" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾", currency: "MYR" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩", currency: "IDR" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭", currency: "PHP" },
  { code: "VN", name: "Vietnam", dial: "+84", flag: "🇻🇳", currency: "VND" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩", currency: "BDT" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰", currency: "PKR" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰", currency: "LKR" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵", currency: "NPR" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦", currency: "ZAR" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬", currency: "NGN" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪", currency: "KES" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬", currency: "EGP" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭", currency: "GHS" },
  { code: "MX", name: "Mexico", dial: "+52", flag: "🇲🇽", currency: "MXN" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷", currency: "BRL" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷", currency: "ARS" },
  { code: "CO", name: "Colombia", dial: "+57", flag: "🇨🇴", currency: "COP" },
  { code: "CL", name: "Chile", dial: "+56", flag: "🇨🇱", currency: "CLP" },
  { code: "PE", name: "Peru", dial: "+51", flag: "🇵🇪", currency: "PEN" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿", currency: "NZD" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦", currency: "QAR" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼", currency: "KWD" },
  { code: "BH", name: "Bahrain", dial: "+973", flag: "🇧🇭", currency: "BHD" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲", currency: "OMR" },
  { code: "JO", name: "Jordan", dial: "+962", flag: "🇯🇴", currency: "JOD" },
  { code: "LB", name: "Lebanon", dial: "+961", flag: "🇱🇧", currency: "LBP" },
  { code: "IL", name: "Israel", dial: "+972", flag: "🇮🇱", currency: "ILS" },
  { code: "TW", name: "Taiwan", dial: "+886", flag: "🇹🇼", currency: "TWD" },
  { code: "HK", name: "Hong Kong", dial: "+852", flag: "🇭🇰", currency: "HKD" },
  { code: "MO", name: "Macau", dial: "+853", flag: "🇲🇴", currency: "MOP" },
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
