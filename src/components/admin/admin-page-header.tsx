import Link from "next/link";

export function AdminPageHeader({
  title,
  description,
  breadcrumb,
  actions,
}: {
  title: string;
  description?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex flex-wrap items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 tracking-tight uppercase">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-300 dark:text-slate-700 font-normal">/</span>}
                {b.href ? (
                  <Link href={b.href} className="hover:text-brand-hover dark:hover:text-brand transition">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-slate-700 dark:text-slate-300 font-bold">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1
          className="text-3xl sm:text-4xl text-slate-950 dark:text-white leading-none"
          style={{
            fontFamily: "'Impact', 'Arial Black', sans-serif",
            fontWeight: 400,
            textTransform: "none",
          }}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl font-medium leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>}
    </div>
  );
}
