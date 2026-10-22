import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCrmApi } from "@/lib/crm-access";

export async function POST(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const {
      commissionId,
      agentId,
      agentName,
      agentEmail,
      propertyTitle,
      transferAmount,
      totalCommission = 0,
      currentPaid = 0,
      paymentMethod = "Direct Bank Transfer (IMPS)",
      notes = "",
    } = body;

    const amt = Number(transferAmount);
    if (!amt || amt <= 0) {
      return NextResponse.json({ error: "Invalid transfer amount" }, { status: 400 });
    }

    const newPaid = Number(currentPaid) + amt;
    const newRemaining = Math.max(0, Number(totalCommission) - newPaid);
    const isFullyPaid = newRemaining <= 0;
    const nextStatus = isFullyPaid ? "PAID" : "PARTIALLY_PAID";

    // Generate Timestamp & Payment Ref
    const now = new Date();
    const timestampStr = now.toISOString().replace("T", " ").slice(0, 16);
    const paymentRef = `COMM-PAY-${Math.floor(100000 + Math.random() * 900000)}`;

    const logEntry = `[${timestampStr}] Disbursed ₹${amt.toLocaleString("en-IN")} via ${paymentMethod}. Ref: ${paymentRef}. Rem: ₹${newRemaining.toLocaleString("en-IN")}.${notes ? ` Note: ${notes}` : ""}`;

    let updatedComm = null;
    let targetUserId = agentId;

    // Update Commission record in database if valid ID
    if (commissionId && !commissionId.startsWith("comm-")) {
      try {
        const existing = await prisma.agentCommission.findUnique({ where: { id: commissionId } });
        if (existing) {
          targetUserId = targetUserId || existing.agentId;
          const existingNotes = existing.notes || "";
          const combinedNotes = existingNotes ? `${logEntry}\n${existingNotes}` : logEntry;

          updatedComm = await prisma.agentCommission.update({
            where: { id: commissionId },
            data: {
              status: isFullyPaid ? "PAID" : "PENDING",
              paidAt: now,
              paymentRef: paymentRef,
              notes: combinedNotes,
            },
          });
        }
      } catch (e) {
        console.warn("Could not update DB commission record directly:", e);
      }
    }

    // Persist real Transaction in Database so it appears in User Profile & Accounts
    let dbTransaction = null;
    if (targetUserId) {
      try {
        dbTransaction = await prisma.transaction.create({
          data: {
            userId: targetUserId,
            propertyId: updatedComm?.propertyId || null,
            amount: amt,
            type: "COMMISSION_PAYOUT",
            status: "COMPLETED",
            paymentMethod: paymentMethod || "Direct Bank Transfer",
            gateway: "Bank Payout",
            description: `Commission Payout disbursemnt for ${propertyTitle || "Property Deal"}. Ref: ${paymentRef}`,
            referenceNo: paymentRef,
            notes: logEntry,
            completedAt: now,
            date: now,
          },
        });
      } catch (e) {
        console.warn("Could not save payout transaction to DB:", e);
      }
    }

    return NextResponse.json({
      ok: true,
      updatedCommission: {
        id: commissionId,
        paidAmount: newPaid,
        remainingBalance: newRemaining,
        status: nextStatus,
        notes: logEntry,
        paymentRef: paymentRef,
        updatedAt: now.toISOString(),
      },
      transaction: dbTransaction || {
        id: paymentRef,
        userId: targetUserId || "USR-AGENT",
        userName: agentName || "Agent Partner",
        userEmail: agentEmail || "agent@plotsnhomes.com",
        type: "COMMISSION_PAYOUT",
        propertyTitle: propertyTitle || "Agent Commission Payout",
        amount: amt,
        status: "COMPLETED",
        method: paymentMethod,
        date: timestampStr,
        referenceNo: paymentRef,
        notes: logEntry,
      },
    });
  } catch (err: any) {
    console.error("Commission payout error:", err);
    return NextResponse.json({ error: err.message || "Failed to process commission payout" }, { status: 500 });
  }
}
