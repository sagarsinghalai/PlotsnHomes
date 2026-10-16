export const dynamic = "force-dynamic";

import { WebpageEditorClient } from "@/components/admin/webpage-editor-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getCustomPages, getNavSettings } from "@/lib/webpage-editor-store";

export default async function AdminWebpageEditorPage() {
  const [pages, nav] = await Promise.all([
    getCustomPages(),
    getNavSettings(),
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

      <WebpageEditorClient initialPages={pages} initialNav={nav} />
    </div>
  );
}
