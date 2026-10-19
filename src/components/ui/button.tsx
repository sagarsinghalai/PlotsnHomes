import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "success"
  | "danger" // legacy subtle-danger (kept for backward compatibility)
  | "gold";  // legacy brand accent (kept for backward compatibility)
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white hover:bg-brand-hover active:bg-brand-pressed shadow-sm",
  secondary:
    "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
  outline:
    "bg-white text-brand border border-brand/40 hover:bg-brand-soft",
  ghost:
    "bg-transparent text-brand hover:bg-brand-soft",
  destructive:
    "bg-[#b91c1c] text-white hover:bg-[#991b1b] shadow-sm",
  success:
    "bg-[#15803d] text-white hover:bg-[#166534] shadow-sm",
  danger:
    "bg-white text-slate-700 border border-slate-200 hover:text-red-600 hover:bg-red-50/80 hover:border-red-200 shadow-2xs",
  gold:
    "bg-brand text-white hover:bg-brand-hover font-semibold shadow-lg shadow-brand/30",
};

const sizes: Record<Size, string> = {
  sm: "min-h-9 px-3 text-sm rounded-md gap-1.5",
  md: "min-h-11 px-4 text-sm rounded-lg gap-2",
  lg: "min-h-12 px-4 text-base rounded-lg gap-2",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }
>(function Button(
  { className, variant = "primary", size = "md", loading, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
});
