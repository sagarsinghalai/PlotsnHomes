import { ProjectDefaultsClient } from "@/components/admin/project-defaults-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  SITE_SETTING_KEYS,
  getSiteSetting,
  DEFAULT_PROJECT_FIELD_DEFAULTS,
  type ProjectFieldDefaults,
} from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function ProjectDefaultsPage() {
  const saved = await getSiteSetting<Partial<ProjectFieldDefaults> | null>(SITE_SETTING_KEYS.PROJECT_FIELD_DEFAULTS);
  const initial: ProjectFieldDefaults = {
    amenities: saved?.amenities ?? DEFAULT_PROJECT_FIELD_DEFAULTS.amenities,
    specifications: saved?.specifications ?? DEFAULT_PROJECT_FIELD_DEFAULTS.specifications,
    documents: saved?.documents ?? DEFAULT_PROJECT_FIELD_DEFAULTS.documents,
    salesFields: saved?.salesFields ?? DEFAULT_PROJECT_FIELD_DEFAULTS.salesFields,
    nearbyCategories: saved?.nearbyCategories ?? DEFAULT_PROJECT_FIELD_DEFAULTS.nearbyCategories,
  };

  return (
    <div>
      <AdminPageHeader
        title="Project Field Defaults"
        description="Manage the master amenity, specification, document, sales-field and nearby-category catalogs that pre-fill every project."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Settings" }, { label: "Project Defaults" }]}
      />
      <div className="mt-6">
        <ProjectDefaultsClient initial={initial} />
      </div>
    </div>
  );
}
