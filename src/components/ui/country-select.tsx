"use client";

import { COUNTRIES, DEFAULT_COUNTRY_CODE } from "@/lib/locale-defaults";
import { cn } from "@/lib/utils";

type CountrySelectProps = {
  value: string;
  onChange: (code: string) => void;
  className?: string;
  disabled?: boolean;
};

export function CountrySelect({
  value,
  onChange,
  className,
  disabled,
}: CountrySelectProps) {
  return (
    <select
      value={value || DEFAULT_COUNTRY_CODE}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm",
        className
      )}
    >
      {COUNTRIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.flag} {c.name}
        </option>
      ))}
    </select>
  );
}
