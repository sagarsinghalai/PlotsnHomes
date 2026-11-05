import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { getPlatformRates } from "@/lib/system-settings";
import { prisma } from "@/lib/prisma";
import { getPrimaryTenantId } from "@/lib/tenant";
import { MEDIA_LIMITS } from "@/lib/media-limits";
import { staffRolesFilter } from "@/lib/roles";
import { slugify } from "@/lib/utils";
import { ensureListingCategory } from "@/lib/listing-taxonomy-seed";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  rentMonthly: z.number().positive().nullable().optional(),
  city: z.string(),
  state: z.string(),
  address: z.string(),
  zip: z.string(),
  category: z.string().optional(),
  listingType: z.enum(["SALE", "RENT"]).default("SALE"),
  bedrooms: z.number().int().min(0).default(0),
  bathrooms: z.number().min(0).default(0),
  sqft: z.number().int().nullable().optional(),
  videoUrl: z.string().nullable().optional(),
  virtualTourUrl: z.string().nullable().optional(),
  images: z.array(z.string()).max(MEDIA_LIMITS.images).default([]),
  videos: z.array(z.string()).max(MEDIA_LIMITS.videos).default([]),
  pdfs: z.array(z.object({ name: z.string(), url: z.string() })).max(MEDIA_LIMITS.pdfs).default([]),
  hasServantRoom: z.boolean().default(false),
  hasPujaRoom: z.boolean().default(false),
  hasStudyRoom: z.boolean().default(false),
  balconies: z.number().int().min(0).default(0),
  liftType: z.string().nullable().optional(),
  flatsPerFloor: z.number().int().nullable().optional(),
  availabilityStatus: z.string().default("Available"),
  // Dynamic/simple seller form extras
  categorySlug: z.string().nullable().optional(),
  garages: z.number().int().min(0).optional(),
  furnishingStatus: z.string().nullable().optional(),
  attributes: z.any().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = schema.parse(await req.json());
    const rates = await getPlatformRates();
    const symbol = `BV-${(data.state || "NA").toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const slug = slugify(`${symbol}-${data.title}`);

    // Match the chosen property type to a DB PropertyCategory (seeds it if missing),
    // so every selection resolves to a real category record.
    let categoryName = data.category;
    const specCategoryId = (data.attributes as any)?.asset_category_id as string | undefined;
    if (specCategoryId) {
      const matched = await ensureListingCategory(specCategoryId);
      if (matched) categoryName = matched;
    }

    const agent = await prisma.user.findFirst({
      where: { role: staffRolesFilter(), active: true },
    });
    if (!agent) {
      return NextResponse.json({ error: "No agent available" }, { status: 400 });
    }

    const property = await prisma.property.create({
      data: {
        tenantId: session.user.tenantId ?? (await getPrimaryTenantId()),
        symbol,
        title: data.title,
        slug,
        description: data.description,
        price: data.price,
        rentMonthly: data.listingType === "RENT" ? data.rentMonthly ?? null : null,
        city: data.city,
        state: data.state,
        address: data.address,
        zip: data.zip,
        category: categoryName,
        listingType: data.listingType,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.sqft ?? null,
        images: JSON.stringify(data.images),
        videos: JSON.stringify(data.videos),
        pdfs: JSON.stringify(data.pdfs),
        videoUrl: data.videoUrl,
        virtualTourUrl: data.virtualTourUrl,
        hasServantRoom: data.hasServantRoom,
        hasPujaRoom: data.hasPujaRoom,
        hasStudyRoom: data.hasStudyRoom,
        balconies: data.balconies,
        garages: data.garages ?? 0,
        furnishingStatus: data.furnishingStatus ?? null,
        liftType: data.liftType,
        flatsPerFloor: data.flatsPerFloor,
        availabilityStatus: data.availabilityStatus,
        attributesJson: JSON.stringify(data.attributes ?? {}),
        status: "PENDING",
        agentId: agent.id,
        submittedById: session.user.id,
        yieldRate: rates.defaultYieldRate,
        capRate: rates.defaultCapRate,
        interestRate: rates.defaultInterestRate,
        pricePerSqft: data.sqft ? data.price / data.sqft : null,
      },
    });

    return NextResponse.json({ ok: true, property });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Submit failed" }, { status: 500 });
  }
}
