"use client";

import { useState, useEffect } from "react";
import { State, City } from "country-state-city";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { SearchableSelect } from "@/components/ui/searchable-select";

type GlobalStateSelectProps = {
  countryCode: string;
  value: string;
  onChange: (stateCode: string, stateName: string) => void;
  className?: string;
};

export function GlobalStateSelect({
  countryCode,
  value,
  onChange,
  className,
}: GlobalStateSelectProps) {
  const states = State.getStatesOfCountry(countryCode);

  if (!states || states.length === 0) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange("", e.target.value)}
        placeholder="Enter State / Region"
        className={className}
      />
    );
  }

  const options = states.map((s) => ({
    value: s.isoCode,
    label: s.name,
    sublabel: s.isoCode,
  }));

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={(val) => {
        const selected = states.find((s) => s.isoCode === val);
        onChange(val, selected?.name ?? val);
      }}
      className={className}
      placeholder="Select State / Region..."
      searchPlaceholder="Search state or region..."
    />
  );
}

type GlobalCitySelectProps = {
  countryCode: string;
  stateCode: string;
  value: string;
  onChange: (city: string) => void;
  className?: string;
};

export function GlobalCitySelect({
  countryCode,
  stateCode,
  value,
  onChange,
  className,
}: GlobalCitySelectProps) {
  const cities = stateCode
    ? City.getCitiesOfState(countryCode, stateCode)
    : City.getCitiesOfCountry(countryCode) ?? [];

  if (!cities || cities.length === 0) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter City"
        className={className}
      />
    );
  }

  const options = cities.map((c) => ({
    value: c.name,
    label: c.name,
  }));

  return (
    <SearchableSelect
      options={options}
      value={value}
      onChange={onChange}
      className={className}
      placeholder="Select City..."
      searchPlaceholder="Search city name..."
    />
  );
}

type GlobalZipSelectProps = {
  countryCode: string;
  city: string;
  value: string;
  onChange: (zip: string) => void;
  className?: string;
  placeholder?: string;
};

export function GlobalZipSelect({
  countryCode,
  city,
  value,
  onChange,
  className,
  placeholder = "ZIP / Postal Code",
}: GlobalZipSelectProps) {
  const [pins, setPins] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countryCode === "IN" && city.trim().length > 2) {
      setLoading(true);
      fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(city)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data[0] && data[0].Status === "Success") {
            const allPins: string[] = data[0].PostOffice.map((po: any) => po.Pincode);
            const uniquePins = Array.from(new Set(allPins)).filter(Boolean).sort();
            setPins(uniquePins);
            if (uniquePins.length === 1 && !uniquePins.includes(value)) {
              onChange(uniquePins[0]);
            }
          } else {
            setPins([]);
          }
        })
        .catch(() => setPins([]))
        .finally(() => setLoading(false));
    } else {
      setPins([]);
    }
  }, [countryCode, city]);

  if (loading) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Fetching PIN codes..."
        className={className}
      />
    );
  }

  if (pins.length > 0) {
    const options = pins.map((p) => ({ value: p, label: p }));
    return (
      <SearchableSelect
        options={options}
        value={value}
        onChange={onChange}
        className={className}
        placeholder={placeholder}
        searchPlaceholder="Search postal code..."
      />
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

export function validatePostalCode(zip: string | null | undefined, countryCode: string | null | undefined): string | null {
  if (!zip || !zip.trim()) return null;
  const cleanZip = zip.trim();
  const cCode = (countryCode || "IN").toUpperCase();

  if (cCode === "IN") {
    if (!/^\d{6}$/.test(cleanZip)) {
      return "Indian PIN Code must be exactly 6 digits.";
    }
  } else if (cCode === "US") {
    if (!/^\d{5}(-\d{4})?$/.test(cleanZip)) {
      return "US ZIP Code must be 5 digits (e.g. 90210) or 5+4 format.";
    }
  } else if (cCode === "UK" || cCode === "GB") {
    if (!/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(cleanZip)) {
      return "Invalid UK Postcode format.";
    }
  } else if (cCode === "CA") {
    if (!/^[A-Z]\d[A-Z]\s*\d[A-Z]\d$/i.test(cleanZip)) {
      return "Invalid Canadian Postal Code format (e.g. K1A 0B1).";
    }
  }
  return null;
}
