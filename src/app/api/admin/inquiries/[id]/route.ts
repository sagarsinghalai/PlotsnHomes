import { LeadStage } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { assignLeadOwner } from "@/lib/lead-routing";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: params.id },
      include: { property: { select: { id: true, title: true, symbol: true, agentId: true } }, lead: true },
    });
    if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (inquiry.lead) {
      return NextResponse.json({ ok: true, lead: inquiry.lead, alreadyConverted: true });
    }

    const duplicate = await prisma.lead.findFirst({
      where: { email: inquiry.email, phone: inquiry.phone ?? undefined },
    });
    if (duplicate) {
      return NextResponse.json({
        ok: true,
        lead: duplicate,
        alreadyConverted: true,
        duplicateMatch: true,
      });
    }

    const ownerId = await assignLeadOwner(inquiry.property.agentId);
    const lead = await prisma.lead.create({
      data: {
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        source: "Property Inquiry",
        stage: LeadStage.NEW,
        propertyId: inquiry.propertyId,
        ownerId,
        inquiryId: inquiry.id,
        notes: inquiry.message,
        score: 60,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        userId: auth.session.user.id,
        type: "CONVERTED",
        message: `Converted from property inquiry (${inquiry.property.symbol}).`,
      },
    });

    return NextResponse.json({ ok: true, lead });
  } catch {
    return NextResponse.json({ error: "Convert failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    await prisma.inquiry.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
