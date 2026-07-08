import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";
import { BhkSettingsForm } from "@/components/admin/bhk-settings-form";
import { getBhkConfigurations } from "@/lib/system-settings";

export const dynamic = "force-dynamic";

export default async function BhkSettingsPage() {
  const configs = await getBhkConfigurations();

  return (
    <div className="flex gap-8">
      <PlatformSettingsNav />
      <div className="flex-1 min-w-0">
        <h1 className="font-display text-3xl font-bold text-slate-900">BHK Configurations</h1>
        <p className="mt-1 text-slate-600 mb-6">
          Manage the active list of property configurations/BHK options available for properties and CRM requirements.
        </p>

        <BhkSettingsForm initialConfigs={configs} />
      </div>
    </div>
  );
}
