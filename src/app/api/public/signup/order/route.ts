import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSignupOrder, activeSignupGateway } from "@/lib/signup-payment";

/**
 * Create a payment order/intent for a signup. Returns the gateway details the
 * client needs to open the checkout (Razorpay/Stripe), or { provider: "test" }
 * when no gateway is configured (simulate + provision directly).
 */
export async function POST(req: Request) {
  let planSlug: string;
  try {
    ({ planSlug } = z.object({ planSlug: z.string().min(1) }).parse(await req.json()));
  } catch {
    return NextResponse.json({ ok: false, error: "A plan is required." }, { status: 400 });
  }

  const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: planSlug, active: true } });
  if (!plan) return NextResponse.json({ ok: false, error: "That plan is not available." }, { status: 404 });

  try {
    const order = await createSignupOrder({ slug: plan.slug, name: plan.name, price: plan.price, currency: plan.currency });
    return NextResponse.json({ ok: true, gateway: activeSignupGateway(), order, planName: plan.name });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Could not start checkout." }, { status: 500 });
  }
}
