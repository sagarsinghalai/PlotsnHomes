import { Eye } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  bookingId: string | null;
  invoiceTo: string;
  bookingName: string;
  brokerageName: string;
  status: string;
  totalAmount: number;
  dueOn: string | null;
  buyerName: string | null;
  agentName: string | null;
  propertySymbol: string | null;
};

export function InvoicesTable({ invoices }: { invoices: InvoiceRow[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[960px]">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3.5">Invoice #</th>
              <th className="px-5 py-3.5">Booking</th>
              <th className="px-5 py-3.5">Buyer</th>
              <th className="px-5 py-3.5">Agent</th>
              <th className="px-5 py-3.5">Property</th>
              <th className="px-5 py-3.5">Type</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Total</th>
              <th className="px-5 py-3.5">Due</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const isPaid = inv.status.toLowerCase() === "paid";
              return (
                <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-gold-dark">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-900">{inv.bookingName}</p>
                    <p className="text-xs text-slate-400 font-mono">{inv.bookingId ?? "—"}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{inv.buyerName ?? inv.bookingName}</td>
                  <td className="px-5 py-4 text-slate-700">{inv.agentName ?? inv.brokerageName}</td>
                  <td className="px-5 py-4 font-mono text-xs text-gold-dark">
                    {inv.propertySymbol ?? "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs">{inv.invoiceTo}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                    {inv.dueOn ? new Date(inv.dueOn).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/bookings/invoices/${inv.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Link>
                      <Link
                        href={`/admin/bookings/invoices/${inv.id}?copy=buyer`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                        title="Buyer receipt"
                      >
                        Buyer
                      </Link>
                      <Link
                        href={`/admin/bookings/invoices/${inv.id}?copy=agent`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                        title="Agent receipt"
                      >
                        Agent
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {invoices.length === 0 && (
        <p className="p-16 text-center text-slate-500">No invoices yet. Run db:seed for sample data.</p>
      )}
    </div>
  );
}
