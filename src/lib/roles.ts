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

/**
 * Account-creation authority, highest → lowest. A user may only create accounts
 * whose role is STRICTLY BELOW their own rank — so no one mints a peer or a
 * superior (privilege-escalation guard). SUPERADMIN is assignable only by a
 * SUPERADMIN; DEMO is reserved for SUPERADMIN too. An AGENT therefore gets only
 * SELLER and BUYER.
 */
const ROLE_RANK: Role[] = [
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

export function assignableRoles(creatorRole: Role | string | null | undefined): Role[] {
  if (creatorRole === Role.SUPERADMIN) return [...ROLE_RANK, Role.DEMO]; // every role
  const myRank = ROLE_RANK.indexOf(creatorRole as Role);
  if (myRank < 0) return [Role.SELLER, Role.BUYER]; // unknown/own-scope → customers only
  return ROLE_RANK.filter((_, i) => i > myRank); // strictly below the creator
}

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
