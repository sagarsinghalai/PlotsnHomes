import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { canManageRolePermissions } from "@/lib/permissions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BusinessProfileClient } from "@/components/admin/business-profile-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Business Profile | Admin",
  description: "Manage your workspace branding, custom domain and payment gateways.",
};

export default async function BusinessProfilePage() {
  const session = await getServerSession(authOptions);
  // Owner-only: the tenant's white-label admin (or the platform owner). A
  // franchise/branch leader can't rebrand the whole workspace.
  if (!canManageRolePermissions(session?.user?.role)) {
    redirect("/dashboard?error=Access+Denied");
  }

  return (
    <div>
      <AdminPageHeader
        title="Business Profile"
        description="Your brand, custom domain and payment gateways — what your customers see on your own site."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Settings" }, { label: "Business Profile" }]}
      />
      <BusinessProfileClient />
    </div>
  );
}
