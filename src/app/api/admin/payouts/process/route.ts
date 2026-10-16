import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { propertyId, propertyTitle, propertySymbol, amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payout amount" }, { status: 400 });
    }

    // Find admin user or system user for logging
    const targetUserId =
      auth.session?.user?.id ??
      (
        await prisma.user.findFirst({
          where: { active: true },
          orderBy: { createdAt: "asc" },
        })
      )?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: "No target user found for transaction" }, { status: 400 });
    }

    // Find actual property record by id or symbol
    let dbPropertyId = propertyId;
    if (propertySymbol || propertyId) {
      const dbProp = await prisma.property.findFirst({
        where: { OR: [{ id: propertyId }, { symbol: propertySymbol }] },
      });
      if (dbProp) {
        dbPropertyId = dbProp.id;
      } else {
        dbPropertyId = null;
      }
    }

    // Create transaction entry in database
    const transaction = await prisma.transaction.create({
      data: {
        userId: targetUserId,
        propertyId: dbPropertyId,
        amount: Number(amount),
        currency: "inr",
        type: "INVESTMENT",
        status: "COMPLETED",
        paymentMethod: "Dividend Yield Settlement",
        gateway: "Automated Payout Engine",
        description: `Monthly Dividend Yield Payout for ${propertyTitle || "Property"} (${propertySymbol || "PROP"})`,
        fee: Math.round(Number(amount) * 0.005),
        date: new Date(),
        completedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        property: { select: { title: true, symbol: true } },
      },
    });

    const txUser = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true, email: true } });

    return NextResponse.json({
      success: true,
      message: "Dividend payout processed successfully and recorded in All Transactions",
      transaction: {
        id: `TXN-${transaction.id.slice(-4).toUpperCase()}`,
        userId: `USR-${txUser?.id.slice(-4).toUpperCase() || 'SYS'}`,
        userName: txUser?.name || "System Admin",
        userEmail: txUser?.email || "admin@plotsnhomes.com",
        type: "SELL",
        propertyTitle: propertyTitle || "Dividend Payout",
        propertySymbol: propertySymbol || "PROP-PAYOUT",
        propertyIcon: "💰",
        amount: transaction.amount,
        fee: transaction.fee || 0,
        status: "completed",
        date: new Date(transaction.createdAt).toISOString().replace("T", " ").slice(0, 16),
      },
    });
  } catch (error: any) {
    console.error("Payout Processing Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process payout" },
      { status: 500 }
    );
  }
}
