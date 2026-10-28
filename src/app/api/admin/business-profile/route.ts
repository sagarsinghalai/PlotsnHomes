import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { canManageRolePermissions } from "@/lib/permissions";
import { getWhiteLabelProfile, saveWhiteLabelProfile, type WhiteLabelProfile } from "@/lib/white-label-store";
import { getPlatformHost } from "@/lib/domain-status";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * A white-label partner's own Business Profile: branding (logo, name, colors,
 * contact, legal) for their PUBLIC site, plus their custom domain. Owner-level
 * only (platform owner or the tenant's white-label admin) — a franchise/branch
 * leader can't rebrand the tenant.
 */
function guard(role: string | null | undefined) {
  return canManageRolePermissions(role);
}

function normalizeDomain(raw: string): string {
  return (raw || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/\.$/, "");
}

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  if (!guard(auth.session.user.role)) {
    return NextResponse.json({ ok: false, error: "Only a workspace owner can manage the business profile." }, { status: 403 });
  }
  const tenantId = auth.tenantId;
  const [profile, org] = await Promise.all([
    getWhiteLabelProfile(tenantId),
    tenantId ? prisma.organization.findUnique({ where: { id: tenantId }, select: { name: true, domain: true, code: true } }) : null,
  ]);
  return NextResponse.json({
    ok: true,
    hasTenant: !!tenantId,
    orgName: org?.name ?? null,
    domain: org?.domain ?? "",
    platformHost: getPlatformHost(),
    profile,
  });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  if (!guard(auth.session.user.role)) {
    return NextResponse.json({ ok: false, error: "Only a workspace owner can manage the business profile." }, { status: 403 });
  }
  const tenantId = auth.tenantId;
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: "No workspace is associated with your account." }, { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  // Domain: optional self-serve set/change, enforced unique across tenants.
  if (typeof body.domain === "string") {
    const domain = normalizeDomain(body.domain);
    if (domain) {
      const clash = await prisma.organization.findFirst({
        where: { domain, id: { not: tenantId }, status: { not: "DELETED" } },
        select: { id: true },
      });
      if (clash) return NextResponse.json({ ok: false, error: "That domain is already in use by another workspace." }, { status: 409 });
    }
    await prisma.organization.update({ where: { id: tenantId }, data: { domain: domain || null } });
  }

  // Branding profile (per-tenant). Only whitelisted fields are accepted.
  if (body.profile && typeof body.profile === "object") {
    const p = body.profile as Partial<WhiteLabelProfile>;
    const allowed: Partial<WhiteLabelProfile> = {};
    const strFields: (keyof WhiteLabelProfile)[] = [
      "companyName", "tagline", "logoUrl", "primaryColor", "secondaryColor",
      "supportPhone", "supportEmail", "officeAddress", "gstCinNumber", "copyrightNotice", "customDomain",
    ];
    for (const f of strFields) if (typeof p[f] === "string") (allowed as any)[f] = (p[f] as string).trim();
    if (typeof p.isWhiteLabelActive === "boolean") allowed.isWhiteLabelActive = p.isWhiteLabelActive;
    await saveWhiteLabelProfile(allowed, tenantId);
  }

  return NextResponse.json({ ok: true });
}
