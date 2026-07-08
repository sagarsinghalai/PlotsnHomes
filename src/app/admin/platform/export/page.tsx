import { ExportHub } from "@/components/admin/import-export-hub";
import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";

export default function ExportPage() {
  return (
    <div className="flex gap-8">
      <PlatformSettingsNav />
      <div className="flex-1">
        <h1 className="font-display text-3xl font-bold">Export</h1>
        <p className="mt-1 text-slate-600">Download leads, tasks, site visits</p>
        <div className="mt-8">
          <ExportHub />
        </div>
      </div>
    </div>
  );
}
