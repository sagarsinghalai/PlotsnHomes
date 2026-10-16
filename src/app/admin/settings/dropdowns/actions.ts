"use server";

import { saveSiteSetting, SITE_SETTING_KEYS, SectionDropdownConfig } from "@/lib/site-settings";
import { revalidatePath } from "next/cache";

export async function updateDropdownOptionsAction(sections: SectionDropdownConfig[]) {
  try {
    await saveSiteSetting(SITE_SETTING_KEYS.DROPDOWN_OPTIONS, sections);
    revalidatePath("/admin/settings/dropdowns");
    revalidatePath("/admin/users");
    revalidatePath("/admin/kyc");
    revalidatePath("/admin/hierarchy");
    return { ok: true };
  } catch (error: any) {
    console.error("Failed to update dropdown options:", error);
    return { ok: false, error: error?.message || "Failed to save dropdown options" };
  }
}
