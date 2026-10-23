import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";
import { SettingsCardGrid } from "@/components/admin/settings-card-grid";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getRolePermissions, getPermissionGroup, PERMISSIONS_SCHEMA } from "@/lib/permissions";
import {
  Bell,
  Briefcase,
  Download,
  FileUp,
  List,
  Phone,
  Target,
  Upload,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";

export default async function PlatformSettingsPage() {
  const session = await getSession();
  const permissions = await getRolePermissions();
  const group = session?.user ? getPermissionGroup(session.user) : "BUYER";
  const userRole = session?.user?.role || "";
  const tenantId = session?.user?.tenantId || "__no_tenant__";

  const [userCount, leadCount, activeUsers] = await Promise.all([
    prisma.user.count({ where: { tenantId } }),
    prisma.lead.count({ where: { tenantId } }),
    prisma.user.count({ where: { active: true, tenantId } }),
  ]);

  const cards = [
    { href: "/admin/users", title: "User Management", description: "Add users, manage teams and hierarchy.", icon: Users },
    { href: "/admin/billing", title: "Billing & subscriptions", description: "Plans, monthly/annual billing, and subscriber management.", icon: Briefcase },
    { href: "/admin/platform/smart-lists", title: "Search Lists", description: "Smart lists to segment your leads.", icon: List },
    { href: "/admin/platform/lead-settings", title: "Lead Settings", description: "Pipeline stages, qualified stages, lead access.", icon: UserCog },
    { href: "/admin/platform/import", title: "Import", description: "Import your data in bulk.", icon: Upload },
    { href: "/admin/platform/export", title: "Export", description: "Download leads, calls, activities and more.", icon: Download },
    { href: "/admin/platform/telephony", title: "Telephony", description: "Setup telephony and IVR (integrate Twilio).", icon: Phone },
    { href: "/admin/platform/notifications", title: "Notification Settings", description: "Manage email and SMS to leads.", icon: Bell },
    { href: "/admin/platform/custom-fields", title: "Custom Fields", description: "Customise with custom fields per module.", icon: Wrench },
    { href: "/admin/platform/bhk", title: "BHK Configurations", description: "Manage property configurations/BHK options.", icon: Wrench },
    { href: "/admin/platform/company", title: "Company Details", description: "Business name, timezone, currency, logo.", icon: Briefcase },
    { href: "/admin/showings", title: "Booking Lists", description: "Site visits and tour requests.", icon: List },
    { href: "/admin/platform/goals", title: "Goals", description: "Add and manage sales goals.", icon: Target, badge: "New" },
    { href: "/admin/platform/bulk-jobs", title: "Bulk Job History", description: "View import and export job logs.", icon: FileUp },
    { href: "/admin/crm/settings", title: "Routing Setup", description: "Lead assignment and round-robin rules.", icon: UserCog },
  ];

  const allowedCards = cards.filter((c) => {
    if (userRole === "SUPERADMIN") return true;

    // Find matching subhead for route
    let permissionKey: string | null = null;
    for (const head of PERMISSIONS_SCHEMA) {
      for (const subhead of head.subheads) {
        if (c.href === subhead.route || c.href.startsWith(subhead.route + "/")) {
          permissionKey = subhead.key;
          break;
        }
      }
      if (permissionKey) break;
    }

    if (!permissionKey) return true;
    return permissions[group]?.[permissionKey] ?? false;
  });

  return (
    <div className="flex gap-8">
      <PlatformSettingsNav />
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-3xl font-bold text-slate-900">Settings Management</h1>
        <p className="mt-1 text-slate-600">Sell.Do-style platform configuration</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">Active users</p>
            <p className="text-2xl font-bold">{activeUsers}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">Leads in CRM</p>
            <p className="text-2xl font-bold">{leadCount}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">Total users</p>
            <p className="text-2xl font-bold">{userCount}</p>
          </div>
        </div>

        <div className="mt-8">
          <SettingsCardGrid cards={allowedCards} />
        </div>
      </div>
    </div>
  );
}
