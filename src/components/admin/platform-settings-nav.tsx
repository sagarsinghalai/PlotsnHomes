"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

const LINKS = [
  { href: "/admin/platform", label: "Settings home" },
  { href: "/admin/users", label: "User management" },
  { href: "/admin/platform/smart-lists", label: "Search lists" },
  { href: "/admin/platform/lead-settings", label: "Lead settings" },
  { href: "/admin/platform/import", label: "Import" },
  { href: "/admin/platform/export", label: "Export" },
  { href: "/admin/platform/telephony", label: "Telephony" },
  { href: "/admin/platform/notifications", label: "Notifications" },
  { href: "/admin/platform/custom-fields", label: "Custom fields" },
  { href: "/admin/platform/bhk", label: "BHK Configurations" },
  { href: "/admin/platform/company", label: "Company details" },
  { href: "/admin/platform/goals", label: "Goals" },
  { href: "/admin/platform/bulk-jobs", label: "Bulk job history" },
  { href: "/admin/crm/settings", label: "Routing setup" },
];

export function PlatformSettingsNav() {
  const pathname = usePathname();
  const { hasItemPermission } = useAdminPermissions();

  const allowedLinks = LINKS.filter((l) => hasItemPermission(l.href));

  return (
    <nav className="w-56 shrink-0 space-y-0.5 text-sm border-r border-slate-200 pr-4">
      <p className="text-xs font-semibold uppercase text-slate-400 mb-3">Administration</p>
      {allowedLinks.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cn(
            "block rounded-lg px-3 py-2",
            pathname === l.href || (l.href !== "/admin/platform" && pathname.startsWith(l.href))
              ? "bg-brand/20 text-brand-hover font-medium"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
