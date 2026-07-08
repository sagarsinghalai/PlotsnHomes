import { PipelineSettingsForm } from "@/components/admin/pipeline-settings-form";
import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";
import { getPipelineConfig } from "@/lib/pipeline-settings";

export default async function LeadSettingsPage() {
  const config = await getPipelineConfig();
  return (
    <div className="flex gap-8">
      <PlatformSettingsNav />
      <div className="flex-1">
        <h1 className="font-display text-3xl font-bold">Lead Settings</h1>
        <p className="mt-1 text-slate-600">Manage pipeline stages</p>
        <div className="mt-8">
          <PipelineSettingsForm config={config} />
        </div>
      </div>
    </div>
  );
}
