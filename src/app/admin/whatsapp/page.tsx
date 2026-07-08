import { WhatsAppHub } from "@/components/admin/whatsapp-hub";
import { getCrmSettings } from "@/lib/crm-settings";
import { prisma } from "@/lib/prisma";

export default async function AdminWhatsAppPage() {
  const [leads, crmSettings, properties] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <WhatsAppHub leads={leads} initialSettings={crmSettings} properties={properties} />
    </div>
  );
}

