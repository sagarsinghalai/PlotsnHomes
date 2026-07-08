import Link from "next/link";
import { searchParamsToQuery, type PropertySearchParams } from "@/lib/property-search";
import { cn } from "@/lib/utils";

export function PropertyPagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: PropertySearchParams;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  function href(p: number) {
    return `/properties?${searchParamsToQuery({ ...searchParams, page: String(p) })}`;
  }

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 && (
        <Link href={href(page - 1)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
          Previous
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={href(p)}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium",
            p === page ? "bg-slate-900 text-white" : "border border-slate-200 hover:bg-slate-50"
          )}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link href={href(page + 1)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
          Next
        </Link>
      )}
    </nav>
  );
}
