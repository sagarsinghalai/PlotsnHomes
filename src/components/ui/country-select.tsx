"use client";

import { COUNTRIES, DEFAULT_COUNTRY_CODE } from "@/lib/locale-defaults";
import { SearchableSelect } from "@/components/ui/searchable-select";

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
  const options = COUNTRIES.map((c) => ({
    value: c.code,
    label: `${c.flag} ${c.name}`,
    sublabel: c.code,
  }));

  return (
    <SearchableSelect
      options={options}
      value={value || DEFAULT_COUNTRY_CODE}
      onChange={onChange}
      disabled={disabled}
      className={className}
      placeholder="Select country..."
      searchPlaceholder="Search country name or code..."
    />
  );
}
