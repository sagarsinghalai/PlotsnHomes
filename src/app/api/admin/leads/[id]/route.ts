import { LeadStage } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { leadScopeForUser, requireCrmApi } from "@/lib/crm-access";
import { prisma } from "@/lib/prisma";
import { noTenantResponse } from "@/lib/data-access";
import { calculateLeadScore, refreshLeadScore } from "@/lib/lead-scoring";

const patchSchema = z.object({
  stage: z.nativeEnum(LeadStage).optional(),
  score: z.number().int().min(0).max(100).optional(),
  ownerId: z.string().nullable().optional(),
  nextFollowUpAt: z.string().nullable().optional(),
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  source: z.string().optional(),
  notes: z.string().nullable().optional(),
  budgetMin: z.number().nullable().optional(),
  budgetMax: z.number().nullable().optional(),
  propertyId: z.string().nullable().optional(),
  lifecycleStage: z.string().optional(),
  leadStatus: z.string().optional(),
  requirements: z.string().nullable().optional(),
  suggestedPropertyIds: z.string().nullable().optional(),
});

const postSchema = z.object({
  action: z.enum(["note", "task", "call", "meeting", "email"]),
  message: z.string().optional(),
  title: z.string().optional(),
  dueAt: z.string().optional(),
});

async function getLeadIfAllowed(id: string, auth: NonNullable<Awaited<ReturnType<typeof requireCrmApi>> & { error?: never }>) {
  const scope = leadScopeForUser(auth.session.user.role, auth.userId, auth.tenantId);
  return prisma.lead.findFirst({ where: { id, ...scope } });
}



export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  if (!auth.tenantId) return noTenantResponse();
  try {
    const existing = await getLeadIfAllowed(params.id, auth);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = patchSchema.parse(await req.json());
    if (!auth.isAdmin && data.ownerId !== undefined && data.ownerId !== auth.userId) {
      return NextResponse.json({ error: "Cannot reassign lead" }, { status: 403 });
    }

    // Load full lead for scoring calculation first
    const fullLeadForScoring = await prisma.lead.findUnique({
      where: { id: params.id },
      include: { tasks: true, activities: true },
    });

    let score = data.score;
    if (score === undefined && fullLeadForScoring) {
      const mergedLead = {
        lifecycleStage: data.lifecycleStage !== undefined ? data.lifecycleStage : fullLeadForScoring.lifecycleStage,
        leadStatus: data.leadStatus !== undefined ? data.leadStatus : fullLeadForScoring.leadStatus,
        budgetMin: data.budgetMin !== undefined ? data.budgetMin : fullLeadForScoring.budgetMin,
        budgetMax: data.budgetMax !== undefined ? data.budgetMax : fullLeadForScoring.budgetMax,
        propertyId: data.propertyId !== undefined ? data.propertyId : fullLeadForScoring.propertyId,
        tasks: fullLeadForScoring.tasks,
        activities: fullLeadForScoring.activities,
      };
      score = calculateLeadScore(mergedLead);
    }

    const updated = await prisma.lead.update({
      where: { id: params.id },
      data: {
        ...(data.stage !== undefined && { stage: data.stage }),
        ...(score !== undefined && { score }),
        ...(data.ownerId !== undefined && { ownerId: data.ownerId }),
        ...(data.nextFollowUpAt !== undefined && {
          nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
        }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.budgetMin !== undefined && { budgetMin: data.budgetMin }),
        ...(data.budgetMax !== undefined && { budgetMax: data.budgetMax }),
        ...(data.propertyId !== undefined && { propertyId: data.propertyId }),
        ...(data.lifecycleStage !== undefined && { lifecycleStage: data.lifecycleStage }),
        ...(data.leadStatus !== undefined && { leadStatus: data.leadStatus }),
        ...(data.requirements !== undefined && { requirements: data.requirements }),
        ...(data.suggestedPropertyIds !== undefined && { suggestedPropertyIds: data.suggestedPropertyIds }),
      },
    });

    if (data.stage !== undefined) {
      await prisma.leadActivity.create({
        data: {
          tenantId: auth.tenantId,
          leadId: params.id,
          userId: auth.session.user.id,
          type: "STAGE",
          message: `Stage changed to ${data.stage.replace("_", " ")}`,
        },
      });
      // Stage change updates score
      await refreshLeadScore(params.id);
    }
    return NextResponse.json({ ok: true, lead: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  if (!auth.tenantId) return noTenantResponse();
  try {
    const existing = await getLeadIfAllowed(params.id, auth);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = postSchema.parse(await req.json());
    if (data.action === "note" || data.action === "call" || data.action === "meeting" || data.action === "email") {
      if (!data.message?.trim()) {
        return NextResponse.json({ error: "Message required" }, { status: 400 });
      }
      const activityType = data.action === "call" ? "CALL" : data.action === "meeting" ? "MEETING" : data.action === "email" ? "EMAIL" : "NOTE";
      const activity = await prisma.leadActivity.create({
        data: {
          tenantId: auth.tenantId,
          leadId: params.id,
          userId: auth.session.user.id,
          type: activityType,
          message: data.message.trim(),
        },
      });
      await refreshLeadScore(params.id);
      return NextResponse.json({ ok: true, activity });
    }
    
    if (!data.title?.trim()) {
      return NextResponse.json({ error: "Task title required" }, { status: 400 });
    }
    const task = await prisma.leadTask.create({
      data: {
        tenantId: auth.tenantId,
        leadId: params.id,
        userId: auth.session.user.id,
        title: data.title.trim(),
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      },
    });
    await refreshLeadScore(params.id);
    return NextResponse.json({ ok: true, task });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

