import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth-options";
import { completeTransactionFromRazorpay } from "@/lib/complete-transaction";

const schema = z.object({
  razorpayPaymentId: z.string(),
  razorpayOrderId: z.string(),
  razorpaySignature: z.string(),
  transactionId: z.string(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const result = await completeTransactionFromRazorpay(
      data.razorpayOrderId,
      data.razorpayPaymentId,
      data.razorpaySignature,
      session.user.id
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason ?? "Payment verification failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyCompleted: result.alreadyCompleted,
      transactionId: result.transaction.id,
    });
  } catch (e) {
    console.error("[PlotsnHomes] razorpay-verify:", e);
    const message = e instanceof Error ? e.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
