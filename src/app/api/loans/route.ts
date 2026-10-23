import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getPrimaryTenantId } from "@/lib/tenant";

const schema = z.object({
  propertyId:         z.string().optional(),
  loanAmount:         z.number().positive(),
  loanType:           z.string().optional(),
  termYears:          z.number().int().min(1).max(40).default(20),
  annualIncome:       z.number().optional(),
  employmentStatus:   z.string().optional(),
  downPayment:        z.number().optional(),
  purpose:            z.string().optional(),
  creditScore:        z.number().int().optional(),
  existingEmi:        z.number().optional(),
  coApplicantName:    z.string().optional(),
  coApplicantIncome:  z.number().optional(),
  propertyType:       z.string().optional(),
  propertyArea:       z.string().optional(),
  propertyCity:       z.string().optional(),
  incomeProofUrl:     z.string().optional(),
  bankStatementUrl:   z.string().optional(),
  propertyDocUrl:     z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const loans = await prisma.loanApplication.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { property: { select: { title: true, slug: true } } },
  });
  return NextResponse.json(loans);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = schema.parse(await req.json());
    const loan = await prisma.loanApplication.create({
      data: { tenantId: session.user.tenantId ?? (await getPrimaryTenantId()), userId: session.user.id, ...data },
    });
    return NextResponse.json({ ok: true, loan });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
