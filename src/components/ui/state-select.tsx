"use client";

import { cn } from "@/lib/utils";
import { Input } from "./input";
import { SearchableSelect } from "@/components/ui/searchable-select";

export const INDIA_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Lakshadweep", "Puducherry"
];

type StateSelectProps = {
  value: string;
  onChange: (val: string) => void;
  country: string | null;
  className?: string;
};

export function StateSelect({ value, onChange, country, className }: StateSelectProps) {
  if (country === "IN") {
    const options = [
      { value: "", label: "Select State" },
      ...INDIA_STATES.map((state) => ({ value: state, label: state })),
    ];

    return (
      <SearchableSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder="Select State..."
        searchPlaceholder="Search Indian states..."
        className={className}
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      placeholder="Enter State"
    />
  );
}
