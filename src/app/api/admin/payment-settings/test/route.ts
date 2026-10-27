import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { requireAdminApi } from "@/lib/admin-api";
import { isSuperAdmin } from "@/lib/roles";
import { stripeClientFor } from "@/lib/stripe";
import { getPaymentConfig, decryptPaymentConfig } from "@/lib/payment-settings";

export const dynamic = "force-dynamic";

/**
 * Live auth check for a configured gateway — a cheap, read-only authenticated
 * call (no charge). Returns ok/failed with a short, secret-free message so an
 * operator can confirm the stored keys actually work before going live.
 */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const scope = body?.scope === "platform" ? "platform" : "tenant";
  const provider = body?.provider === "stripe" ? "stripe" : body?.provider === "razorpay" ? "razorpay" : null;
  if (!provider) return NextResponse.json({ ok: false, error: "Specify provider: razorpay or stripe." }, { status: 400 });
  if (scope === "platform" && !isSuperAdmin(auth.session.user.role)) {
    return NextResponse.json({ ok: false, error: "Platform owner access required." }, { status: 403 });
  }

  const targetTenant = scope === "platform" ? null : auth.tenantId;
  const cfg = decryptPaymentConfig(await getPaymentConfig(targetTenant));

  // Test whatever keys would actually be used: saved config first, else the
  // environment keys (matching getResolvedGateway's fallback).
  const rzpKeyId = cfg.razorpay.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  const rzpSecret = cfg.razorpay.keySecret || process.env.RAZORPAY_KEY_SECRET || "";
  const strSecret = cfg.stripe.secretKey || process.env.STRIPE_SECRET_KEY || "";

  try {
    if (provider === "razorpay") {
      if (!rzpKeyId || !rzpSecret) {
        return NextResponse.json({ ok: false, error: "No Razorpay keys configured (saved config or environment)." }, { status: 400 });
      }
      const rzp = new Razorpay({ key_id: rzpKeyId, key_secret: rzpSecret });
      // Cheap authenticated read — fails fast on bad credentials.
      await rzp.orders.all({ count: 1 });
      const src = cfg.razorpay.keyId ? "saved" : "environment";
      const mode = rzpKeyId.startsWith("rzp_live_") ? "live" : "test";
      return NextResponse.json({ ok: true, provider, message: `Razorpay keys are valid (${mode} mode, ${src}).` });
    }

    // Stripe
    if (!strSecret) {
      return NextResponse.json({ ok: false, error: "No Stripe secret key configured (saved config or environment)." }, { status: 400 });
    }
    const client = stripeClientFor(strSecret);
    if (!client) return NextResponse.json({ ok: false, error: "Stripe secret key is invalid." }, { status: 400 });
    await client.balance.retrieve();
    const src = cfg.stripe.secretKey ? "saved" : "environment";
    const mode = strSecret.startsWith("sk_live_") ? "live" : "test";
    return NextResponse.json({ ok: true, provider, message: `Stripe keys are valid (${mode} mode, ${src}).` });
  } catch (e: any) {
    // Surface the gateway's own error text, never the keys.
    const msg = typeof e?.error?.description === "string" ? e.error.description : e?.message || "Authentication failed.";
    return NextResponse.json({ ok: false, provider, error: `${provider} check failed: ${msg}` }, { status: 502 });
  }
}
