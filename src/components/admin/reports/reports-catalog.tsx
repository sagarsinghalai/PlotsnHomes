"use client";

import Link from "next/link";
import { BarChart3, ChevronRight } from "lucide-react";
import { REPORT_CATALOG } from "./report-shell";

const CATEGORIES = ["Sales", "Finance", "Listings", "Marketing", "People", "Compliance"] as const;

export function ReportsCatalog() {
  return (
    <div className="space-y-10">
      {CATEGORIES.map((cat) => {
        const items = REPORT_CATALOG.filter((r) => r.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">{cat}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((report) => (
                <Link
                  key={report.href}
                  href={report.href}
                  className={`group rounded-2xl border bg-gradient-to-br p-6 transition hover:shadow-md ${report.color}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-xl bg-white/80 p-2.5 shadow-sm">
                      <BarChart3 className="h-5 w-5 text-brand-hover" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-brand-hover group-hover:translate-x-0.5 transition" />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{report.title}</h3>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{report.description}</p>
                  <p className="mt-4 text-xs font-medium text-brand-hover">Open report →</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
