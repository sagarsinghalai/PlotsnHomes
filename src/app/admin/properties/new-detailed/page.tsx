import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { hasAddPermissionServer } from "@/lib/permissions";
import { DynamicListingForm } from "@/components/become-seller/dynamic-listing-form";

export const dynamic = "force-dynamic";

// Admin/back-office full listing form — the complete spec-driven form (every
// property type + all fields). Sellers use the simpler /become-seller form.
export default async function NewDetailedPropertyPage() {
  const session = await getServerSession(authOptions);
  const canAdd = await hasAddPermissionServer(session?.user, "/admin/properties");
  if (!canAdd) {
    redirect("/admin/properties?error=Access+Denied");
  }
  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Detailed listing</h1>
      <p className="mt-1 text-slate-600 mb-6">Create a listing with the complete property specification (all types &amp; fields).</p>
      <DynamicListingForm doneHref="/admin/properties" />
    </div>
  );
}
