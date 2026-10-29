export const dynamic = "force-dynamic";

import { WebpageEditorClient } from "@/components/admin/webpage-editor-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getCustomPages, getNavSettings } from "@/lib/webpage-editor-store";
import { getForms } from "@/lib/forms-store";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isSuperAdmin } from "@/lib/roles";

export default async function AdminWebpageEditorPage() {
  const session = await getServerSession(authOptions);
  const owner = session?.user ? isSuperAdmin(session.user.role) : false;
  const [pages, nav, forms] = await Promise.all([
    getCustomPages(),
    getNavSettings(),
    getForms(owner ? undefined : session?.user?.tenantId),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Webpage Editor"
        description="Visual Elementor-style page builder, dynamic routing, and custom website navigation."
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Webpage Editor" },
        ]}
      />

      <WebpageEditorClient
        initialPages={pages}
        initialNav={nav}
        forms={forms.map((f) => ({ slug: f.slug, name: f.name }))}
      />
    </div>
  );
}
