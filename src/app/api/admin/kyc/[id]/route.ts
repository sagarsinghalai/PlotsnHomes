import { KycStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const profiles = await prisma.kycProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });
  return NextResponse.json(profiles);
}

const patchSchema = z.object({
  status: z.nativeEnum(KycStatus),
  adminNotes: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const data = patchSchema.parse(await req.json());
    const kyc = await prisma.kycProfile.update({
      where: { id: params.id },
      data: { ...data, reviewedAt: new Date() },
    });
    return NextResponse.json({ ok: true, kyc });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 400 });
  }
}
