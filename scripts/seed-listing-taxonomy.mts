// Bulk-seed the spec taxonomy's leaf property types into PropertyCategory.
// Run: DATABASE_URL="file:./dev.db" npx tsx scripts/seed-listing-taxonomy.mts
// Idempotent — safe to re-run; never overwrites an existing row.
import { PrismaClient } from "@prisma/client";
import { TAXONOMY } from "../src/lib/listing-spec.generated";

const prisma = new PrismaClient();

function iconFor(id: string): string {
  if (id.startsWith("LAND") || /AGRI|FARM/.test(id)) return "land-plot";
  if (id.startsWith("COMM") || id.startsWith("IND")) return "store";
  return "home";
}

let seeded = 0;
for (const c of TAXONOMY.filter((x) => x.level === 2)) {
  try {
    await prisma.propertyCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        name: c.name,
        slug: c.slug,
        icon: iconFor(c.id),
        description: `${c.name} — ${c.assetClass}`,
        subcategories: JSON.stringify([]),
        tags: JSON.stringify([`spec:${c.id}`, `asset:${c.assetClass}`]),
      },
    });
    seeded++;
  } catch (e) {
    console.warn("skip", c.slug, String((e as Error)?.message || "").slice(0, 70));
  }
}
console.log(JSON.stringify({ seeded, totalLeaves: TAXONOMY.filter((x) => x.level === 2).length }));
await prisma.$disconnect();
