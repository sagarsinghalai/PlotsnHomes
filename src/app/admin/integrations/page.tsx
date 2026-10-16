import { IntegrationsForm } from "@/components/admin/integrations-form";
import { getCrmSettings } from "@/lib/crm-settings";
import { getMessagingIntegrations } from "@/lib/messaging-settings";

export default async function AdminIntegrationsPage() {
  const [config, crm] = await Promise.all([getMessagingIntegrations(), getCrmSettings()]);
  const whatsappTemplates = crm.messageTemplates
    .filter((t) => t.channel === "whatsapp")
    .map((t) => ({ id: t.id, name: t.name, body: t.body }));

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-slate-900">Integrations</h1>
      <p className="mt-1 text-slate-600 mb-8">
        WhatsApp Business API, Telegram, Twilio SMS, Calendly / Cal.com, Gmail / company email
      </p>
      <IntegrationsForm initial={config} whatsappTemplates={whatsappTemplates} />
    </div>
  );
}
