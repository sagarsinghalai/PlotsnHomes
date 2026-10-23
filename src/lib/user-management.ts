import type { Role } from "@prisma/client";
import { isSuperAdmin } from "@/lib/roles";

/**
 * Stage D — who may activate/deactivate (manage) whose account.
 *
 * The platform owner manages anyone. A tenant/parent admin manages only accounts
 * strictly below them, within their own subtree, and never a super admin or
 * themselves. User.active gates login, so deactivation = immediate lockout with
 * data preserved.
 */
export type ManageableUser = {
  id: string;
  role: Role | string;
  tenantId?: string | null;
  franchiseId?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
};

const RANK: Record<string, number> = {
  SUPERADMIN: 100,
  PLATFORM_ADMIN: 95,
  WHITE_LABEL_ADMIN: 80,
  FRANCHISE_ADMIN: 70,
  BRANCH_MANAGER: 60,
  DEPARTMENT_HEAD: 50,
  TEAM_LEADER: 40,
  EXECUTIVE: 30,
  EMPLOYEE: 25,
  AGENT: 20,
  SELLER: 10,
  BUYER: 10,
  DEMO: 5,
};
function rank(r: string | Role): number {
  return RANK[String(r)] ?? 0;
}

export function canManageUser(actor: ManageableUser, target: ManageableUser): boolean {
  if (!actor || !target) return false;
  if (actor.id === target.id) return false; // no self-management (can't lock yourself out)
  if (isSuperAdmin(target.role as Role)) return false; // a platform owner is never deactivated here
  if (isSuperAdmin(actor.role as Role)) return true; // platform owner manages anyone else
  if (!actor.tenantId || actor.tenantId !== target.tenantId) return false; // same tenant only
  if (rank(target.role) >= rank(actor.role)) return false; // only strictly-lower ranks

  switch (actor.role) {
    case "WHITE_LABEL_ADMIN":
      return true; // the whole tenant
    case "FRANCHISE_ADMIN":
      return !!actor.franchiseId && actor.franchiseId === target.franchiseId;
    case "BRANCH_MANAGER":
      return !!actor.branchId && actor.branchId === target.branchId;
    case "DEPARTMENT_HEAD":
      return !!actor.departmentId && actor.departmentId === target.departmentId;
    case "TEAM_LEADER":
      return !!actor.teamId && actor.teamId === target.teamId;
    default:
      return false;
  }
}
