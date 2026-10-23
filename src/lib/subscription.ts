import type { SubscriptionInterval, SubscriptionStatus } from "@prisma/client";

export const INTERVAL_LABELS: Record<SubscriptionInterval, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly (Annual)",
  LIFETIME: "Lifetime",
  CUSTOM: "Custom duration",
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: "Active",
  TRIALING: "Trialing",
  PAST_DUE: "Past due",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  PAUSED: "Paused",
};

export function intervalShort(interval: SubscriptionInterval) {
  switch (interval) {
    case "MONTHLY":
      return "/mo";
    case "QUARTERLY":
      return "/qtr";
    case "YEARLY":
      return "/yr";
    case "LIFETIME":
      return " once";
    case "CUSTOM":
      return "";
    default:
      return "";
  }
}

/**
 * The end of a subscription/grant period. LIFETIME never expires (null). CUSTOM
 * uses durationMinutes so a grant can be as short as a few minutes. A CUSTOM
 * plan with no/zero durationMinutes also never expires.
 */
export function periodEndFromInterval(
  start: Date,
  interval: SubscriptionInterval,
  durationMinutes?: number | null
): Date | null {
  const d = new Date(start);
  switch (interval) {
    case "MONTHLY":
      d.setMonth(d.getMonth() + 1);
      return d;
    case "QUARTERLY":
      d.setMonth(d.getMonth() + 3);
      return d;
    case "YEARLY":
      d.setFullYear(d.getFullYear() + 1);
      return d;
    case "LIFETIME":
      return null;
    case "CUSTOM":
      if (!durationMinutes || durationMinutes <= 0) return null;
      return new Date(d.getTime() + durationMinutes * 60 * 1000);
    default:
      return d;
  }
}

/** Human label for a duration in minutes (e.g. 5 → "5 min", 1440 → "1 day"). */
export function formatDurationMinutes(mins?: number | null): string {
  if (!mins || mins <= 0) return "No expiry";
  if (mins < 60) return `${mins} min`;
  if (mins < 1440) {
    const h = mins / 60;
    return `${Number.isInteger(h) ? h : h.toFixed(1)} hr`;
  }
  const days = mins / 1440;
  return `${Number.isInteger(days) ? days : days.toFixed(1)} day${days === 1 ? "" : "s"}`;
}

/** True when a subscription end date has passed. null endsAt = never expires. */
export function isExpired(endsAt: Date | null | undefined, now: Date = new Date()): boolean {
  return !!endsAt && endsAt.getTime() <= now.getTime();
}

export function parseFeatures(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const p = JSON.parse(json);
    return Array.isArray(p) ? p.map(String) : [];
  } catch {
    return [];
  }
}
