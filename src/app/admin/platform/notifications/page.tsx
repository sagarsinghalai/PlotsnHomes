import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";
import Link from "next/link";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="flex gap-8">
      <PlatformSettingsNav />
      <div className="flex-1">
        <h1 className="font-display text-3xl font-bold">Notification Settings</h1>
        <p className="mt-1 text-slate-600">Manage notifications to leads</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 max-w-2xl">
          <Link
            href="/admin/messages"
            className="rounded-2xl border bg-white p-6 hover:border-gold flex gap-4"
          >
            <Bell className="h-10 w-10 text-sky-600" />
            <div>
              <h3 className="font-semibold">Lead notification</h3>
              <p className="text-sm text-slate-500">Send email / SMS / WhatsApp to leads</p>
            </div>
          </Link>
          <Link
            href="/admin/crm/settings"
            className="rounded-2xl border bg-white p-6 hover:border-gold flex gap-4"
          >
            <Bell className="h-10 w-10 text-sky-600" />
            <div>
              <h3 className="font-semibold">Message templates</h3>
              <p className="text-sm text-slate-500">WhatsApp and email templates</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
