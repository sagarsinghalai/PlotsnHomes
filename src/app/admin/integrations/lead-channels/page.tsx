import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LeadChannelsClient } from "@/components/admin/lead-channels-client";
import { getMaskedLeadChannels } from "@/lib/lead-channels";

export const dynamic = "force-dynamic";

export default async function LeadChannelsPage() {
  const [channels, users, teams] = await Promise.all([
    getMaskedLeadChannels(),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" } }),
    prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Lead Channels"
        description="Connect Facebook/Meta, Google Ads, Justdial, MagicBricks, 99acres and other sources to pipe leads straight into the CRM with auto-assignment."
        breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Integrations" }, { label: "Lead Channels" }]}
      />
      <div className="mt-6">
        <LeadChannelsClient initial={channels} users={users} teams={teams} />
      </div>
    </div>
  );
}
