/**
 * Phase B7 — tenant lifecycle.
 *
 * A tenant (Organization) moves through a small set of states. Only ACTIVE and
 * PAST_DUE permit login/API access; SUSPENDED/CANCELLED/PENDING/DELETED block
 * access while PRESERVING all data (nothing is deleted on suspension). State is
 * stored in `Organization.status` and every transition is written to the audit
 * trail by the platform console.
 */

export const TENANT_STATES = [
  "PENDING",
  "ACTIVE",
  "PAST_DUE",
  "SUSPENDED",
  "CANCELLED",
  "DELETED",
] as const;

export type TenantStatus = (typeof TENANT_STATES)[number];

export const TENANT_STATE_LABELS: Record<TenantStatus, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  PAST_DUE: "Past due",
  SUSPENDED: "Suspended",
  CANCELLED: "Cancelled",
  DELETED: "Deleted",
};

/** States whose users may log in and call the API. */
const ACCESS_ALLOWED = new Set<string>(["ACTIVE", "PAST_DUE"]);

/**
 * Whether a tenant in this status may access the app. A null/empty status
 * (platform user with no tenant, or a legacy row with no status) is allowed;
 * any known non-active state blocks.
 */
export function isTenantAccessAllowed(status?: string | null): boolean {
  if (!status) return true;
  return ACCESS_ALLOWED.has(status);
}

export function isTenantStatus(v: unknown): v is TenantStatus {
  return typeof v === "string" && (TENANT_STATES as readonly string[]).includes(v);
}

/** Allowed state transitions. DELETED is terminal. */
const TRANSITIONS: Record<TenantStatus, TenantStatus[]> = {
  PENDING: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["PAST_DUE", "SUSPENDED", "CANCELLED"],
  PAST_DUE: ["ACTIVE", "SUSPENDED", "CANCELLED"],
  SUSPENDED: ["ACTIVE", "CANCELLED"],
  CANCELLED: ["ACTIVE", "DELETED"],
  DELETED: [],
};

export function canTransition(from: string | null | undefined, to: string): boolean {
  const current = (from && isTenantStatus(from) ? from : "ACTIVE") as TenantStatus;
  if (!isTenantStatus(to)) return false;
  if (current === to) return false;
  return TRANSITIONS[current].includes(to);
}

export function allowedTransitions(from: string | null | undefined): TenantStatus[] {
  const current = (from && isTenantStatus(from) ? from : "ACTIVE") as TenantStatus;
  return TRANSITIONS[current];
}
