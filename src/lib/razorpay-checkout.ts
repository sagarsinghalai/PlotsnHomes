import crypto from "crypto";
import { razorpay } from "@/lib/razorpay";

export interface RazorpayOrderResult {
  orderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
}

/**
 * Creates a Razorpay order on the server.
 * Amount should be in rupees (we convert to paise internally).
 */
export async function createRazorpayOrder(params: {
  amountRupees: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResult> {
  if (!razorpay) throw new Error("Razorpay not configured");

  const currency = (params.currency ?? "INR").toUpperCase();
  const amountPaise = Math.round(params.amountRupees * 100);

  const order = await razorpay.orders.create({
    amount: amountPaise,
    currency,
    receipt: params.receipt.slice(0, 40), // Razorpay max 40 chars
    notes: params.notes ?? {},
  });

  return {
    orderId: order.id,
    amount: amountPaise,
    currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
  };
}

/**
 * Verifies Razorpay payment signature (HMAC-SHA256).
 * Must be done server-side before completing transaction.
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expected === razorpaySignature;
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
