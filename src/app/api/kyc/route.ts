import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  fullName:           z.string().min(2),
  dateOfBirth:        z.string().optional(),
  nationality:        z.string().optional(),
  idType:             z.string().optional(),
  idNumber:           z.string().optional(),
  address:            z.string().optional(),
  city:               z.string().optional(),
  state:              z.string().optional(),
  pinCode:            z.string().optional(),
  country:            z.string().optional(),
  photoUrl:           z.string().optional(),
  aadhaarFrontUrl:    z.string().optional(),
  aadhaarBackUrl:     z.string().optional(),
  panCardUrl:         z.string().optional(),
  drivingLicenseUrl:  z.string().optional(),
  voterIdUrl:         z.string().optional(),
  idDocumentUrl:      z.string().optional(),
  addressProofUrl:    z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const kyc = await prisma.kycProfile.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json(kyc);
}

import { validateUserDobAge } from "@/lib/user-validation";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = schema.parse(await req.json());

    // Validate DOB Age >= 18 from account creation date
    if (data.dateOfBirth) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      const dobCheck = validateUserDobAge(data.dateOfBirth, user?.createdAt);
      if (!dobCheck.valid) {
        return NextResponse.json({ error: dobCheck.message }, { status: 400 });
      }
    }

    const kyc = await prisma.kycProfile.upsert({
      where:  { userId: session.user.id },
      create: { userId: session.user.id, ...data },
      update: { ...data, status: "PENDING" },
    });
    return NextResponse.json({ ok: true, kyc });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
