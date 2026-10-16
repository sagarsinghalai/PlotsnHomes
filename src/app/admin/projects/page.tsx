import { prisma } from "@/lib/prisma";
import { ProjectManager } from "@/components/admin/project-manager";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function ProjectsPage() {
  const [projects, developers] = await Promise.all([
    prisma.project.findMany({
      include: {
        developer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            properties: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.developer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedProjects = projects.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt ? p.updatedAt.toISOString() : undefined,
    reraRegDate: p.reraRegDate ? p.reraRegDate.toISOString() : undefined,
    possessionDate: p.possessionDate ? p.possessionDate.toISOString() : undefined,
    launchDate: p.launchDate ? p.launchDate.toISOString() : undefined,
    completionDate: p.completionDate ? p.completionDate.toISOString() : undefined,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Developer Projects"
        description="Manage master developer projects, unit configurations, location blueprints, RERA registrations, and marketing assets."
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Projects" },
        ]}
      />
      <div className="mt-6">
        <ProjectManager
          initialProjects={serializedProjects}
          developersList={developers}
        />
      </div>
    </div>
  );
}
