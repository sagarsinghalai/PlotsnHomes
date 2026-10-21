import { AnalyticsIntegrationClient } from "@/components/admin/analytics-integration-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

export default function AnalyticsIntegrationPage() {
  return (
    <div>
      <AdminPageHeader
        title="Analytics Integration"
        description="Connect Google Analytics so projects can show live performance numbers. Per-project tracking IDs are set under each project's Analytics tab."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Settings" }, { label: "Analytics Integration" }]}
      />
      <div className="mt-6">
        <AnalyticsIntegrationClient />
      </div>
    </div>
  );
}
