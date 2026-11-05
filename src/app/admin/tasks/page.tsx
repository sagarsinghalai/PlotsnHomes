import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TasksClient } from "@/components/admin/tasks-client";
import { getSession } from "@/lib/auth";
import { hasCrmAccess } from "@/lib/roles";

export const dynamic = "force-dynamic";

// A single place for everything awaiting an admin action, across the platform.
export default async function TasksPage() {
  const session = await getSession();
  if (!session?.user || !hasCrmAccess(session.user.role)) {
    redirect("/admin");
  }
  return (
    <div>
      <AdminPageHeader
        title="Notifications & Tasks"
        description="Everything that needs your attention. Each item disappears once you complete it."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Notifications & Tasks" }]}
      />
      <TasksClient />
    </div>
  );
}
