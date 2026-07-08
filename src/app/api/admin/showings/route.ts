import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const showings = await prisma.propertyShowing.findMany({
    orderBy: { tourDate: "desc" },
    take: 200,
    include: {
      property: { select: { title: true, symbol: true, slug: true } },
      lead: { select: { id: true, stage: true } },
    },
  });

  return NextResponse.json({ showings });
}
