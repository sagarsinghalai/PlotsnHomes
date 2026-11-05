import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { hasAddPermissionServer } from "@/lib/permissions";
import { ListingImportClient } from "@/components/admin/listing-import-client";

export const dynamic = "force-dynamic";

// Admin imports a seller's completed Excel listing template into a PENDING listing.
export default async function ListingImportPage() {
  const session = await getServerSession(authOptions);
  const canAdd = await hasAddPermissionServer(session?.user, "/admin/properties");
  if (!canAdd) {
    redirect("/admin/properties?error=Access+Denied");
  }
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Import listing from Excel</h1>
      <p className="mt-1 text-slate-600 mb-8">Download the full template, have the seller fill it, then upload it to create the listing.</p>
      <ListingImportClient />
    </div>
  );
}
