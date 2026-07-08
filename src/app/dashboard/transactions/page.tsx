import { Suspense } from "react";
import { PaymentSuccessHandler } from "@/components/payments/payment-success-handler";
import { requireAuth } from "@/lib/auth";
import { completeTransactionFromStripeSession } from "@/lib/complete-transaction";
import { stripeConfigured } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { paymentMethodLabel, paymentPlanLabel } from "@/lib/payment-plans";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const METHOD_COLOR: Record<string, string> = {
  upi: "bg-violet-100 text-violet-700",
  card: "bg-blue-100 text-blue-700",
  netbanking: "bg-sky-100 text-sky-700",
  wallet: "bg-pink-100 text-pink-700",
  emi: "bg-orange-100 text-orange-700",
  cheque: "bg-slate-100 text-slate-600",
  neft_rtgs: "bg-slate-100 text-slate-600",
  all: "bg-emerald-100 text-emerald-700",
};

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  PENDING: "bg-amber-100 text-amber-800 border border-amber-200",
  FAILED: "bg-red-100 text-red-700 border border-red-200",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { success?: string; demo?: string; session_id?: string };
}) {
  const session = await requireAuth();

  if (searchParams.session_id && stripeConfigured() && !searchParams.demo) {
    try {
      await completeTransactionFromStripeSession(searchParams.session_id, session.user.id);
    } catch (e) {
      console.error("[PlotsnHomes] server verify:", e);
    }
  }

  let whereClause: Record<string, unknown> = {};
  if (session.user.role === "SUPERADMIN" || session.user.role === "EMPLOYEE") {
    whereClause = {};
  } else if (session.user.role === "SELLER") {
    whereClause = { OR: [{ userId: session.user.id }, { property: { submittedById: session.user.id } }] };
  } else if (session.user.role === "AGENT") {
    whereClause = { OR: [{ userId: session.user.id }, { property: { agentId: session.user.id } }] };
  } else {
    whereClause = { userId: session.user.id };
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      property: { select: { title: true, slug: true, symbol: true, brokerageRate: true } },
      user: { select: { name: true, email: true } },
    },
  });

  // Summary stats
  const completed = transactions.filter((t) => t.status === "COMPLETED");
  const totalPaid = completed.reduce((s, t) => s + t.amount, 0);
  const totalPlatformFees = completed.reduce((s, t) => s + (t.brokerageAmount ?? 0), 0);
  const totalSellerPayouts = completed.reduce((s, t) => s + (t.sellerAmount ?? t.amount), 0);
  const pendingCount = transactions.filter((t) => t.status === "PENDING").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Transaction History</h1>
        <p className="mt-1 text-slate-500 text-sm">All payments with full beneficiary breakdown</p>
      </div>

      <Suspense fallback={null}>
        <PaymentSuccessHandler />
      </Suspense>

      {searchParams.success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="text-emerald-600 text-lg">✓</span>
          </div>
          <div>
            <p className="font-bold text-emerald-900 text-sm">Payment Recorded Successfully</p>
            <p className="text-xs text-emerald-700">
              {searchParams.demo
                ? "Demo payment recorded. Check Admin → Emails for confirmation."
                : "Your transaction has been recorded and is being processed."}
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Paid", value: formatCurrency(totalPaid), color: "bg-slate-900 text-white" },
          { label: "Platform Fees", value: formatCurrency(totalPlatformFees), color: "bg-amber-50 border border-amber-200 text-amber-900" },
          { label: "Seller Payouts", value: formatCurrency(totalSellerPayouts), color: "bg-emerald-50 border border-emerald-200 text-emerald-900" },
          { label: "Pending", value: `${pendingCount} txn${pendingCount !== 1 ? "s" : ""}`, color: "bg-violet-50 border border-violet-200 text-violet-900" },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl p-4 ${card.color}`}>
            <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">{card.label}</p>
            <p className="mt-1 text-xl font-bold font-mono">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Transaction Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left border-b border-slate-200">
                {["Date & Time", "Property", "Method", "Total Paid", "→ PlotsnHomes (Fee)", "→ Seller (Payout)", "Ref No.", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3.5 font-semibold text-[11px] text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isOffline = tx.paymentMethod === "cheque" || tx.paymentMethod === "neft_rtgs";
                const rate = tx.brokerageRate ?? (isOffline ? 0 : (tx.property?.brokerageRate ?? 3.0));
                const platShare = tx.brokerageAmount ?? (isOffline ? 0 : tx.amount * (rate / 100));
                const sellerPayout = tx.sellerAmount ?? (tx.amount - platShare);
                const methodColor = METHOD_COLOR[tx.paymentMethod ?? ""] ?? "bg-slate-100 text-slate-600";
                const statusStyle = STATUS_STYLE[tx.status] ?? "bg-slate-100 text-slate-600";

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900 text-xs">
                        {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(tx.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                      {tx.completedAt && (
                        <p className="text-[9px] text-emerald-600 font-mono mt-0.5">
                          ✓ {new Date(tx.completedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 max-w-[180px]">
                      <p className="font-semibold text-slate-900 text-xs truncate">{tx.property?.title ?? "—"}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{tx.property?.symbol ?? ""}</p>
                      {tx.buyerName && <p className="text-[10px] text-slate-500 mt-0.5">Buyer: {tx.buyerName}</p>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${methodColor}`}>
                        {paymentMethodLabel(tx.paymentMethod)}
                      </span>
                      {isOffline && (
                        <p className="text-[9px] text-slate-400 mt-1">0% fee</p>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {platShare > 0 ? (
                        <div>
                          <p className="font-mono font-bold text-amber-600">{formatCurrency(platShare)}</p>
                          <p className="text-[10px] text-slate-400">{rate.toFixed(1)}% platform fee</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-sm">₹0.00</span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-mono font-bold text-emerald-600">{formatCurrency(sellerPayout)}</p>
                        {tx.sellerName && <p className="text-[10px] text-slate-400">{tx.sellerName}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {tx.referenceNo ? (
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded-lg whitespace-nowrap">
                          {tx.referenceNo}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <p className="text-slate-400 text-sm font-medium">No transactions yet.</p>
                    <p className="text-slate-300 text-xs mt-1">Pay a deposit on any property listing to get started.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
