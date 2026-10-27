import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { hasCrmAccess, isSuperAdmin, roleDataScope } from "@/lib/roles";

export async function requireCrmApi() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasCrmAccess(session.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return {
    session,
    isAdmin: isSuperAdmin(session.user.role),
    userId: session.user.id,
    tenantId: session.user.tenantId ?? null,
  };
}

/**
 * True when the role's data scope confines it to records it personally owns
 * (EXECUTIVE/EMPLOYEE/AGENT and sandbox/demo users). Leaders — and super admins —
 * see the whole tenant. This is the single source of truth every per-model scope
 * helper below shares, so the page-level narrowing always matches `roleDataScope`.
 */
export function isOwnScopeRole(role: Role): boolean {
  if (isSuperAdmin(role)) return false;
  const dataScope = roleDataScope(role);
  return dataScope === "OWN" || dataScope === "SANDBOX";
}

const tenantBase = (tenantId: string | null | undefined) => ({
  // Fail-closed: no tenant yields an impossible match, never a tenant-wide one.
  tenantId: tenantId || "__no_tenant__",
});

/**
 * Prisma `where` for any model with an `ownerId` column (Lead, CrmGoal): TENANT-FIRST.
 * The tenant filter is ALWAYS applied (fail-closed to an impossible match when there
 * is no tenant), and the role's data scope only narrows *within* that tenant. A
 * manager can see the whole tenant's records — never another tenant's.
 */
export function ownerScopeForUser(
  role: Role,
  userId: string,
  tenantId: string | null | undefined
): { tenantId: string; ownerId?: string } {
  const base = tenantBase(tenantId);
  return isOwnScopeRole(role) ? { ...base, ownerId: userId } : base;
}

/** Back-compat alias — leads scope by `ownerId` like every other owner model. */
export function leadScopeForUser(
  role: Role,
  userId: string,
  tenantId: string | null | undefined
): { tenantId: string; ownerId?: string } {
  return ownerScopeForUser(role, userId, tenantId);
}

/**
 * Prisma `where` for Transaction: TENANT-FIRST, then narrowed for OWN-scope roles
 * to the deals they are party to — their own transactions, transactions on a
 * property they are the listing agent for, or transactions carrying their
 * commission. Leaders see the whole tenant's transactions.
 */
export function transactionScopeForUser(
  role: Role,
  userId: string,
  tenantId: string | null | undefined
): Record<string, unknown> {
  const base = tenantBase(tenantId);
  if (!isOwnScopeRole(role)) return base;
  return {
    ...base,
    OR: [
      { userId },
      { property: { agentId: userId } },
      { agentCommission: { agentId: userId } },
    ],
  };
}

/**
 * Prisma `where` for AgentCommission: TENANT-FIRST, narrowed to the agent's own
 * commissions for OWN-scope roles. Leaders see the whole tenant.
 */
export function commissionScopeForUser(
  role: Role,
  userId: string,
  tenantId: string | null | undefined
): { tenantId: string; agentId?: string } {
  const base = tenantBase(tenantId);
  return isOwnScopeRole(role) ? { ...base, agentId: userId } : base;
}

/**
 * Prisma `where` for the User list behind the wallet view: TENANT-FIRST, narrowed
 * to the viewer's own user row for OWN-scope roles so an agent can't read other
 * users' balances. Leaders see every user in their tenant.
 */
export function walletUserScopeForUser(
  role: Role,
  userId: string,
  tenantId: string | null | undefined
): { tenantId: string; id?: string } {
  const base = tenantBase(tenantId);
  return isOwnScopeRole(role) ? { ...base, id: userId } : base;
}
