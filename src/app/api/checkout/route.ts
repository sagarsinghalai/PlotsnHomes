import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import {
  calculatePaymentAmount,
  paymentMethodLabel,
  paymentPlanLabel,
  planTransactionType,
  type PaymentMethodId,
  type PaymentPlanId,
} from "@/lib/payment-plans";
import { getCompanyCurrency } from "@/lib/company-settings";
import { prisma } from "@/lib/prisma";
import { createStripeCheckoutSession } from "@/lib/stripe-checkout";
import { stripeConfigured } from "@/lib/stripe";
import { razorpayConfigured } from "@/lib/razorpay";
import { createRazorpayOrder } from "@/lib/razorpay-checkout";

const schema = z.object({
  propertyId: z.string(),
  plan: z.enum([
    "deposit_10",
    "partial_25",
    "investment_1k",
    "investment_5k",
    "investment_10k",
    "rent_first_month",
  ]),
  paymentMethod: z
    .enum(["all", "card", "upi", "netbanking", "wallet", "emi", "bank", "bnpl", "cashapp", "cheque", "neft_rtgs"])
    .default("upi"),
  type: z.enum(["DEPOSIT", "INVESTMENT", "LISTING_FEE", "RENT_PAYMENT"]).optional(),
  amount: z.number().positive().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const planId = data.plan as PaymentPlanId;
    const paymentMethod = data.paymentMethod as PaymentMethodId;
    const amount = data.amount ?? calculatePaymentAmount(planId, property);
    const txType = data.type ?? planTransactionType(planId);
    const amountCents = Math.round(amount * 100);

    const planLabel = paymentPlanLabel(planId);
    const methodLabel = paymentMethodLabel(paymentMethod);
    const currency = (await getCompanyCurrency()).toLowerCase();

    const isOffline = paymentMethod === "cheque" || paymentMethod === "neft_rtgs";
    const brokerageRate = property.brokerageRate ?? 3.0;
    const brokerageAmount = isOffline ? 0.0 : amount * (brokerageRate / 100);
    const sellerAmount = isOffline ? amount : amount - brokerageAmount;
    const balance = isOffline ? 0.0 : brokerageAmount;
    const received = "no";

    // ─── Offline Payment Methods (Cheque / NEFT / RTGS) ───────────────────────
    if (isOffline) {
      // Generate a unique human-readable reference number
      const refNo = `BV-REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

      // Fetch seller name if available
      const sellerRecord = property.submittedById
        ? await prisma.user.findUnique({ where: { id: property.submittedById }, select: { name: true } })
        : null;

      const tx = await prisma.transaction.create({
        data: {
          tenantId: property.tenantId,
          userId: session.user.id,
          propertyId: property.id,
          amount,
          currency: "inr",
          type: txType,
          status: "PENDING",
          paymentPlan: planId,
          paymentMethod,
          description: `${planLabel} via ${methodLabel} — ${property.title} (${property.symbol})`,
          brokerageRate: 0.0,
          brokerageAmount: 0.0,
          sellerAmount: amount,
          received: "no",
          balance: 0.0,
          referenceNo: refNo,
          buyerName: session.user.name ?? undefined,
          sellerName: sellerRecord?.name ?? undefined,
          notes: `Offline payment. Full amount to seller. Brokerage fee waived.`,
        },
      });

      return NextResponse.json({
        ok: true,
        redirectUrl: "/dashboard/transactions?success=1",
        transactionId: tx.id,
        referenceNo: refNo,
      });
    }

    // ─── Razorpay (preferred for INR / Indian users) ──────────────────────────
    if (razorpayConfigured()) {
      // Create Razorpay order first
      let razorpayOrder;
      try {
        razorpayOrder = await createRazorpayOrder({
          amountRupees: amount,
          currency: "INR",
          receipt: `bv_${Date.now()}`,
          notes: {
            propertyId: property.id,
            planId,
            paymentMethod,
            userId: session.user.id,
          },
        });
      } catch (rzpErr) {
        const msg = rzpErr instanceof Error ? rzpErr.message : "Razorpay order failed";
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      // Persist transaction with Razorpay order ID
      const sellerRecord2 = property.submittedById
        ? await prisma.user.findUnique({ where: { id: property.submittedById }, select: { name: true } })
        : null;

      const tx = await prisma.transaction.create({
        data: {
          tenantId: property.tenantId,
          userId: session.user.id,
          propertyId: property.id,
          amount,
          currency: "inr",
          type: txType,
          status: "PENDING",
          paymentPlan: planId,
          paymentMethod,
          razorpayOrderId: razorpayOrder.orderId,
          description: `${planLabel} via ${methodLabel} — ${property.title} (${property.symbol})`,
          brokerageRate,
          brokerageAmount,
          sellerAmount,
          received,
          balance,
          buyerName: session.user.name ?? undefined,
          sellerName: sellerRecord2?.name ?? undefined,
        },
      });

      return NextResponse.json({
        provider: "razorpay",
        orderId: razorpayOrder.orderId,
        amount: razorpayOrder.amount,     // in paise
        currency: razorpayOrder.currency,
        keyId: razorpayOrder.keyId,
        transactionId: tx.id,
        prefill: {
          name: session.user.name ?? "",
          email: session.user.email ?? "",
        },
        description: `${planLabel} — ${property.title}`,
        propertySymbol: property.symbol,
      });
    }

    // ─── Stripe fallback ──────────────────────────────────────────────────────
    if (!stripeConfigured()) {
      return NextResponse.json(
        {
          error: "No payment gateway configured",
          useDemo: true,
          message: "Add Razorpay keys to .env — see README",
        },
        { status: 503 }
      );
    }

    const tx = await prisma.transaction.create({
      data: {
        tenantId: property.tenantId,
        userId: session.user.id,
        propertyId: property.id,
        amount,
        currency,
        type: txType,
        status: "PENDING",
        paymentPlan: planId,
        paymentMethod,
        description: `${planLabel} via ${methodLabel} — ${property.title} (${property.symbol})`,
        brokerageRate,
        brokerageAmount,
        sellerAmount,
        received,
        balance,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

    let checkoutSession;
    try {
      checkoutSession = await createStripeCheckoutSession({
        amountCents,
        currency,
        productName: `${property.symbol} — ${planLabel}`,
        productDescription: `${methodLabel} · ${property.title}`,
        successUrl: `${appUrl}/dashboard/transactions?success=1&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${appUrl}/properties/${property.slug}?canceled=1`,
        customerEmail: session.user.email,
        paymentMethod: paymentMethod as "all" | "card" | "bank" | "wallet" | "bnpl" | "cashapp",
        metadata: {
          transactionId: tx.id,
          userId: session.user.id,
          propertyId: property.id,
          paymentPlan: planId,
          paymentMethod,
        },
      });
    } catch (stripeErr) {
      await prisma.transaction.update({
        where: { id: tx.id },
        data: { status: "FAILED" },
      });
      const message =
        stripeErr instanceof Error ? stripeErr.message : "Stripe checkout failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ provider: "stripe", url: checkoutSession.url, transactionId: tx.id });
  } catch (e) {
    console.error(e);
    const message = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
