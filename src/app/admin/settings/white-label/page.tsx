import { getPartnerSubscriptions, getWhiteLabelProfile } from "@/lib/white-label-store";
import { WhiteLabelClient } from "@/components/admin/white-label-client";

export const metadata = {
  title: "White-Label & Subscription Hub | Admin Settings",
};

export default async function WhiteLabelSettingsPage() {
  const [profile, subscriptions] = await Promise.all([
    getWhiteLabelProfile(),
    getPartnerSubscriptions(),
  ]);

  return <WhiteLabelClient initialProfile={profile} initialSubscriptions={subscriptions} />;
}
