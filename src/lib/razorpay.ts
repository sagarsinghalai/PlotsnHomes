import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID?.trim();
const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

export const razorpay =
  keyId && keySecret
    ? new Razorpay({ key_id: keyId, key_secret: keySecret })
    : null;

export function razorpayConfigured(): boolean {
  const id = process.env.RAZORPAY_KEY_ID?.trim();
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const pubKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim();
  return Boolean(
    id &&
      secret &&
      pubKey &&
      id.length > 10 &&
      secret.length > 10 &&
      (id.startsWith("rzp_test_") || id.startsWith("rzp_live_"))
  );
}
