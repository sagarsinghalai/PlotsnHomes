// Builds the downloadable Excel listing template (the "complete file" a seller
// fills after approval) and parses a filled one back, validating each value
// against the spec's fields and option sets.
import * as XLSX from "xlsx";
import { TAXONOMY, FIELDS, CATEGORY_FIELD_MAP } from "@/lib/listing-spec.generated";
import { getCategory, SKIP_FIELDS } from "@/lib/listing-spec";

const HEADER = ["Section", "Field", "Key", "Required", "Allowed values / format", "Your value"];

function fieldKeysFor(categoryId?: string): string[] {
  if (categoryId && CATEGORY_FIELD_MAP[categoryId]) {
    return CATEGORY_FIELD_MAP[categoryId].map((e) => e.field);
  }
  return Object.keys(FIELDS);
}

/** Build the .xlsx template as a Buffer. Optionally scoped to one property type. */
export function buildListingTemplate(categoryId?: string): Buffer {
  const leafSlugs = TAXONOMY.filter((c) => c.level === 2).map((c) => c.slug).join(" | ");
  const rows: (string | number)[][] = [HEADER];

  // Property type is always first and drives everything on import.
  rows.push([
    "Basics", "Property type", "asset_category_id", "yes",
    `slug — one of: ${leafSlugs}`,
    categoryId ? getCategory(categoryId)?.slug ?? "" : "",
  ]);

  for (const key of fieldKeysFor(categoryId)) {
    if (key === "asset_category_id" || SKIP_FIELDS.has(key)) continue;
    const f = FIELDS[key];
    if (!f) continue;
    const allowed = f.options.length ? f.options.map((o) => o.value).join(" | ") : f.format || "";
    rows.push(["", f.label, key, f.required, allowed, ""]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{ wch: 14 }, { wch: 28 }, { wch: 24 }, { wch: 10 }, { wch: 60 }, { wch: 26 }];

  const info = XLSX.utils.aoa_to_sheet([
    ["PlotsnHomes — Property listing template"],
    [""],
    ["How to fill this file:"],
    ["1. In the 'Listing' sheet, set the Property type (asset_category_id) to one of the allowed slugs."],
    ["2. Fill the 'Your value' column for each field you want to provide."],
    ["3. For fields that list 'Allowed values', use exactly one of those values."],
    ["4. Required fields should not be left blank."],
    ["5. Send the completed file to the admin, who imports it to create the listing."],
  ]);
  info["!cols"] = [{ wch: 100 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Listing");
  XLSX.utils.book_append_sheet(wb, info, "Instructions");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export type ParsedListing = {
  categoryId: string | null;
  categoryName: string | null;
  values: Record<string, string>;
  warnings: string[];
};

/** Parse a filled template buffer into values, validating keys + option values. */
export function parseListingTemplate(buf: Buffer): ParsedListing {
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets["Listing"] || wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];

  const warnings: string[] = [];
  const values: Record<string, string> = {};
  // Locate columns from the header row.
  const header = (rows[0] || []).map((h) => String(h).trim().toLowerCase());
  const keyCol = header.findIndex((h) => h === "key");
  const valCol = header.findIndex((h) => h.startsWith("your value"));
  const kc = keyCol === -1 ? 2 : keyCol;
  const vc = valCol === -1 ? 5 : valCol;

  for (const r of rows.slice(1)) {
    const key = String(r[kc] ?? "").trim();
    const val = String(r[vc] ?? "").trim();
    if (!key || !val) continue;
    values[key] = val;
  }

  // Resolve the property type.
  let categoryId: string | null = null;
  let categoryName: string | null = null;
  const typeSlug = values["asset_category_id"];
  if (typeSlug) {
    const cat = TAXONOMY.find((c) => c.slug === typeSlug || c.id === typeSlug);
    if (cat) { categoryId = cat.id; categoryName = cat.name; }
    else warnings.push(`Unknown property type "${typeSlug}" — it will be left unmatched.`);
    delete values["asset_category_id"];
  } else {
    warnings.push("No property type (asset_category_id) was provided.");
  }

  // Validate each value against the spec: known key + (for enums) allowed option.
  for (const [key, val] of Object.entries(values)) {
    const f = FIELDS[key];
    if (!f) { warnings.push(`Unknown field "${key}" — ignored.`); delete values[key]; continue; }
    if (f.options.length) {
      const ok = f.options.some((o) => o.value === val || o.label.toLowerCase() === val.toLowerCase());
      if (!ok) warnings.push(`"${f.label}": "${val}" is not an allowed value — kept as-is.`);
    }
  }

  return { categoryId, categoryName, values, warnings };
}
