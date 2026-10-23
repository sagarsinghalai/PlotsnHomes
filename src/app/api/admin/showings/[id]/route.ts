import { LeadStage, ShowingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { assignLeadOwner } from "@/lib/lead-routing";
import { prisma } from "@/lib/prisma";
import { notifyAgentNewLead } from "@/lib/whatsapp-central";
import { tenantScope, noTenantResponse } from "@/lib/data-access";

const patchSchema = z.object({
  status: z.nativeEnum(ShowingStatus).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const data = patchSchema.parse(await req.json());
    const showing = await prisma.propertyShowing.update({
      where: { id: params.id },
      data: { ...(data.status !== undefined && { status: data.status }) },
    });
    return NextResponse.json({ ok: true, showing });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  if (!auth.tenantId) return noTenantResponse();

  try {
    const showing = await prisma.propertyShowing.findFirst({
      where: { id: params.id, ...tenantScope(auth.tenantId) },
      include: {
        property: { select: { id: true, title: true, symbol: true, agentId: true } },
        lead: true,
      },
    });
    if (!showing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (showing.lead) {
      return NextResponse.json({ ok: true, lead: showing.lead, alreadyConverted: true });
    }

    const ownerId = await assignLeadOwner(showing.property.agentId);
    const lead = await prisma.lead.create({
      data: {
        tenantId: showing.tenantId,
        name: showing.name,
        email: showing.email,
        phone: showing.phone,
        source: "Site Visit",
        stage: LeadStage.SITE_VISIT,
        propertyId: showing.propertyId,
        ownerId,
        showingId: showing.id,
        notes: showing.message ?? `Tour ${showing.tourType} on ${showing.tourDate.toISOString().slice(0, 10)} at ${showing.tourTime}`,
        score: 70,
        nextFollowUpAt: showing.tourDate,
      },
    });

    await prisma.leadActivity.create({
      data: {
        tenantId: showing.tenantId,
        leadId: lead.id,
        userId: auth.session.user.id,
        type: "CONVERTED",
        message: `Converted from site visit request (${showing.property.symbol}).`,
      },
    });

    if (lead.ownerId) void notifyAgentNewLead(lead.id);

    return NextResponse.json({ ok: true, lead });
  } catch {
    return NextResponse.json({ error: "Convert failed" }, { status: 500 });
  }
}
