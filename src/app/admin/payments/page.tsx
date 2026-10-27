import { PaymentGatewaysClient } from "@/components/admin/payment-gateways-client";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getServerTenantId } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const tenantId = await getServerTenantId();
  const transactions = await prisma.transaction.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { name: true, email: true } } },
  });

  const statusChip: Record<string, string> = {
    COMPLETED: "bg-emerald-100 text-emerald-800",
    PENDING: "bg-amber-100 text-amber-800",
    FAILED: "bg-rose-100 text-rose-800",
    REFUNDED: "bg-slate-200 text-slate-700",
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Payment gateways</h1>
        <p className="mt-1 text-slate-600">
          Connect your own Razorpay / Stripe keys to collect payments. Secrets are encrypted at rest and never shown back.
        </p>
      </div>

      <PaymentGatewaysClient />

      <section>
        <h2 className="font-display text-xl font-bold text-slate-900">Recent transactions</h2>
        <p className="mt-1 text-sm text-slate-500">Real settlement activity recorded against your account.</p>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">No transactions yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.id.slice(0, 12)}</td>
                    <td className="px-4 py-3">{t.user?.name || t.user?.email || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{t.type}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusChip[t.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{t.createdAt.toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
