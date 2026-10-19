import { prisma } from "@/lib/prisma";
import { TeamsManager, type TeamRow } from "@/components/admin/teams-manager";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const [teams, departments, leaders] = await Promise.all([
    prisma.team.findMany({
      include: {
        department: { select: { id: true, name: true } },
        teamLeader: { select: { id: true, name: true, email: true } },
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
  ]);

  const serialized: TeamRow[] = teams.map((t) => ({
    id: t.id,
    name: t.name,
    code: t.code,
    status: t.status,
    departmentId: t.departmentId,
    teamLeaderId: t.teamLeaderId,
    department: t.department,
    teamLeader: t.teamLeader,
    _count: t._count,
  }));

  return (
    <TeamsManager
      initialTeams={serialized}
      departments={departments}
      leaders={leaders}
    />
  );
}
