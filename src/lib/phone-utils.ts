import {
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  DEFAULT_DIAL_CODE,
  getCountryByCode,
  getCountryByDial,
} from "@/lib/locale-defaults";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Build E.164 phone from dial code + national number */
export function formatPhoneE164(dialCode: string, nationalNumber: string): string {
  const codeDigits = digitsOnly(dialCode);
  let national = digitsOnly(nationalNumber);
  if (national.startsWith(codeDigits)) {
    national = national.slice(codeDigits.length);
  }
  if (!national) return "";
  return `+${codeDigits}${national}`;
}

export function parseStoredPhone(
  phone: string | null | undefined,
  fallbackCountry = DEFAULT_COUNTRY_CODE
): { countryCode: string; dial: string; national: string; e164: string } {
  if (!phone?.trim()) {
    const c = getCountryByCode(fallbackCountry);
    return { countryCode: c.code, dial: c.dial, national: "", e164: "" };
  }

  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    const match = getCountryByDial(trimmed);
    if (match) {
      const national = trimmed.slice(match.dial.length).replace(/\D/g, "");
      return {
        countryCode: match.code,
        dial: match.dial,
        national,
        e164: formatPhoneE164(match.dial, national),
      };
    }
    const digits = digitsOnly(trimmed);
    return {
      countryCode: fallbackCountry,
      dial: `+${digits.slice(0, 2)}`,
      national: digits.slice(2),
      e164: `+${digits}`,
    };
  }

  const c = getCountryByCode(fallbackCountry);
  const national = digitsOnly(trimmed);
  return {
    countryCode: c.code,
    dial: c.dial,
    national,
    e164: formatPhoneE164(c.dial, national),
  };
}

/** Extract phone from QR / wa.me / vCard / plain text */
export function parsePhoneFromScan(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  const waMatch = text.match(/wa\.me\/(\d+)/i);
  if (waMatch) return `+${waMatch[1]}`;

  const telMatch = text.match(/tel:(\+?\d[\d\s-]{6,})/i);
  if (telMatch) return normalizePhoneE164(telMatch[1]);

  const vcardTel = text.match(/TEL[^:]*:(\+?[\d\s-]+)/i);
  if (vcardTel) return normalizePhoneE164(vcardTel[1]);

  const jsonPhone = text.match(/"phone"\s*:\s*"([^"]+)"/i);
  if (jsonPhone) return normalizePhoneE164(jsonPhone[1]);

  const digits = digitsOnly(text);
  if (digits.length >= 10) {
    if (digits.length === 10) return formatPhoneE164(DEFAULT_DIAL_CODE, digits);
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
    return `+${digits}`;
  }

  return null;
}

export function normalizePhoneE164(phone: string, defaultDial = DEFAULT_DIAL_CODE): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) {
    const d = digitsOnly(trimmed);
    return d ? `+${d}` : "";
  }
  const national = digitsOnly(trimmed);
  if (!national) return "";
  return formatPhoneE164(defaultDial, national);
}

export function phonePlaceholder(countryCode = DEFAULT_COUNTRY_CODE): string {
  const c = getCountryByCode(countryCode);
  if (c.code === "IN") return "98765 43210";
  if (c.code === "US") return "555 123 4567";
  return "Phone number";
}

export { COUNTRIES, DEFAULT_COUNTRY_CODE, DEFAULT_DIAL_CODE };
