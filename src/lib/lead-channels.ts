import { getSetting, setSetting } from "@/lib/system-settings";

const KEY = "lead_channels";

export type LeadChannelKey = "meta" | "google" | "justdial" | "magicbricks" | "acres99" | "generic";

export type ChannelFieldMap = { name?: string; phone?: string; email?: string; message?: string };

export interface LeadChannelConfig {
  enabled: boolean;
  label: string;
  secret: string; // shared secret for webhook validation (portals/generic) & meta query key
  assignOwnerId?: string;
  assignTeamId?: string;
  defaultStage?: string; // LeadStage value, default NEW
  // Meta (Facebook) Lead Ads
  verifyToken?: string;
  pageAccessToken?: string;
  appSecret?: string;
  // Google Ads Lead Form
  googleKey?: string;
  // Portals / generic
  fieldMap?: ChannelFieldMap;
}

export type LeadChannels = Record<LeadChannelKey, LeadChannelConfig>;

export const LEAD_CHANNEL_ORDER: LeadChannelKey[] = ["meta", "google", "justdial", "magicbricks", "acres99", "generic"];

const base = (label: string, fieldMap?: ChannelFieldMap): LeadChannelConfig => ({
  enabled: false,
  label,
  secret: "",
  assignOwnerId: "",
  assignTeamId: "",
  defaultStage: "NEW",
  fieldMap,
});

export const DEFAULT_LEAD_CHANNELS: LeadChannels = {
  meta: { ...base("Facebook / Meta"), verifyToken: "", pageAccessToken: "", appSecret: "" },
  google: { ...base("Google Ads"), googleKey: "" },
  justdial: base("Justdial", { name: "name", phone: "mobile", email: "email", message: "requirements" }),
  magicbricks: base("MagicBricks", { name: "name", phone: "phone", email: "email", message: "message" }),
  acres99: base("99acres", { name: "name", phone: "phone", email: "email", message: "message" }),
  generic: base("Generic Webhook", { name: "name", phone: "phone", email: "email", message: "message" }),
};

export async function getLeadChannels(): Promise<LeadChannels> {
  const raw = await getSetting(KEY);
  if (!raw) return structuredCloneSafe(DEFAULT_LEAD_CHANNELS);
  try {
    const saved = JSON.parse(raw) as Partial<LeadChannels>;
    const merged = structuredCloneSafe(DEFAULT_LEAD_CHANNELS);
    (Object.keys(merged) as LeadChannelKey[]).forEach((k) => {
      if (saved[k]) merged[k] = { ...merged[k], ...saved[k], fieldMap: { ...merged[k].fieldMap, ...saved[k]?.fieldMap } };
    });
    return merged;
  } catch {
    return structuredCloneSafe(DEFAULT_LEAD_CHANNELS);
  }
}

export async function getChannel(channel: string): Promise<LeadChannelConfig | null> {
  const all = await getLeadChannels();
  return (all as any)[channel] ?? null;
}

export async function saveLeadChannels(value: LeadChannels): Promise<void> {
  await setSetting(KEY, JSON.stringify(value));
}

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
