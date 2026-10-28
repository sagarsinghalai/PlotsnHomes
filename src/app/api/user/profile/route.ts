import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { validateAddressFields } from "@/lib/profile-validation";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      country: true,
      image: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    // Validate address fields authoritatively (the client can be bypassed).
    // Fall back to the stored country so ZIP rules apply even when the PATCH
    // omits country.
    let country = data.country ?? undefined;
    if (country === undefined && data.zip !== undefined) {
      const existing = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { country: true },
      });
      country = existing?.country ?? undefined;
    }
    const addressErrors = validateAddressFields({
      city: data.city,
      state: data.state,
      zip: data.zip,
      country,
    });
    const firstField = Object.keys(addressErrors)[0];
    if (firstField) {
      return NextResponse.json(
        { error: addressErrors[firstField], field: firstField },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.zip !== undefined && { zip: data.zip }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.image !== undefined && { image: data.image }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        country: true,
        image: true,
        role: true,
      },
    });

    return NextResponse.json({ user });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.flatten() }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
