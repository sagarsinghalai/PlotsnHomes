import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const showings = await prisma.propertyShowing.findMany({
    include: { property: { select: { symbol: true, title: true } } },
  });

  const header = "name,email,phone,property,status,tourDate,tourTime\n";
  const rows = showings.map(
    (s) =>
      `"${s.name}","${s.email}","${s.phone ?? ""}","${s.property.symbol}","${s.status}","${s.tourDate.toISOString().slice(0, 10)}","${s.tourTime}"`
  );

  return new NextResponse(header + rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="site-visits-export.csv"',
    },
  });
}
