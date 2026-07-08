import { Prisma, PropertyStatus, PropertyType } from "@prisma/client";

export type PropertySearchParams = {
  q?: string;
  city?: string;
  state?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  minBeds?: string;
  maxBeds?: string;
  minBaths?: string;
  minYield?: string;
  maxYield?: string;
  sort?: string;
  page?: string;
  perPage?: string;
  listingType?: string;
  category?: string;
  area?: string;
  minSqft?: string;
  maxSqft?: string;
  minRooms?: string;
  featured?: string;
  fChairAccessible?: string;
  fElevator?: string;
  fPool?: string;
  fVentilation?: string;
  fWasherDryer?: string;
  fWater?: string;
  fWifi?: string;
  // New filter params
  furnishing?: string;
  servantRoom?: string;
  pujaRoom?: string;
  studyRoom?: string;
  minBalconies?: string;
  liftType?: string;
  flatsPerFloor?: string;
  availabilityStatus?: string;
  bhk?: string;
};

export const PER_PAGE_DEFAULT = 12;

export function parsePropertySearch(params: PropertySearchParams) {
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const perPage = Math.min(
    48,
    Math.max(
      6,
      parseInt(params.perPage ?? String(PER_PAGE_DEFAULT), 10) ||
        PER_PAGE_DEFAULT,
    ),
  );

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    q: params.q?.trim() || undefined,
    city: params.city?.trim() || undefined,
    state: params.state?.trim() || undefined,
    type: params.type as PropertyType | undefined,
    minPrice: params.minPrice ? parseFloat(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseFloat(params.maxPrice) : undefined,
    minBeds: params.minBeds ? parseInt(params.minBeds, 10) : undefined,
    maxBeds: params.maxBeds ? parseInt(params.maxBeds, 10) : undefined,
    minBaths: params.minBaths ? parseFloat(params.minBaths) : undefined,
    minYield: params.minYield ? parseFloat(params.minYield) : undefined,
    maxYield: params.maxYield ? parseFloat(params.maxYield) : undefined,
    sort: params.sort ?? "featured",
    featuredOnly: params.featured === "1",
    listingType: params.listingType as "SALE" | "RENT" | undefined,
    category: params.category?.trim() || undefined,
    area: params.area?.trim() || undefined,
    minSqft: params.minSqft ? parseInt(params.minSqft, 10) : undefined,
    maxSqft: params.maxSqft ? parseInt(params.maxSqft, 10) : undefined,
    minRooms: params.minRooms ? parseInt(params.minRooms, 10) : undefined,
    requiredFeatures: [
      params.fChairAccessible === "1" ? "Chair Accessible" : null,
      params.fElevator === "1" ? "Elevator" : null,
      params.fPool === "1" ? "Pool" : null,
      params.fVentilation === "1" ? "Ventilation" : null,
      params.fWasherDryer === "1" ? "Washer and dryer" : null,
      params.fWater === "1" ? "Water" : null,
      params.fWifi === "1" ? "WiFi" : null,
    ].filter(Boolean) as string[],
    // New filters
    furnishing: params.furnishing?.trim() || undefined,
    servantRoom: params.servantRoom === "1",
    pujaRoom: params.pujaRoom === "1",
    studyRoom: params.studyRoom === "1",
    minBalconies: params.minBalconies
      ? parseInt(params.minBalconies, 10)
      : undefined,
    liftType: params.liftType?.trim() || undefined,
    flatsPerFloor: params.flatsPerFloor
      ? parseInt(params.flatsPerFloor, 10)
      : undefined,
    availabilityStatus: params.availabilityStatus?.trim() || undefined,
    bhk: params.bhk?.trim() || undefined,
  };
}

export function buildPropertyWhere(
  filters: ReturnType<typeof parsePropertySearch>,
): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {
    status: PropertyStatus.ACTIVE,
  };

  if (filters.featuredOnly) where.featured = true;

  if (filters.q) {
    const isSymbolSearch =
      /^bv-/i.test(filters.q) || /^[a-z]{2}-\d{4}$/i.test(filters.q);
    if (isSymbolSearch) {
      where.symbol = { contains: filters.q.toUpperCase() };
      return where;
    }

    where.OR = [
      { title: { contains: filters.q } },
      { city: { contains: filters.q } },
      { state: { contains: filters.q } },
      { symbol: { contains: filters.q.toUpperCase() } },
      { address: { contains: filters.q } },
      { bhk: { contains: filters.q } },
    ];
  }

  if (filters.city) where.city = { contains: filters.city };
  if (filters.state) where.state = { equals: filters.state };
  if (filters.type) where.type = filters.type;
  if (filters.listingType) where.listingType = filters.listingType;
  if (filters.category) where.category = { contains: filters.category };
  if (filters.area) where.area = { contains: filters.area };

  if (filters.minSqft != null || filters.maxSqft != null) {
    where.sqft = {};
    if (filters.minSqft != null) where.sqft.gte = filters.minSqft;
    if (filters.maxSqft != null) where.sqft.lte = filters.maxSqft;
  }

  if (filters.minRooms != null) {
    where.rooms = { gte: filters.minRooms };
  }

  if (filters.requiredFeatures.length > 0) {
    const featureClauses = filters.requiredFeatures.map((f) => ({
      features: { contains: f },
    }));
    const existingAnd = Array.isArray(where.AND)
      ? where.AND
      : where.AND
        ? [where.AND]
        : [];
    where.AND = [...existingAnd, ...featureClauses];
  }

  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {};
    if (filters.minPrice != null) where.price.gte = filters.minPrice;
    if (filters.maxPrice != null) where.price.lte = filters.maxPrice;
  }

  if (filters.minBeds != null || filters.maxBeds != null) {
    where.bedrooms = {};
    if (filters.minBeds != null) where.bedrooms.gte = filters.minBeds;
    if (filters.maxBeds != null) where.bedrooms.lte = filters.maxBeds;
  }

  if (filters.minBaths != null) {
    where.bathrooms = { gte: filters.minBaths };
  }

  if (filters.minYield != null || filters.maxYield != null) {
    where.yieldRate = {};
    if (filters.minYield != null) where.yieldRate.gte = filters.minYield;
    if (filters.maxYield != null) where.yieldRate.lte = filters.maxYield;
  }

  // New filter clauses
  if (filters.furnishing) where.furnishingStatus = filters.furnishing;
  if (filters.servantRoom) where.hasServantRoom = true;
  if (filters.pujaRoom) where.hasPujaRoom = true;
  if (filters.studyRoom) where.hasStudyRoom = true;
  if (filters.minBalconies != null)
    where.balconies = { gte: filters.minBalconies };
  if (filters.liftType) where.liftType = filters.liftType;
  if (filters.flatsPerFloor != null)
    where.flatsPerFloor = filters.flatsPerFloor;
  if (filters.availabilityStatus)
    where.availabilityStatus = filters.availabilityStatus;
  if (filters.bhk) where.bhk = filters.bhk;

  return where;
}

export function buildPropertyOrderBy(
  sort: string,
): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "yield_desc":
      return [{ yieldRate: "desc" }];
    case "yield_asc":
      return [{ yieldRate: "asc" }];
    case "change_ytd_desc":
      return [{ changeYtd: "desc" }];
    case "change_ytd_asc":
      return [{ changeYtd: "asc" }];
    case "change_24h_desc":
      return [{ change24h: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    case "sqft_desc":
      return [{ sqft: "desc" }];
    default:
      return [
        { featured: "desc" },
        { volumeScore: "desc" },
        { createdAt: "desc" },
      ];
  }
}

export function searchParamsToQuery(params: PropertySearchParams): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") sp.set(k, v);
  });
  return sp.toString();
}
