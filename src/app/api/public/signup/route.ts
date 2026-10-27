import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { provisionTenantSignup } from "@/lib/signup";
import { verifySignupPayment } from "@/lib/signup-payment";

/**
 * Public self-serve white-label signup. Verifies the payment (real gateway when
 * configured, simulated in test mode) and then provisions the tenant + White
 * Label Admin + active subscription.
 */
const schema = z.object({
  planSlug: z.string().min(1, "Choose a plan"),
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().trim().min(2, "Enter your company / agency name"),
  domain: z.string().trim().optional().or(z.literal("")),
  // Payment proof (present once a real gateway is configured).
  razorpay_order_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  razorpay_signature: z.string().optional(),
  stripe_payment_intent_id: z.string().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    // Free plans need no payment; otherwise verify first (passes in test mode).
    const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: parsed.data.planSlug, active: true }, select: { price: true } });
    const isFree = !plan || plan.price <= 0;

    let paymentRef: string | undefined;
    if (!isFree) {
      const paid = await verifySignupPayment(parsed.data);
      if (!paid.ok) {
        return NextResponse.json({ ok: false, error: paid.error }, { status: 402 });
      }
      paymentRef = paid.ref;
    }

    const result = await provisionTenantSignup({ ...parsed.data, paymentRef });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      ok: true,
      testMode: true,
      email: result.email,
      plan: result.planName,
      expiresAt: result.expiresAt ? result.expiresAt.toISOString() : null,
      message: "Your workspace is ready. Sign in to get started.",
    });
  } catch (e: any) {
    console.error("[signup] provisioning failed:", e?.message);
    return NextResponse.json({ ok: false, error: "Could not complete signup. Please try again." }, { status: 500 });
  }
}
