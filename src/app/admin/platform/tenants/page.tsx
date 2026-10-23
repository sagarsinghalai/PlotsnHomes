import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { TenantLifecycleClient } from "@/components/admin/tenant-lifecycle-client";

export const dynamic = "force-dynamic";

// Platform-owner control plane: manage tenant (white-label) lifecycle —
// activate, suspend, mark past-due, cancel. Suspension blocks login/API for that
// tenant's users while preserving all their data. Every change is audited.
export default async function PlatformTenantsPage() {
  const session = await getSession();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    redirect("/dashboard?error=Platform+owner+access+required");
  }
  return <TenantLifecycleClient />;
}
