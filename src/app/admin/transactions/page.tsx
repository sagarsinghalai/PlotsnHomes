import { TransactionsManager } from "@/components/admin/transactions-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminTransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: {
      user: { select: { name: true, email: true, role: true } },
      property: { select: { title: true, symbol: true, slug: true, brokerageRate: true } },
    },
  });

  // Platform-wide financial summary
  const completed = transactions.filter((t) => t.status === "COMPLETED");
  const pending = transactions.filter((t) => t.status === "PENDING");
  const totalVolume = completed.reduce((s, t) => s + t.amount, 0);
  const totalPlatformEarnings = completed.reduce((s, t) => s + (t.brokerageAmount ?? 0), 0);
  const totalSellerPayouts = completed.reduce((s, t) => s + (t.sellerAmount ?? t.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Transactions</h1>
        <p className="mt-1 text-slate-500 text-sm">
          All payments · dual-beneficiary split · full audit trail
        </p>
      </div>

      {/* Platform Financial Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {[
          { label: "Total Volume", value: `₹${(totalVolume / 100000).toFixed(2)}L`, sub: `${completed.length} completed txns`, bg: "bg-slate-900 text-white" },
          { label: "PlotsnHomes Earnings", value: `₹${(totalPlatformEarnings / 1000).toFixed(1)}K`, sub: "Platform brokerage fees", bg: "bg-amber-50 border border-amber-200 text-amber-900" },
          { label: "Seller Payouts", value: `₹${(totalSellerPayouts / 100000).toFixed(2)}L`, sub: "To builders/sellers", bg: "bg-emerald-50 border border-emerald-200 text-emerald-900" },
          { label: "Pending", value: `${pending.length}`, sub: "Awaiting confirmation", bg: "bg-violet-50 border border-violet-200 text-violet-900" },
          { label: "Total Txns", value: `${transactions.length}`, sub: "All time", bg: "bg-sky-50 border border-sky-200 text-sky-900" },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl p-4 ${card.bg}`}>
            <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider">{card.label}</p>
            <p className="mt-1 text-2xl font-bold font-mono">{card.value}</p>
            <p className="text-[10px] opacity-60 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <TransactionsManager
          transactions={transactions.map((tx) => ({
            ...tx,
            createdAt: tx.createdAt.toISOString(),
            completedAt: tx.completedAt?.toISOString() ?? null,
            propertySymbol: tx.property?.symbol ?? null,
            propertyTitle: tx.property?.title ?? null,
            propertySlug: tx.property?.slug ?? null,
            brokerageRateEffective: tx.property?.brokerageRate ?? tx.brokerageRate ?? 3.0,
          }))}
        />
      </div>
    </div>
  );
}
