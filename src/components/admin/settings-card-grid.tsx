import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function SettingsCardGrid({
  cards,
}: {
  cards: {
    href: string;
    title: string;
    description: string;
    icon: LucideIcon;
    badge?: string;
  }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.href}
            href={c.href}
            className="relative rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand hover:shadow-md transition group"
          >
            {c.badge && (
              <span className="absolute top-3 right-3 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {c.badge}
              </span>
            )}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:bg-brand/10 group-hover:text-brand-hover">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">{c.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{c.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
