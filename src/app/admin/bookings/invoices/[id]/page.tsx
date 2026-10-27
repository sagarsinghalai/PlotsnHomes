import { InvoiceReceipt } from "@/components/admin/invoice-receipt";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { mapInvoiceToReceipt } from "@/lib/invoice-map";
import { getInvoiceIssuer } from "@/lib/invoice-issuer";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerTenantId } from "@/lib/tenant";

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { copy?: string };
}) {
  const tenantId = await getServerTenantId();
  const inv = await prisma.brokerageInvoice.findFirst({ where: { id: params.id, tenantId } });
  if (!inv) notFound();

  const issuer = await getInvoiceIssuer(inv.tenantId);
  const receipt = mapInvoiceToReceipt(inv, issuer);

  return (
    <div>
      <AdminPageHeader
        title={inv.invoiceNumber ?? `Invoice ${inv.id.slice(0, 8)}`}
        description={`${inv.bookingName} · ${formatCurrency(inv.totalAmount)} · ${inv.status}`}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Invoices", href: "/admin/bookings/invoices" },
          { label: inv.invoiceNumber ?? "Detail" },
        ]}
        actions={
          <Link
            href="/admin/bookings/invoices"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            ← All invoices
          </Link>
        }
      />
      <InvoiceReceipt
        invoice={receipt}
        initialParty={searchParams.copy === "agent" ? "agent" : "buyer"}
      />
    </div>
  );
}
