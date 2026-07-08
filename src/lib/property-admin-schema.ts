import { ListingType, PropertyStatus, PropertyType } from "@prisma/client";
import { z } from "zod";

export const propertyMediaSchema = z.object({
  listingType: z.nativeEnum(ListingType).optional(),
  category: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
  country: z.string().optional(),
  rooms: z.number().int().min(0).optional().nullable(),
  garages: z.number().int().min(0).optional(),
  lotSize: z.number().int().optional().nullable(),
  totalFloors: z.number().int().min(1).optional().nullable(),
  floorNumber: z.number().int().min(0).optional().nullable(),
  videos: z.array(z.string()).optional(),
  pdfs: z
    .array(z.union([z.string(), z.object({ name: z.string(), url: z.string() })]))
    .optional(),
  features: z.array(z.string()).optional(),
  videoUrl: z.string().optional().nullable(),
  virtualTourUrl: z.string().optional().nullable(),
  mapLat: z.number().optional().nullable(),
  mapLng: z.number().optional().nullable(),
  // New extra fields
  bhk: z.string().optional().nullable(),
  furnishingStatus: z.string().optional().nullable(),
  hasServantRoom: z.boolean().optional(),
  hasPujaRoom: z.boolean().optional(),
  hasStudyRoom: z.boolean().optional(),
  balconies: z.number().int().min(0).optional(),
  liftType: z.string().optional().nullable(),
  flatsPerFloor: z.number().int().min(1).optional().nullable(),
  availabilityStatus: z.string().optional(),
  customFields: z.string().optional(),
});

export const propertyCreateSchema = z
  .object({
    title: z.string().min(3),
    symbol: z.string().min(3),
    description: z.string().min(10),
    price: z.number().positive(),
    listedPrice: z.number().positive().optional().nullable(),
    currentPrice: z.number().positive().optional().nullable(),
    rentMonthly: z.number().optional().nullable(),
    city: z.string().min(2),
    state: z.string().min(2),
    address: z.string().min(3),
    zip: z.string().min(3),
    type: z.nativeEnum(PropertyType).default(PropertyType.RESIDENTIAL),
    status: z.nativeEnum(PropertyStatus).default(PropertyStatus.ACTIVE),
    bedrooms: z.number().int().min(0).default(0),
    bathrooms: z.number().min(0).default(0),
    sqft: z.number().int().optional().nullable(),
    images: z.array(z.string().min(1)).default([]),
    agentId: z.string().optional(),
    yieldRate: z.number().optional(),
    capRate: z.number().optional(),
    interestRate: z.number().optional(),
    change24h: z.number().optional(),
    change7d: z.number().optional(),
    change1m: z.number().optional(),
    change6m: z.number().optional(),
    changeYtd: z.number().optional(),
    marketRating: z.string().optional(),
    volumeScore: z.number().int().optional(),
    featured: z.boolean().optional(),
    yearBuilt: z.number().int().nullable().optional(),
    brokerageRate: z.number().optional(),
  })
  .merge(propertyMediaSchema);

export const propertyPatchSchema = propertyCreateSchema.partial().omit({ symbol: true });

export function serializeMediaArrays(data: {
  videos?: string[];
  pdfs?: (string | { name: string; url: string })[];
  features?: string[];
}) {
  return {
    ...(data.videos !== undefined && { videos: JSON.stringify(data.videos) }),
    ...(data.pdfs !== undefined && { pdfs: JSON.stringify(data.pdfs) }),
    ...(data.features !== undefined && { features: JSON.stringify(data.features) }),
  };
}
