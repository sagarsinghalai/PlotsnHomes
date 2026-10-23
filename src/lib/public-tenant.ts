import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getPrimaryTenantId } from "@/lib/tenant";

/**
 * Stage B — per-domain tenant resolution for the PUBLIC site.
 *
 * Decides which tenant (Organization) a visitor is looking at from the host they
 * arrived on, so a white-label agency's own domain serves its own listings and
 * captures leads into its own CRM. Resolution order:
 *   1. exact custom domain  (acme-realty.com  → Organization.domain)
 *   2. subdomain label      (acme.platform.com / acme.localhost → Organization.code)
 *   3. fallback             → the platform's primary tenant
 * A DELETED organization never resolves. There is no session here, so the host
 * is the only trusted signal.
 */
function normalizeHost(host: string | null | undefined): string {
  return (host || "").toLowerCase().split(":")[0].trim();
}

export async function resolvePublicTenantId(host: string | null | undefined): Promise<string> {
  const h = normalizeHost(host);
  if (h) {
    const byDomain = await prisma.organization.findFirst({
      where: { domain: h, status: { not: "DELETED" } },
      select: { id: true },
    });
    if (byDomain) return byDomain.id;

    const label = h.split(".")[0];
    if (h.includes(".") && label && label !== "www" && label !== "localhost") {
      const byCode = await prisma.organization.findFirst({
        where: { code: label, status: { not: "DELETED" } },
        select: { id: true },
      });
      if (byCode) return byCode.id;
    }
  }
  return getPrimaryTenantId();
}

/** Resolve the public tenant for the current server request (reads the Host header). */
export async function getPublicTenantId(): Promise<string> {
  try {
    const host = headers().get("host");
    return await resolvePublicTenantId(host);
  } catch {
    return getPrimaryTenantId();
  }
}
