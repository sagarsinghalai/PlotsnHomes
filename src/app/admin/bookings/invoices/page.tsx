import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { InvoicesTable } from "@/components/admin/invoices-table";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export default async function BrokerageInvoicesPage() {
  const invoices = await prisma.brokerageInvoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalValue = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const paid = invoices.filter((i) => i.status.toLowerCase() === "paid").length;

  return (
    <div>
      <AdminPageHeader
        title="Invoices & receipts"
        description="Brokerage invoices with buyer and agent receipts — view details, print, or download"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Finance" },
          { label: "Invoices" },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Total invoices</p>
          <p className="text-2xl font-bold">{invoices.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Total value</p>
          <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-slate-500">Paid</p>
          <p className="text-2xl font-bold text-emerald-600">{paid}</p>
        </div>
      </div>

      <InvoicesTable
        invoices={invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber ?? `BV-TMP-${inv.id.slice(0, 6)}`,
          bookingId: inv.bookingId,
          invoiceTo: inv.invoiceTo,
          bookingName: inv.bookingName,
          brokerageName: inv.brokerageName,
          status: inv.status,
          totalAmount: inv.totalAmount,
          dueOn: inv.dueOn?.toISOString() ?? null,
          buyerName: inv.buyerName,
          agentName: inv.agentName,
          propertySymbol: inv.propertySymbol,
        }))}
      />
    </div>
  );
}
