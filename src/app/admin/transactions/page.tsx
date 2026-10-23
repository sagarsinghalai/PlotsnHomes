import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { TransactionsManager } from "@/components/admin/transactions-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const tenantId = user?.tenantId || "__no_tenant__";

  let whereClause: any = { tenantId };

  // If user is AGENT, scope transactions strictly to their own transactions & assigned customer deals
  if (user?.role === "AGENT") {
    whereClause = {
      tenantId,
      OR: [
        { userId: user.id },
        { property: { agentId: user.id } },
        { agentCommission: { agentId: user.id } },
      ],
    };
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      property: { select: { title: true, symbol: true, slug: true, brokerageRate: true, agentId: true } },
    },
  });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
        {user?.role === "AGENT" ? "My Commissions & Client Transactions" : "Transactions"}
      </h1>
      <p className="mt-1 text-slate-600 dark:text-slate-400 mb-8">
        {user?.role === "AGENT"
          ? "Scoped transaction audit log — view your commission payouts, client settlements, and deal history"
          : "Real-time audit log, buyer/seller settlements, and transaction management"}
      </p>
      <TransactionsManager
        currentUserId={user?.id}
        currentUserRole={user?.role}
        currentUserName={user?.name}
        currentUserEmail={user?.email}
        transactions={transactions.map((tx) => ({
          ...tx,
          userId: tx.user?.id ? `USR-${tx.user.id.slice(-4).toUpperCase()}` : undefined,
          userName: tx.user?.name ?? "Customer",
          userEmail: tx.user?.email ?? "user@example.com",
          createdAt: tx.createdAt.toISOString(),
          propertySymbol: tx.property?.symbol ?? "BKV-PROP-001",
          propertyTitle: tx.property?.title ?? "Kensington Manor",
        }))}
      />
    </div>
  );
}
