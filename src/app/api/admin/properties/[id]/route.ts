import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { hasEditPermissionServer, hasDeletePermissionServer } from "@/lib/permissions";
import { propertyPatchSchema, serializeMediaArrays } from "@/lib/property-admin-schema";
import { prisma } from "@/lib/prisma";
import { tenantScope } from "@/lib/data-access";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const property = await prisma.property.findFirst({
    where: { id: params.id, ...tenantScope(auth.tenantId) },
    include: { agent: { select: { id: true, name: true, email: true } } },
  });
  if (!property) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(property);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const canEdit = await hasEditPermissionServer(auth.session.user, "/admin/properties");
  if (!canEdit) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to edit properties." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const data = propertyPatchSchema.parse(body);

    const existing = await prisma.property.findFirst({
      where: { id: params.id, ...tenantScope(auth.tenantId) },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const price = data.price ?? existing.price;
    const sqft = data.sqft !== undefined ? data.sqft : existing.sqft;

    const property = await prisma.property.update({
      where: { id: params.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.rentMonthly !== undefined && { rentMonthly: data.rentMonthly }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.zip !== undefined && { zip: data.zip }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.bhk !== undefined && { bhk: data.bhk }),
        ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms }),
        ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms }),
        ...(data.sqft !== undefined && { sqft: data.sqft }),
        ...(data.images !== undefined && { images: JSON.stringify(data.images) }),
        ...(data.agentId !== undefined && { agentId: data.agentId }),
        ...(data.yieldRate !== undefined && { yieldRate: data.yieldRate }),
        ...(data.capRate !== undefined && { capRate: data.capRate }),
        ...(data.interestRate !== undefined && { interestRate: data.interestRate }),
        ...(data.brokerageRate !== undefined && { brokerageRate: data.brokerageRate }),
        ...(data.change24h !== undefined && { change24h: data.change24h }),
        ...(data.change7d !== undefined && { change7d: data.change7d }),
        ...(data.changeYtd !== undefined && { changeYtd: data.changeYtd }),
        ...(data.marketRating !== undefined && { marketRating: data.marketRating }),
        ...(data.volumeScore !== undefined && { volumeScore: data.volumeScore }),
        ...(data.featured !== undefined && { featured: data.featured }),
        ...(data.yearBuilt !== undefined && { yearBuilt: data.yearBuilt }),
        ...(data.listingType !== undefined && { listingType: data.listingType }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.area !== undefined && { area: data.area }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.rooms !== undefined && { rooms: data.rooms }),
        ...(data.garages !== undefined && { garages: data.garages }),
        ...(data.lotSize !== undefined && { lotSize: data.lotSize }),
        ...(data.totalFloors !== undefined && { totalFloors: data.totalFloors }),
        ...(data.floorNumber !== undefined && { floorNumber: data.floorNumber }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.virtualTourUrl !== undefined && { virtualTourUrl: data.virtualTourUrl }),
        ...(data.mapLat !== undefined && { mapLat: data.mapLat }),
        ...(data.mapLng !== undefined && { mapLng: data.mapLng }),
        ...(data.customFields !== undefined && { customFields: data.customFields }),
        ...(data.developerId !== undefined && { developerId: data.developerId }),
        ...(data.projectId !== undefined && { projectId: data.projectId }),
        ...(data.basePriceRate !== undefined && { basePriceRate: data.basePriceRate }),
        ...(data.softLaunchRate !== undefined && { softLaunchRate: data.softLaunchRate }),
        ...(data.preLaunchRate !== undefined && { preLaunchRate: data.preLaunchRate }),
        ...(data.launchRate !== undefined && { launchRate: data.launchRate }),
        ...serializeMediaArrays({
          videos: data.videos,
          pdfs: data.pdfs,
          features: data.features,
        }),
        pricePerSqft: sqft && sqft > 0 ? price / sqft : existing.pricePerSqft,
      },
    });

    if (data.price !== undefined && data.price !== existing.price) {
      const { logPropertyPriceChange } = await import("@/lib/price-history");
      await logPropertyPriceChange({
        propertyId: params.id,
        price: data.price,
        ratePerSqft: sqft && sqft > 0 ? data.price / sqft : null,
        stage: "Current Price",
        changedByUserId: auth.session.user.id,
        changedByName: auth.session.user.name || "Admin",
        notes: "Price updated via Admin panel",
      });
    }

    return NextResponse.json({ ok: true, property });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const canDelete = await hasDeletePermissionServer(auth.session.user, "/admin/properties");
  if (!canDelete) {
    return NextResponse.json(
      { error: "Forbidden: You do not have permission to delete properties." },
      { status: 403 }
    );
  }

  const existing = await prisma.property.findFirst({
    where: { id: params.id, ...tenantScope(auth.tenantId) },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.favorite.deleteMany({ where: { propertyId: params.id } });
      await tx.inquiry.deleteMany({ where: { propertyId: params.id } });
      await tx.transaction.deleteMany({ where: { propertyId: params.id } });
      await tx.property.delete({ where: { id: params.id } });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
