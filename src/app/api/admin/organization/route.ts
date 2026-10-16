import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";
import { getFieldPrivacyConfig, saveFieldPrivacyConfig, FieldPrivacyMatrix } from "@/lib/field-privacy";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized Super Admin access required" }, { status: 403 });
    }

    const [organizations, franchises, branches, departments, teams, privacyConfig] = await Promise.all([
      prisma.organization.findMany({
        include: { whiteLabelAdmin: { select: { id: true, name: true, email: true, role: true } }, _count: { select: { franchises: true, users: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.franchise.findMany({
        include: { organization: { select: { id: true, name: true } }, franchiseAdmin: { select: { id: true, name: true, email: true, role: true } }, _count: { select: { branches: true, users: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.branch.findMany({
        include: { franchise: { select: { id: true, name: true } }, branchManager: { select: { id: true, name: true, email: true, role: true } }, _count: { select: { departments: true, users: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.department.findMany({
        include: { branch: { select: { id: true, name: true } }, departmentHead: { select: { id: true, name: true, email: true, role: true } }, _count: { select: { teams: true, users: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.team.findMany({
        include: { department: { select: { id: true, name: true } }, teamLeader: { select: { id: true, name: true, email: true, role: true } }, _count: { select: { users: true } } },
        orderBy: { name: "asc" },
      }),
      getFieldPrivacyConfig(),
    ]);

    return NextResponse.json({
      organizations,
      franchises,
      branches,
      departments,
      teams,
      privacyConfig,
    });
  } catch (error: any) {
    console.error("GET /api/admin/organization error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch organization units" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized Super Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { actionType, data } = body;

    if (actionType === "PRIVACY_MATRIX") {
      const success = await saveFieldPrivacyConfig(data as FieldPrivacyMatrix);
      if (success) return NextResponse.json({ success: true, message: "Field privacy settings saved!" });
      return NextResponse.json({ error: "Failed to save privacy settings" }, { status: 500 });
    }

    if (actionType === "ORGANIZATION") {
      const { id, name, code, domain, whiteLabelAdminId, status } = data;
      if (!name || !code) return NextResponse.json({ error: "Organization Name and Code are required" }, { status: 400 });
      
      const org = id
        ? await prisma.organization.update({
            where: { id },
            data: { name, code, domain: domain || null, whiteLabelAdminId: whiteLabelAdminId || null, status: status || "ACTIVE" },
          })
        : await prisma.organization.create({
            data: { name, code, domain: domain || null, whiteLabelAdminId: whiteLabelAdminId || null, status: status || "ACTIVE" },
          });

      if (whiteLabelAdminId) {
        await prisma.user.update({ where: { id: whiteLabelAdminId }, data: { tenantId: org.id, hierarchyLevel: "Tenant", role: "WHITE_LABEL_ADMIN" } }).catch(() => {});
      }
      return NextResponse.json({ success: true, item: org });
    }

    if (actionType === "FRANCHISE") {
      const { id, name, code, organizationId, franchiseAdminId, location, status } = data;
      if (!name || !code) return NextResponse.json({ error: "Franchise Name and Code are required" }, { status: 400 });
      
      const franchise = id
        ? await prisma.franchise.update({
            where: { id },
            data: { name, code, organizationId: organizationId || null, franchiseAdminId: franchiseAdminId || null, location: location || null, status: status || "ACTIVE" },
          })
        : await prisma.franchise.create({
            data: { name, code, organizationId: organizationId || null, franchiseAdminId: franchiseAdminId || null, location: location || null, status: status || "ACTIVE" },
          });

      if (franchiseAdminId) {
        await prisma.user.update({ where: { id: franchiseAdminId }, data: { franchiseId: franchise.id, hierarchyLevel: "Franchise", role: "FRANCHISE_ADMIN" } }).catch(() => {});
      }
      return NextResponse.json({ success: true, item: franchise });
    }

    if (actionType === "BRANCH") {
      const { id, name, code, franchiseId, branchManagerId, city, status } = data;
      if (!name || !code) return NextResponse.json({ error: "Branch Name and Code are required" }, { status: 400 });

      const branch = id
        ? await prisma.branch.update({
            where: { id },
            data: { name, code, franchiseId: franchiseId || null, branchManagerId: branchManagerId || null, city: city || null, status: status || "ACTIVE" },
          })
        : await prisma.branch.create({
            data: { name, code, franchiseId: franchiseId || null, branchManagerId: branchManagerId || null, city: city || null, status: status || "ACTIVE" },
          });

      if (branchManagerId) {
        await prisma.user.update({ where: { id: branchManagerId }, data: { branchId: branch.id, hierarchyLevel: "Branch", role: "BRANCH_MANAGER" } }).catch(() => {});
      }
      return NextResponse.json({ success: true, item: branch });
    }

    if (actionType === "DEPARTMENT") {
      const { id, name, code, branchId, departmentHeadId, status } = data;
      if (!name || !code) return NextResponse.json({ error: "Department Name and Code are required" }, { status: 400 });

      const department = id
        ? await prisma.department.update({
            where: { id },
            data: { name, code, branchId: branchId || null, departmentHeadId: departmentHeadId || null, status: status || "ACTIVE" },
          })
        : await prisma.department.create({
            data: { name, code, branchId: branchId || null, departmentHeadId: departmentHeadId || null, status: status || "ACTIVE" },
          });

      if (departmentHeadId) {
        await prisma.user.update({ where: { id: departmentHeadId }, data: { departmentId: department.id, hierarchyLevel: "Department", role: "DEPARTMENT_HEAD" } }).catch(() => {});
      }
      return NextResponse.json({ success: true, item: department });
    }

    if (actionType === "TEAM") {
      const { id, name, code, departmentId, teamLeaderId, status } = data;
      if (!name || !code) return NextResponse.json({ error: "Team Name and Code are required" }, { status: 400 });

      const team = id
        ? await prisma.team.update({
            where: { id },
            data: { name, code, departmentId: departmentId || null, teamLeaderId: teamLeaderId || null, status: status || "ACTIVE" },
          })
        : await prisma.team.create({
            data: { name, code, departmentId: departmentId || null, teamLeaderId: teamLeaderId || null, status: status || "ACTIVE" },
          });

      if (teamLeaderId) {
        await prisma.user.update({ where: { id: teamLeaderId }, data: { teamId: team.id, hierarchyLevel: "Team", role: "TEAM_LEADER" } }).catch(() => {});
      }
      return NextResponse.json({ success: true, item: team });
    }

    return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/admin/organization error:", error);
    return NextResponse.json({ error: error.message || "Failed to process organization update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !isSuperAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized Super Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 });
    }

    if (type === "ORGANIZATION") await prisma.organization.delete({ where: { id } });
    else if (type === "FRANCHISE") await prisma.franchise.delete({ where: { id } });
    else if (type === "BRANCH") await prisma.branch.delete({ where: { id } });
    else if (type === "DEPARTMENT") await prisma.department.delete({ where: { id } });
    else if (type === "TEAM") await prisma.team.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/organization error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete organization unit" }, { status: 500 });
  }
}
