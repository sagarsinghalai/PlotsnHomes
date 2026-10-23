import { IntegrationsForm } from "@/components/admin/integrations-form";
import { EmailSendersManager } from "@/components/admin/email-senders-manager";
import { getCrmSettings } from "@/lib/crm-settings";
import { getMessagingIntegrations } from "@/lib/messaging-settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export default async function AdminIntegrationsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId || "__no_tenant__";
  const [config, crm] = await Promise.all([getMessagingIntegrations(tenantId), getCrmSettings(tenantId)]);
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
      <EmailSendersManager />
    </div>
  );
}
