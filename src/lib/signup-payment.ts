import { createRazorpayOrder, verifyRazorpaySignature } from "@/lib/razorpay-checkout";
import { stripeClientFor } from "@/lib/stripe";
import { getResolvedGateway, type ResolvedGateway } from "@/lib/payment-settings";

/**
 * Payment gateway behind self-serve signup / renewal.
 *
 * The SUBSCRIPTION flow always uses the PLATFORM gateway — the global payment
 * config (Settings → Payments, saved with no tenant) with an environment-key
 * fallback. So subscription revenue flows to the platform owner and every
 * signup invoice is issued in the platform company's name. With neither a
 * stored config nor env keys the flow runs in TEST MODE (payment simulated).
 */
export type SignupGateway = "razorpay" | "stripe" | "test";

/** Resolve the platform (subscription) gateway with live, decrypted credentials. */
export function resolvePlatformGateway(): Promise<ResolvedGateway> {
  return getResolvedGateway(null);
}

/** The active platform gateway kind (async — reads config + env). */
export async function activeSignupGateway(): Promise<SignupGateway> {
  return (await resolvePlatformGateway()).provider;
}

export type SignupOrder =
  | { provider: "test" }
  | { provider: "razorpay"; orderId: string; amount: number; currency: string; keyId: string }
  | { provider: "stripe"; clientSecret: string; publishableKey: string; amount: number; currency: string };

export type PlanForOrder = { slug: string; name: string; price: number; currency: string };

export async function createSignupOrder(plan: PlanForOrder): Promise<SignupOrder> {
  const gw = await resolvePlatformGateway();
  if (gw.provider === "test") return { provider: "test" };

  if (gw.provider === "razorpay") {
    const order = await createRazorpayOrder({
      amountRupees: plan.price, // major units → the helper converts to the smallest unit
      currency: (plan.currency || "INR").toUpperCase(),
      receipt: `signup_${plan.slug}_${Date.now()}`.slice(0, 40),
      notes: { planSlug: plan.slug, kind: "tenant_signup" },
      creds: { keyId: gw.keyId, keySecret: gw.keySecret },
    });
    return { provider: "razorpay", orderId: order.orderId, amount: order.amount, currency: order.currency, keyId: order.keyId };
  }

  // Stripe
  const amountMinor = Math.round(plan.price * 100);
  const currency = (plan.currency || "usd").toLowerCase();
  const client = stripeClientFor(gw.secretKey);
  if (!client) throw new Error("Stripe is not configured.");
  const intent = await client.paymentIntents.create({
    amount: amountMinor,
    currency,
    metadata: { planSlug: plan.slug, kind: "tenant_signup" },
    automatic_payment_methods: { enabled: true },
  });
  return {
    provider: "stripe",
    clientSecret: intent.client_secret ?? "",
    publishableKey: gw.publishableKey,
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
 * can provision a paid tenant without paying. Verifies against the PLATFORM
 * gateway's live credentials (config or env).
 */
export async function verifySignupPayment(proof: PaymentProof): Promise<{ ok: boolean; ref?: string; error?: string }> {
  const gw = await resolvePlatformGateway();
  if (gw.provider === "test") return { ok: true, ref: "test-mode" };

  if (gw.provider === "razorpay") {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = proof;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return { ok: false, error: "Payment was not completed." };
    }
    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, gw.keySecret)) {
      return { ok: false, error: "Payment verification failed." };
    }
    return { ok: true, ref: `rzp:${razorpay_payment_id}` };
  }

  // Stripe
  const pi = proof.stripe_payment_intent_id;
  if (!pi) return { ok: false, error: "Payment was not completed." };
  const client = stripeClientFor(gw.secretKey);
  if (!client) return { ok: false, error: "Stripe is not configured." };
  try {
    const intent = await client.paymentIntents.retrieve(pi);
    if (intent.status !== "succeeded") return { ok: false, error: `Payment not completed (${intent.status}).` };
    return { ok: true, ref: `stripe:${pi}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Could not verify the Stripe payment." };
  }
}
