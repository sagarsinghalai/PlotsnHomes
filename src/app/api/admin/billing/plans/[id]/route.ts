import { SubscriptionInterval } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  interval: z.nativeEnum(SubscriptionInterval).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  features: z.array(z.string()).optional(),
  targetRole: z.string().nullable().optional(),
  trialDays: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);
    const plan = await prisma.subscriptionPlan.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug.toLowerCase() }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.interval !== undefined && { interval: data.interval }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.features !== undefined && {
          featuresJson: JSON.stringify(data.features),
        }),
        ...(data.targetRole !== undefined && { targetRole: data.targetRole }),
        ...(data.trialDays !== undefined && { trialDays: data.trialDays }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
    return NextResponse.json({ ok: true, plan });
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

  const count = await prisma.userSubscription.count({ where: { planId: params.id } });
  if (count > 0) {
    return NextResponse.json(
      { error: "Cannot delete plan with active subscribers. Deactivate instead." },
      { status: 400 }
    );
  }
  await prisma.subscriptionPlan.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
