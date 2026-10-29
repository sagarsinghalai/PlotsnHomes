// Client-safe lead-channel types + constants. Kept separate from lead-channels.ts
// (which imports node:crypto via credentials-crypto) so client components can use
// these without pulling server-only crypto into the browser bundle.

/** Fields that hold credentials and must be encrypted at rest / masked in GETs. */
export const SECRET_FIELDS = ["verifyToken", "pageAccessToken", "appSecret", "googleKey", "secret"] as const;

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
  // Present only on masked (client-facing) configs — never contains secrets.
  _secrets?: Record<string, boolean>;
  isConfigured?: boolean;
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
