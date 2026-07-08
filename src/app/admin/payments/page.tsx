import { PaymentsManager } from "@/components/admin/payments-manager";
import { prisma } from "@/lib/prisma";

export default async function AdminPaymentsPage() {
  // Fetch the latest 10 completed deposits/investments/subscriptions to populate the recent activity table
  const recentPayments = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  const parsedPayments = recentPayments.map((p) => ({
    id: p.id,
    userName: p.user.name,
    userEmail: p.user.email,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.paymentMethod || "Direct Transfer",
    type: p.type,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Payment Methods</h1>
      <p className="mt-1 text-slate-600 mb-8">
        Configure payment gateways, monitor receiver bank accounts, and view recent settlement activity
      </p>
      <PaymentsManager recentPayments={parsedPayments} />
    </div>
  );
}
