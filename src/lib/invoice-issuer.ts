import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/system-settings";
import { getWhiteLabelProfile } from "@/lib/white-label-store";
import type { InvoiceIssuer } from "@/lib/invoice";

export const INVOICE_RELATIONSHIP_KEY = "invoice_partner_relationship_label";
export const DEFAULT_RELATIONSHIP_LABEL = "Authorized Partner";

/**
 * Build the issuer block for an invoice/receipt. The platform company (the
 * global white-label profile) is always the merchant of record; when the sale
 * belongs to a white-label tenant, that organization is named as the operating
 * partner under a configurable relationship label (default "Authorized
 * Partner"). We never present the partner as the issuing company.
 */
export async function getInvoiceIssuer(tenantId?: string | null): Promise<InvoiceIssuer> {
  const [profile, relLabelRaw] = await Promise.all([
    getWhiteLabelProfile(),
    getSetting(INVOICE_RELATIONSHIP_KEY),
  ]);

  let partnerName: string | null = null;
  if (tenantId) {
    try {
      const org = await prisma.organization.findUnique({ where: { id: tenantId }, select: { name: true } });
      partnerName = org?.name ?? null;
    } catch {
      partnerName = null;
    }
  }
  // If the tenant is the platform company itself, there's no separate partner to name.
  if (partnerName && partnerName.trim().toLowerCase() === profile.companyName.trim().toLowerCase()) {
    partnerName = null;
  }

  return {
    companyName: profile.companyName,
    email: profile.supportEmail,
    website: profile.customDomain.replace(/^https?:\/\//, ""),
    address: profile.officeAddress,
    gstCin: profile.gstCinNumber,
    copyright: profile.copyrightNotice,
    partnerName,
    relationshipLabel: (relLabelRaw || "").trim() || DEFAULT_RELATIONSHIP_LABEL,
  };
}
