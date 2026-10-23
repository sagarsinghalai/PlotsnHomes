import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformApi } from "@/lib/platform-access";
import { writeAudit } from "@/lib/audit";
import { getPrimaryTenantId } from "@/lib/tenant";
import { canTransition, isTenantStatus, TENANT_STATE_LABELS } from "@/lib/tenant-lifecycle";

export const dynamic = "force-dynamic";

// Platform-owner tenant control plane: list every tenant (Organization) with its
// lifecycle status + counts, and transition a tenant's status (audited).
export async function GET() {
  const auth = await requirePlatformApi();
  if (auth.error) return auth.error;
  try {
    const [organizations, primaryTenantId] = await Promise.all([
      prisma.organization.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          domain: true,
          createdAt: true,
          whiteLabelAdmin: { select: { id: true, name: true, email: true } },
          _count: { select: { users: true, franchises: true } },
        },
      }),
      getPrimaryTenantId().catch(() => ""),
    ]);
    return NextResponse.json({ success: true, organizations, primaryTenantId });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requirePlatformApi();
  if (auth.error) return auth.error;
  try {
    const { orgId, toStatus } = await req.json();
    if (!orgId || !isTenantStatus(toStatus)) {
      return NextResponse.json({ success: false, error: "orgId and a valid toStatus are required" }, { status: 400 });
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, status: true },
    });
    if (!org) return NextResponse.json({ success: false, error: "Tenant not found" }, { status: 404 });

    // Never suspend/cancel/delete the platform's own primary tenant.
    const primaryTenantId = await getPrimaryTenantId().catch(() => "");
    if (org.id === primaryTenantId && toStatus !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "The primary tenant cannot be suspended, cancelled or deleted." },
        { status: 400 }
      );
    }

    if (!canTransition(org.status, toStatus)) {
      return NextResponse.json(
        { success: false, error: `Cannot move ${(TENANT_STATE_LABELS as Record<string, string>)[org.status] ?? org.status} → ${TENANT_STATE_LABELS[toStatus]}` },
        { status: 400 }
      );
    }

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: { status: toStatus },
      select: { id: true, name: true, status: true },
    });

    await writeAudit({
      actorId: auth.actorId,
      actorEmail: auth.session.user.email ?? null,
      action: "TENANT_STATUS_CHANGE",
      detail: `${org.name} (${org.id}): ${org.status} → ${toStatus}`,
    });

    return NextResponse.json({ success: true, organization: updated });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
