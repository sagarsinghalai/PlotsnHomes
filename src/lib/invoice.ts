export type InvoiceLineItem = {
  description: string;
  qty: number;
  rate: number;
  amount: number;
};

/**
 * Who issues the invoice. The platform company is the merchant of record on
 * every invoice/receipt; the white-label partner that operated the sale is
 * named as an authorized partner (never as the issuer).
 */
export type InvoiceIssuer = {
  companyName: string; // platform master company (merchant of record)
  email: string;
  website: string;
  address: string;
  gstCin: string;
  copyright: string;
  partnerName: string | null; // the operating white-label partner (tenant org)
  relationshipLabel: string; // e.g. "Authorized Partner"
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
  issuer?: InvoiceIssuer;
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
