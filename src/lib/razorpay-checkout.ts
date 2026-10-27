import crypto from "crypto";
import Razorpay from "razorpay";
import { razorpay } from "@/lib/razorpay";

export interface RazorpayOrderResult {
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
}

/** Explicit per-tenant/platform credentials, when not using the env singleton. */
export interface RazorpayCreds {
  keyId: string;
  keySecret: string;
}

/**
 * Creates a Razorpay order on the server.
 * Amount should be in rupees (we convert to paise internally).
 * Pass `creds` to use tenant/platform-configured keys; omit to use the env singleton.
 */
export async function createRazorpayOrder(params: {
  amountRupees: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
  creds?: RazorpayCreds;
}): Promise<RazorpayOrderResult> {
  const client = params.creds
    ? new Razorpay({ key_id: params.creds.keyId, key_secret: params.creds.keySecret })
    : razorpay;
  if (!client) throw new Error("Razorpay not configured");

  const currency = (params.currency ?? "INR").toUpperCase();
  const amountPaise = Math.round(params.amountRupees * 100);

  const order = await client.orders.create({
    amount: amountPaise,
    currency,
    receipt: params.receipt.slice(0, 40), // Razorpay max 40 chars
    notes: params.notes ?? {},
  });

  return {
    orderId: order.id,
    amount: amountPaise,
    currency,
    keyId: params.creds?.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
  };
}

/**
 * Verifies Razorpay payment signature (HMAC-SHA256).
 * Must be done server-side before completing transaction.
 * Pass `keySecret` to verify against tenant/platform-configured keys.
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  keySecret?: string
): boolean {
  const secret = keySecret || process.env.RAZORPAY_KEY_SECRET || "";
  if (!secret) return false;
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  // Length-safe constant-time compare.
  const a = Buffer.from(expected);
  const b = Buffer.from(razorpaySignature || "");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Verifies Razorpay webhook signature.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  if (!secret) return true; // dev-only bypass
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}
