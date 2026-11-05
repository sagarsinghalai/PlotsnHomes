// Resolution helpers over the auto-generated listing spec. Turns the taxonomy +
// category→field map into render-ready field lists for the dynamic seller form.
import {
  TAXONOMY,
  FIELDS,
  CATEGORY_FIELD_MAP,
  type SpecCategory,
  type SpecField,
} from "@/lib/listing-spec.generated";

export type { SpecCategory, SpecField };

// Fields the dynamic form handles specially (selected via boxes), not as plain inputs.
export const BOX_FIELDS = new Set(["listing_intent", "bedrooms", "furnishing_status", "possession_status"]);

// Fields we don't render in the prototype (handled elsewhere, system-controlled, or out of scope).
export const SKIP_FIELDS = new Set([
  "asset_category_id", // chosen via the property-type boxes
  "property_subtype", // implied by the chosen subtype
  "currency_code", // defaulted to INR
  "latitude",
  "longitude",
  "listing_status",
  "identity_verification_status",
]);

// BHK choices for the bedrooms box control (value stored is the integer bedroom count).
export const BHK_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "1 RK" },
  { value: 1, label: "1 BHK" },
  { value: 2, label: "2 BHK" },
  { value: 3, label: "3 BHK" },
  { value: 4, label: "4 BHK" },
  { value: 5, label: "5+ BHK" },
];

export function getAssetClasses(): SpecCategory[] {
  return TAXONOMY.filter((c) => c.level === 1);
}

export function getSubtypes(assetClassId: string): SpecCategory[] {
  return TAXONOMY.filter((c) => c.parent === assetClassId);
}

// ---- Seller-facing (simple form) curation ------------------------------------
// External sellers see a limited, common set of types across the 3 main asset
// classes. The admin's full form (Phase 2) still exposes the entire taxonomy.
export const SELLER_ASSET_CLASSES = ["RES", "LAND", "COMM"];
export const SELLER_CATEGORY_IDS = new Set([
  // Residential
  "RES_APT", "RES_PENT", "RES_STUDIO", "RES_BUILDER", "RES_HOUSE", "RES_VILLA", "RES_ROW", "RES_FARMHOUSE",
  // Land & plots
  "LAND_RES", "LAND_COMM", "LAND_AGRI", "LAND_FARM",
  // Commercial
  "COMM_OFFICE", "COMM_RETAIL", "COMM_SCO", "COMM_BUILDING",
]);

export function getSellerSubtypes(assetClassId: string): SpecCategory[] {
  return getSubtypes(assetClassId).filter((c) => SELLER_CATEGORY_IDS.has(c.id));
}

export type CategoryKind = "RESIDENTIAL" | "LAND" | "COMMERCIAL";

/** Broad kind for a category id, used to decide which simple-form fields apply. */
export function kindOf(categoryId: string): CategoryKind {
  if (categoryId.startsWith("LAND") || /AGRI|FARM/.test(categoryId)) return "LAND";
  if (categoryId.startsWith("COMM") || categoryId.startsWith("IND")) return "COMMERCIAL";
  return "RESIDENTIAL";
}

export function getCategory(id: string): SpecCategory | undefined {
  return TAXONOMY.find((c) => c.id === id);
}

export type ResolvedField = {
  field: SpecField;
  section: string;
  required: boolean;
  order: number;
};

/** Ordered, render-ready fields for a category (skips system/handled fields). */
export function resolveCategoryFields(categoryId: string): ResolvedField[] {
  const entries = CATEGORY_FIELD_MAP[categoryId] || [];
  const out: ResolvedField[] = [];
  for (const e of entries) {
    if (SKIP_FIELDS.has(e.field)) continue;
    const field = FIELDS[e.field];
    if (!field) continue;
    const required =
      e.requiredOverride === "yes" ? true : e.requiredOverride === "no" ? false : field.required === "yes";
    out.push({ field, section: e.section || "Details", required, order: e.order });
  }
  return out.sort((a, b) => a.order - b.order);
}

// Preferred display order of sections (anything else sorts after, alphabetically).
const SECTION_ORDER = ["Basics", "Details"];

/** Group resolved fields by section, with Basics first, then Details, then the rest. */
export function groupBySection(fields: ResolvedField[]): { section: string; fields: ResolvedField[] }[] {
  const bySection: Record<string, ResolvedField[]> = {};
  for (const f of fields) (bySection[f.section] ||= []).push(f);
  const rank = (s: string) => {
    const i = SECTION_ORDER.indexOf(s);
    return i === -1 ? SECTION_ORDER.length : i;
  };
  return Object.keys(bySection)
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((section) => ({ section, fields: bySection[section].sort((a, b) => a.order - b.order) }));
}
