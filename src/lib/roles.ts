import { Role } from "@prisma/client";

/** Staff roles that can manage CRM and listings */
export const CRM_ROLES: Role[] = [
  Role.SUPERADMIN,
  Role.PLATFORM_ADMIN,
  Role.WHITE_LABEL_ADMIN,
  Role.FRANCHISE_ADMIN,
  Role.BRANCH_MANAGER,
  Role.DEPARTMENT_HEAD,
  Role.TEAM_LEADER,
  Role.EXECUTIVE,
  Role.EMPLOYEE,
  Role.AGENT,
];

/** Roles with access to the admin panel */
export const ADMIN_PANEL_ROLES: Role[] = [
  Role.SUPERADMIN,
  Role.PLATFORM_ADMIN,
  Role.WHITE_LABEL_ADMIN,
  Role.FRANCHISE_ADMIN,
  Role.BRANCH_MANAGER,
  Role.DEPARTMENT_HEAD,
  Role.TEAM_LEADER,
  Role.EXECUTIVE,
  Role.EMPLOYEE,
  Role.AGENT,
  Role.SELLER,
  Role.BUYER,
];

/** Full platform control (user deletion, last-superadmin guard) */
export const SUPERADMIN_ROLES: Role[] = [Role.SUPERADMIN, Role.PLATFORM_ADMIN];

/** Customer-facing marketplace roles */
export const CUSTOMER_ROLES: Role[] = [Role.BUYER, Role.SELLER, Role.DEMO];

export const ROLE_LABELS: Record<Role, string> = {
  SUPERADMIN: "Super Admin",
  PLATFORM_ADMIN: "Platform Admin",
  WHITE_LABEL_ADMIN: "White Label Admin",
  FRANCHISE_ADMIN: "Franchise Admin",
  BRANCH_MANAGER: "Branch Manager",
  DEPARTMENT_HEAD: "Department Head",
  TEAM_LEADER: "Team Leader",
  EXECUTIVE: "Executive",
  EMPLOYEE: "Employee",
  AGENT: "Agent",
  DEMO: "Demo User",
  SELLER: "Seller",
  BUYER: "Buyer",
};

export const HIERARCHY_LEVELS: Record<Role, string> = {
  SUPERADMIN: "Platform",
  PLATFORM_ADMIN: "Platform",
  WHITE_LABEL_ADMIN: "Tenant",
  FRANCHISE_ADMIN: "Franchise",
  BRANCH_MANAGER: "Branch",
  DEPARTMENT_HEAD: "Department",
  TEAM_LEADER: "Team",
  EXECUTIVE: "Employee",
  EMPLOYEE: "Employee",
  AGENT: "Employee",
  BUYER: "Customer",
  SELLER: "Customer",
  DEMO: "Guest",
};

export const ROLE_DATA_SCOPES: Record<Role, string> = {
  SUPERADMIN: "GLB",
  PLATFORM_ADMIN: "ORG",
  WHITE_LABEL_ADMIN: "WL",
  FRANCHISE_ADMIN: "FR",
  BRANCH_MANAGER: "BR",
  DEPARTMENT_HEAD: "DEPT",
  TEAM_LEADER: "TEAM",
  EXECUTIVE: "OWN",
  EMPLOYEE: "OWN",
  AGENT: "OWN",
  BUYER: "OWN",
  SELLER: "OWN",
  DEMO: "SANDBOX",
};

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role;
}

export function roleHierarchyLevel(role: Role): string {
  return HIERARCHY_LEVELS[role] ?? "Employee";
}

export function roleDataScope(role: Role): string {
  return ROLE_DATA_SCOPES[role] ?? "OWN";
}

export function hasCrmAccess(role: Role): boolean {
  return CRM_ROLES.includes(role);
}

export function hasAdminPanelAccess(role: Role): boolean {
  return ADMIN_PANEL_ROLES.includes(role);
}

export function isSuperAdmin(role: Role): boolean {
  return role === Role.SUPERADMIN || role === Role.PLATFORM_ADMIN;
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
