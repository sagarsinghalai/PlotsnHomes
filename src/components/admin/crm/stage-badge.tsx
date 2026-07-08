import { stageLabel, STAGE_META } from "@/lib/crm-ui";
import { cn } from "@/lib/utils";

export function StageBadge({
  stage,
  labels,
  size = "sm",
}: {
  stage: string;
  labels?: Record<string, string>;
  size?: "sm" | "md";
}) {
  const meta = STAGE_META[stage] ?? STAGE_META.NEW;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium border",
        meta.bg,
        meta.border,
        meta.color,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", meta.dot)} />
      {stageLabel(stage, labels)}
    </span>
  );
}
