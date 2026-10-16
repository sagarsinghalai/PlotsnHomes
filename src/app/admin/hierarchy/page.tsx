import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TeamHierarchyView } from "@/components/admin/team-hierarchy-view";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getFieldPrivacyConfig } from "@/lib/field-privacy";

export default async function AdminHierarchyPage() {
  const session = await getSession();

  const [users, privacyConfig] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        phone: true,
        dob: true,
        address: true,
        city: true,
        state: true,
        zip: true,
        role: true,
        hierarchyLevel: true,
        dataScope: true,
        active: true,
        managerId: true,
        createdAt: true,
      },
    }),
    getFieldPrivacyConfig(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Team Hierarchy & Organizational Tree"
        description="Visual multi-tiered tree diagram showing enterprise reporting structures, organizational units, and Super Admin field privacy controls."
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Team Hierarchy" },
        ]}
      />

      <TeamHierarchyView
        currentUser={{
          id: session?.user?.id ?? "",
          name: session?.user?.name ?? session?.user?.email ?? "User",
          email: session?.user?.email ?? "",
          role: (session?.user?.role as any) ?? "BUYER",
        }}
        initialPrivacyConfig={privacyConfig}
        users={users.map((u) => ({
          ...u,
          dob: u.dob ? u.dob.toISOString() : null,
          createdAt: u.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
