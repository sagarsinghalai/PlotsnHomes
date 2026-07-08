import { LucideIcon } from "lucide-react";
import Link from "next/link";

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  href?: string;
}) {
  const inner = (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-gold/40 hover:shadow-md h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>
          {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
          {href && (
            <p className="mt-3 text-xs font-medium text-gold-dark">View details →</p>
          )}
        </div>
        <div className="rounded-xl bg-slate-100 p-3 text-slate-600 shrink-0">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
}
