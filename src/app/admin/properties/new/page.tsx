import { PropertyForm } from "@/components/admin/property-form";
import { prisma } from "@/lib/prisma";
import { getBhkConfigurations } from "@/lib/system-settings";

export default async function NewPropertyPage() {
  const [agents, bhkConfigurations] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["SUPERADMIN", "EMPLOYEE", "AGENT"] }, active: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    getBhkConfigurations(),
  ]);

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Add property</h1>
      <p className="mt-1 text-slate-600 mb-8">Create a new listing on the exchange</p>
      <PropertyForm agents={agents} bhkConfigurations={bhkConfigurations} />
    </div>
  );
}
