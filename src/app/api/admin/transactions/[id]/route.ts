import { TransactionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.nativeEnum(TransactionStatus).optional(),
  amount: z.number().positive().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const data = patchSchema.parse(await req.json());
    
    const existing = await prisma.transaction.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const amount = data.amount ?? existing.amount;
    const status = data.status ?? existing.status;
    const paymentMethod = existing.paymentMethod;
    const brokerageRate = existing.brokerageRate;

    const isOffline = paymentMethod === "cheque" || paymentMethod === "neft_rtgs";
    
    let brokerageAmount = existing.brokerageAmount;
    let sellerAmount = existing.sellerAmount;
    let received = existing.received;
    let balance = existing.balance;

    if (data.amount !== undefined) {
      if (isOffline) {
        brokerageAmount = 0.0;
        sellerAmount = amount;
      } else {
        brokerageAmount = amount * (brokerageRate / 100);
        sellerAmount = amount - brokerageAmount;
      }
    }

    if (status === "COMPLETED") {
      received = "yes";
      balance = 0.0;
    } else if (status === "PENDING") {
      received = "no";
      balance = isOffline ? 0.0 : brokerageAmount;
    } else {
      received = "no";
      balance = 0.0;
    }

    const tx = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        ...(data.status && { status }),
        ...(data.amount !== undefined && { amount }),
        brokerageAmount,
        sellerAmount,
        received,
        balance,
      },
    });
    return NextResponse.json({ ok: true, transaction: tx });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    await prisma.transaction.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
