// Seeds the spec taxonomy's property types into the PropertyCategory table so
// every property-type selection maps to a real DB record. Idempotent (upsert by
// slug); never clobbers admin customizations on an existing row.
import { prisma } from "@/lib/prisma";
import { TAXONOMY } from "@/lib/listing-spec.generated";
import { getCategory, kindOf } from "@/lib/listing-spec";

function iconFor(categoryId: string): string {
  const k = kindOf(categoryId);
  return k === "LAND" ? "land-plot" : k === "COMMERCIAL" ? "store" : "home";
}

/**
 * Ensure a single taxonomy category exists in PropertyCategory.
 * Returns the stored category name to persist on the Property (the "match").
 */
export async function ensureListingCategory(categoryId: string): Promise<string | null> {
  const cat = getCategory(categoryId);
  if (!cat) return null;
  try {
    const rec = await (prisma as any).propertyCategory.upsert({
      where: { slug: cat.slug },
      update: {}, // keep whatever the admin has (icon/tags/subcategories)
      create: {
        name: cat.name,
        slug: cat.slug,
        icon: iconFor(categoryId),
        description: `${cat.name} — ${cat.assetClass}`,
        subcategories: JSON.stringify([]),
        tags: JSON.stringify([`spec:${cat.id}`, `asset:${cat.assetClass}`]),
      },
    });
    return rec?.name ?? cat.name;
  } catch {
    // e.g. a name-unique collision with a pre-existing default category — the
    // selection is still "matched" by name.
    return cat.name;
  }
}

/** Bulk-upsert every leaf (selectable) property type. Safe to re-run. */
export async function seedAllListingCategories(): Promise<{ seeded: number }> {
  const leaves = TAXONOMY.filter((c) => c.level === 2);
  let seeded = 0;
  for (const c of leaves) {
    const name = await ensureListingCategory(c.id);
    if (name) seeded++;
  }
  return { seeded };
}
