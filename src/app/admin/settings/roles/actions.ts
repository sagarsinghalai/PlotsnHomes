"use server";

import { requireAdminApi } from "@/lib/admin-api";
import { setTenantSetting } from "@/lib/system-settings";
import { isSuperAdmin } from "@/lib/roles";
import { RolePermissionsConfig } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function saveRolePermissionsAction(updatedConfig: RolePermissionsConfig) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return { ok: false, error: "Unauthorized access" };
  }

  try {
    const jsonVal = JSON.stringify(updatedConfig);
    // The platform owner edits the global default; a tenant admin edits only
    // their own tenant's matrix (null tenant writes the global SystemSetting).
    const targetTenant = isSuperAdmin(auth.session.user.role) ? null : auth.tenantId;
    await setTenantSetting("user_role_permissions", jsonVal, targetTenant);

    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/settings/roles");
    return { ok: true };
  } catch (err: any) {
    console.error("Error saving role permissions:", err);
    return { ok: false, error: err.message || "Failed to save permissions" };
  }
}
