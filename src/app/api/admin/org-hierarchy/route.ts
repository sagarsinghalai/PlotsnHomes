import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";

// Returns the organization hierarchy (Whitelabel → Franchise → Branch →
// Department → Team) plus all users with their hierarchy links + contact
// details. Powers the Lead-Settings cascade and the Contact user dropdowns.
export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const [organizations, franchises, branches, departments, teams, users] = await Promise.all([
      prisma.organization.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      prisma.franchise.findMany({ select: { id: true, name: true, organizationId: true }, orderBy: { name: "asc" } }),
      prisma.branch.findMany({ select: { id: true, name: true, franchiseId: true }, orderBy: { name: "asc" } }),
      prisma.department.findMany({ select: { id: true, name: true, branchId: true }, orderBy: { name: "asc" } }),
      prisma.team.findMany({ select: { id: true, name: true, departmentId: true }, orderBy: { name: "asc" } }),
      prisma.user.findMany({
        select: {
          id: true, name: true, email: true, phone: true, countryCode: true, role: true,
          tenantId: true, franchiseId: true, branchId: true, departmentId: true, teamId: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ success: true, organizations, franchises, branches, departments, teams, users });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Failed to load hierarchy" }, { status: 500 });
  }
}
