import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(2),
  projectCount: z.number().int().min(0).optional(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  country: z.string().optional(),
  experienceYears: z.number().int().min(0).optional().nullable(),
  identityType: z.string().optional().nullable(),
  identityNumber: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const exists = await prisma.developer.findUnique({
      where: { name: data.name },
    });
    if (exists) {
      return NextResponse.json(
        { error: "Developer name already exists" },
        { status: 400 }
      );
    }

    const developer = await prisma.developer.create({
      data: {
        name: data.name,
        projectCount: data.projectCount ?? 0,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        zip: data.zip || null,
        country: data.country ?? "IN",
        experienceYears: data.experienceYears ?? null,
        identityType: data.identityType || null,
        identityNumber: data.identityNumber || null,
        website: data.website || null,
        description: data.description || null,
      },
    });

    return NextResponse.json({ ok: true, developer });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Could not create developer" },
      { status: 500 }
    );
  }
}
