export const dynamic = "force-dynamic";

import { MessagesWorkspace } from "@/components/admin/messages-workspace";
import { getCompanyCountry } from "@/lib/company-settings";
import { getMessagingIntegrations } from "@/lib/messaging-settings";
import { getCrmSettings } from "@/lib/crm-settings";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? "";

  const [dbUsers, dbLeads, dbDevelopers, config, defaultCountry, crmSettings, properties] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["BUYER", "SELLER", "DEMO", "AGENT"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true, role: true, country: true },
    }),
    prisma.lead.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true },
    }),
    prisma.developer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, phone: true, country: true },
    }),
    getMessagingIntegrations(),
    getCompanyCountry(),
    getCrmSettings(),
    prisma.property.findMany({
      where: { status: "ACTIVE" },
      orderBy: { title: "asc" },
      select: { id: true, title: true, symbol: true },
    }),
  ]);

  const users = [
    ...dbUsers,
    ...dbLeads.map((lead) => ({
      ...lead,
      role: "LEAD",
      country: null,
    })),
    ...dbDevelopers.map((dev) => ({
      id: dev.id,
      name: dev.name,
      email: dev.email ?? "",
      phone: dev.phone ?? null,
      role: "DEVELOPER",
      country: dev.country ?? "IN",
    })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  // Pre-select user from URL query param (e.g. coming from lead detail page)
  const initialUserId = searchParams.userId ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-slate-900">Messaging Hub</h1>
        <p className="mt-1 text-slate-600">
          Send templates, check logs, and chat with clients in real-time.
        </p>
      </div>

      <MessagesWorkspace
        users={users}
        whatsappMode={config.whatsappMode}
        calendlyUrl={config.calendlyUrl}
        customMeetingUrl={config.customMeetingUrl}
        defaultCountry={defaultCountry}
        templates={crmSettings.messageTemplates}
        properties={properties}
        currentUserId={currentUserId}
        initialUserId={initialUserId}
      />
    </div>
  );
}
