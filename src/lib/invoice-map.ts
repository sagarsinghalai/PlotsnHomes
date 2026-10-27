import type { BrokerageInvoice } from "@prisma/client";
import type { InvoiceReceiptData, InvoiceIssuer } from "@/lib/invoice";
import { parseLineItems } from "@/lib/invoice";

export function mapInvoiceToReceipt(inv: BrokerageInvoice, issuer?: InvoiceIssuer): InvoiceReceiptData {
  return {
    id: inv.id,
    invoiceNumber: inv.invoiceNumber ?? `BV-INV-${inv.id.slice(0, 8).toUpperCase()}`,
    bookingId: inv.bookingId,
    invoiceTo: inv.invoiceTo,
    bookingName: inv.bookingName,
    brokerageName: inv.brokerageName,
    status: inv.status,
    totalAmount: inv.totalAmount,
    subtotal: inv.subtotal || inv.totalAmount - (inv.taxAmount ?? 0),
    taxRate: inv.taxRate ?? 0,
    taxAmount: inv.taxAmount ?? 0,
    commissionPct: inv.commissionPct,
    dueOn: inv.dueOn?.toISOString() ?? null,
    paidAt: inv.paidAt?.toISOString() ?? null,
    createdAt: inv.createdAt.toISOString(),
    buyerName: inv.buyerName,
    buyerEmail: inv.buyerEmail,
    buyerPhone: inv.buyerPhone,
    buyerAddress: inv.buyerAddress,
    agentName: inv.agentName,
    agentEmail: inv.agentEmail,
    agentPhone: inv.agentPhone,
    propertySymbol: inv.propertySymbol,
    propertyTitle: inv.propertyTitle,
    propertyAddress: inv.propertyAddress,
    lineItems: parseLineItems(inv.lineItemsJson),
    notes: inv.notes,
    issuer,
  };
}
