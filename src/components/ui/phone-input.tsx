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
import { SearchableSelect } from "@/components/ui/searchable-select";

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
    const cleaned = next.replace(/\D/g, "").slice(0, 10);
    setNational(cleaned);
    onChange(formatPhoneE164(country.dial, cleaned));
  }

  const countryOptions = COUNTRIES.map((c) => ({
    value: c.code,
    label: `${c.flag} ${c.dial}`,
    sublabel: `${c.name} (${c.code})`,
  }));

  return (
    <div className={cn("flex gap-2 items-center", className)}>
      <div className="w-[110px] shrink-0">
        <SearchableSelect
          options={countryOptions}
          value={countryCode}
          onChange={updateCountry}
          disabled={disabled}
          placeholder="Code"
          searchPlaceholder="Search country..."
        />
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        disabled={disabled}
        value={national}
        onChange={(e) => updateNational(e.target.value)}
        placeholder={phonePlaceholder(countryCode)}
        className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm"
      />
    </div>
  );
}
