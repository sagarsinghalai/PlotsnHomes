import type Stripe from "stripe";
import type { PaymentMethodId } from "@/lib/payment-plans";
import { stripe } from "@/lib/stripe";

/** Stripe Checkout payment_method_types for the user's chosen rail. */
export function stripePaymentMethodTypes(
  method: PaymentMethodId,
  currency = "usd"
): NonNullable<Stripe.Checkout.SessionCreateParams["payment_method_types"]> {
  const isIndia = currency.toLowerCase() === "inr";
  if (isIndia) {
    return ["card"];
  }

  switch (method) {
    case "card":
      return ["card", "link"];
    case "bank":
      return ["us_bank_account"];
    case "wallet":
      return ["card"];
    case "cashapp":
      return ["cashapp", "card"];
    case "bnpl":
      return ["klarna", "affirm", "card"];
    case "all":
    default:
      return [
        "card",
        "us_bank_account",
        "link",
        "cashapp",
        "klarna",
        "affirm",
      ];
  }
}

export async function createStripeCheckoutSession(params: {
  amountCents: number;
  currency?: string;
  productName: string;
  productDescription: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail: string;
  paymentMethod: PaymentMethodId;
  metadata: Record<string, string>;
}) {
  if (!stripe) throw new Error("Stripe not configured");

  const currency = (params.currency ?? "inr").toLowerCase();
  const paymentMethodTypes = stripePaymentMethodTypes(params.paymentMethod, currency);

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "payment",
    payment_method_types: paymentMethodTypes,
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: params.productName,
            description: params.productDescription,
          },
          unit_amount: params.amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    customer_email: params.customerEmail,
    metadata: params.metadata,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  };

  if (paymentMethodTypes.includes("us_bank_account")) {
    sessionParams.payment_method_options = {
      us_bank_account: {
        financial_connections: {
          permissions: ["payment_method", "balances"],
        },
        verification_method: "automatic",
      },
    };
  }

  try {
    return await stripe.checkout.sessions.create(sessionParams);
  } catch (err) {
    const stripeErr = err as { message?: string };
    const msg = stripeErr.message ?? "";
    if (
      params.paymentMethod !== "card" &&
      (msg.includes("payment_method") || msg.includes("not enabled"))
    ) {
      return stripe.checkout.sessions.create({
        ...sessionParams,
        payment_method_types: ["card", "link"],
      });
    }
    throw err;
  }
}
