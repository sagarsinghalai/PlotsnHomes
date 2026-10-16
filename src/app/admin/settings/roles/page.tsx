import { getRolePermissions } from "@/lib/permissions";
import { RolesSettingsClient } from "./roles-settings-client";

export const metadata = {
  title: "Roles & Permissions Settings | Admin",
  description: "Manage granular roles, permissions, user access, and module toggles.",
};

export default async function RolesSettingsPage() {
  const initialPermissions = await getRolePermissions();

  return <RolesSettingsClient initialPermissions={initialPermissions} />;
}
