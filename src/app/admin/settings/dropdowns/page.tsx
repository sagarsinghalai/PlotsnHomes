import { getSiteSetting, SITE_SETTING_KEYS, SectionDropdownConfig, DEFAULT_USERS_ACCOUNTS_DROPDOWNS } from "@/lib/site-settings";
import { DropdownSettingsClient } from "./dropdown-settings-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

export default async function DropdownSettingsPage() {
  const sections = await getSiteSetting<SectionDropdownConfig[]>(SITE_SETTING_KEYS.DROPDOWN_OPTIONS);
  const initialSections = sections && sections.length > 0 ? sections : DEFAULT_USERS_ACCOUNTS_DROPDOWNS;

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Dropdown options"
        description="Manage dropdown choices for website features starting with Users & accounts."
      />
      <DropdownSettingsClient initialSections={initialSections} />
    </div>
  );
}
