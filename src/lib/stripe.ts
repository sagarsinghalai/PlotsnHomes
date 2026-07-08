import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY?.trim();

export const stripe = stripeSecret ? new Stripe(stripeSecret) : null;

export function stripeConfigured() {
  const sk = process.env.STRIPE_SECRET_KEY?.trim();
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return Boolean(
    stripe &&
      sk &&
      pk &&
      sk.length > 10 &&
      pk.length > 10 &&
      (sk.startsWith("sk_test_") || sk.startsWith("sk_live_")) &&
      (pk.startsWith("pk_test_") || pk.startsWith("pk_live_"))
  );
}
