export type InvoiceLineItem = {
  description: string;
  qty: number;
  rate: number;
  amount: number;
};

export type InvoiceReceiptData = {
  id: string;
  invoiceNumber: string;
  bookingId: string | null;
  invoiceTo: string;
  bookingName: string;
  brokerageName: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  commissionPct: number | null;
  dueOn: string | null;
  paidAt: string | null;
  createdAt: string;
  buyerName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  buyerAddress: string | null;
  agentName: string | null;
  agentEmail: string | null;
  agentPhone: string | null;
  propertySymbol: string | null;
  propertyTitle: string | null;
  propertyAddress: string | null;
  lineItems: InvoiceLineItem[];
  notes: string | null;
};

export function parseLineItems(json: string | null | undefined): InvoiceLineItem[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as InvoiceLineItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function generateInvoiceNumber(seq: number) {
  const year = new Date().getFullYear();
  return `BV-INV-${year}-${String(seq).padStart(5, "0")}`;
}

export function defaultLineItems(
  subtotal: number,
  commissionPct?: number | null
): InvoiceLineItem[] {
  const commission = commissionPct
    ? Math.round(subtotal * (commissionPct / 100))
    : Math.round(subtotal * 0.02);
  return [
    {
      description: "Property booking / brokerage service",
      qty: 1,
      rate: subtotal - commission,
      amount: subtotal - commission,
    },
    {
      description: `Agent commission${commissionPct ? ` (${commissionPct}%)` : ""}`,
      qty: 1,
      rate: commission,
      amount: commission,
    },
  ];
}
