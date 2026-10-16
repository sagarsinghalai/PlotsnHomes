"use server";

import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { RolePermissionsConfig } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function saveRolePermissionsAction(updatedConfig: RolePermissionsConfig) {
  const auth = await requireAdminApi();
  if (auth.error) {
    return { ok: false, error: "Unauthorized access" };
  }

  try {
    const jsonVal = JSON.stringify(updatedConfig);
    await prisma.systemSetting.upsert({
      where: { key: "user_role_permissions" },
      update: { value: jsonVal },
      create: { key: "user_role_permissions", value: jsonVal },
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
    revalidatePath("/admin/settings/roles");
    return { ok: true };
  } catch (err: any) {
    console.error("Error saving role permissions:", err);
    return { ok: false, error: err.message || "Failed to save permissions" };
  }
}
