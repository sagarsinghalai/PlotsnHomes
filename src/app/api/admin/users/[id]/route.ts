import { KycStatus, Role, LoanStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const kycSchema = z.object({
  fullName:           z.string().min(2).optional(),
  dateOfBirth:        z.string().nullable().optional(),
  nationality:        z.string().nullable().optional(),
  idType:             z.string().nullable().optional(),
  idNumber:           z.string().nullable().optional(),
  address:            z.string().nullable().optional(),
  city:               z.string().nullable().optional(),
  state:              z.string().nullable().optional(),
  pinCode:            z.string().nullable().optional(),
  country:            z.string().nullable().optional(),
  photoUrl:           z.string().nullable().optional(),
  aadhaarFrontUrl:    z.string().nullable().optional(),
  aadhaarBackUrl:     z.string().nullable().optional(),
  panCardUrl:         z.string().nullable().optional(),
  drivingLicenseUrl:  z.string().nullable().optional(),
  voterIdUrl:         z.string().nullable().optional(),
  idDocumentUrl:      z.string().nullable().optional(),
  addressProofUrl:    z.string().nullable().optional(),
  status:             z.nativeEnum(KycStatus).optional(),
  adminNotes:         z.string().nullable().optional(),
});

const loanAppSchema = z.object({
  id: z.string(),
  loanAmount: z.number(),
  loanType: z.string().nullable().optional(),
  termYears: z.number(),
  annualIncome: z.number().nullable().optional(),
  employmentStatus: z.string().nullable().optional(),
  downPayment: z.number().nullable().optional(),
  creditScore: z.number().nullable().optional(),
  existingEmi: z.number().nullable().optional(),
  coApplicantName: z.string().nullable().optional(),
  coApplicantIncome: z.number().nullable().optional(),
  propertyType: z.string().nullable().optional(),
  propertyArea: z.string().nullable().optional(),
  propertyCity: z.string().nullable().optional(),
  incomeProofUrl: z.string().nullable().optional(),
  bankStatementUrl: z.string().nullable().optional(),
  propertyDocUrl: z.string().nullable().optional(),
  status: z.nativeEnum(LoanStatus),
  adminNotes: z.string().nullable().optional(),
});

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional().refine(
    (val) => {
      if (!val) return true;
      const digits = val.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    },
    { message: "Phone number must be between 10 and 15 digits." }
  ),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  role: z.nativeEnum(Role).optional(),
  active: z.boolean().optional(),
  kyc: kycSchema.optional(),
  loans: z.array(loanAppSchema).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (data.role && data.role !== Role.SUPERADMIN && user.role === Role.SUPERADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.SUPERADMIN } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot demote the last super admin" }, { status: 400 });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: params.id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.email !== undefined && { email: data.email.toLowerCase() }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.state !== undefined && { state: data.state }),
          ...(data.zip !== undefined && { zip: data.zip }),
          ...(data.country !== undefined && { country: data.country }),
          ...(data.role !== undefined && { role: data.role }),
          ...(data.active !== undefined && { active: data.active }),
        },
      });

      if (data.kyc) {
        const k = data.kyc;
        const existing = await tx.kycProfile.findUnique({ where: { userId: params.id } });
        if (existing) {
          await tx.kycProfile.update({
            where: { userId: params.id },
            data: {
              ...(k.fullName          !== undefined && { fullName: k.fullName }),
              ...(k.dateOfBirth       !== undefined && { dateOfBirth: k.dateOfBirth }),
              ...(k.nationality       !== undefined && { nationality: k.nationality }),
              ...(k.idType            !== undefined && { idType: k.idType }),
              ...(k.idNumber          !== undefined && { idNumber: k.idNumber }),
              ...(k.address           !== undefined && { address: k.address }),
              ...(k.city              !== undefined && { city: k.city }),
              ...(k.state             !== undefined && { state: k.state }),
              ...(k.pinCode           !== undefined && { pinCode: k.pinCode }),
              ...(k.country           !== undefined && { country: k.country }),
              ...(k.photoUrl          !== undefined && { photoUrl: k.photoUrl }),
              ...(k.aadhaarFrontUrl   !== undefined && { aadhaarFrontUrl: k.aadhaarFrontUrl }),
              ...(k.aadhaarBackUrl    !== undefined && { aadhaarBackUrl: k.aadhaarBackUrl }),
              ...(k.panCardUrl        !== undefined && { panCardUrl: k.panCardUrl }),
              ...(k.drivingLicenseUrl !== undefined && { drivingLicenseUrl: k.drivingLicenseUrl }),
              ...(k.voterIdUrl        !== undefined && { voterIdUrl: k.voterIdUrl }),
              ...(k.idDocumentUrl     !== undefined && { idDocumentUrl: k.idDocumentUrl }),
              ...(k.addressProofUrl   !== undefined && { addressProofUrl: k.addressProofUrl }),
              ...(k.status            !== undefined && { status: k.status, reviewedAt: new Date() }),
              ...(k.adminNotes        !== undefined && { adminNotes: k.adminNotes }),
            },
          });
        } else if (k.fullName) {
          await tx.kycProfile.create({
            data: {
              userId:           params.id,
              fullName:         k.fullName,
              dateOfBirth:      k.dateOfBirth      ?? null,
              nationality:      k.nationality      ?? null,
              idType:           k.idType           ?? null,
              idNumber:         k.idNumber         ?? null,
              address:          k.address          ?? null,
              city:             k.city             ?? null,
              state:            k.state            ?? null,
              pinCode:          k.pinCode          ?? null,
              country:          k.country          ?? null,
              photoUrl:         k.photoUrl         ?? null,
              aadhaarFrontUrl:  k.aadhaarFrontUrl  ?? null,
              aadhaarBackUrl:   k.aadhaarBackUrl   ?? null,
              panCardUrl:       k.panCardUrl       ?? null,
              drivingLicenseUrl:k.drivingLicenseUrl?? null,
              voterIdUrl:       k.voterIdUrl       ?? null,
              idDocumentUrl:    k.idDocumentUrl    ?? null,
              addressProofUrl:  k.addressProofUrl  ?? null,
              status:           k.status           ?? KycStatus.PENDING,
              adminNotes:       k.adminNotes       ?? null,
            },
          });
        }
      }

      if (data.loans) {
        for (const l of data.loans) {
          const isTemp = l.id.startsWith("temp-");
          if (isTemp) {
            await tx.loanApplication.create({
              data: {
                userId:           params.id,
                loanAmount:       l.loanAmount,
                loanType:         l.loanType ?? "Home Loan",
                termYears:        l.termYears ?? 20,
                annualIncome:     l.annualIncome,
                employmentStatus: l.employmentStatus,
                downPayment:      l.downPayment,
                creditScore:      l.creditScore,
                existingEmi:      l.existingEmi,
                coApplicantName:  l.coApplicantName,
                coApplicantIncome:l.coApplicantIncome,
                propertyType:     l.propertyType,
                propertyArea:     l.propertyArea,
                propertyCity:     l.propertyCity,
                incomeProofUrl:   l.incomeProofUrl,
                bankStatementUrl: l.bankStatementUrl,
                propertyDocUrl:   l.propertyDocUrl,
                status:           l.status,
                adminNotes:       l.adminNotes,
              },
            });
          } else {
            await tx.loanApplication.update({
              where: { id: l.id },
              data: {
                loanAmount:       l.loanAmount,
                loanType:         l.loanType,
                termYears:        l.termYears,
                annualIncome:     l.annualIncome,
                employmentStatus: l.employmentStatus,
                downPayment:      l.downPayment,
                creditScore:      l.creditScore,
                existingEmi:      l.existingEmi,
                coApplicantName:  l.coApplicantName,
                coApplicantIncome:l.coApplicantIncome,
                propertyType:     l.propertyType,
                propertyArea:     l.propertyArea,
                propertyCity:     l.propertyCity,
                incomeProofUrl:   l.incomeProofUrl,
                bankStatementUrl: l.bankStatementUrl,
                propertyDocUrl:   l.propertyDocUrl,
                status:           l.status,
                adminNotes:       l.adminNotes,
              },
            });
          }
        }
      }

      return u;
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  if (auth.session!.user.id === params.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { _count: { select: { properties: true } } },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === Role.SUPERADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.SUPERADMIN } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot delete the last super admin" }, { status: 400 });
      }
    }

    const fallbackAgent = await prisma.user.findFirst({
      where: {
        role: { in: [Role.SUPERADMIN, Role.EMPLOYEE, Role.AGENT] },
        id: { not: params.id },
        active: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!fallbackAgent) {
      return NextResponse.json({ error: "No fallback agent to reassign listings" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      if (user._count.properties > 0) {
        await tx.property.updateMany({
          where: { agentId: params.id },
          data: { agentId: fallbackAgent.id },
        });
      }
      await tx.favorite.deleteMany({ where: { userId: params.id } });
      await tx.transaction.deleteMany({ where: { userId: params.id } });
      await tx.inquiry.updateMany({
        where: { userId: params.id },
        data: { userId: null },
      });
      await tx.user.delete({ where: { id: params.id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
