import { SubscriptionInterval } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const planSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  interval: z.nativeEnum(SubscriptionInterval),
  price: z.number().min(0),
  currency: z.string().default("usd"),
  features: z.array(z.string()).optional(),
  targetRole: z.string().optional(),
  trialDays: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const plans = await prisma.subscriptionPlan.findMany({
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
    include: { _count: { select: { subscriptions: true } } },
  });
  return NextResponse.json({ plans });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const data = planSchema.parse(body);
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: data.name,
        slug: data.slug.toLowerCase().replace(/\s+/g, "-"),
        description: data.description ?? null,
        interval: data.interval,
        price: data.price,
        currency: data.currency,
        featuresJson: data.features ? JSON.stringify(data.features) : null,
        targetRole: data.targetRole ?? "ALL",
        trialDays: data.trialDays ?? 0,
        active: data.active ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    return NextResponse.json({ ok: true, plan });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Could not create plan" }, { status: 500 });
  }
}
