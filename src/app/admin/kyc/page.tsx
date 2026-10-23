import { KycManager } from "@/components/admin/kyc-manager";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma";
import { getServerTenantId } from "@/lib/tenant";

export default async function AdminKycPage() {
  const tenantId = await getServerTenantId();
  const profiles = await prisma.kycProfile.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });

  const pending = profiles.filter((p) => p.status === "PENDING").length;

  return (
    <div>
      <AdminPageHeader
        title="KYC verification"
        description={`${pending} pending · Quick approve here or open full profile to edit all KYC fields`}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: "KYC" },
        ]}
      />
      <KycManager
        profiles={profiles.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
