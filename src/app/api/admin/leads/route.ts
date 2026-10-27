import { LeadStage } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { leadScopeForUser, requireCrmApi } from "@/lib/crm-access";
import { noTenantResponse } from "@/lib/data-access";
import { assignLeadOwner } from "@/lib/lead-routing";
import { prisma } from "@/lib/prisma";
import { calculateLeadScore } from "@/lib/lead-scoring";
import { notifyAgentNewLead } from "@/lib/whatsapp-central";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.union([z.string().email(), z.literal("")]).nullable().optional(),
  phone: z.string().min(1, "Phone number is required"),
  source: z.string().optional(),
  stage: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  propertyId: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  nextFollowUpAt: z.string().nullable().optional(),
  lifecycleStage: z.string().optional(),
  leadStatus: z.string().optional(),
  requirements: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const ownerId = searchParams.get("ownerId");
  const source = searchParams.get("source");

  const scope = await leadScopeForUser(auth.session.user.role, auth.userId, auth.tenantId);
  const leads = await prisma.lead.findMany({
    where: {
      ...scope,
      ...(stage && { stage: stage as any }),
      ...(ownerId && auth.isAdmin && { ownerId }),
      ...(source && { source }),
    },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
    include: {
      property: { select: { id: true, title: true, symbol: true, slug: true } },
      owner: { select: { id: true, name: true } },
    },
    take: 500,
  });

  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  if (!auth.tenantId) return noTenantResponse();

  try {
    const data = createSchema.parse(await req.json());
    let ownerId = data.ownerId ?? null;
    if (!auth.isAdmin) {
      ownerId = auth.userId;
    } else if (!ownerId) {
      const property = data.propertyId
        ? await prisma.property.findUnique({
            where: { id: data.propertyId },
            select: { agentId: true },
          })
        : null;
      ownerId = await assignLeadOwner(property?.agentId);
    }

    const lifecycleStage = data.lifecycleStage ?? "Lead";
    const leadStatus = data.leadStatus ?? "New";
    
    // Map stage string to Prisma enum if valid, or default to NEW
    let stageEnum: LeadStage = LeadStage.NEW;
    if (data.stage) {
      const upper = data.stage.toUpperCase().replace(/\s+/g, "_");
      if (Object.values(LeadStage).includes(upper as LeadStage)) {
        stageEnum = upper as LeadStage;
      }
    }

    const computedScore = data.score ?? calculateLeadScore({
      lifecycleStage,
      leadStatus,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      propertyId: data.propertyId,
    });

    const lead = await prisma.lead.create({
      data: {
        tenantId: auth.tenantId,
        name: data.name,
        email: data.email ? data.email : "",
        phone: data.phone,
        source: data.source ?? "Website",
        stage: stageEnum,
        score: computedScore,
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
        notes: data.notes ?? null,
        propertyId: data.propertyId ?? null,
        ownerId,
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
        lifecycleStage,
        leadStatus,
        requirements: data.requirements ?? null,
      },
    });

    await prisma.leadActivity.create({
      data: {
        tenantId: auth.tenantId,
        leadId: lead.id,
        userId: auth.session.user.id,
        type: "CREATED",
        message: "Opportunity created in CRM.",
      },
    });

    if (lead.ownerId) void notifyAgentNewLead(lead.id);

    return NextResponse.json({ ok: true, lead });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
