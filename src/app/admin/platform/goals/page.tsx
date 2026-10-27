import { GoalsManager } from "@/components/admin/goals-manager";
import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { ownerScopeForUser } from "@/lib/crm-access";

export default async function GoalsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId || "__no_tenant__";
  // OWN-scope roles only see goals assigned to them; leaders see the whole tenant.
  const goalWhere = session?.user
    ? await ownerScopeForUser(session.user.role, session.user.id, session.user.tenantId)
    : { tenantId, ownerId: "__no_tenant__" as string | undefined };
  const goals = await prisma.crmGoal.findMany({
    where: goalWhere,
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true } } },
  });

  return (
    <div className="flex gap-8">
      <PlatformSettingsNav />
      <div className="flex-1">
        <h1 className="font-display text-3xl font-bold">Goals</h1>
        <p className="mt-1 text-slate-600">Add and manage sales goals</p>
        <div className="mt-8">
          <GoalsManager goals={goals} />
        </div>
      </div>
    </div>
  );
}
