import { ImportHub } from "@/components/admin/import-export-hub";
import { PlatformSettingsNav } from "@/components/admin/platform-settings-nav";

export default function ImportPage() {
  return (
    <div className="flex gap-8">
      <PlatformSettingsNav />
      <div className="flex-1">
        <h1 className="font-display text-3xl font-bold">Import</h1>
        <p className="mt-1 text-slate-600">Bulk import your data</p>
        <div className="mt-8">
          <ImportHub />
        </div>
      </div>
    </div>
  );
}
