import Link from "next/link";
import { Inbox, Bot, Settings } from "lucide-react";
import { WhatsAppHub } from "@/components/admin/whatsapp-hub";
import { getCrmSettings } from "@/lib/crm-settings";
import { prisma } from "@/lib/prisma";

const HUB_ACTIONS = [
  { href: "/admin/whatsapp/inbox", label: "Inbox", desc: "Assigned conversations", icon: Inbox },
  { href: "/admin/whatsapp/bot", label: "Bot flows", desc: "Auto-replies & handoff", icon: Bot },
  { href: "/admin/whatsapp/settings", label: "Settings", desc: "Number & credentials", icon: Settings },
];

export default async function AdminWhatsAppPage() {
  const [leadsRaw, crmSettings, properties] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        stage: true,
        source: true,
        leadStatus: true,
        budgetMin: true,
        budgetMax: true,
        owner: { select: { name: true } },
        property: { select: { title: true } },
      },
    }),
    getCrmSettings(),
    prisma.property.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        images: true,
        description: true,
        price: true,
      },
    }),
  ]);

  // Flatten relations to plain strings for the client audience filters.
  const leads = leadsRaw.map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    email: l.email,
    stage: l.stage,
    source: l.source,
    leadStatus: l.leadStatus,
    budgetMin: l.budgetMin,
    budgetMax: l.budgetMax,
    ownerName: l.owner?.name ?? null,
    propertyTitle: l.property?.title ?? null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">WhatsApp Hub</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Send messages to leads, and jump to the inbox, bot flows or settings.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {HUB_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand hover:shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand">{a.label}</span>
                  <span className="block text-xs text-slate-500">{a.desc}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <WhatsAppHub leads={leads} initialSettings={crmSettings} properties={properties} />
    </div>
  );
}

