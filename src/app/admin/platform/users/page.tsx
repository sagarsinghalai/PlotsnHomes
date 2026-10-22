import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { PlatformUsersClient } from "@/components/admin/platform-users-client";

export const dynamic = "force-dynamic";

// Platform-owner console: every user across all white-labels, franchises and
// sub-accounts, with "Login as user" (audited impersonation) and password reset.
export default async function PlatformUsersPage() {
  const session = await getSession();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    redirect("/dashboard?error=Platform+owner+access+required");
  }
  return <PlatformUsersClient />;
}
