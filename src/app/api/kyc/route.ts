import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getPrimaryTenantId } from "@/lib/tenant";
import { validateFullName, validateNationality, validateIdNumber } from "@/lib/kyc-validation";

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

    // Full legal name — letters only, no digits
    const nameCheck = validateFullName(data.fullName);
    if (!nameCheck.valid) {
      return NextResponse.json({ error: nameCheck.message }, { status: 400 });
    }
    data.fullName = nameCheck.normalized!;

    // Nationality — letters only, no digits (optional)
    if (data.nationality) {
      const natCheck = validateNationality(data.nationality);
      if (!natCheck.valid) {
        return NextResponse.json({ error: natCheck.message }, { status: 400 });
      }
      data.nationality = natCheck.normalized;
    }

    // ID number — must match the selected ID type's format
    if (data.idType || data.idNumber) {
      const idCheck = validateIdNumber(data.idType ?? "", data.idNumber ?? "");
      if (!idCheck.valid) {
        return NextResponse.json({ error: idCheck.message }, { status: 400 });
      }
      data.idNumber = idCheck.normalized;
    }

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
      create: { tenantId: session.user.tenantId ?? (await getPrimaryTenantId()), userId: session.user.id, ...data },
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
