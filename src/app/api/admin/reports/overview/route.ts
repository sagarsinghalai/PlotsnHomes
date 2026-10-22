import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { groupCountByMonth, groupSumByMonth } from "@/lib/admin-reports";
import { requireCrmApi } from "@/lib/crm-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  const [transactions, leads, users, inquiries] = await Promise.all([
    prisma.transaction.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.lead.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.inquiry.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return NextResponse.json({
    revenue: groupSumByMonth(transactions),
    leads: groupCountByMonth(leads.map((l) => l.createdAt)),
    users: groupCountByMonth(users.map((u) => u.createdAt)),
    inquiries: groupCountByMonth(inquiries.map((i) => i.createdAt)),
  });
}
