"use client";

import { useEffect, useId, useState } from "react";
import {
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  getCountryByCode,
} from "@/lib/locale-defaults";
import {
  formatPhoneE164,
  parseStoredPhone,
  phonePlaceholder,
} from "@/lib/phone-utils";
import { cn } from "@/lib/utils";

type PhoneInputProps = {
  value: string;
  onChange: (e164: string) => void;
  defaultCountry?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
};

export function PhoneInput({
  value,
  onChange,
  defaultCountry = DEFAULT_COUNTRY_CODE,
  className,
  disabled,
  id: externalId,
}: PhoneInputProps) {
  const autoId = useId();
  const id = externalId ?? autoId;
  const [countryCode, setCountryCode] = useState(defaultCountry);
  const [national, setNational] = useState("");

  useEffect(() => {
    const parsed = parseStoredPhone(value, defaultCountry);
    setCountryCode(parsed.countryCode);
    setNational(parsed.national);
  }, [value, defaultCountry]);

  const country = getCountryByCode(countryCode);

  function updateCountry(code: string) {
    const c = getCountryByCode(code);
    setCountryCode(code);
    onChange(formatPhoneE164(c.dial, national));
  }

  function updateNational(next: string) {
    const cleaned = next.replace(/[^\d\s-]/g, "");
    setNational(cleaned);
    onChange(formatPhoneE164(country.dial, cleaned));
  }

  return (
    <div className={cn("flex gap-2", className)}>
      <select
        aria-label="Country code"
        value={countryCode}
        disabled={disabled}
        onChange={(e) => updateCountry(e.target.value)}
        className="w-[130px] shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-sm font-medium"
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        disabled={disabled}
        value={national}
        onChange={(e) => updateNational(e.target.value)}
        placeholder={phonePlaceholder(countryCode)}
        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
      />
    </div>
  );
}
