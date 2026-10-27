import { razorpayConfigured } from "@/lib/razorpay";
import { createRazorpayOrder, verifyRazorpaySignature } from "@/lib/razorpay-checkout";
import { stripe, stripeConfigured } from "@/lib/stripe";

/**
 * Payment gateway behind self-serve signup / renewal.
 *
 * Razorpay is preferred, then Stripe; with neither configured the flow runs in
 * TEST MODE (payment simulated). Keys come from the environment
 * (RAZORPAY_KEY_ID/SECRET + NEXT_PUBLIC_RAZORPAY_KEY_ID, or STRIPE_SECRET_KEY +
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) — so going live is purely configuration.
 */
export type SignupGateway = "razorpay" | "stripe" | "test";

export function activeSignupGateway(): SignupGateway {
  if (razorpayConfigured()) return "razorpay";
  if (stripeConfigured()) return "stripe";
  return "test";
}

export type SignupOrder =
  | { provider: "test" }
  | { provider: "razorpay"; orderId: string; amount: number; currency: string; keyId: string }
  | { provider: "stripe"; clientSecret: string; publishableKey: string; amount: number; currency: string };

export type PlanForOrder = { slug: string; name: string; price: number; currency: string };

export async function createSignupOrder(plan: PlanForOrder): Promise<SignupOrder> {
  const gw = activeSignupGateway();
  if (gw === "test") return { provider: "test" };

  if (gw === "razorpay") {
    const order = await createRazorpayOrder({
      amountRupees: plan.price, // major units → the helper converts to the smallest unit
      currency: (plan.currency || "INR").toUpperCase(),
      receipt: `signup_${plan.slug}_${Date.now()}`.slice(0, 40),
      notes: { planSlug: plan.slug, kind: "tenant_signup" },
    });
    return { provider: "razorpay", orderId: order.orderId, amount: order.amount, currency: order.currency, keyId: order.keyId };
  }

  const amountMinor = Math.round(plan.price * 100);
  const currency = (plan.currency || "usd").toLowerCase();
  const intent = await stripe!.paymentIntents.create({
    amount: amountMinor,
    currency,
    metadata: { planSlug: plan.slug, kind: "tenant_signup" },
    automatic_payment_methods: { enabled: true },
  });
  return {
    provider: "stripe",
    clientSecret: intent.client_secret ?? "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    amount: amountMinor,
    currency,
  };
}

export type PaymentProof = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  stripe_payment_intent_id?: string;
};

/**
 * Verify the payment before provisioning. In test mode it always passes (no
 * gateway). With a gateway configured, a missing/invalid proof fails — so no one
 * can provision a paid tenant without paying.
 */
export async function verifySignupPayment(proof: PaymentProof): Promise<{ ok: boolean; ref?: string; error?: string }> {
  const gw = activeSignupGateway();
  if (gw === "test") return { ok: true, ref: "test-mode" };

  if (gw === "razorpay") {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = proof;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { ok: false, error: "Payment was not completed." };
    }
    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return { ok: false, error: "Payment verification failed." };
    }
    return { ok: true, ref: `rzp:${razorpay_payment_id}` };
  }

  const pi = proof.stripe_payment_intent_id;
  if (!pi) return { ok: false, error: "Payment was not completed." };
  try {
    const intent = await stripe!.paymentIntents.retrieve(pi);
    if (intent.status !== "succeeded") return { ok: false, error: `Payment not completed (${intent.status}).` };
    return { ok: true, ref: `stripe:${pi}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not verify the Stripe payment." };
  }
}
