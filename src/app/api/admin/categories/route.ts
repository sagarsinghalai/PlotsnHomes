import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCrmApi } from "@/lib/crm-access";

const DEFAULT_CATEGORIES = [
  {
    name: "Apartments",
    slug: "apartment",
    icon: "building-2",
    description: "High-rise, multi-family, studio, and luxury apartments",
    subcategories: JSON.stringify(["Studio", "1 BHK", "2 BHK", "3 BHK Luxury", "Penthouse Suite", "Serviced Apartment"]),
    tags: JSON.stringify(["City View", "Balcony", "Gated Community", "Elevator"]),
  },
  {
    name: "Villas & Luxury Homes",
    slug: "villa",
    icon: "home",
    description: "Independent villas, luxury estates, and beachfront homes",
    subcategories: JSON.stringify(["Beachfront", "Gated Villa", "Golf Villa", "Heritage Villa", "Private Pool Estate"]),
    tags: JSON.stringify(["Private Pool", "Garden", "Garage", "Solar Powered"]),
  },
  {
    name: "Penthouses",
    slug: "penthouse",
    icon: "crown",
    description: "Exclusive top-floor residences with panoramic skyline views",
    subcategories: JSON.stringify(["Duplex Penthouse", "Sky Villa", "Terrace Suite", "Full Floor Penthouse"]),
    tags: JSON.stringify(["Skyline View", "Private Lift", "Jacuzzi", "Helipad Access"]),
  },
  {
    name: "Townhouses",
    slug: "townhouse",
    icon: "building",
    description: "Multi-floor urban and suburban terraced homes",
    subcategories: JSON.stringify(["Row House", "End Unit", "Corner Townhouse", "Cluster House"]),
    tags: JSON.stringify(["Corner Lot", "Clubhouse Access", "Dedicated Parking"]),
  },
  {
    name: "Land & Plots",
    slug: "land-plot",
    icon: "land-plot",
    description: "Residential, agricultural, and commercial open land plots",
    subcategories: JSON.stringify(["Residential Plot", "Agricultural Land", "Commercial Land", "Industrial Plot", "Farmhouse Land"]),
    tags: JSON.stringify(["Corner Plot", "Highway Facing", "Freehold", "Clear Title"]),
  },
  {
    name: "Commercial & Retail",
    slug: "commercial",
    icon: "store",
    description: "Offices, retail shops, warehouses, and commercial spaces",
    subcategories: JSON.stringify(["Corporate Office", "Retail Store", "Warehouse", "Showroom", "Co-working Space"]),
    tags: JSON.stringify(["Prime Location", "High Footfall", "Parking Facilities"]),
  },
  {
    name: "Duplexes",
    slug: "duplex",
    icon: "layers",
    description: "Two-story residential units connected by internal stairs",
    subcategories: JSON.stringify(["Garden Duplex", "Top Floor Duplex", "Independent Duplex"]),
    tags: JSON.stringify(["Double Height Ceiling", "Private Deck", "Modern Kitchen"]),
  },
  {
    name: "Full Floors",
    slug: "full-floor",
    icon: "layout",
    description: "Entire floor spaces for residential or corporate occupancy",
    subcategories: JSON.stringify(["Full Commercial Floor", "Full Residential Penthouse Floor"]),
    tags: JSON.stringify(["360 View", "High Security", "Private Elevator"]),
  },
];

const DEFAULT_LISTING_TYPES = ["Sales", "Rentals", "Lease", "PG / Hostel"];
const DEFAULT_TYPES = ["RESIDENTIAL", "COMMERCIAL", "LAND", "RENTAL", "INDUSTRIAL", "HOSPITALITY"];
const DEFAULT_STATUSES = ["ACTIVE", "DRAFT", "PENDING", "SOLD", "RENTED", "UNDER_OFFER"];

export async function GET() {
  try {
    if (!prisma || !(prisma as any).propertyCategory) {
      const fallback = DEFAULT_CATEGORIES.map((c, i) => ({
        id: `default-${i}`,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        description: c.description,
        subcategories: c.subcategories,
        tags: c.tags,
      }));
      return NextResponse.json({
        success: true,
        categories: fallback,
        listingTypes: DEFAULT_LISTING_TYPES,
        types: DEFAULT_TYPES,
        statuses: DEFAULT_STATUSES,
      });
    }

    let allItems = await (prisma as any).propertyCategory.findMany({
      orderBy: { createdAt: "asc" },
    });

    if (allItems.length === 0) {
      // Seed default categories
      for (const cat of DEFAULT_CATEGORIES) {
        await (prisma as any).propertyCategory.create({ data: cat });
      }
      // Seed system dropdown option records
      await (prisma as any).propertyCategory.create({
        data: {
          name: "System Listing Types",
          slug: "sys-listing-types",
          icon: "key",
          description: "Dropdown options for Listing Types",
          subcategories: JSON.stringify(DEFAULT_LISTING_TYPES),
          tags: JSON.stringify(["system-option"]),
        },
      });
      await (prisma as any).propertyCategory.create({
        data: {
          name: "System Property Types",
          slug: "sys-property-types",
          icon: "building",
          description: "Dropdown options for Property Types",
          subcategories: JSON.stringify(DEFAULT_TYPES),
          tags: JSON.stringify(["system-option"]),
        },
      });
      await (prisma as any).propertyCategory.create({
        data: {
          name: "System Statuses",
          slug: "sys-statuses",
          icon: "shield",
          description: "Dropdown options for Property Statuses",
          subcategories: JSON.stringify(DEFAULT_STATUSES),
          tags: JSON.stringify(["system-option"]),
        },
      });

      allItems = await (prisma as any).propertyCategory.findMany({
        orderBy: { createdAt: "asc" },
      });
    }

    // Separate regular categories vs system dropdown records
    const categories = allItems.filter((c: any) => !c.slug.startsWith("sys-"));
    
    const ltItem = allItems.find((c: any) => c.slug === "sys-listing-types");
    const ptItem = allItems.find((c: any) => c.slug === "sys-property-types");
    const stItem = allItems.find((c: any) => c.slug === "sys-statuses");

    const listingTypes: string[] = ltItem ? JSON.parse(ltItem.subcategories || "[]") : DEFAULT_LISTING_TYPES;
    const types: string[] = ptItem ? JSON.parse(ptItem.subcategories || "[]") : DEFAULT_TYPES;
    const statuses: string[] = stItem ? JSON.parse(stItem.subcategories || "[]") : DEFAULT_STATUSES;

    return NextResponse.json({
      success: true,
      categories,
      listingTypes: Array.from(new Set([...DEFAULT_LISTING_TYPES, ...listingTypes])),
      types: Array.from(new Set([...DEFAULT_TYPES, ...types])),
      statuses: Array.from(new Set([...DEFAULT_STATUSES, ...statuses])),
      rawItems: allItems,
    });
  } catch (error: any) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json({
      success: true,
      categories: DEFAULT_CATEGORIES.map((c, i) => ({ id: `default-${i}`, ...c })),
      listingTypes: DEFAULT_LISTING_TYPES,
      types: DEFAULT_TYPES,
      statuses: DEFAULT_STATUSES,
    });
  }
}

export async function POST(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { name, slug, icon, description, subcategories, tags, targetGroup, optionValue } = body;

    // Handle quick adding to system dropdown options (listingTypes, types, statuses)
    if (targetGroup) {
      const sysSlug = `sys-${targetGroup}`;
      let sysRecord = await (prisma as any).propertyCategory.findUnique({
        where: { slug: sysSlug },
      });

      let currentList: string[] = [];
      if (!sysRecord) {
        if (targetGroup === "listing-types") currentList = [...DEFAULT_LISTING_TYPES];
        else if (targetGroup === "property-types") currentList = [...DEFAULT_TYPES];
        else if (targetGroup === "statuses") currentList = [...DEFAULT_STATUSES];

        if (optionValue && !currentList.includes(optionValue.trim())) {
          currentList.push(optionValue.trim());
        }

        sysRecord = await (prisma as any).propertyCategory.create({
          data: {
            name: `System ${targetGroup}`,
            slug: sysSlug,
            icon: "settings",
            description: `Dropdown options for ${targetGroup}`,
            subcategories: JSON.stringify(currentList),
            tags: JSON.stringify(["system-option"]),
          },
        });
      } else {
        currentList = JSON.parse(sysRecord.subcategories || "[]");
        if (optionValue && !currentList.includes(optionValue.trim())) {
          currentList.push(optionValue.trim());
          sysRecord = await (prisma as any).propertyCategory.update({
            where: { id: sysRecord.id },
            data: { subcategories: JSON.stringify(currentList) },
          });
        }
      }

      return NextResponse.json({ success: true, options: currentList, sysRecord });
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Category name is required" }, { status: 400 });
    }

    const generatedSlug = slug && slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")
      : name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const existing = await (prisma as any).propertyCategory.findFirst({
      where: {
        OR: [{ name: name.trim() }, { slug: generatedSlug }],
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: "Category with this name or slug already exists" }, { status: 400 });
    }

    const category = await (prisma as any).propertyCategory.create({
      data: {
        name: name.trim(),
        slug: generatedSlug,
        icon: icon || "building",
        description: description?.trim() || "",
        subcategories: JSON.stringify(Array.isArray(subcategories) ? subcategories : []),
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { id, name, slug, icon, description, subcategories, tags, targetGroup, optionsList } = body;

    // Handle updating system dropdown options
    if (targetGroup && Array.isArray(optionsList)) {
      const sysSlug = `sys-${targetGroup}`;
      let sysRecord = await (prisma as any).propertyCategory.findUnique({
        where: { slug: sysSlug },
      });

      if (sysRecord) {
        await (prisma as any).propertyCategory.update({
          where: { id: sysRecord.id },
          data: { subcategories: JSON.stringify(optionsList) },
        });
      } else {
        await (prisma as any).propertyCategory.create({
          data: {
            name: `System ${targetGroup}`,
            slug: sysSlug,
            icon: "settings",
            description: `Dropdown options for ${targetGroup}`,
            subcategories: JSON.stringify(optionsList),
            tags: JSON.stringify(["system-option"]),
          },
        });
      }

      return NextResponse.json({ success: true, options: optionsList });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (slug) updateData.slug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (icon) updateData.icon = icon;
    if (description !== undefined) updateData.description = description.trim();
    if (subcategories !== undefined) updateData.subcategories = JSON.stringify(Array.isArray(subcategories) ? subcategories : []);
    if (tags !== undefined) updateData.tags = JSON.stringify(Array.isArray(tags) ? tags : []);

    const updated = await (prisma as any).propertyCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error("PUT /api/admin/categories error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 });
    }

    await (prisma as any).propertyCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/admin/categories error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
