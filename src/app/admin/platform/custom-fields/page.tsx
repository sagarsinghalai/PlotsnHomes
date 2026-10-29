import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";
import { SettingsCardGrid } from "@/components/admin/settings-card-grid";
import { prisma } from "@/lib/prisma";
import { Briefcase, FileText, Phone, User } from "lucide-react";

const CATEGORIES = [
  { slug: "user", title: "User / Account Fields", icon: User },
  { slug: "call", title: "Call Related Fields", icon: Phone },
  { slug: "site_visit", title: "Site Visit Related Fields", icon: Briefcase },
  { slug: "followup", title: "Followup Related Fields", icon: FileText },
  { slug: "lead", title: "Lead Related Fields", icon: User },
  { slug: "booking", title: "Booking Related Fields", icon: FileText },
];

export default async function CustomFieldsPage() {
  const counts = await Promise.all(
    CATEGORIES.map((c) => prisma.customFieldDef.count({ where: { category: c.slug } }))
  );

  const cards = CATEGORIES.map((c, i) => ({
    href: `/admin/platform/custom-fields/${c.slug}`,
    title: c.title,
    description: `Manage your ${c.slug.replace("_", " ")} fields · ${counts[i]} defined`,
    icon: c.icon,
  }));

  return (
    <div className="flex gap-8">
      <PlatformSettingsNav />
      <div className="flex-1">
        <h1 className="font-display text-3xl font-bold">Custom Fields</h1>
        <p className="mt-1 text-slate-600">Customise modules with extra fields</p>
        <div className="mt-8">
          <SettingsCardGrid cards={cards} />
        </div>
      </div>
    </div>
  );
}
