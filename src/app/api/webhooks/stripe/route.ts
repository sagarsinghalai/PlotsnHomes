import { NextResponse } from "next/server";
import Stripe from "stripe";
import { completeTransaction } from "@/lib/complete-transaction";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (secret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, secret);
    } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    console.warn("[PlotsnHomes] STRIPE_WEBHOOK_SECRET not set — parsing body without verification (dev only)");
    event = JSON.parse(body) as Stripe.Event;
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const transactionId = checkoutSession.metadata?.transactionId;

    if (transactionId && checkoutSession.payment_status === "paid") {
      try {
        await completeTransaction(transactionId);
      } catch (e) {
        console.error("[PlotsnHomes] webhook complete:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
