import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { LogsManager } from "@/components/admin/logs-manager";
import { resolveScopeOwnerIds } from "@/lib/crm-access";
import { isSuperAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const session = await getServerSession(authOptions);

  // Scope whose activity this viewer may see. Only the platform owner
  // (SUPERADMIN/PLATFORM_ADMIN) sees everything (null). A white-label admin sees
  // their own tenant's users; a mid-level leader sees their org-unit subtree; an
  // agent/staffer sees only their own. So no one below the owner sees the owner's
  // logs. We translate the scoped user-ids to the emails the logs are keyed by.
  let allowedActorEmails: string[] | null = null;
  const u = session?.user;
  if (u && !isSuperAdmin(u.role)) {
    const ids = await resolveScopeOwnerIds(u.role, u.id, u.tenantId);
    const where = ids ? { id: { in: ids } } : { tenantId: u.tenantId ?? "__none__" };
    const users = await prisma.user.findMany({ where, select: { email: true } });
    allowedActorEmails = users.map((x) => x.email.toLowerCase());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-extrabold text-slate-900 dark:text-white font-display">
          Platform Activity & Audit Logs
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Real-time audit log of admin operations, employee tasks, agent activities, seller submissions, customer interactions, and system profile edits
        </p>
      </div>

      <LogsManager allowedActorEmails={allowedActorEmails} viewerEmail={u?.email ?? null} />
    </div>
  );
}
