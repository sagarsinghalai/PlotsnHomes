"use server";

import { revalidatePath } from "next/cache";
import { saveSiteSetting, SITE_SETTING_KEYS, FeaturedArea, TestimonialsConfig, TeamMemberItem } from "@/lib/site-settings";

export async function updateFrontendSettingsAction(payload: {
  featuredAreas: FeaturedArea[];
  testimonials: TestimonialsConfig;
  teamMembers: TeamMemberItem[];
}) {
  try {
    await Promise.all([
      saveSiteSetting(SITE_SETTING_KEYS.FEATURED_AREAS, payload.featuredAreas),
      saveSiteSetting(SITE_SETTING_KEYS.TESTIMONIALS, payload.testimonials),
      saveSiteSetting(SITE_SETTING_KEYS.TEAM_MEMBERS, payload.teamMembers),
    ]);

    revalidatePath("/");
    revalidatePath("/admin/settings/frontend");
    return { ok: true };
  } catch (error: any) {
    console.error("Failed to save frontend settings:", error);
    return { ok: false, error: error.message || "Failed to update frontend settings" };
  }
}
