import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { hasAddPermissionServer } from "@/lib/permissions";
import { noTenantResponse } from "@/lib/data-access";

// GET — list all teams (with department + leader + member count), plus the
// departments and candidate team leaders needed by the Teams manager UI and
// the project "Assign Team" dropdown.
export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const [teams, departments, leaders] = await Promise.all([
      prisma.team.findMany({
        include: {
          department: { select: { id: true, name: true } },
          teamLeader: { select: { id: true, name: true, email: true } },
          _count: { select: { users: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.department.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ success: true, teams, departments, leaders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

// POST — create a team.
export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const canAdd = await hasAddPermissionServer(auth.session.user, "/admin/teams");
    if (!canAdd) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to add teams." },
        { status: 403 }
      );
    }
    if (!auth.tenantId) return noTenantResponse();

    const body = await req.json();
    const name = (body.name ?? "").trim();
    const code = (body.code ?? "").trim();
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: "Team Name and Code are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.team.findUnique({ where: { code }, select: { id: true } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `A team with code "${code}" already exists.` },
        { status: 400 }
      );
    }

    const team = await prisma.team.create({
      data: {
        tenantId: auth.tenantId,
        name,
        code,
        departmentId: body.departmentId || null,
        teamLeaderId: body.teamLeaderId || null,
        status: body.status || "ACTIVE",
      },
      include: {
        department: { select: { id: true, name: true } },
        teamLeader: { select: { id: true, name: true, email: true } },
        _count: { select: { users: true } },
      },
    });

    if (body.teamLeaderId) {
      await prisma.user
        .update({ where: { id: body.teamLeaderId }, data: { teamId: team.id } })
        .catch(() => {});
    }

    return NextResponse.json({ success: true, team });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create team" },
      { status: 500 }
    );
  }
}
