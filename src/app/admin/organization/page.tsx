import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";
import { OrganizationUnitsManager } from "@/components/admin/organization-units-manager";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminOrganizationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    redirect("/admin");
  }

  const [organizations, franchises, branches, departments, teams, users] = await Promise.all([
    prisma.organization?.findMany
      ? prisma.organization.findMany({
          include: {
            whiteLabelAdmin: { select: { id: true, name: true, email: true, role: true } },
            _count: { select: { franchises: true, users: true } },
          },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.franchise?.findMany
      ? prisma.franchise.findMany({
          include: {
            organization: { select: { id: true, name: true } },
            franchiseAdmin: { select: { id: true, name: true, email: true, role: true } },
            _count: { select: { branches: true, users: true } },
          },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.branch?.findMany
      ? prisma.branch.findMany({
          include: {
            franchise: {
              select: {
                id: true,
                name: true,
                organizationId: true,
                organization: { select: { id: true, name: true } },
              },
            },
            branchManager: { select: { id: true, name: true, email: true, role: true } },
            _count: { select: { departments: true, users: true } },
          },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.department?.findMany
      ? prisma.department.findMany({
          include: {
            branch: {
              select: {
                id: true,
                name: true,
                franchiseId: true,
                franchise: {
                  select: {
                    id: true,
                    name: true,
                    organizationId: true,
                  },
                },
              },
            },
            departmentHead: { select: { id: true, name: true, email: true, role: true } },
            _count: { select: { teams: true, users: true } },
          },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.team?.findMany
      ? prisma.team.findMany({
          include: {
            department: {
              select: {
                id: true,
                name: true,
                branchId: true,
                branch: {
                  select: {
                    id: true,
                    name: true,
                    franchiseId: true,
                    franchise: {
                      select: {
                        id: true,
                        name: true,
                        organizationId: true,
                      },
                    },
                  },
                },
              },
            },
            teamLeader: { select: { id: true, name: true, email: true, role: true } },
            _count: { select: { users: true } },
          },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        franchiseId: true,
        branchId: true,
        departmentId: true,
        teamId: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Organizations & Franchises"
        description="Super Admin Management Console for White Label Tenants, Regional Franchises, City Branches, Departments, and Teams."
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Organizations & Franchises" },
        ]}
      />

      <OrganizationUnitsManager
        organizations={organizations as any}
        franchises={franchises as any}
        branches={branches as any}
        departments={departments as any}
        teams={teams as any}
        allUsers={users as any}
      />
    </div>
  );
}
