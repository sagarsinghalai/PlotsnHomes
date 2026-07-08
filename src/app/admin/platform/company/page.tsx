import { CompanySettingsForm } from "@/components/admin/company-settings-form";
import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";
import { getCompanySettings } from "@/lib/company-settings";

export default async function CompanyPage() {
  const settings = await getCompanySettings();
  return (
    <div className="flex gap-8">
      <PlatformSettingsNav />
      <div className="flex-1">
        <h1 className="font-display text-3xl font-bold">Company Details</h1>
        <p className="mt-1 text-slate-600">Basics — business info and lead visibility</p>
        <div className="mt-8">
          <CompanySettingsForm settings={settings} />
        </div>
      </div>
    </div>
  );
}
