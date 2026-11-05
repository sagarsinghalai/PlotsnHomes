import { NextResponse } from "next/server";
import { requireCrmApi } from "@/lib/crm-access";
import { prisma } from "@/lib/prisma";
import { getPlatformRates } from "@/lib/system-settings";
import { getPrimaryTenantId } from "@/lib/tenant";
import { staffRolesFilter } from "@/lib/roles";
import { slugify } from "@/lib/utils";
import { parseListingTemplate } from "@/lib/listing-template";
import { ensureListingCategory } from "@/lib/listing-taxonomy-seed";

export const dynamic = "force-dynamic";

const num = (v: any): number | null => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const int = (v: any): number | null => {
  const n = num(v);
  return n == null ? null : Math.trunc(n);
};

// Admin uploads a filled listing template (.xlsx) → validate against the spec →
// create a PENDING listing with the full attribute set.
export async function POST(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof (file as any).arrayBuffer !== "function") {
      return NextResponse.json({ error: "Upload an .xlsx file." }, { status: 400 });
    }
    const buf = Buffer.from(await (file as File).arrayBuffer());
    const parsed = parseListingTemplate(buf);
    const v = parsed.values;

    let categoryName = parsed.categoryName;
    if (parsed.categoryId) {
      const matched = await ensureListingCategory(parsed.categoryId);
      if (matched) categoryName = matched;
    }

    const title = (v.listing_title || categoryName || "Imported listing").trim();
    if (title.length < 3) {
      return NextResponse.json({ error: "listing_title is required (min 3 chars).", warnings: parsed.warnings }, { status: 400 });
    }
    const description = (v.description || `${categoryName || "Property"} imported from template.`).trim();
    const intent = (v.listing_intent || "sale").toLowerCase();
    const isRent = ["rent", "lease", "lease_out"].includes(intent);
    const price = num(v.asking_price) ?? num(v.monthly_rent) ?? 0;

    const rates = await getPlatformRates();
    const state = (v.state_code || "").toString();
    const symbol = `BV-${(state || "NA").toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const slug = slugify(`${symbol}-${title}`);

    const agent = await prisma.user.findFirst({ where: { role: staffRolesFilter(), active: true } });
    if (!agent) return NextResponse.json({ error: "No agent available to assign." }, { status: 400 });

    const tenantId = (auth as any).tenantId ?? (await getPrimaryTenantId());
    const submittedById = (auth as any).userId ?? agent.id;

    const property = await prisma.property.create({
      data: {
        tenantId,
        symbol,
        title,
        slug,
        description,
        price,
        rentMonthly: isRent ? price : null,
        city: (v.city_id || "").toString(),
        state,
        address: (v.address_line || v.locality || "").toString(),
        zip: (v.postal_code || "").toString(),
        category: categoryName,
        listingType: isRent ? "RENT" : "SALE",
        bedrooms: int(v.bedrooms) ?? 0,
        bathrooms: num(v.bathrooms) ?? 0,
        sqft: int(v.area_value),
        images: "[]",
        videos: "[]",
        pdfs: "[]",
        furnishingStatus: v.furnishing_status || null,
        balconies: int(v.balconies) ?? 0,
        garages: int(v.parking_count) ?? 0,
        totalFloors: int(v.total_floors),
        floorNumber: int(v.floor_number),
        yearBuilt: int(v.year_built),
        availabilityStatus: v.possession_status
          ? String(v.possession_status).replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())
          : "Available",
        attributesJson: JSON.stringify(parsed.values),
        status: "PENDING",
        agentId: agent.id,
        submittedById,
        yieldRate: rates.defaultYieldRate,
        capRate: rates.defaultCapRate,
        interestRate: rates.defaultInterestRate,
        pricePerSqft: int(v.area_value) ? price / (int(v.area_value) as number) : null,
      },
    });

    return NextResponse.json({
      ok: true,
      propertyId: property.id,
      title: property.title,
      category: property.category,
      fieldsImported: Object.keys(parsed.values).length,
      warnings: parsed.warnings,
    });
  } catch (e) {
    console.error("[listing-import] error:", e);
    return NextResponse.json({ error: "Failed to import listing. Check the file format." }, { status: 500 });
  }
}
