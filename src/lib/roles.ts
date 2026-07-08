import { Role } from "@prisma/client";

/** Staff roles that can manage CRM and listings */
export const CRM_ROLES: Role[] = [Role.SUPERADMIN, Role.EMPLOYEE, Role.AGENT];

/** Roles with access to the admin panel */
export const ADMIN_PANEL_ROLES: Role[] = [Role.SUPERADMIN, Role.EMPLOYEE];

/** Full platform control (user deletion, last-superadmin guard) */
export const SUPERADMIN_ROLES: Role[] = [Role.SUPERADMIN];

/** Customer-facing marketplace roles */
export const CUSTOMER_ROLES: Role[] = [Role.BUYER, Role.SELLER, Role.DEMO];

export const ROLE_LABELS: Record<Role, string> = {
  SUPERADMIN: "Super Admin",
  EMPLOYEE: "Employee",
  AGENT: "Agent",
  DEMO: "Demo",
  SELLER: "Seller",
  BUYER: "Buyer",
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}

export function hasCrmAccess(role: Role): boolean {
  return CRM_ROLES.includes(role);
}

export function hasAdminPanelAccess(role: Role): boolean {
  return ADMIN_PANEL_ROLES.includes(role);
}

export function isSuperAdmin(role: Role): boolean {
  return role === Role.SUPERADMIN;
}

export function isCustomerRole(role: Role): boolean {
  return CUSTOMER_ROLES.includes(role);
}

export function staffRolesFilter() {
  return { in: CRM_ROLES };
}

export function adminPanelRolesFilter() {
  return { in: ADMIN_PANEL_ROLES };
}
