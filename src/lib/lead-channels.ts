import { getTenantSetting, setTenantSetting } from "@/lib/system-settings";
import { encryptSecret, decryptSecret, isEncrypted } from "@/lib/credentials-crypto";
import { prisma } from "@/lib/prisma";
// Client-safe types + constants live in lead-channels-config (no node:crypto);
// re-exported here so existing server imports from "@/lib/lead-channels" keep working.
import {
  SECRET_FIELDS,
  LEAD_CHANNEL_ORDER,
  DEFAULT_LEAD_CHANNELS,
  type LeadChannelKey,
  type ChannelFieldMap,
  type LeadChannelConfig,
  type LeadChannels,
} from "@/lib/lead-channels-config";

export {
  SECRET_FIELDS,
  LEAD_CHANNEL_ORDER,
  DEFAULT_LEAD_CHANNELS,
  type LeadChannelKey,
  type ChannelFieldMap,
  type LeadChannelConfig,
  type LeadChannels,
};

const KEY = "lead_channels";

export async function getLeadChannels(tenantId?: string | null): Promise<LeadChannels> {
  const raw = await getTenantSetting(KEY, tenantId);
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
export async function getChannel(channel: string, tenantId?: string | null): Promise<LeadChannelConfig | null> {
  const all = await getLeadChannels(tenantId);
  const cfg = (all as any)[channel] as LeadChannelConfig | undefined;
  return cfg ? decryptChannelSecrets(cfg) : null;
}

/** Persist channels, encrypting any plaintext secret fields (idempotent). */
export async function saveLeadChannels(value: LeadChannels, tenantId?: string | null): Promise<void> {
  const safe: any = {};
  (Object.keys(value) as LeadChannelKey[]).forEach((k) => { safe[k] = encryptChannelSecrets(value[k]); });
  await setTenantSetting(KEY, JSON.stringify(safe), tenantId);
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
export async function getMaskedLeadChannels(tenantId?: string | null): Promise<Record<LeadChannelKey, MaskedChannel>> {
  const all = await getLeadChannels(tenantId);
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

/**
 * Resolve which tenant a public lead webhook belongs to, by matching the
 * presented secret (header/query key, or Meta verify token) against each
 * tenant's stored channel config. Returns the tenantId + decrypted config, or
 * null when nothing matches (caller may then fall back to the global config).
 */
export async function resolveTenantByChannelSecret(
  channel: string,
  presented: string | null | undefined
): Promise<{ tenantId: string; cfg: LeadChannelConfig } | null> {
  if (!presented) return null;
  const rows = await prisma.tenantSetting.findMany({
    where: { key: KEY },
    select: { tenantId: true, value: true },
  });
  for (const row of rows) {
    try {
      const all = JSON.parse(row.value) as Partial<LeadChannels>;
      const stored = (all as any)[channel] as LeadChannelConfig | undefined;
      if (!stored) continue;
      const cfg = decryptChannelSecrets(stored);
      if (
        (cfg.secret && cfg.secret === presented) ||
        (cfg.verifyToken && cfg.verifyToken === presented) ||
        (cfg.googleKey && cfg.googleKey === presented)
      ) {
        return { tenantId: row.tenantId, cfg };
      }
    } catch { /* skip malformed */ }
  }
  return null;
}
