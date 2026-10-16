export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { isSuperAdmin } from "@/lib/roles";
import { getPipelines } from "@/lib/pipeline-store";
import { PipelinesManager } from "@/components/admin/crm/pipelines-manager";
import { CrmSubNav } from "@/components/admin/crm/crm-sub-nav";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function AdminPipelinesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    redirect("/admin");
  }

  const pipelines = await getPipelines();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Pipeline"
        description="Manage opportunities, sales stages, and pipeline progress"
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Pipeline" },
        ]}
      />

      <CrmSubNav active="pipelines" />
      <PipelinesManager initialPipelines={pipelines} />
    </div>
  );
}
