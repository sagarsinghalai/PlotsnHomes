import { getTenantSetting, setTenantSetting } from "@/lib/system-settings";
import { encryptSecret, decryptSecret, isEncrypted } from "@/lib/credentials-crypto";
import { prisma } from "@/lib/prisma";

/**
 * WhatsApp Business (Cloud API) configuration, stored in SystemSetting so the
 * platform owner can change the number from the admin UI without editing env.
 * Secret fields are encrypted at rest (AES-256-GCM). Falls back to the legacy
 * environment variables when nothing is stored yet.
 */
const KEY = "whatsapp_business";

const SECRET_FIELDS = ["accessToken", "appSecret", "verifyToken"] as const;

export interface WhatsAppConfig {
  enabled: boolean;
  displayNumber: string; // public phone number for click-to-chat (wa.me), e.g. +9199...
  phoneNumberId: string; // Cloud API phone number id
  apiVersion: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
}

const DEFAULTS: WhatsAppConfig = {
  enabled: false,
  displayNumber: "",
  phoneNumberId: "",
  apiVersion: "v20.0",
  accessToken: "",
  appSecret: "",
  verifyToken: "",
};

function envFallback(): Partial<WhatsAppConfig> {
  return {
    displayNumber: process.env.WHATSAPP_DISPLAY_NUMBER || "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
    apiVersion: process.env.WHATSAPP_API_VERSION || DEFAULTS.apiVersion,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
    appSecret: process.env.WHATSAPP_APP_SECRET || "",
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "",
  };
}

/** Raw stored config (secrets still encrypted), merged over defaults. */
async function getRaw(tenantId?: string | null): Promise<WhatsAppConfig> {
  const base = { ...DEFAULTS };
  const raw = await getTenantSetting(KEY, tenantId);
  if (!raw) return base;
  try {
    return { ...base, ...(JSON.parse(raw) as Partial<WhatsAppConfig>) };
  } catch {
    return base;
  }
}

/** Server-side only: decrypted config, with env fallback for any empty field. */
export async function getWhatsAppConfig(tenantId?: string | null): Promise<WhatsAppConfig> {
  const stored = await getRaw(tenantId);
  const env = envFallback();
  const out: WhatsAppConfig = { ...stored };
  for (const f of SECRET_FIELDS) {
    out[f] = stored[f] ? decryptSecret(stored[f]) : "";
  }
  // Fill any empty field from env (lets you keep using env until you save in UI).
  (Object.keys(DEFAULTS) as (keyof WhatsAppConfig)[]).forEach((k) => {
    if (!out[k] && (env as any)[k]) (out as any)[k] = (env as any)[k];
  });
  return out;
}

/** Just the public click-to-chat number in digits (for wa.me links). "" if unset. */
export async function getPublicWhatsAppNumber(tenantId?: string | null): Promise<string> {
  const cfg = await getWhatsAppConfig(tenantId);
  return (cfg.displayNumber || "").replace(/\D/g, "");
}

export type MaskedWhatsAppConfig = Omit<WhatsAppConfig, "accessToken" | "appSecret" | "verifyToken"> & {
  _secrets: Record<string, boolean>;
  isConfigured: boolean;
};

/** Browser-safe config — no secret values, only "is set" booleans. */
export async function getMaskedWhatsAppConfig(tenantId?: string | null): Promise<MaskedWhatsAppConfig> {
  const stored = await getRaw(tenantId);
  const env = envFallback();
  const flags: Record<string, boolean> = {};
  for (const f of SECRET_FIELDS) flags[`has${f[0].toUpperCase()}${f.slice(1)}`] = !!(stored[f] || (env as any)[f]);
  const displayNumber = stored.displayNumber || env.displayNumber || "";
  const phoneNumberId = stored.phoneNumberId || env.phoneNumberId || "";
  return {
    enabled: stored.enabled,
    displayNumber,
    phoneNumberId,
    apiVersion: stored.apiVersion || env.apiVersion || DEFAULTS.apiVersion,
    _secrets: flags,
    isConfigured: !!(displayNumber && flags.hasAccessToken),
  };
}

/** Persist config, encrypting any new plaintext secret values (idempotent). */
export async function saveWhatsAppConfig(value: WhatsAppConfig, tenantId?: string | null): Promise<void> {
  const out: any = { ...value };
  for (const f of SECRET_FIELDS) {
    const v = (value as any)[f];
    if (v && !isEncrypted(v)) out[f] = encryptSecret(v);
  }
  await setTenantSetting(KEY, JSON.stringify(out), tenantId);
}

/**
 * Resolve which tenant owns an incoming WhatsApp message, by matching the Cloud
 * API `phone_number_id` against each tenant's stored config. Returns null when
 * no tenant has configured that number (caller falls back to the primary tenant).
 */
export async function resolveTenantByPhoneNumberId(phoneNumberId: string | null | undefined): Promise<string | null> {
  if (!phoneNumberId) return null;
  const rows = await prisma.tenantSetting.findMany({
    where: { key: KEY },
    select: { tenantId: true, value: true },
  });
  for (const row of rows) {
    try {
      const cfg = JSON.parse(row.value) as Partial<WhatsAppConfig>;
      if (cfg.phoneNumberId && cfg.phoneNumberId === phoneNumberId) return row.tenantId;
    } catch { /* skip malformed */ }
  }
  return null;
}

/** Merge a masked UI update onto stored config, preserving omitted/blank secrets. */
export async function mergeWhatsAppUpdate(body: Partial<WhatsAppConfig>, tenantId?: string | null): Promise<WhatsAppConfig> {
  const current = await getRaw(tenantId);
  const next: any = { ...current };
  for (const k of ["enabled", "displayNumber", "phoneNumberId", "apiVersion"] as const) {
    if (body[k] !== undefined) next[k] = body[k];
  }
  for (const f of SECRET_FIELDS) {
    const v = typeof (body as any)[f] === "string" ? (body as any)[f].trim() : "";
    next[f] = v ? v : (current as any)[f] || ""; // keep existing (encrypted) when blank/omitted
  }
  return next as WhatsAppConfig;
}
