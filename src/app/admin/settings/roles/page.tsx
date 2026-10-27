import { getRolePermissions } from "@/lib/permissions";
import { RolesSettingsClient } from "./roles-settings-client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const metadata = {
  title: "Roles & Permissions Settings | Admin",
  description: "Manage granular roles, permissions, user access, and module toggles.",
};

export default async function RolesSettingsPage() {
  const session = await getServerSession(authOptions);
  // A tenant admin edits their own tenant's matrix; the platform owner edits the global one.
  const initialPermissions = await getRolePermissions(session?.user?.tenantId);

  return <RolesSettingsClient initialPermissions={initialPermissions} />;
}
