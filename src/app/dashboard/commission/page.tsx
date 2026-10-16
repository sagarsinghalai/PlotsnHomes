import { AgentCommissionTracker } from "@/components/admin/agent-commission-tracker";
import { requireAuth } from "@/lib/auth";
import { Role } from "@prisma/client";

export default async function DashboardCommissionPage() {
  const session = await requireAuth([Role.SUPERADMIN, Role.EMPLOYEE, Role.AGENT, Role.DEMO]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-slate-900 dark:text-white">
          My Commission Tracker
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Track property leads, sold properties, property values, earned commissions, and payout status.
        </p>
      </div>

      <AgentCommissionTracker agentId={session.user.id} isAdmin={false} />
    </div>
  );
}
