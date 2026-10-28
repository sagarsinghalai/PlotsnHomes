import { Building2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  /** White-label overrides — the visited tenant's brand (falls back to defaults). */
  brandName?: string;
  logoUrl?: string;
}

export function BrandLogo({
  href = "/",
  className,
  iconClassName,
  textClassName,
  showText = true,
  brandName,
  logoUrl,
}: BrandLogoProps) {
  const name = brandName?.trim() || "PlotsnHomes";
  const content = (
    <div className={cn("inline-flex shrink-0 items-center gap-2.5 select-none", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className={cn("h-10 w-auto max-w-[160px] shrink-0 rounded-xl object-contain", iconClassName)}
        />
      ) : (
        <span className={cn(
          "flex h-10 w-10 min-w-[2.5rem] min-h-[2.5rem] shrink-0 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-brand shadow-sm transition-transform hover:scale-105",
          iconClassName
        )}>
          <Building2 className="h-5 w-5 shrink-0 block text-brand stroke-[2.2]" />
        </span>
      )}
      {showText && !logoUrl && (
        <span className={cn(
          "whitespace-nowrap font-display text-xl font-extrabold tracking-tight text-white shrink-0",
          textClassName
        )}>
          {name}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center hover:opacity-95 transition">
        {content}
      </Link>
    );
  }

  return content;
}
