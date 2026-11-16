import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MediaLibraryClient } from "@/components/admin/media-library-client";

export const dynamic = "force-dynamic";

export default function MediaPage() {
  return (
    <div>
      <AdminPageHeader
        title="Media Library"
        description="Every uploaded image, video and document in one place. Edit titles, descriptions and alt text, and copy sharable links."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Media" }]}
      />
      <MediaLibraryClient />
    </div>
  );
}
