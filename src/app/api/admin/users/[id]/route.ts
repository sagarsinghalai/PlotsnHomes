import { KycStatus, Role, LoanStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { checkUserExists4Params, validateUserDobAge } from "@/lib/user-validation";
import { resolveTenantForOwnerOrProperty } from "@/lib/tenant";

const kycSchema = z.object({
  fullName:           z.string().regex(/^([a-zA-Z\s]{2,})?$/, "Name can only contain alphabets and spaces").optional(),
  dateOfBirth:        z.string().nullable().optional(),
  nationality:        z.string().regex(/^[a-zA-Z\s]*$/, "Nationality can only contain alphabets").nullable().optional(),
  idType:             z.string().nullable().optional(),
  idNumber:           z.string().nullable().optional(),
  address:            z.string().nullable().optional(),
  city:               z.string().regex(/^[a-zA-Z\s]*$/, "City can only contain alphabets").nullable().optional(),
  state:              z.string().regex(/^[a-zA-Z\s]*$/, "State can only contain alphabets").nullable().optional(),
  pinCode:            z.string().regex(/^(\d{6})?$/, "Pin Code must be exactly 6 digits").nullable().optional(),
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
  coApplicantName: z.string().regex(/^[a-zA-Z\s]*$/, "Name can only contain alphabets").nullable().optional(),
  coApplicantIncome: z.number().nullable().optional(),
  propertyType: z.string().nullable().optional(),
  propertyArea: z.string().nullable().optional(),
  propertyCity: z.string().regex(/^[a-zA-Z\s]*$/, "City can only contain alphabets").nullable().optional(),
  incomeProofUrl: z.string().nullable().optional(),
  bankStatementUrl: z.string().nullable().optional(),
  propertyDocUrl: z.string().nullable().optional(),
  status: z.nativeEnum(LoanStatus),
  adminNotes: z.string().nullable().optional(),
});

const patchSchema = z.object({
  name: z.string().min(2).regex(/^[a-zA-Z\s]+$/, "Name can only contain alphabets and spaces").optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional().refine(
    (val) => {
      if (!val) return true;
      return /^\+?[1-9]\d{9,14}$/.test(val);
    },
    { message: "Invalid phone number format." }
  ),
  pan: z.string().nullable().optional(),
  aadhar: z.string().nullable().optional(),
  dob: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().regex(/^[a-zA-Z\s]*$/, "City can only contain alphabets").nullable().optional(),
  state: z.string().regex(/^[a-zA-Z\s]*$/, "State can only contain alphabets").nullable().optional(),
  zip: z.string().regex(/^\d{6}$/, "Zip Code must be exactly 6 digits").nullable().optional(),
  country: z.string().nullable().optional(),
  role: z.nativeEnum(Role).optional(),
  managerId: z.string().nullable().optional(),
  tenantId: z.string().nullable().optional(),
  franchiseId: z.string().nullable().optional(),
  branchId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  teamId: z.string().nullable().optional(),
  active: z.boolean().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  kyc: kycSchema.optional(),
  loans: z.array(loanAppSchema).optional(),
  // A single new admin note to APPEND (with author + timestamp) to the KYC
  // notes history, instead of overwriting adminNotes.
  addKycNote: z.string().trim().min(1).max(4000).optional(),
  // A single new admin note to APPEND (with author + user ID + timestamp) to a
  // specific loan application's notes history.
  addLoanNote: z.object({ loanId: z.string().min(1), text: z.string().trim().min(1).max(4000) }).optional(),
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

    // Validate DOB Age >= 18 from date of account creation
    const existingKyc = await prisma.kycProfile.findUnique({ where: { userId: params.id } });
    const dobToValidate = data.dob || data.kyc?.dateOfBirth || (user.dob ? user.dob.toISOString() : undefined) || (existingKyc?.dateOfBirth ?? undefined);
    if (dobToValidate) {
      const dobCheck = validateUserDobAge(dobToValidate, user.createdAt);
      if (!dobCheck.valid) {
        return NextResponse.json({ error: dobCheck.message }, { status: 400 });
      }
    }

    // 4-Parameter Uniqueness Check excluding current user
    const checkPan = data.pan || (data.kyc?.idType === "PAN" ? data.kyc.idNumber : undefined);
    const checkAadhar = data.aadhar || (data.kyc?.idType === "Aadhaar" || data.kyc?.idType === "Aadhar" ? data.kyc.idNumber : undefined);

    const check = await checkUserExists4Params({
      email: data.email,
      phone: data.phone,
      pan: checkPan,
      aadhar: checkAadhar,
      excludeUserId: params.id,
    });

    if (check.exists) {
      return NextResponse.json({ error: check.message }, { status: 400 });
    }

    if (data.role === Role.SUPERADMIN && auth.session?.user?.role !== Role.SUPERADMIN) {
      return NextResponse.json({ error: "Only a Super Admin can assign the Super Admin role." }, { status: 403 });
    }

    if (data.role && data.role !== Role.SUPERADMIN && user.role === Role.SUPERADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.SUPERADMIN } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot demote the last super admin" }, { status: 400 });
      }
    }

    // Append a new KYC admin note (with author name + user ID + timestamp).
    let appendedNotes: string | undefined;
    if (data.addKycNote) {
      const admin = auth.session?.user?.id
        ? await prisma.user.findUnique({ where: { id: auth.session.user.id }, select: { name: true, userId: true } })
        : null;
      const ts = new Date().toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
      const author = `${admin?.name ?? "Admin"} · ${admin?.userId ?? "—"}`;
      const entry = `[${ts}] [${author}] ${data.addKycNote}`;
      const existing = await prisma.kycProfile.findUnique({ where: { userId: params.id }, select: { adminNotes: true } });
      appendedNotes = existing?.adminNotes ? `${existing.adminNotes}\n\n${entry}` : entry;
      if (existing) {
        await prisma.kycProfile.update({ where: { userId: params.id }, data: { adminNotes: appendedNotes } });
      } else {
        await prisma.kycProfile.create({ data: { tenantId: await resolveTenantForOwnerOrProperty(params.id), userId: params.id, fullName: user.name, adminNotes: appendedNotes, status: KycStatus.PENDING } });
      }
    }

    // Append a new loan admin note (with author name + user ID + timestamp).
    let appendedLoanNotes: string | undefined;
    if (data.addLoanNote) {
      const loan = await prisma.loanApplication.findFirst({
        where: { id: data.addLoanNote.loanId, userId: params.id },
        select: { id: true, adminNotes: true },
      });
      if (!loan) return NextResponse.json({ error: "Loan application not found" }, { status: 404 });
      const admin = auth.session?.user?.id
        ? await prisma.user.findUnique({ where: { id: auth.session.user.id }, select: { name: true, userId: true } })
        : null;
      const ts = new Date().toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
      });
      const author = `${admin?.name ?? "Admin"} · ${admin?.userId ?? "—"}`;
      const entry = `[${ts}] [${author}] ${data.addLoanNote.text}`;
      appendedLoanNotes = loan.adminNotes ? `${loan.adminNotes}\n\n${entry}` : entry;
      await prisma.loanApplication.update({ where: { id: loan.id }, data: { adminNotes: appendedLoanNotes } });
    }

    const targetTenant = await resolveTenantForOwnerOrProperty(params.id);
    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: params.id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.email !== undefined && { email: data.email.toLowerCase() }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.dob !== undefined && { dob: data.dob ? new Date(data.dob) : null }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.state !== undefined && { state: data.state }),
          ...(data.zip !== undefined && { zip: data.zip }),
          ...(data.country !== undefined && { country: data.country }),
          ...(data.role !== undefined && { role: data.role }),
          // Empty strings for optional relations must become null, or the FK
          // lookup fails (Prisma P2003 "Foreign key constraint violated").
          ...(data.managerId !== undefined && { managerId: data.managerId || null }),
          ...(data.tenantId !== undefined && { tenantId: data.tenantId || null }),
          ...(data.franchiseId !== undefined && { franchiseId: data.franchiseId || null }),
          ...(data.branchId !== undefined && { branchId: data.branchId || null }),
          ...(data.departmentId !== undefined && { departmentId: data.departmentId || null }),
          ...(data.teamId !== undefined && { teamId: data.teamId || null }),
          ...(data.active !== undefined && { active: data.active }),
          ...(data.commissionRate !== undefined && { commissionRate: data.commissionRate }),
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
              tenantId:         targetTenant,
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
                tenantId:         targetTenant,
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

    return NextResponse.json({ ok: true, user: updated, appendedNotes, appendedLoanNotes });
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
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  try {
    const id = params.id;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        teamRel: { select: { name: true } },
        branchRel: { select: { name: true } },
        departmentRel: { select: { name: true } },
        franchiseRel: { select: { name: true } },
        organizationRel: { select: { name: true } },
      },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === Role.SUPERADMIN) {
      const adminCount = await prisma.user.count({ where: { role: Role.SUPERADMIN } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot delete the last Super Admin." }, { status: 400 });
      }
    }

    // Safety policy: a user is NEVER hard-deleted while they have history or
    // relationships in the system — doing so would erase or orphan real records.
    // We count every association and, if any exist, refuse the delete and return
    // a full breakdown so the admin can see what is attached and deactivate
    // instead (which retains all data and is reversible).
    const [
      propertiesAsAgent, propertiesSubmitted, transactions, subordinates,
      loans, meetingsAttended, meetingsCreated, inquiries, favorites,
      showings, leadsOwned, leadActivities, leadTasks, crmGoals,
      commissions, subscriptions, bulkJobs, listingDrafts,
      messagesSent, messagesReceived, kyc,
      orgsAdministered, franchisesAdministered, branchesManaged,
      departmentsHeaded, teamsLed,
    ] = await prisma.$transaction([
      prisma.property.count({ where: { agentId: id } }),
      prisma.property.count({ where: { submittedById: id } }),
      prisma.transaction.count({ where: { userId: id } }),
      prisma.user.count({ where: { managerId: id } }),
      prisma.loanApplication.count({ where: { userId: id } }),
      prisma.meetingInvite.count({ where: { userId: id } }),
      prisma.meetingInvite.count({ where: { createdById: id } }),
      prisma.inquiry.count({ where: { userId: id } }),
      prisma.favorite.count({ where: { userId: id } }),
      prisma.propertyShowing.count({ where: { userId: id } }),
      prisma.lead.count({ where: { ownerId: id } }),
      prisma.leadActivity.count({ where: { userId: id } }),
      prisma.leadTask.count({ where: { userId: id } }),
      prisma.crmGoal.count({ where: { ownerId: id } }),
      prisma.agentCommission.count({ where: { agentId: id } }),
      prisma.userSubscription.count({ where: { userId: id } }),
      prisma.bulkJob.count({ where: { createdById: id } }),
      prisma.listingDraft.count({ where: { userId: id } }),
      prisma.messageLog.count({ where: { sentById: id } }),
      prisma.messageLog.count({ where: { recipientId: id } }),
      prisma.kycProfile.count({ where: { userId: id } }),
      prisma.organization.count({ where: { whiteLabelAdminId: id } }),
      prisma.franchise.count({ where: { franchiseAdminId: id } }),
      prisma.branch.count({ where: { branchManagerId: id } }),
      prisma.department.count({ where: { departmentHeadId: id } }),
      prisma.team.count({ where: { teamLeaderId: id } }),
    ]);

    const blockers: { label: string; count: number }[] = [];
    const add = (label: string, count: number) => { if (count > 0) blockers.push({ label, count }); };

    add("Transactions", transactions);
    add("Property listings (as agent)", propertiesAsAgent);
    add("Properties submitted", propertiesSubmitted);
    add("Team members reporting to them", subordinates);
    add("Loan applications", loans);
    add("Meetings", meetingsAttended + meetingsCreated);
    add("Site-visit requests", showings);
    add("Inquiries", inquiries);
    add("Saved / favorite properties", favorites);
    add("CRM leads owned", leadsOwned);
    add("CRM lead activities", leadActivities);
    add("CRM lead tasks", leadTasks);
    add("CRM goals", crmGoals);
    add("Commission records", commissions);
    add("Subscriptions", subscriptions);
    add("Bulk jobs created", bulkJobs);
    add("Listing drafts", listingDrafts);
    add("Messages / notifications", messagesSent + messagesReceived);
    add("KYC profile", kyc);
    add("White-label organizations administered", orgsAdministered);
    add("Franchises administered", franchisesAdministered);
    add("Branches managed", branchesManaged);
    add("Departments headed", departmentsHeaded);
    add("Teams led", teamsLed);

    // Current org-structure membership (a single assignment each).
    if (user.teamRel) blockers.push({ label: `Member of team: ${user.teamRel.name}`, count: 1 });
    if (user.branchRel) blockers.push({ label: `Assigned to branch: ${user.branchRel.name}`, count: 1 });
    if (user.departmentRel) blockers.push({ label: `Assigned to department: ${user.departmentRel.name}`, count: 1 });
    if (user.franchiseRel) blockers.push({ label: `Assigned to franchise: ${user.franchiseRel.name}`, count: 1 });
    if (user.organizationRel) blockers.push({ label: `Belongs to organization: ${user.organizationRel.name}`, count: 1 });

    if (blockers.length > 0) {
      return NextResponse.json(
        {
          error: "This user can't be deleted.",
          reason:
            "The account has history and active relationships in the system. Deleting it would erase or orphan real records. Deactivate the user instead — this keeps every record intact and can be reversed later.",
          blockers,
          canDeactivate: true,
        },
        { status: 409 }
      );
    }

    // No associations at all — safe to hard-delete (e.g. a mistyped test account).
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    // Belt-and-braces: if a relation we don't yet count still blocks the delete,
    // surface it rather than a bare 500.
    if (e && typeof e === "object" && (e as { code?: string }).code === "P2003") {
      return NextResponse.json(
        {
          error: "This user can't be deleted.",
          reason: "The account still has linked records in the system. Deactivate the user instead.",
          canDeactivate: true,
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
