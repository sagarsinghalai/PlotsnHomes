/** Property listing categories (type: residential, land, etc.) */
export const PROPERTY_CATEGORIES = [
  "Apartment",
  "Villa",
  "Penthouse",
  "Townhouse",
  "Duplex",
  "Full Floor",
  "Land",
  "Plot",
  "Commercial",
] as const;

export type PropertyCategory = (typeof PROPERTY_CATEGORIES)[number];
