import { getSetting, setSetting } from "@/lib/system-settings";
import { encryptSecret, decryptSecret, isEncrypted } from "@/lib/credentials-crypto";

const KEY = "lead_channels";

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

/** Server-side only: returns a channel config with secrets DECRYPTED for use. */
export async function getChannel(channel: string): Promise<LeadChannelConfig | null> {
  const all = await getLeadChannels();
  const cfg = (all as any)[channel] as LeadChannelConfig | undefined;
  return cfg ? decryptChannelSecrets(cfg) : null;
}

/** Persist channels, encrypting any plaintext secret fields (idempotent). */
export async function saveLeadChannels(value: LeadChannels): Promise<void> {
  const safe: any = {};
  (Object.keys(value) as LeadChannelKey[]).forEach((k) => { safe[k] = encryptChannelSecrets(value[k]); });
  await setSetting(KEY, JSON.stringify(safe));
}

/** Encrypt the secret fields of one channel (skips already-encrypted/empty). */
export function encryptChannelSecrets(cfg: LeadChannelConfig): LeadChannelConfig {
  const out: any = { ...cfg };
  for (const f of SECRET_FIELDS) {
    const v = (cfg as any)[f];
    if (v && !isEncrypted(v)) out[f] = encryptSecret(v);
  }
  return out;
}

/** Decrypt the secret fields of one channel (plaintext passes through). */
export function decryptChannelSecrets(cfg: LeadChannelConfig): LeadChannelConfig {
  const out: any = { ...cfg };
  for (const f of SECRET_FIELDS) {
    const v = (cfg as any)[f];
    if (v) out[f] = decryptSecret(v);
  }
  return out;
}

export type MaskedChannel = Omit<LeadChannelConfig, "verifyToken" | "pageAccessToken" | "appSecret" | "googleKey" | "secret"> & {
  secret: "";
  _secrets: Record<string, boolean>;
  isConfigured: boolean;
};

/** Strip all secret values and expose only boolean "is set" indicators. */
export function maskChannel(key: LeadChannelKey, cfg: LeadChannelConfig): MaskedChannel {
  const flags: Record<string, boolean> = {};
  for (const f of SECRET_FIELDS) flags[`has${f[0].toUpperCase()}${f.slice(1)}`] = !!(cfg as any)[f];
  const required =
    key === "meta" ? ["pageAccessToken", "appSecret"] :
    key === "google" ? ["googleKey"] : [];
  const isConfigured = required.every((f) => !!(cfg as any)[f]);
  const clean: any = { ...cfg };
  for (const f of SECRET_FIELDS) clean[f] = "";
  return { ...clean, _secrets: flags, isConfigured };
}

/** All channels with secrets removed — safe to return to the browser. */
export async function getMaskedLeadChannels(): Promise<Record<LeadChannelKey, MaskedChannel>> {
  const all = await getLeadChannels();
  const out: any = {};
  (Object.keys(all) as LeadChannelKey[]).forEach((k) => { out[k] = maskChannel(k, all[k]); });
  return out;
}

/**
 * Merge an incoming (masked) update onto the stored config, PRESERVING existing
 * secrets when a field is omitted or blank. Non-secret fields always take the
 * incoming value. New plaintext secrets are left for saveLeadChannels to encrypt.
 */
export function mergeChannelUpdate(current: LeadChannels, body: Partial<LeadChannels>): LeadChannels {
  const merged: any = { ...current };
  (Object.keys(current) as LeadChannelKey[]).forEach((k) => {
    const cur = current[k];
    const inc = (body as any)[k];
    if (!inc) return;
    const next: any = { ...cur, ...inc, fieldMap: { ...cur.fieldMap, ...inc.fieldMap } };
    for (const f of SECRET_FIELDS) {
      const v = typeof inc[f] === "string" ? inc[f].trim() : "";
      next[f] = v ? v : (cur as any)[f] || ""; // keep existing (encrypted) when blank/omitted
    }
    merged[k] = next;
  });
  return merged;
}

function structuredCloneSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
