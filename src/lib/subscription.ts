import type { SubscriptionInterval, SubscriptionStatus } from "@prisma/client";

export const INTERVAL_LABELS: Record<SubscriptionInterval, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly (Annual)",
  LIFETIME: "Lifetime",
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
    default:
      return "";
  }
}

export function periodEndFromInterval(start: Date, interval: SubscriptionInterval): Date | null {
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
    default:
      return d;
  }
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
