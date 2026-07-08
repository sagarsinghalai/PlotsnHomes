import { NextResponse } from "next/server";
import { completeTransaction } from "@/lib/complete-transaction";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay-checkout";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";

  // Verify webhook signature
  if (!verifyRazorpayWebhookSignature(body, sig)) {
    console.error("[PlotsnHomes] Invalid Razorpay webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event: string;
    payload: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
        };
      };
    };
  };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    const razorpayPaymentId = payment?.id;

    if (razorpayOrderId && razorpayPaymentId) {
      try {
        const tx = await prisma.transaction.findFirst({
          where: { razorpayOrderId },
        });

        if (tx && tx.status !== "COMPLETED") {
          await prisma.transaction.update({
            where: { id: tx.id },
            data: { razorpayPaymentId },
          });
          await completeTransaction(tx.id);
          console.log(`[PlotsnHomes] Razorpay webhook: completed tx ${tx.id}`);
        }
      } catch (e) {
        console.error("[PlotsnHomes] Razorpay webhook complete error:", e);
      }
    }
  }

  return NextResponse.json({ received: true });
}
