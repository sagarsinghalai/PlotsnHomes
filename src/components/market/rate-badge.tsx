import { TrendingDown, TrendingUp } from "lucide-react";
import { changeBg, formatChangePercent } from "@/lib/market";
import { cn } from "@/lib/utils";

export function RateBadge({
  value,
  label,
  size = "sm",
}: {
  value: number;
  label?: string;
  size?: "sm" | "md";
}) {
  const Icon = value >= 0 ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-mono font-semibold",
        changeBg(value),
        size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs"
      )}
    >
      <Icon className={size === "md" ? "h-4 w-4" : "h-3 w-3"} />
      {formatChangePercent(value)}
      {label && <span className="font-sans font-normal opacity-80">{label}</span>}
    </span>
  );
}
