import { LeadStage } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { leadScopeForUser, requireCrmApi } from "@/lib/crm-access";
import { assignLeadOwner } from "@/lib/lead-routing";
import { prisma } from "@/lib/prisma";
import { calculateLeadScore } from "@/lib/lead-scoring";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  source: z.string().optional(),
  stage: z.nativeEnum(LeadStage).optional(),
  score: z.number().int().min(0).max(100).optional(),
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  propertyId: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  nextFollowUpAt: z.string().nullable().optional(),
  lifecycleStage: z.string().optional(),
  leadStatus: z.string().optional(),
});

export async function GET(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const ownerId = searchParams.get("ownerId");
  const source = searchParams.get("source");

  const scope = leadScopeForUser(auth.session.user.role, auth.userId);
  const leads = await prisma.lead.findMany({
    where: {
      ...scope,
      ...(stage && { stage: stage as LeadStage }),
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
    
    // Automatically calculate score if not explicitly provided
    const computedScore = data.score ?? calculateLeadScore({
      lifecycleStage,
      leadStatus,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      propertyId: data.propertyId,
    });

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone ?? null,
        source: data.source ?? "Website",
        stage: data.stage ?? LeadStage.NEW,
        score: computedScore,
        budgetMin: data.budgetMin ?? null,
        budgetMax: data.budgetMax ?? null,
        notes: data.notes ?? null,
        propertyId: data.propertyId ?? null,
        ownerId,
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
        lifecycleStage,
        leadStatus,
      },
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        userId: auth.session.user.id,
        type: "CREATED",
        message: "Lead created manually from CRM.",
      },
    });

    return NextResponse.json({ ok: true, lead });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
