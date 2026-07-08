import { NextResponse } from "next/server";
import {
  buildPropertyOrderBy,
  buildPropertyWhere,
  parsePropertySearch,
} from "@/lib/property-search";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    raw[k] = v;
  });

  const filters = parsePropertySearch(raw);
  const where = buildPropertyWhere(filters);
  const orderBy = buildPropertyOrderBy(filters.sort);

  const [total, properties, priceRange, cities] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      orderBy,
      skip: filters.skip,
      take: filters.perPage,
      include: { agent: { select: { name: true } } },
    }),
    prisma.property.aggregate({
      where: { status: "ACTIVE" },
      _min: { price: true },
      _max: { price: true },
    }),
    prisma.property.findMany({
      where: { status: "ACTIVE" },
      select: { city: true, state: true },
      distinct: ["city", "state"],
      take: 40,
    }),
  ]);

  return NextResponse.json({
    properties,
    total,
    page: filters.page,
    perPage: filters.perPage,
    totalPages: Math.ceil(total / filters.perPage),
    priceMin: priceRange._min.price ?? 0,
    priceMax: priceRange._max.price ?? 0,
    cities: cities.map((c) => ({ city: c.city, state: c.state })),
  });
}
