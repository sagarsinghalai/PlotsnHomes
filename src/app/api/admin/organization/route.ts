import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";
import { getFieldPrivacyConfig, saveFieldPrivacyConfig, FieldPrivacyMatrix } from "@/lib/field-privacy";
import { getPrimaryTenantId } from "@/lib/tenant";
import { canManageOrgUnits } from "@/lib/org-access";
import { writeAudit } from "@/lib/audit";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !canManageOrgUnits(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized — org hierarchy access required" }, { status: 403 });
    }

    // Platform owner sees all tenants; a white-label admin sees only their own.
    const superAdmin = isSuperAdmin(session.user.role);
    const actorTenant = session.user.tenantId || "__no_tenant__";
    const orgWhere = superAdmin ? {} : { id: actorTenant };
    const unitWhere = superAdmin ? {} : { tenantId: actorTenant };

    const [organizations, franchises, branches, departments, teams, privacyConfig] = await Promise.all([
      prisma.organization.findMany({
        where: orgWhere,
        include: { whiteLabelAdmin: { select: { id: true, name: true, email: true, role: true } }, _count: { select: { franchises: true, users: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.franchise.findMany({
        where: unitWhere,
        include: { organization: { select: { id: true, name: true } }, franchiseAdmin: { select: { id: true, name: true, email: true, role: true } }, _count: { select: { branches: true, users: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.branch.findMany({
        where: unitWhere,
        include: { franchise: { select: { id: true, name: true } }, branchManager: { select: { id: true, name: true, email: true, role: true } }, _count: { select: { departments: true, users: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.department.findMany({
        where: unitWhere,
        include: { branch: { select: { id: true, name: true } }, departmentHead: { select: { id: true, name: true, email: true, role: true } }, _count: { select: { teams: true, users: true } } },
        orderBy: { name: "asc" },
      }),
      prisma.team.findMany({
        where: unitWhere,
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
    if (!session?.user || !canManageOrgUnits(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized — org hierarchy access required" }, { status: 403 });
    }

    const superAdmin = isSuperAdmin(session.user.role);
    const actorTenant = session.user.tenantId || null;
    const actorId = session.user.id;
    const actorEmail = session.user.email ?? null;

    const body = await req.json();
    const { actionType, data } = body;

    // Verify a target record (edit) or a parent record belongs to the actor's
    // tenant; and compute the tenant a new unit must be stamped with.
    const ownsOrReject = async (model: "organization" | "franchise" | "branch" | "department" | "team", id: string | undefined | null): Promise<boolean> => {
      if (superAdmin || !id) return true;
      const rec = await (prisma as any)[model].findUnique({ where: { id }, select: { tenantId: true, id: true } });
      const ownerTenant = model === "organization" ? rec?.id : rec?.tenantId;
      return !!rec && ownerTenant === actorTenant;
    };
    const userInTenant = async (userId: string | undefined | null): Promise<boolean> => {
      if (superAdmin || !userId) return true;
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
      return !!u && u.tenantId === actorTenant;
    };

    // Tenant-scope for the whole tree stays platform-owner only.
    if ((actionType === "PRIVACY_MATRIX" || actionType === "ORGANIZATION") && !superAdmin) {
      return NextResponse.json({ error: "Only the platform owner can manage tenants or privacy settings." }, { status: 403 });
    }

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
      if (!(await ownsOrReject("franchise", id))) return NextResponse.json({ error: "That franchise is not in your tenant." }, { status: 403 });
      if (!(await userInTenant(franchiseAdminId))) return NextResponse.json({ error: "The assigned admin must be in your tenant." }, { status: 403 });

      // WL admin: a franchise belongs to their own tenant; super admin: as given.
      const orgId = superAdmin ? (organizationId || null) : actorTenant;
      const franchiseTenant = superAdmin ? (organizationId || (await getPrimaryTenantId())) : (actorTenant as string);
      const franchise = id
        ? await prisma.franchise.update({
            where: { id },
            data: { name, code, organizationId: orgId, franchiseAdminId: franchiseAdminId || null, location: location || null, status: status || "ACTIVE" },
          })
        : await prisma.franchise.create({
            data: { tenantId: franchiseTenant, name, code, organizationId: orgId, franchiseAdminId: franchiseAdminId || null, location: location || null, status: status || "ACTIVE" },
          });

      if (franchiseAdminId) {
        await prisma.user.update({ where: { id: franchiseAdminId }, data: { franchiseId: franchise.id, hierarchyLevel: "Franchise", role: "FRANCHISE_ADMIN" } }).catch(() => {});
      }
      await writeAudit({ actorId, actorEmail, action: id ? "ORG_UNIT_UPDATE" : "ORG_UNIT_CREATE", detail: `Franchise ${name} (${code})` });
      return NextResponse.json({ success: true, item: franchise });
    }

    if (actionType === "BRANCH") {
      const { id, name, code, franchiseId, branchManagerId, city, status } = data;
      if (!name || !code) return NextResponse.json({ error: "Branch Name and Code are required" }, { status: 400 });
      if (!(await ownsOrReject("branch", id))) return NextResponse.json({ error: "That branch is not in your tenant." }, { status: 403 });
      if (franchiseId && !(await ownsOrReject("franchise", franchiseId))) return NextResponse.json({ error: "That franchise is not in your tenant." }, { status: 403 });
      if (!(await userInTenant(branchManagerId))) return NextResponse.json({ error: "The assigned manager must be in your tenant." }, { status: 403 });

      const branchTenant = superAdmin
        ? ((franchiseId ? (await prisma.franchise.findUnique({ where: { id: franchiseId }, select: { tenantId: true } }))?.tenantId : null) || (await getPrimaryTenantId()))
        : (actorTenant as string);
      const branch = id
        ? await prisma.branch.update({
            where: { id },
            data: { name, code, franchiseId: franchiseId || null, branchManagerId: branchManagerId || null, city: city || null, status: status || "ACTIVE" },
          })
        : await prisma.branch.create({
            data: { tenantId: branchTenant, name, code, franchiseId: franchiseId || null, branchManagerId: branchManagerId || null, city: city || null, status: status || "ACTIVE" },
          });

      if (branchManagerId) {
        await prisma.user.update({ where: { id: branchManagerId }, data: { branchId: branch.id, hierarchyLevel: "Branch", role: "BRANCH_MANAGER" } }).catch(() => {});
      }
      await writeAudit({ actorId, actorEmail, action: id ? "ORG_UNIT_UPDATE" : "ORG_UNIT_CREATE", detail: `Branch ${name} (${code})` });
      return NextResponse.json({ success: true, item: branch });
    }

    if (actionType === "DEPARTMENT") {
      const { id, name, code, branchId, departmentHeadId, status } = data;
      if (!name || !code) return NextResponse.json({ error: "Department Name and Code are required" }, { status: 400 });
      if (!(await ownsOrReject("department", id))) return NextResponse.json({ error: "That department is not in your tenant." }, { status: 403 });
      if (branchId && !(await ownsOrReject("branch", branchId))) return NextResponse.json({ error: "That branch is not in your tenant." }, { status: 403 });
      if (!(await userInTenant(departmentHeadId))) return NextResponse.json({ error: "The assigned head must be in your tenant." }, { status: 403 });

      const deptTenant = superAdmin
        ? ((branchId ? (await prisma.branch.findUnique({ where: { id: branchId }, select: { tenantId: true } }))?.tenantId : null) || (await getPrimaryTenantId()))
        : (actorTenant as string);
      const department = id
        ? await prisma.department.update({
            where: { id },
            data: { name, code, branchId: branchId || null, departmentHeadId: departmentHeadId || null, status: status || "ACTIVE" },
          })
        : await prisma.department.create({
            data: { tenantId: deptTenant, name, code, branchId: branchId || null, departmentHeadId: departmentHeadId || null, status: status || "ACTIVE" },
          });

      if (departmentHeadId) {
        await prisma.user.update({ where: { id: departmentHeadId }, data: { departmentId: department.id, hierarchyLevel: "Department", role: "DEPARTMENT_HEAD" } }).catch(() => {});
      }
      await writeAudit({ actorId, actorEmail, action: id ? "ORG_UNIT_UPDATE" : "ORG_UNIT_CREATE", detail: `Department ${name} (${code})` });
      return NextResponse.json({ success: true, item: department });
    }

    if (actionType === "TEAM") {
      const { id, name, code, departmentId, teamLeaderId, status } = data;
      if (!name || !code) return NextResponse.json({ error: "Team Name and Code are required" }, { status: 400 });
      if (!(await ownsOrReject("team", id))) return NextResponse.json({ error: "That team is not in your tenant." }, { status: 403 });
      if (departmentId && !(await ownsOrReject("department", departmentId))) return NextResponse.json({ error: "That department is not in your tenant." }, { status: 403 });
      if (!(await userInTenant(teamLeaderId))) return NextResponse.json({ error: "The assigned leader must be in your tenant." }, { status: 403 });

      const teamTenant = superAdmin
        ? ((departmentId ? (await prisma.department.findUnique({ where: { id: departmentId }, select: { tenantId: true } }))?.tenantId : null) || (await getPrimaryTenantId()))
        : (actorTenant as string);
      const team = id
        ? await prisma.team.update({
            where: { id },
            data: { name, code, departmentId: departmentId || null, teamLeaderId: teamLeaderId || null, status: status || "ACTIVE" },
          })
        : await prisma.team.create({
            data: { tenantId: teamTenant, name, code, departmentId: departmentId || null, teamLeaderId: teamLeaderId || null, status: status || "ACTIVE" },
          });

      if (teamLeaderId) {
        await prisma.user.update({ where: { id: teamLeaderId }, data: { teamId: team.id, hierarchyLevel: "Team", role: "TEAM_LEADER" } }).catch(() => {});
      }
      await writeAudit({ actorId, actorEmail, action: id ? "ORG_UNIT_UPDATE" : "ORG_UNIT_CREATE", detail: `Team ${name} (${code})` });
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
