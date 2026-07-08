import { SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.nativeEnum(SubscriptionStatus).optional(),
  planId: z.string().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  currentPeriodEnd: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    const existing = await prisma.userSubscription.findUnique({
      where: { id: params.id },
      include: { plan: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    let planId = existing.planId;
    let amount = existing.amount;
    if (data.planId && data.planId !== existing.planId) {
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: data.planId } });
      if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      planId = plan.id;
      amount = plan.price;
    }

    const updated = await prisma.userSubscription.update({
      where: { id: params.id },
      data: {
        ...(data.status !== undefined && {
          status: data.status,
          cancelledAt: data.status === "CANCELLED" ? new Date() : null,
        }),
        ...(data.planId !== undefined && { planId, amount }),
        ...(data.cancelAtPeriodEnd !== undefined && { cancelAtPeriodEnd: data.cancelAtPeriodEnd }),
        ...(data.currentPeriodEnd !== undefined && {
          currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return NextResponse.json({ ok: true, subscription: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  await prisma.userSubscription.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
