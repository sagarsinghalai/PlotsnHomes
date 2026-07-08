import { UserDetailEditor } from "@/components/admin/user-detail-editor";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      kycProfile: true,
      loanApplications: {
        orderBy: { createdAt: "desc" },
        include: { property: { select: { title: true, symbol: true } } },
      },
      _count: { select: { properties: true, transactions: true, inquiries: true } },
    },
  });

  if (!user) notFound();

  return (
    <div>
      <AdminPageHeader
        title={user.name}
        description={`${user.email} · ${user.role}${!user.active ? " · Disabled" : ""}`}
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Users", href: "/admin/users" },
          { label: user.name },
        ]}
      />
      <UserDetailEditor
        user={{
          ...user,
          phone: user.phone ?? null,
          address: user.address ?? null,
          city: user.city ?? null,
          state: user.state ?? null,
          zip: user.zip ?? null,
          country: user.country ?? null,
          lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
          createdAt: user.createdAt.toISOString(),
          kycProfile: user.kycProfile,
          loanApplications: user.loanApplications.map((l) => ({
            ...l,
            createdAt: l.createdAt.toISOString(),
            updatedAt: l.updatedAt.toISOString(),
          })),
        }}
      />
    </div>
  );
}
