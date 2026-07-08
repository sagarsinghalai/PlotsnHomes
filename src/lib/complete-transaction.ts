import { sendEmail, transactionEmailHtml } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { verifyRazorpaySignature } from "@/lib/razorpay-checkout";
import { formatCurrency } from "@/lib/utils";

/** Mark transaction COMPLETED after Stripe/Razorpay payment and send confirmation email. */
export async function completeTransaction(transactionId: string) {
  const tx = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: "COMPLETED",
      received: "yes",
      balance: 0.0,
      completedAt: new Date(),
    },
    include: {
      user: true,
      property: { select: { symbol: true, title: true } },
    },
  });

  if (tx.status === "COMPLETED") {
    try {
      const platformFee = tx.brokerageAmount ?? 0;
      const sellerPayout = tx.sellerAmount ?? (tx.amount - platformFee);
      const breakdown = tx.brokerageRate > 0
        ? `Platform fee (${tx.brokerageRate}%): ${formatCurrency(platformFee)} · Seller payout: ${formatCurrency(sellerPayout)}`
        : `Brokerage fee waived (offline payment) · Full amount to seller: ${formatCurrency(sellerPayout)}`;

      await sendEmail({
        to: tx.user.email,
        subject: "Payment confirmed — PlotsnHomes",
        html: transactionEmailHtml(
          formatCurrency(tx.amount),
          `${tx.description ?? "Your payment was successful."}\n${breakdown}`,
          tx.property?.symbol
        ),
      });
    } catch (e) {
      console.error("[PlotsnHomes] confirmation email:", e);
    }
  }

  return tx;
}


/** Verify Stripe Checkout session and complete matching transaction. */
export async function completeTransactionFromStripeSession(
  checkoutSessionId: string,
  userId: string
) {
  if (!stripe) {
    throw new Error("Stripe not configured");
  }

  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);

  if (session.payment_status !== "paid") {
    return { ok: false as const, reason: "Payment not completed" };
  }

  const transactionId = session.metadata?.transactionId;
  if (!transactionId) {
    return { ok: false as const, reason: "Missing transaction metadata" };
  }

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  if (!tx || tx.userId !== userId) {
    return { ok: false as const, reason: "Transaction not found" };
  }

  if (tx.status === "COMPLETED") {
    return { ok: true as const, alreadyCompleted: true, transaction: tx };
  }

  const completed = await completeTransaction(transactionId);
  return { ok: true as const, alreadyCompleted: false, transaction: completed };
}

/** Verify Razorpay payment signature and complete matching transaction. */
export async function completeTransactionFromRazorpay(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  userId: string
) {
  const isValid = verifyRazorpaySignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    return { ok: false as const, reason: "Invalid payment signature" };
  }

  const tx = await prisma.transaction.findFirst({
    where: { razorpayOrderId, userId },
  });

  if (!tx) {
    return { ok: false as const, reason: "Transaction not found" };
  }

  if (tx.status === "COMPLETED") {
    return { ok: true as const, alreadyCompleted: true, transaction: tx };
  }

  // Store the payment ID and mark complete
  await prisma.transaction.update({
    where: { id: tx.id },
    data: { razorpayPaymentId },
  });

  const completed = await completeTransaction(tx.id);
  return { ok: true as const, alreadyCompleted: false, transaction: completed };
}
