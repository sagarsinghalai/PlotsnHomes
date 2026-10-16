import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PropertyForm } from "@/components/admin/property-form";
import { prisma } from "@/lib/prisma";
import { getBhkConfigurations } from "@/lib/system-settings";
import { authOptions } from "@/lib/auth-options";
import { hasAddPermissionServer } from "@/lib/permissions";

export default async function NewPropertyPage() {
  const session = await getServerSession(authOptions);
  const canAdd = await hasAddPermissionServer(session?.user, "/admin/properties");
  if (!canAdd) {
    redirect("/admin/properties?error=Access+Denied");
  }
  const [agents, bhkConfigurations, developers, projects] = await Promise.all([
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

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Add property</h1>
      <p className="mt-1 text-slate-600 mb-8">Create a new listing on the exchange</p>
      <PropertyForm
        agents={agents}
        bhkConfigurations={bhkConfigurations}
        developers={developers}
        projects={projects}
      />
    </div>
  );
}
