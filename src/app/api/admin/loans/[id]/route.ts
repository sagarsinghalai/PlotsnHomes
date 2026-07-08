import { LoanStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const loans = await prisma.loanApplication.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      property: { select: { title: true } },
    },
  });
  return NextResponse.json(loans);
}

const patchSchema = z.object({
  status: z.nativeEnum(LoanStatus).optional(),
  adminNotes: z.string().nullable().optional(),
  loanAmount: z.number().optional(),
  termYears: z.number().optional(),
  loanType: z.string().nullable().optional(),
  annualIncome: z.number().nullable().optional(),
  employmentStatus: z.string().nullable().optional(),
  downPayment: z.number().nullable().optional(),
  creditScore: z.number().nullable().optional(),
  existingEmi: z.number().nullable().optional(),
  coApplicantName: z.string().nullable().optional(),
  coApplicantIncome: z.number().nullable().optional(),
  propertyType: z.string().nullable().optional(),
  propertyCity: z.string().nullable().optional(),
  propertyArea: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const data = patchSchema.parse(await req.json());
    const loan = await prisma.loanApplication.update({
      where: { id: params.id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.adminNotes !== undefined && { adminNotes: data.adminNotes }),
        ...(data.loanAmount !== undefined && { loanAmount: data.loanAmount }),
        ...(data.termYears !== undefined && { termYears: data.termYears }),
        ...(data.loanType !== undefined && { loanType: data.loanType }),
        ...(data.annualIncome !== undefined && { annualIncome: data.annualIncome }),
        ...(data.employmentStatus !== undefined && { employmentStatus: data.employmentStatus }),
        ...(data.downPayment !== undefined && { downPayment: data.downPayment }),
        ...(data.creditScore !== undefined && { creditScore: data.creditScore }),
        ...(data.existingEmi !== undefined && { existingEmi: data.existingEmi }),
        ...(data.coApplicantName !== undefined && { coApplicantName: data.coApplicantName }),
        ...(data.coApplicantIncome !== undefined && { coApplicantIncome: data.coApplicantIncome }),
        ...(data.propertyType !== undefined && { propertyType: data.propertyType }),
        ...(data.propertyCity !== undefined && { propertyCity: data.propertyCity }),
        ...(data.propertyArea !== undefined && { propertyArea: data.propertyArea }),
      },
    });
    return NextResponse.json({ ok: true, loan });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update loan details" }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    await prisma.loanApplication.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 400 });
  }
}
