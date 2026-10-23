import { isSuperAdmin } from "@/lib/roles";

/**
 * Who may manage the org hierarchy (franchises/branches/departments/teams).
 * Platform owners manage all tenants; a White Label Admin manages only their own
 * tenant's hierarchy (enforced with a tenant filter at the call site). Creating
 * or editing the tenant (Organization) itself, and the field-privacy matrix,
 * stay platform-owner only.
 */
export function canManageOrgUnits(role?: string | null): boolean {
  if (!role) return false;
  return isSuperAdmin(role as any) || role === "WHITE_LABEL_ADMIN";
}
