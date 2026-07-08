import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";
import { SettingsCardGrid } from "@/components/admin/settings-card-grid";
import { SMART_LISTS, countSmartList } from "@/lib/smart-lists";
import { List } from "lucide-react";
import Link from "next/link";

export default async function SmartListsPage() {
  const counts = await Promise.all(SMART_LISTS.map((s) => countSmartList(s.id)));

  const cards = SMART_LISTS.map((s, i) => ({
    href: `/admin/leads?list=${s.id}`,
    title: s.label,
    description: `${s.description} · ${counts[i]} leads`,
    icon: List,
  }));

  return (
    <div className="flex gap-8">
      <PlatformSettingsNav />
      <div className="flex-1">
        <h1 className="font-display text-3xl font-bold">Search Lists</h1>
        <p className="mt-1 text-slate-600">Smart lists to segment leads (Sell.Do style)</p>
        <p className="mt-4">
          <Link href="/admin/leads" className="text-gold-dark font-medium hover:underline">
            Open all leads table →
          </Link>
        </p>
        <div className="mt-8">
          <SettingsCardGrid cards={cards} />
        </div>
      </div>
    </div>
  );
}
