import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().min(2).regex(/^[a-zA-Z\s]+$/, "Name can only contain alphabets and spaces").optional(),
  projectCount: z.number().int().min(0).optional(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable().or(z.literal("")).refine(
    (val) => {
      if (!val) return true;
      return /^\+?[1-9]\d{9,14}$/.test(val);
    },
    { message: "Invalid phone number format." }
  ),
  address: z.string().optional().nullable(),
  city: z.string().regex(/^[a-zA-Z\s]*$/, "City can only contain alphabets").optional().nullable(),
  state: z.string().regex(/^[a-zA-Z\s]*$/, "State can only contain alphabets").optional().nullable(),
  zip: z.string().regex(/^\d{6}$/, "Zip Code must be exactly 6 digits").optional().nullable(),
  country: z.string().regex(/^[a-zA-Z\s]*$/, "Country can only contain alphabets").optional(),
  experienceYears: z.number().int().min(0).optional().nullable(),
  identityType: z.string().optional().nullable(),
  identityNumber: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    const existing = await prisma.developer.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    if (data.name && data.name !== existing.name) {
      const exists = await prisma.developer.findUnique({
        where: { name: data.name },
      });
      if (exists) {
        return NextResponse.json(
          { error: "Developer name already exists" },
          { status: 400 }
        );
      }
    }

    const developer = await prisma.developer.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.projectCount !== undefined && { projectCount: data.projectCount }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.city !== undefined && { city: data.city || null }),
        ...(data.state !== undefined && { state: data.state || null }),
        ...(data.zip !== undefined && { zip: data.zip || null }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.experienceYears !== undefined && { experienceYears: data.experienceYears }),
        ...(data.identityType !== undefined && { identityType: data.identityType || null }),
        ...(data.identityNumber !== undefined && { identityNumber: data.identityNumber || null }),
        ...(data.website !== undefined && { website: data.website || null }),
        ...(data.description !== undefined && { description: data.description || null }),
      },
    });

    return NextResponse.json({ ok: true, developer });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Could not update developer" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const existing = await prisma.developer.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    await prisma.developer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not delete developer" },
      { status: 500 }
    );
  }
}
