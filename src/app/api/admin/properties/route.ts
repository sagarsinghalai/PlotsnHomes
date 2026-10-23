import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { hasAddPermissionServer } from "@/lib/permissions";
import { propertyCreateSchema, serializeMediaArrays } from "@/lib/property-admin-schema";
import { getPlatformRates } from "@/lib/system-settings";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { tenantScope, noTenantResponse } from "@/lib/data-access";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const canAdd = await hasAddPermissionServer(auth.session.user, "/admin/properties");
  if (!canAdd) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to add properties." },
      { status: 403 }
    );
  }

  if (!auth.tenantId) return noTenantResponse();

  try {
    const body = await req.json();
    const data = propertyCreateSchema.parse(body);
    const rates = await getPlatformRates();

    const agentId =
      data.agentId ??
      (
        await prisma.user.findFirst({
          where: {
            role: { in: ["SUPERADMIN", "EMPLOYEE", "AGENT"] },
            active: true,
            ...tenantScope(auth.tenantId),
          },
          orderBy: { createdAt: "asc" },
        })
      )?.id;

    if (!agentId) {
      return NextResponse.json({ error: "No agent available" }, { status: 400 });
    }

    const slug = slugify(`${data.symbol}-${data.title}`);
    const existing = await prisma.property.findFirst({
      where: {
        ...tenantScope(auth.tenantId),
        OR: [{ slug }, { symbol: data.symbol.toUpperCase() }],
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Symbol or slug already exists" },
        { status: 400 }
      );
    }

    const property = await prisma.property.create({
      data: {
        tenantId: auth.tenantId,
        symbol: data.symbol.toUpperCase(),
        title: data.title,
        slug,
        description: data.description,
        price: data.price,
        rentMonthly: data.rentMonthly ?? null,
        city: data.city,
        state: data.state,
        address: data.address,
        zip: data.zip,
        type: data.type,
        status: data.status,
        bhk: data.bhk ?? null,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        sqft: data.sqft ?? null,
        images: JSON.stringify(data.images),
        agentId,
        yieldRate: data.yieldRate ?? rates.defaultYieldRate,
        capRate: data.capRate ?? rates.defaultCapRate,
        interestRate: data.interestRate ?? rates.defaultInterestRate,
        brokerageRate: data.brokerageRate ?? 3.0,
        featured: data.featured ?? false,
        pricePerSqft: data.sqft ? data.price / data.sqft : null,
        listingType: data.listingType ?? "SALE",
        category: data.category ?? null,
        area: data.area ?? null,
        country: data.country ?? "IN",
        rooms: data.rooms ?? null,
        garages: data.garages ?? 0,
        lotSize: data.lotSize ?? null,
        totalFloors: data.totalFloors ?? null,
        floorNumber: data.floorNumber ?? null,
        videoUrl: data.videoUrl ?? null,
        virtualTourUrl: data.virtualTourUrl ?? null,
        mapLat: data.mapLat ?? null,
        mapLng: data.mapLng ?? null,
        customFields: data.customFields ?? "[]",
        developerId: data.developerId ?? null,
        projectId: data.projectId ?? null,
        ...serializeMediaArrays({
          videos: data.videos ?? [],
          pdfs: data.pdfs ?? [],
          features: data.features ?? [],
        }),
      },
    });

    return NextResponse.json({ ok: true, property });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
