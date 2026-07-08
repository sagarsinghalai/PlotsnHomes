import { getSetting, setSetting } from "@/lib/system-settings";
import type { MessageTemplate } from "@/lib/crm-template-utils";

export type { MessageTemplate } from "@/lib/crm-template-utils";

export const CRM_KEYS = {
  ROUTING_MODE: "crm_routing_mode",
  AUTO_ASSIGN: "crm_auto_assign",
  DEFAULT_OWNER_ID: "crm_default_owner_id",
  LEAD_SOURCES: "crm_lead_sources",
  MESSAGE_TEMPLATES: "crm_message_templates",
} as const;

export type CrmRoutingMode = "property_agent" | "round_robin" | "manual";

export type CrmSettings = {
  routingMode: CrmRoutingMode;
  autoAssign: boolean;
  defaultOwnerId: string;
  leadSources: string[];
  messageTemplates: MessageTemplate[];
};

const DEFAULT_SOURCES = [
  "Website",
  "Property Inquiry",
  "Site Visit",
  "Referral",
  "Walk-in",
  "Facebook",
  "Google Ads",
  "Portal",
];

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "welcome",
    name: "Welcome — new lead",
    channel: "whatsapp",
    body: "Hi {{name}}, thanks for your interest in {{property}}. I'm your PlotsnHomes advisor — when is a good time for a quick call?",
  },
  {
    id: "followup",
    name: "Follow-up reminder",
    channel: "whatsapp",
    body: "Hi {{name}}, following up on your inquiry for {{property}}. Are you still exploring options this week?",
  },
  {
    id: "site_visit",
    name: "Site visit confirmation",
    channel: "email",
    subject: "Your property tour — PlotsnHomes",
    body: "Hi {{name}},\n\nYour site visit for {{property}} is confirmed. Reply if you need to reschedule.\n\nPlotsnHomes Team",
  },
];

export async function getCrmSettings(): Promise<CrmSettings> {
  const [routingMode, autoAssign, defaultOwnerId, sourcesRaw, templatesRaw] = await Promise.all([
    getSetting(CRM_KEYS.ROUTING_MODE),
    getSetting(CRM_KEYS.AUTO_ASSIGN),
    getSetting(CRM_KEYS.DEFAULT_OWNER_ID),
    getSetting(CRM_KEYS.LEAD_SOURCES),
    getSetting(CRM_KEYS.MESSAGE_TEMPLATES),
  ]);

  let leadSources = DEFAULT_SOURCES;
  let messageTemplates = DEFAULT_TEMPLATES;
  try {
    if (sourcesRaw) leadSources = JSON.parse(sourcesRaw) as string[];
  } catch {
    /* keep defaults */
  }
  try {
    if (templatesRaw) messageTemplates = JSON.parse(templatesRaw) as MessageTemplate[];
  } catch {
    /* keep defaults */
  }

  return {
    routingMode: (routingMode || "property_agent") as CrmRoutingMode,
    autoAssign: autoAssign !== "false",
    defaultOwnerId: defaultOwnerId ?? "",
    leadSources,
    messageTemplates,
  };
}

export async function saveCrmSettings(data: Partial<CrmSettings>) {
  const entries: [string, string][] = [];
  if (data.routingMode !== undefined) entries.push([CRM_KEYS.ROUTING_MODE, data.routingMode]);
  if (data.autoAssign !== undefined) entries.push([CRM_KEYS.AUTO_ASSIGN, String(data.autoAssign)]);
  if (data.defaultOwnerId !== undefined) entries.push([CRM_KEYS.DEFAULT_OWNER_ID, data.defaultOwnerId]);
  if (data.leadSources !== undefined) entries.push([CRM_KEYS.LEAD_SOURCES, JSON.stringify(data.leadSources)]);
  if (data.messageTemplates !== undefined) {
    entries.push([CRM_KEYS.MESSAGE_TEMPLATES, JSON.stringify(data.messageTemplates)]);
  }
  await Promise.all(entries.map(([k, v]) => setSetting(k, v)));
}
