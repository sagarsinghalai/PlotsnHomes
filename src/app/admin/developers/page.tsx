import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DevelopersList } from "@/components/admin/developers-list";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default async function DevelopersPage() {
  const developers = await prisma.developer.findMany({
    orderBy: { name: "asc" },
    take: 100,
  });

  const serializedDevelopers = developers.map((d) => ({
    id: d.id,
    name: d.name,
    projectCount: d.projectCount,
    email: d.email,
    phone: d.phone,
    address: d.address,
    city: d.city,
    state: d.state,
    zip: d.zip,
    country: d.country,
    experienceYears: d.experienceYears,
    identityType: d.identityType,
    identityNumber: d.identityNumber,
    website: d.website,
    description: d.description,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <div>
      <AdminPageHeader
        title="Developers"
        description="Manage project developers, verification info, and corporate addresses."
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Developers" },
        ]}
      />
      <div className="mt-6">
        <DevelopersList initialDevelopers={serializedDevelopers} />
      </div>
    </div>
  );
}
