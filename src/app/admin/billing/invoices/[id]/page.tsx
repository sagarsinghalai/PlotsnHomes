import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isSuperAdmin } from "@/lib/roles";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getSubscriptionInvoice } from "@/lib/subscription-invoice";
import { getInvoiceIssuer } from "@/lib/invoice-issuer";
import { SubscriptionReceipt } from "@/components/admin/subscription-receipt";

export const dynamic = "force-dynamic";

export default async function SubscriptionInvoicePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) notFound();

  // A partner can only open their own org's invoice; the platform owner, any.
  const scopeOrg = isSuperAdmin(session.user.role) ? null : session.user.tenantId ?? "__no_tenant__";
  const inv = await getSubscriptionInvoice(params.id, scopeOrg);
  if (!inv) notFound();

  const issuer = await getInvoiceIssuer(inv.organizationId);

  return (
    <div>
      <AdminPageHeader
        title={inv.invoiceNumber}
        description={`${inv.planName} · ${inv.status}`}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Billing", href: "/admin/billing" },
          { label: inv.invoiceNumber },
        ]}
        actions={
          <Link href="/admin/billing" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
            ← Back to billing
          </Link>
        }
      />
      <SubscriptionReceipt
        data={{
          invoiceNumber: inv.invoiceNumber,
          planName: inv.planName,
          amount: inv.amount,
          currency: inv.currency,
          status: inv.status,
          kind: inv.kind,
          periodStart: inv.periodStart.toISOString(),
          periodEnd: inv.periodEnd ? inv.periodEnd.toISOString() : null,
          issuedAt: inv.issuedAt.toISOString(),
          paymentRef: inv.paymentRef,
          provider: inv.provider,
          issuer,
        }}
      />
    </div>
  );
}
