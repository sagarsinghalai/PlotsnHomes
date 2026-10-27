import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { checkDomainDns, dnsRecordsFor, getPlatformHost } from "@/lib/domain-status";

export const dynamic = "force-dynamic";

/**
 * Custom-domain status for the caller's own workspace: the configured domain,
 * the DNS records to set, and a live resolution check. Tenant-scoped.
 */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const org = auth.tenantId
    ? await prisma.organization.findUnique({ where: { id: auth.tenantId }, select: { domain: true, code: true } })
    : null;
  const domain = org?.domain ?? "";

  const check = await checkDomainDns(domain);
  return NextResponse.json({
    ok: true,
    domain,
    platformHost: getPlatformHost(),
    subdomainHint: org?.code ? `${org.code}.${getPlatformHost()}` : null,
    records: dnsRecordsFor(domain || "your-domain.com"),
    check,
  });
}
