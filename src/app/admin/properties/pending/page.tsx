import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PendingListingsClient } from "@/components/admin/pending-listings-client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hasEditPermissionServer } from "@/lib/permissions";
import { isSuperAdmin } from "@/lib/roles";

export const dynamic = "force-dynamic";

// Dedicated review screen for seller-submitted listings (status PENDING).
// Approve -> ACTIVE (goes public); Reject -> REJECTED (stays hidden).
export default async function PendingListingsPage() {
  const session = await getSession();
  const canReview = await hasEditPermissionServer(session?.user, "/admin/properties");
  if (!canReview) {
    redirect("/admin/properties?error=Access+Denied");
  }
  // Super-admins review all tenants' pending listings; a tenant admin sees only
  // their own tenant's.
  const global = isSuperAdmin(session!.user.role) || !session?.user?.tenantId;
  const where = global
    ? { status: "PENDING" as const }
    : { status: "PENDING" as const, tenantId: session.user.tenantId! };

  const pending = await prisma.property.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, title: true, slug: true, category: true, listingType: true,
      city: true, state: true, price: true, images: true, createdAt: true,
      submittedBy: { select: { name: true, email: true } },
    },
  });

  const rows = pending.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));

  return (
    <div>
      <AdminPageHeader
        title="Pending Listings"
        description="Review seller-submitted listings. Approve to publish them on the site, or reject."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Properties", href: "/admin/properties" }, { label: "Pending" }]}
      />
      <PendingListingsClient initial={rows} />
    </div>
  );
}
