import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { PropertyForm } from "@/components/admin/property-form";
import { prisma } from "@/lib/prisma";
import { getBhkConfigurations } from "@/lib/system-settings";
import { authOptions } from "@/lib/auth-options";
import { hasEditPermissionServer } from "@/lib/permissions";

export default async function EditPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const canEdit = await hasEditPermissionServer(session?.user, "/admin/properties");
  if (!canEdit) {
    redirect("/admin/properties?error=Access+Denied");
  }
  const [property, agents, bhkConfigurations, developers, projects] = await Promise.all([
    prisma.property.findUnique({
      where: { id: params.id },
      include: { agent: { select: { id: true, name: true, email: true } } },
    }),
    prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "EMPLOYEE", "AGENT"] }, active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    getBhkConfigurations(),
    prisma.developer.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.project.findMany({
      select: { id: true, name: true, developerId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!property) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Edit property</h1>
      <p className="mt-1 text-slate-600 mb-8 font-mono text-brand-hover">{property.symbol}</p>
      <PropertyForm
        agents={agents}
        property={property}
        bhkConfigurations={bhkConfigurations}
        developers={developers}
        projects={projects}
      />
    </div>
  );
}
