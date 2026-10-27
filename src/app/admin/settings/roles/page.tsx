import { getRolePermissions, canManageRolePermissions } from "@/lib/permissions";
import { RolesSettingsClient } from "./roles-settings-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Roles & Permissions Settings | Admin",
  description: "Manage granular roles, permissions, user access, and module toggles.",
};

export default async function RolesSettingsPage() {
  const session = await getServerSession(authOptions);
  // Owner-only: the permission editor is the one control a sub-leader must never
  // reach (they could grant themselves access). Enforced here regardless of the
  // stored matrix, matching the save action.
  if (!canManageRolePermissions(session?.user?.role)) {
    redirect("/dashboard?error=Access+Denied");
  }
  // A tenant admin edits their own tenant's matrix; the platform owner edits the global one.
  const initialPermissions = await getRolePermissions(session?.user?.tenantId);

  return <RolesSettingsClient initialPermissions={initialPermissions} />;
}
