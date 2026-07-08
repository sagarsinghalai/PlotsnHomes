"use client";

import Link from "next/link";
import { KanbanSquare, List, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CrmSubNav({ active }: { active: "pipeline" | "leads" }) {
  const tabs = [
    { id: "pipeline" as const, href: "/admin/crm", label: "Pipeline", icon: KanbanSquare },
    { id: "leads" as const, href: "/admin/leads", label: "All leads", icon: List },
    { id: "reports" as const, href: "/admin/reports/funnel", label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
                isActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
