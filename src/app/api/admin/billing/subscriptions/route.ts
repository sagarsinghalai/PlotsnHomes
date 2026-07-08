import { SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { periodEndFromInterval } from "@/lib/subscription";

const assignSchema = z.object({
  userId: z.string(),
  planId: z.string(),
  status: z.nativeEnum(SubscriptionStatus).optional(),
  notes: z.string().optional(),
});

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const subscriptions = await prisma.userSubscription.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      plan: true,
    },
  });
  return NextResponse.json({ subscriptions });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const data = assignSchema.parse(body);

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: data.planId } });
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const start = new Date();
    const end = periodEndFromInterval(start, plan.interval);

    const sub = await prisma.userSubscription.create({
      data: {
        userId: data.userId,
        planId: plan.id,
        status: data.status ?? (plan.trialDays > 0 ? "TRIALING" : "ACTIVE"),
        amount: plan.price,
        currency: plan.currency,
        currentPeriodStart: start,
        currentPeriodEnd: end,
        notes: data.notes ?? null,
      },
    });

    await prisma.transaction.create({
      data: {
        userId: data.userId,
        amount: plan.price,
        currency: plan.currency,
        type: "SUBSCRIPTION",
        status: "COMPLETED",
        description: `Subscription: ${plan.name} (${plan.interval})`,
        paymentPlan: plan.slug,
      },
    });

    return NextResponse.json({ ok: true, subscription: sub });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Could not assign subscription" }, { status: 500 });
  }
}
