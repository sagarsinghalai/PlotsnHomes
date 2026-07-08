import { notFound } from "next/navigation";
import { PropertyForm } from "@/components/admin/property-form";
import { prisma } from "@/lib/prisma";
import { getBhkConfigurations } from "@/lib/system-settings";

export default async function EditPropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const [property, agents, bhkConfigurations] = await Promise.all([
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
  ]);

  if (!property) notFound();

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Edit property</h1>
      <p className="mt-1 text-slate-600 mb-8 font-mono text-gold-dark">{property.symbol}</p>
      <PropertyForm agents={agents} property={property} bhkConfigurations={bhkConfigurations} />
    </div>
  );
}
