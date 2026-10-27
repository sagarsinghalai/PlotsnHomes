import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Subscription invoices/receipts for white-label partners. Each billed period
 * (signup, renewal, or a manual grant) is persisted so a partner has a durable
 * billing history. Issued in the platform company's name (merchant of record);
 * the partner org is shown on the receipt as an authorized partner.
 */
type TxClient = Prisma.TransactionClient | PrismaClient;

export function subscriptionInvoiceNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `SUB-INV-${year}-${String(seq).padStart(5, "0")}`;
}

/** Map a stored payment ref to the provider that produced it. */
export function providerFromRef(ref?: string | null): string {
  if (!ref) return "test";
  if (ref.startsWith("rzp:")) return "razorpay";
  if (ref.startsWith("stripe:")) return "stripe";
  if (ref === "test-mode") return "test";
  return "manual";
}

export type CreateSubInvoiceInput = {
  organizationId: string;
  subscriptionId?: string | null;
  planName: string;
  planSlug?: string | null;
  amount: number;
  currency: string;
  periodStart: Date;
  periodEnd?: Date | null;
  status?: string; // PAID | DUE | TEST | COMPLIMENTARY
  kind?: string; // signup | renewal | grant
  provider?: string | null;
  paymentRef?: string | null;
};

export async function createSubscriptionInvoice(input: CreateSubInvoiceInput, client: TxClient = prisma) {
  // Sequential human-friendly number. Count is good enough at this scale; the
  // unique constraint on invoiceNumber is the real guard against duplicates.
  const count = await client.subscriptionInvoice.count();
  const invoiceNumber = subscriptionInvoiceNumber(count + 1);
  return client.subscriptionInvoice.create({
    data: {
      organizationId: input.organizationId,
      subscriptionId: input.subscriptionId ?? null,
      invoiceNumber,
      planName: input.planName,
      planSlug: input.planSlug ?? null,
      amount: input.amount,
      currency: input.currency,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd ?? null,
      status: input.status ?? "PAID",
      kind: input.kind ?? "signup",
      provider: input.provider ?? null,
      paymentRef: input.paymentRef ?? null,
    },
  });
}

export function getSubscriptionInvoices(organizationId: string) {
  return prisma.subscriptionInvoice.findMany({
    where: { organizationId },
    orderBy: { issuedAt: "desc" },
  });
}

export function getSubscriptionInvoice(id: string, organizationId?: string | null) {
  return prisma.subscriptionInvoice.findFirst({
    where: { id, ...(organizationId ? { organizationId } : {}) },
  });
}
