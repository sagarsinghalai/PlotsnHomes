import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isSuperAdmin } from "@/lib/roles";
import { getForms, getMetrics } from "@/lib/forms-store";
import { FormsManager } from "@/components/admin/forms-manager";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

export default async function AdminFormsPage() {
  const session = await getServerSession(authOptions);
  const owner = session?.user ? isSuperAdmin(session.user.role) : false;
  const forms = await getForms(owner ? undefined : session?.user?.tenantId);
  const withMetrics = await Promise.all(
    forms.map(async (f) => ({ ...f, metrics: await getMetrics(f.id) }))
  );

  return (
    <div>
      <AdminPageHeader
        title="Forms"
        description="Build forms, share them via a link or embed them anywhere to collect leads — with submission analytics."
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Communications", href: "/admin/communications" },
          { label: "Forms" },
        ]}
      />
      <FormsManager initialForms={withMetrics} />
    </div>
  );
}
