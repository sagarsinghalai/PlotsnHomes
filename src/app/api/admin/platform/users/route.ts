import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePlatformApi } from "@/lib/platform-access";

export const dynamic = "force-dynamic";

// Platform-owner directory: every user on the platform, with their white-label
// (Organization), franchise, branch, department and team. SUPERADMIN only.
// Never returns password material.
export async function GET() {
  const auth = await requirePlatformApi();
  if (auth.error) return auth.error;

  try {
    const [users, organizations] = await Promise.all([
      prisma.user.findMany({
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          active: true,
          lastActiveAt: true,
          createdAt: true,
          tenantId: true,
          organizationRel: { select: { id: true, name: true, code: true } },
          franchiseId: true,
          franchiseRel: { select: { id: true, name: true } },
          branchId: true,
          branchRel: { select: { id: true, name: true } },
          departmentId: true,
          departmentRel: { select: { id: true, name: true } },
          teamId: true,
          teamRel: { select: { id: true, name: true } },
        },
      }),
      prisma.organization.findMany({
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          code: true,
          status: true,
          domain: true,
          whiteLabelAdmin: { select: { id: true, name: true, email: true } },
          _count: { select: { users: true, franchises: true } },
        },
      }),
    ]);

    return NextResponse.json({ success: true, users, organizations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to load users" }, { status: 500 });
  }
}
