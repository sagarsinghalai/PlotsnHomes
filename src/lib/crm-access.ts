import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
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

/** The User membership column a mid-level leader scopes their subtree by. */
type UnitField = "franchiseId" | "branchId" | "departmentId" | "teamId";
function unitFieldForScope(dataScope: string): UnitField | null {
  switch (dataScope) {
    case "FR": return "franchiseId";
    case "BR": return "branchId";
    case "DEPT": return "departmentId";
    case "TEAM": return "teamId";
    default: return null;
  }
}

/**
 * The set of user ids whose owner-owned records a viewer may see WITHIN their
 * tenant, or `null` for "the whole tenant" (super admins, platform/org and
 * white-label admins). Narrowing:
 *   - OWN/SANDBOX roles → just themselves.
 *   - Mid-level leaders (FR/BR/DEPT/TEAM) → every user in the org unit they
 *     belong to (their franchise/branch/department/team), plus themselves.
 * Fail-closed: a mid-level leader with no unit assigned sees only their own.
 */
export async function resolveScopeOwnerIds(
  role: Role,
  userId: string,
  tenantId: string | null | undefined
): Promise<string[] | null> {
  if (isSuperAdmin(role)) return null;
  const dataScope = roleDataScope(role);
  if (dataScope === "OWN" || dataScope === "SANDBOX") return [userId];

  const field = unitFieldForScope(dataScope);
  if (!field) return null; // GLB/ORG/WL → whole tenant

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { franchiseId: true, branchId: true, departmentId: true, teamId: true },
  });
  const unitId = me?.[field];
  if (!unitId) return [userId]; // misconfigured leader → own only (fail-closed)

  const members = await prisma.user.findMany({
    where: { tenantId: tenantId || "__no_tenant__", [field]: unitId },
    select: { id: true },
  });
  const ids = new Set(members.map((m) => m.id));
  ids.add(userId);
  return Array.from(ids);
}

/** An `ownerId`-style clause from a resolved id set (exact for one, `in` for many). */
function idClause(ids: string[]): string | { in: string[] } {
  return ids.length === 1 ? ids[0] : { in: ids };
}

/**
 * Prisma `where` for any model with an `ownerId` column (Lead, CrmGoal): TENANT-FIRST,
 * then narrowed by the role's data scope WITHIN that tenant — own records (OWN roles),
 * the leader's org-unit subtree (FR/BR/DEPT/TEAM), or the whole tenant (WL/owner).
 */
export async function ownerScopeForUser(
  role: Role,
  userId: string,
  tenantId: string | null | undefined
): Promise<Record<string, unknown>> {
  const base = tenantBase(tenantId);
  const ids = await resolveScopeOwnerIds(role, userId, tenantId);
  return ids ? { ...base, ownerId: idClause(ids) } : base;
}

/** Back-compat alias — leads scope by `ownerId` like every other owner model. */
export async function leadScopeForUser(
  role: Role,
  userId: string,
  tenantId: string | null | undefined
): Promise<Record<string, unknown>> {
  return ownerScopeForUser(role, userId, tenantId);
}

/**
 * Prisma `where` for Transaction: TENANT-FIRST, then narrowed to the deals in the
 * viewer's scope — transactions they (or anyone in their subtree) are party to:
 * their own, on a property their subtree lists, or carrying their subtree's
 * commission. Leaders/owners see the whole tenant's transactions.
 */
export async function transactionScopeForUser(
  role: Role,
  userId: string,
  tenantId: string | null | undefined
): Promise<Record<string, unknown>> {
  const base = tenantBase(tenantId);
  const ids = await resolveScopeOwnerIds(role, userId, tenantId);
  if (!ids) return base;
  const c = idClause(ids);
  return {
    ...base,
    OR: [
      { userId: c },
      { property: { agentId: c } },
      { agentCommission: { agentId: c } },
    ],
  };
}

/**
 * Prisma `where` for AgentCommission: TENANT-FIRST, narrowed to the agent's own (or
 * their subtree's) commissions. Leaders/owners see the whole tenant.
 */
export async function commissionScopeForUser(
  role: Role,
  userId: string,
  tenantId: string | null | undefined
): Promise<Record<string, unknown>> {
  const base = tenantBase(tenantId);
  const ids = await resolveScopeOwnerIds(role, userId, tenantId);
  return ids ? { ...base, agentId: idClause(ids) } : base;
}

/**
 * Prisma `where` for the User list behind the wallet view: TENANT-FIRST, narrowed
 * to the viewer (OWN roles) or their org-unit members (mid-level leaders) so an
 * agent can't read other users' balances. Leaders/owners see every tenant user.
 */
export async function walletUserScopeForUser(
  role: Role,
  userId: string,
  tenantId: string | null | undefined
): Promise<Record<string, unknown>> {
  const base = tenantBase(tenantId);
  const ids = await resolveScopeOwnerIds(role, userId, tenantId);
  return ids ? { ...base, id: idClause(ids) } : base;
}
