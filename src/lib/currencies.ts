export type CurrencyCode =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AED"
  | "HKD"
  | "AUD"
  | "CAD"
  | "SGD"
  | "JPY"
  | "CHF"
  | "CNY"
  | "SAR"
  | "QAR"
  | "MYR"
  | "KWD";

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  rateFromINR: number; // Rate to convert INR base amount to this currency
  locale: string;
};

export const CURRENCIES_MAP: Record<CurrencyCode, CurrencyInfo> = {
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", flag: "🇮🇳", rateFromINR: 1, locale: "en-IN" },
  USD: { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸", rateFromINR: 0.012, locale: "en-US" },
  EUR: { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺", rateFromINR: 0.011, locale: "de-DE" },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧", rateFromINR: 0.0095, locale: "en-GB" },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham", flag: "🇦🇪", rateFromINR: 0.044, locale: "ar-AE" },
  HKD: { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", flag: "🇭🇰", rateFromINR: 0.094, locale: "zh-HK" },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", flag: "🇦🇺", rateFromINR: 0.018, locale: "en-AU" },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦", rateFromINR: 0.016, locale: "en-CA" },
  SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar", flag: "🇸🇬", rateFromINR: 0.016, locale: "zh-SG" },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", flag: "🇯🇵", rateFromINR: 1.82, locale: "ja-JP" },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc", flag: "🇨🇭", rateFromINR: 0.011, locale: "de-CH" },
  CNY: { code: "CNY", symbol: "¥", name: "Chinese Yuan", flag: "🇨🇳", rateFromINR: 0.087, locale: "zh-CN" },
  SAR: { code: "SAR", symbol: "﷼", name: "Saudi Riyal", flag: "🇸🇦", rateFromINR: 0.045, locale: "ar-SA" },
  QAR: { code: "QAR", symbol: "QR", name: "Qatari Riyal", flag: "🇶🇦", rateFromINR: 0.044, locale: "ar-QA" },
  MYR: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", flag: "🇲🇾", rateFromINR: 0.056, locale: "ms-MY" },
  KWD: { code: "KWD", symbol: "KD", name: "Kuwaiti Dinar", flag: "🇰🇼", rateFromINR: 0.0037, locale: "ar-KW" },
};
