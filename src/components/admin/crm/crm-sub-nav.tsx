"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

export function CrmSubNav({ active }: { active?: "opportunities" | "forecast" | "pipelines" | "bulk" | "leads" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = active || searchParams.get("tab") || (pathname.includes("/pipelines") ? "pipelines" : "opportunities");
  
  let hasSubPermission: ((permissionKey: string, subKey: string) => boolean) | null = null;
  try {
    const perms = useAdminPermissions();
    hasSubPermission = perms.hasSubPermission;
  } catch (e) {
    // If rendered outside AdminPermissionsProvider, default to show
  }

  const allTabs = [
    { id: "opportunities" as const, key: "opportunities_tab", href: "/admin/crm?tab=opportunities", label: "Opportunities" },
    { id: "forecast" as const, key: "forecast_tab", href: "/admin/crm?tab=forecast", label: "Forecast" },
    { id: "pipelines" as const, key: "pipelines_tab", href: "/admin/crm/pipelines", label: "Pipelines" },
    { id: "bulk" as const, key: "bulk_actions_tab", href: "/admin/crm?tab=bulk", label: "Bulk Actions" },
  ];

  const visibleTabs = allTabs.filter((tab) => {
    if (!hasSubPermission) return true;
    return hasSubPermission("pipeline", tab.key);
  });

  return (
    <div className="flex items-center gap-8 border-b border-slate-200 dark:border-slate-800 mb-6 pb-0 font-bold text-sm overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {visibleTabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`pb-3 text-sm transition whitespace-nowrap ${
              isActive
                ? "text-[#b58a18] dark:text-[#d4af37] font-extrabold border-b-2 border-[#b58a18] dark:border-[#d4af37]"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
