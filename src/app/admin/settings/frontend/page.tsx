import { getSiteSetting, SITE_SETTING_KEYS, FeaturedArea, TestimonialsConfig, TeamMemberItem } from "@/lib/site-settings";
import { FrontendSettingsClient } from "./frontend-settings-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

export default async function FrontendSettingsPage() {
  const [featuredAreas, testimonials, teamMembers] = await Promise.all([
    getSiteSetting<FeaturedArea[]>(SITE_SETTING_KEYS.FEATURED_AREAS),
    getSiteSetting<TestimonialsConfig>(SITE_SETTING_KEYS.TESTIMONIALS),
    getSiteSetting<TeamMemberItem[]>(SITE_SETTING_KEYS.TEAM_MEMBERS),
  ]);

  return (
    <FrontendSettingsClient
      initialFeaturedAreas={featuredAreas}
      initialTestimonials={testimonials}
      initialTeamMembers={teamMembers}
    />
  );
}
