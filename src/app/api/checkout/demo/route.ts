import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { sendEmail, transactionEmailHtml } from "@/lib/email";
import {
  calculatePaymentAmount,
  paymentMethodLabel,
  paymentPlanLabel,
  planTransactionType,
  type PaymentMethodId,
  type PaymentPlanId,
} from "@/lib/payment-plans";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  propertyId: z.string(),
  plan: z
    .enum([
      "deposit_10",
      "partial_25",
      "investment_1k",
      "investment_5k",
      "investment_10k",
      "rent_first_month",
    ])
    .default("deposit_10"),
  paymentMethod: z
    .enum(["all", "card", "upi", "netbanking", "wallet", "emi", "bank", "bnpl", "cashapp", "cheque", "neft_rtgs"])
    .default("all"),
});

/** Demo payment when Stripe keys are not set — always completes even if email log fails. */
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
    const amount = calculatePaymentAmount(planId, property);
    const txType = planTransactionType(planId);
    const planLabel = paymentPlanLabel(planId);
    const methodLabel = paymentMethodLabel(paymentMethod);
    const description = `${planLabel} via ${methodLabel} (demo) — ${property.title} (${property.symbol})`;

    const isOffline = paymentMethod === "cheque" || paymentMethod === "neft_rtgs";
    const brokerageRate = isOffline ? 0.0 : (property.brokerageRate ?? 3.0);
    const brokerageAmount = isOffline ? 0.0 : amount * (brokerageRate / 100);
    const sellerAmount = isOffline ? amount : amount - brokerageAmount;

    const tx = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        propertyId: property.id,
        amount,
        type: txType,
        status: isOffline ? "PENDING" : "COMPLETED",
        paymentPlan: planId,
        paymentMethod,
        description,
        stripeSessionId: `demo_${Date.now()}`,
        brokerageRate,
        brokerageAmount,
        sellerAmount,
        received: isOffline ? "no" : "yes",
        balance: 0.0,
      },
    });

    try {
      await sendEmail({
        to: session.user.email,
        subject: "Payment confirmed — PlotsnHomes (Demo)",
        html: transactionEmailHtml(formatCurrency(amount), description, property.symbol),
      });
    } catch (emailErr) {
      console.error("[PlotsnHomes] payment email error:", emailErr);
    }

    return NextResponse.json({
      ok: true,
      demo: true,
      transactionId: tx.id,
      amount,
      redirectUrl: "/dashboard/transactions?success=1&demo=1",
    });
  } catch (e) {
    console.error("[PlotsnHomes] demo payment:", e);
    const msg =
      e instanceof Error ? e.message : "Demo payment failed";
    return NextResponse.json(
      {
        error: msg.includes("paymentPlan")
          ? "Database out of date — stop server, run: npx prisma generate && npx prisma db push"
          : msg,
      },
      { status: 500 }
    );
  }
}
