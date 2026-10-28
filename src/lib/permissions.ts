import { prisma } from "./prisma";
import { isSuperAdmin } from "./roles";

export type PermissionSubhead = {
  key: string;
  label: string;
  route: string;
};

export type PermissionHead = {
  label: string;
  subheads: PermissionSubhead[];
};

export const PERMISSIONS_SCHEMA: PermissionHead[] = [
  {
    label: "Overview",
    subheads: [
      { key: "overview_dashboard", label: "Overview Dashboard", route: "/admin" },
    ],
  },
  {
    label: "People",
    subheads: [
      { key: "users_accounts", label: "Users & accounts", route: "/admin/users" },
      { key: "team_hierarchy", label: "Team hierarchy", route: "/admin/hierarchy" },
      { key: "organization_units", label: "Organizations & Franchises", route: "/admin/organization" },
      { key: "developers", label: "Developers", route: "/admin/developers" },
      { key: "kyc_verification", label: "KYC verification", route: "/admin/kyc" },
    ],
  },
  {
    label: "Listings",
    subheads: [
      { key: "projects", label: "Projects", route: "/admin/projects" },
      { key: "properties", label: "Properties", route: "/admin/properties" },
      { key: "price_history", label: "Price History", route: "/admin/price-history" },
      { key: "categories", label: "Categories", route: "/admin/categories" },
    ],
  },
  {
    label: "Sales & CRM",
    subheads: [
      { key: "all_leads", label: "All leads", route: "/admin/leads" },
      { key: "pipeline", label: "Pipeline", route: "/admin/crm" },
      { key: "inquiries", label: "Inquiries", route: "/admin/inquiries" },
      { key: "site_visits", label: "Site visits", route: "/admin/showings" },
      { key: "reports", label: "Reports", route: "/admin/reports" },
      { key: "form_registrations", label: "Form Registrations", route: "/admin/form-registrations" },
    ],
  },
  {
    label: "Finance",
    subheads: [
      { key: "pricing_shares", label: "Pricing & Shares", route: "/admin/pricing" },
      { key: "billing", label: "Billing & subscriptions", route: "/admin/billing" },
      { key: "transactions", label: "Transactions", route: "/admin/transactions" },
      { key: "wallets", label: "Wallets", route: "/admin/wallets" },
      { key: "trade_history", label: "Trade History", route: "/admin/trades" },
      { key: "payouts", label: "Payouts", route: "/admin/payouts" },
      { key: "payment_methods", label: "Payment Methods", route: "/admin/payments" },
      { key: "loans", label: "Loans", route: "/admin/loans" },
      { key: "invoices", label: "Invoices", route: "/admin/bookings/invoices" },
      { key: "rates", label: "Rates", route: "/admin/rates" },
    ],
  },
  {
    label: "Communications",
    subheads: [
      { key: "comms_hub", label: "Hub", route: "/admin/communications" },
      { key: "whatsapp_hub", label: "WhatsApp Hub", route: "/admin/whatsapp" },
      { key: "send_message", label: "Send message", route: "/admin/messages" },
      { key: "meetings", label: "Meetings", route: "/admin/meetings" },
      { key: "email_log", label: "Email log", route: "/admin/emails" },
      { key: "email_hub", label: "Email Hub", route: "/admin/emails/hub" },
    ],
  },
  {
    label: "Settings",
    subheads: [
      { key: "frontend_settings", label: "Frontend Settings", route: "/admin/settings/frontend" },
      { key: "platform", label: "Platform", route: "/admin/platform" },
      { key: "integrations", label: "Integrations", route: "/admin/integrations" },
    ],
  },
  {
    label: "Other settings",
    subheads: [
      { key: "business_profile", label: "Business Profile", route: "/admin/settings/business-profile" },
      { key: "roles_permissions", label: "Roles & permissions", route: "/admin/settings/roles" },
      { key: "dropdown_options", label: "Dropdown options", route: "/admin/settings/dropdowns" },
      { key: "webpage_editor", label: "Webpage Editor", route: "/admin/settings/webpage-editor" },
      { key: "footer_settings", label: "Footer", route: "/admin/settings/footer" },
      { key: "variables_templates", label: "Variables & Templates", route: "/admin/variables-templates" },
      { key: "white_label_hub", label: "White-Label & Subscription Hub", route: "/admin/settings/white-label" },
      { key: "system_status", label: "System status", route: "/admin/settings" },
      { key: "live_markets", label: "Live markets", route: "/markets" },
    ],
  },
];

export type PermissionGroup =
  | "ADMIN"
  | "PLATFORM_ADMIN"
  | "WHITE_LABEL_ADMIN"
  | "FRANCHISE_ADMIN"
  | "BRANCH_MANAGER"
  | "DEPARTMENT_HEAD"
  | "TEAM_LEADER"
  | "EXECUTIVE"
  | "EMPLOYEE"
  | "AGENT"
  | "SELLER"
  | "BUYER"
  | "DEMO";

export const PERMISSION_GROUPS: { value: PermissionGroup; label: string }[] = [
  { value: "ADMIN", label: "Super Admin (Global Scope)" },
  { value: "PLATFORM_ADMIN", label: "Platform Admin (Organization Scope)" },
  { value: "WHITE_LABEL_ADMIN", label: "White Label Admin (Tenant Scope)" },
  { value: "FRANCHISE_ADMIN", label: "Franchise Admin (Franchise Scope)" },
  { value: "BRANCH_MANAGER", label: "Branch Manager (Branch Scope)" },
  { value: "DEPARTMENT_HEAD", label: "Department Head (Department Scope)" },
  { value: "TEAM_LEADER", label: "Team Leader (Team Scope)" },
  { value: "EXECUTIVE", label: "Executive (Own Scope)" },
  { value: "SELLER", label: "Seller (Own Store)" },
  { value: "BUYER", label: "Customer (Own Profile)" },
  { value: "DEMO", label: "Demo User (Sandbox Scope)" },
];

export type RolePermissionsConfig = Record<
  PermissionGroup,
  Record<string, { view: boolean; add: boolean; edit: boolean; delete: boolean }>
>;

type PermCell = { view: boolean; add: boolean; edit: boolean; delete: boolean };

const FULL_ADMIN_BASE: Record<string, PermCell> = {
  overview_dashboard: { view: true, add: true, edit: true, delete: true },
  users_accounts: { view: true, add: true, edit: true, delete: true },
  team_hierarchy: { view: true, add: true, edit: true, delete: true },
  developers: { view: true, add: true, edit: true, delete: true },
  kyc_verification: { view: true, add: true, edit: true, delete: true },
  projects: { view: true, add: true, edit: true, delete: true },
  properties: { view: true, add: true, edit: true, delete: true },
  price_history: { view: true, add: true, edit: true, delete: true },
  categories: { view: true, add: true, edit: true, delete: true },
  listing_types: { view: true, add: true, edit: true, delete: true },
  property_types: { view: true, add: true, edit: true, delete: true },
  statuses: { view: true, add: true, edit: true, delete: true },
  all_leads: { view: true, add: true, edit: true, delete: true },
  pipeline: { view: true, add: true, edit: true, delete: true },
  inquiries: { view: true, add: true, edit: true, delete: true },
  site_visits: { view: true, add: true, edit: true, delete: true },
  reports: { view: true, add: true, edit: true, delete: true },
  pricing_shares: { view: true, add: true, edit: true, delete: true },
  billing: { view: true, add: true, edit: true, delete: true },
  transactions: { view: true, add: true, edit: true, delete: true },
  wallets: { view: true, add: true, edit: true, delete: true },
  trade_history: { view: true, add: true, edit: true, delete: true },
  payouts: { view: true, add: true, edit: true, delete: true },
  payment_methods: { view: true, add: true, edit: true, delete: true },
  loans: { view: true, add: true, edit: true, delete: true },
  invoices: { view: true, add: true, edit: true, delete: true },
  rates: { view: true, add: true, edit: true, delete: true },
  comms_hub: { view: true, add: true, edit: true, delete: true },
  whatsapp_hub: { view: true, add: true, edit: true, delete: true },
  send_message: { view: true, add: true, edit: true, delete: true },
  meetings: { view: true, add: true, edit: true, delete: true },
  email_log: { view: true, add: true, edit: true, delete: true },
  email_hub: { view: true, add: true, edit: true, delete: true },
  frontend_settings: { view: true, add: true, edit: true, delete: true },
  platform: { view: true, add: true, edit: true, delete: true },
  integrations: { view: true, add: true, edit: true, delete: true },
  webpage_editor: { view: true, add: true, edit: true, delete: true },
  footer_settings: { view: true, add: true, edit: true, delete: true },
  system_status: { view: true, add: true, edit: true, delete: true },
  live_markets: { view: true, add: true, edit: true, delete: true },
};

const END_USER_BASE: Record<string, PermCell> = {
  overview_dashboard: { view: false, add: false, edit: false, delete: false },
  users_accounts: { view: false, add: false, edit: false, delete: false },
  team_hierarchy: { view: false, add: false, edit: false, delete: false },
  developers: { view: false, add: false, edit: false, delete: false },
  kyc_verification: { view: true, add: true, edit: true, delete: false },
  projects: { view: false, add: false, edit: false, delete: false },
  properties: { view: true, add: false, edit: false, delete: false },
  price_history: { view: false, add: false, edit: false, delete: false },
  categories: { view: false, add: false, edit: false, delete: false },
  listing_types: { view: false, add: false, edit: false, delete: false },
  property_types: { view: false, add: false, edit: false, delete: false },
  statuses: { view: false, add: false, edit: false, delete: false },
  all_leads: { view: false, add: false, edit: false, delete: false },
  pipeline: { view: false, add: false, edit: false, delete: false },
  inquiries: { view: true, add: true, edit: false, delete: false },
  site_visits: { view: true, add: true, edit: false, delete: false },
  reports: { view: false, add: false, edit: false, delete: false },
  pricing_shares: { view: false, add: false, edit: false, delete: false },
  billing: { view: false, add: false, edit: false, delete: false },
  transactions: { view: true, add: false, edit: false, delete: false },
  wallets: { view: false, add: false, edit: false, delete: false },
  trade_history: { view: false, add: false, edit: false, delete: false },
  payouts: { view: false, add: false, edit: false, delete: false },
  payment_methods: { view: false, add: false, edit: false, delete: false },
  loans: { view: true, add: true, edit: false, delete: false },
  invoices: { view: false, add: false, edit: false, delete: false },
  rates: { view: false, add: false, edit: false, delete: false },
  comms_hub: { view: false, add: false, edit: false, delete: false },
  whatsapp_hub: { view: false, add: false, edit: false, delete: false },
  send_message: { view: true, add: true, edit: false, delete: false },
  meetings: { view: false, add: false, edit: false, delete: false },
  email_log: { view: false, add: false, edit: false, delete: false },
  email_hub: { view: false, add: false, edit: false, delete: false },
  platform: { view: false, add: false, edit: false, delete: false },
  integrations: { view: false, add: false, edit: false, delete: false },
  system_status: { view: false, add: false, edit: false, delete: false },
  live_markets: { view: true, add: true, edit: true, delete: true },
};

// Every menu item in PERMISSIONS_SCHEMA must appear for every role, so the Roles
// & Permissions UI never misses an item and route checks never fall through to a
// missing key. Admin roles default-allow any key not set explicitly above; end
// users default-deny. Explicit entries in the *_BASE objects always win, and any
// extra legacy keys they carry are preserved.
const ALL_PERMISSION_KEYS = PERMISSIONS_SCHEMA.flatMap((h) => h.subheads.map((s) => s.key));
function fillPermissions(base: Record<string, PermCell>, fallback: PermCell): Record<string, PermCell> {
  const out: Record<string, PermCell> = {};
  for (const k of ALL_PERMISSION_KEYS) out[k] = base[k] ? { ...base[k] } : { ...fallback };
  for (const k of Object.keys(base)) if (!(k in out)) out[k] = { ...base[k] };
  return out;
}

const fullAdminPerms = fillPermissions(FULL_ADMIN_BASE, { view: true, add: true, edit: true, delete: true });

// Platform-governance items stay with the platform owner only — a white-label /
// tenant admin never edits the global role matrix, the platform settings, or the
// white-label/subscription hub (they'd affect every tenant).
// roles_permissions is now per-tenant, so a white-label admin may tune roles
// within their own tenant; platform settings and the white-label hub stay
// platform-owner only.
const PLATFORM_ONLY_KEYS = ["platform", "white_label_hub"];
// Tenant-governance: only the tenant OWNER (white-label admin) — and the platform
// owner — may open/edit the role-permission matrix. A franchise/branch/team leader
// must never grant permissions (they could escalate their own access), so the
// permission editor is owner-only, not part of the general staff menu set.
const TENANT_GOVERNANCE_KEYS = ["roles_permissions", "business_profile"];
const NONE: PermCell = { view: false, add: false, edit: false, delete: false };

// White-label (tenant) admin: full tenant admin incl. the role matrix for their tenant.
const wlAdminPerms: Record<string, PermCell> = { ...fullAdminPerms };
for (const k of PLATFORM_ONLY_KEYS) wlAdminPerms[k] = { ...NONE };

// Franchise / branch / department / team / staff: same, minus tenant-governance
// (the permission editor). The owner can further restrict them via the matrix.
const subLeaderPerms: Record<string, PermCell> = { ...wlAdminPerms };
for (const k of TENANT_GOVERNANCE_KEYS) subLeaderPerms[k] = { ...NONE };

const endUserPerms = fillPermissions(END_USER_BASE, { ...NONE });

export const DEFAULT_PERMISSIONS: RolePermissionsConfig = {
  ADMIN: fullAdminPerms,
  PLATFORM_ADMIN: fullAdminPerms,
  WHITE_LABEL_ADMIN: wlAdminPerms,
  FRANCHISE_ADMIN: subLeaderPerms,
  BRANCH_MANAGER: subLeaderPerms,
  DEPARTMENT_HEAD: subLeaderPerms,
  TEAM_LEADER: subLeaderPerms,
  EXECUTIVE: subLeaderPerms,
  EMPLOYEE: subLeaderPerms,
  AGENT: subLeaderPerms,
  SELLER: endUserPerms,
  BUYER: endUserPerms,
  DEMO: endUserPerms,
};

/** Who may OPEN or EDIT the role-permission matrix (defense-in-depth beyond the
 * matrix itself): the platform owner, or a tenant's white-label admin. */
export function canManageRolePermissions(role: string | null | undefined): boolean {
  return role === "SUPERADMIN" || role === "PLATFORM_ADMIN" || role === "WHITE_LABEL_ADMIN" || role === "ADMIN";
}

/**
 * Force tenant-governance keys (the permission editor) OFF for any role that may
 * not manage them — regardless of what a saved matrix says. This makes the lock
 * self-healing: a stale/over-broad saved matrix can never re-expose the editor to
 * a franchise/branch/team leader. SUPERADMIN bypasses permission checks elsewhere.
 */
function enforceGovernance(config: RolePermissionsConfig): RolePermissionsConfig {
  const out = { ...config } as Record<string, Record<string, PermCell>>;
  for (const role of Object.keys(out)) {
    if (canManageRolePermissions(role)) continue;
    out[role] = { ...out[role] };
    for (const k of TENANT_GOVERNANCE_KEYS) out[role][k] = { view: false, add: false, edit: false, delete: false };
  }
  return out as RolePermissionsConfig;
}

const ROLE_PERMS_KEY = "user_role_permissions";

/**
 * Role → permission matrix. When a tenantId is given and that tenant has saved
 * its own matrix, it wins; otherwise the platform-global matrix is used, then the
 * built-in DEFAULT_PERMISSIONS. Either way every value is merged over the schema
 * defaults so no item is ever missing.
 */
export async function getRolePermissions(tenantId?: string | null): Promise<RolePermissionsConfig> {
  try {
    let raw: string | null = null;
    if (tenantId) {
      const t = await prisma.tenantSetting.findUnique({
        where: { tenantId_key: { tenantId, key: ROLE_PERMS_KEY } },
      });
      raw = t?.value ?? null;
    }
    if (raw == null) {
      const g = await prisma.systemSetting.findUnique({ where: { key: ROLE_PERMS_KEY } });
      raw = g?.value ?? null;
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged = { ...DEFAULT_PERMISSIONS };
      for (const group of Object.keys(DEFAULT_PERMISSIONS) as PermissionGroup[]) {
        merged[group] = {
          ...DEFAULT_PERMISSIONS[group],
          ...(parsed[group] || {}),
        };
      }
      return enforceGovernance(merged);
    }
  } catch (error) {
    console.error("Failed to read user_role_permissions setting:", error);
  }
  return enforceGovernance(DEFAULT_PERMISSIONS);
}

type PermUser = { email: string; role: string; tenantId?: string | null };

export function getPermissionGroup(user: { email: string; role: string }): PermissionGroup {
  if (!user || !user.role) return "BUYER";
  if (user.role in DEFAULT_PERMISSIONS) {
    return user.role as PermissionGroup;
  }
  return "EMPLOYEE";
}

export function matchPermissionKey(route: string): string | null {
  let bestMatch: any = null;
  for (const head of PERMISSIONS_SCHEMA) {
    for (const subhead of head.subheads) {
      if (subhead.route === "/admin") {
        if (route === "/admin") {
          bestMatch = subhead;
        }
      } else if (route === subhead.route || route.startsWith(subhead.route + "/")) {
        if (!bestMatch || subhead.route.length > bestMatch.route.length) {
          bestMatch = subhead;
        }
      }
    }
  }
  return bestMatch ? bestMatch.key : null;
}

export async function getFirstAllowedAdminRoute(
  user: PermUser | null | undefined
): Promise<string | null> {
  if (!user) return null;
  if (user.role === "SUPERADMIN") return "/admin";

  const permissions = await getRolePermissions(user.tenantId);
  const group = getPermissionGroup(user);
  const userPerms = permissions[group] || {};

  for (const head of PERMISSIONS_SCHEMA) {
    for (const subhead of head.subheads) {
      if (subhead.route !== "/admin" && userPerms[subhead.key]?.view) {
        return subhead.route;
      }
    }
  }
  return null;
}

export async function hasPermission(
  user: PermUser | null | undefined,
  route: string
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "SUPERADMIN") return true;

  const permissionKey = matchPermissionKey(route);
  if (!permissionKey) return true;

  const group = getPermissionGroup(user);
  const permissions = await getRolePermissions(user.tenantId);
  const perm = permissions[group]?.[permissionKey];
  if (!perm) return false;
  return perm.view;
}

export async function hasAddPermissionServer(
  user: PermUser | null | undefined,
  route: string
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "SUPERADMIN") return true;

  const permissionKey = matchPermissionKey(route);
  if (!permissionKey) return true;

  const group = getPermissionGroup(user);
  const permissions = await getRolePermissions(user.tenantId);
  const perm = permissions[group]?.[permissionKey];
  if (!perm) return false;
  return perm.add;
}

export async function hasEditPermissionServer(
  user: PermUser | null | undefined,
  route: string
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "SUPERADMIN") return true;

  const permissionKey = matchPermissionKey(route);
  if (!permissionKey) return true;

  const group = getPermissionGroup(user);
  const permissions = await getRolePermissions(user.tenantId);
  const perm = permissions[group]?.[permissionKey];
  if (!perm) return false;
  return perm.edit;
}

export async function hasDeletePermissionServer(
  user: PermUser | null | undefined,
  route: string
): Promise<boolean> {
  if (!user) return false;
  if (user.role === "SUPERADMIN") return true;

  const permissionKey = matchPermissionKey(route);
  if (!permissionKey) return true;

  const group = getPermissionGroup(user);
  const permissions = await getRolePermissions(user.tenantId);
  const perm = permissions[group]?.[permissionKey];
  if (!perm) return false;
  return perm.delete;
}
