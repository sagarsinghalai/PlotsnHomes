export const CRM_STAGES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "SITE_VISIT",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export type CrmStage = (typeof CRM_STAGES)[number];

export const STAGE_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  NEW: {
    label: "New",
    color: "text-sky-800",
    bg: "bg-sky-50",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  CONTACTED: {
    label: "Contacted",
    color: "text-indigo-800",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    dot: "bg-indigo-500",
  },
  QUALIFIED: {
    label: "Qualified",
    color: "text-violet-800",
    bg: "bg-violet-50",
    border: "border-violet-200",
    dot: "bg-violet-500",
  },
  SITE_VISIT: {
    label: "Site visit",
    color: "text-amber-800",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  NEGOTIATION: {
    label: "Negotiation",
    color: "text-orange-800",
    bg: "bg-orange-50",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  WON: {
    label: "Won",
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  LOST: {
    label: "Lost",
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

export function stageLabel(stage: string, labels?: Record<string, string>) {
  return labels?.[stage] ?? STAGE_META[stage]?.label ?? stage.replace(/_/g, " ");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function formatBudget(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (max != null) return `Up to ${fmt(max)}`;
  return `From ${fmt(min!)}`;
}
