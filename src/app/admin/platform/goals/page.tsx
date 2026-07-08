import { GoalsManager } from "@/components/admin/goals-manager";
import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";
import { prisma } from "@/lib/prisma";

export default async function GoalsPage() {
  const goals = await prisma.crmGoal.findMany({
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
