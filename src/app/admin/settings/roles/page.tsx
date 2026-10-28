import {
  getRolePermissions,
  canManageRolePermissions,
  getGlobalRolePermissions,
  buildEffectiveCeiling,
} from "@/lib/permissions";
import { isSuperAdmin } from "@/lib/roles";
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
  const role = session?.user?.role;
  const owner = role ? isSuperAdmin(role) : false;

  // The platform owner edits the raw GLOBAL ceiling directly; a tenant admin edits
  // their own tenant's matrix (already clamped to the owner's ceiling on read).
  const initialPermissions = owner
    ? await getGlobalRolePermissions()
    : await getRolePermissions(session?.user?.tenantId);

  // Non-owners get the effective ceiling so the UI can lock anything the platform
  // owner hasn't granted. The owner has no ceiling — they define it.
  const ceiling = owner ? null : buildEffectiveCeiling(await getGlobalRolePermissions());

  return (
    <RolesSettingsClient
      initialPermissions={initialPermissions}
      isOwner={owner}
      ceiling={ceiling}
    />
  );
}
