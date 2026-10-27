import { getTenantSetting, setTenantSetting } from "@/lib/system-settings";
import { encryptSecret, decryptSecret, isEncrypted } from "@/lib/credentials-crypto";
import { razorpayConfigured } from "@/lib/razorpay";
import { stripeConfigured } from "@/lib/stripe";

/**
 * Per-tenant payment gateway configuration, stored in TenantSetting (key
 * `payment_gateways`) with secrets encrypted at rest via credentials-crypto.
 *
 * Resolution order for any tenant:
 *   1. that tenant's own enabled gateway config (money → the tenant/partner), else
 *   2. the environment keys (the platform's gateway — shared fallback), else
 *   3. TEST MODE (payment simulated).
 *
 * The PLATFORM gateway (for self-serve subscription signup/renewal) is the
 * global config (tenantId = null → SystemSetting) with the same env fallback —
 * so the platform owner configures it once and every signup flows to it.
 *
 * Publishable/key ids are client-visible by design (Razorpay keyId, Stripe
 * publishable key); only the SECRET_FIELDS below are encrypted + masked.
 */
const KEY = "payment_gateways";

export type PaymentProvider = "razorpay" | "stripe";

export interface RazorpayCfg {
  enabled: boolean;
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

export interface StripeCfg {
  enabled: boolean;
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
}

export interface PaymentConfig {
  razorpay: RazorpayCfg;
  stripe: StripeCfg;
  preferred: PaymentProvider; // which to use when both are enabled
  currency: string; // default collection currency for this tenant (e.g. INR, USD)
}

/** Dotted paths of fields that hold secrets — encrypted at rest, masked in GETs. */
export const SECRET_PATHS = [
  "razorpay.keySecret",
  "razorpay.webhookSecret",
  "stripe.secretKey",
  "stripe.webhookSecret",
] as const;

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  razorpay: { enabled: false, keyId: "", keySecret: "", webhookSecret: "" },
  stripe: { enabled: false, publishableKey: "", secretKey: "", webhookSecret: "" },
  preferred: "razorpay",
  currency: "INR",
};

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function getPath(obj: any, path: string): string {
  return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj) ?? "";
}

function setPath(obj: any, path: string, value: string): void {
  const keys = path.split(".");
  const last = keys.pop() as string;
  let node = obj;
  for (const k of keys) {
    if (node[k] == null || typeof node[k] !== "object") node[k] = {};
    node = node[k];
  }
  node[last] = value;
}

/** Read the stored config merged onto defaults (secrets still ENCRYPTED). */
export async function getPaymentConfig(tenantId?: string | null): Promise<PaymentConfig> {
  let raw = "";
  try {
    raw = await getTenantSetting(KEY, tenantId);
  } catch {
    return clone(DEFAULT_PAYMENT_CONFIG);
  }
  if (!raw) return clone(DEFAULT_PAYMENT_CONFIG);
  try {
    const saved = JSON.parse(raw) as Partial<PaymentConfig>;
    const merged = clone(DEFAULT_PAYMENT_CONFIG);
    merged.razorpay = { ...merged.razorpay, ...(saved.razorpay ?? {}) };
    merged.stripe = { ...merged.stripe, ...(saved.stripe ?? {}) };
    if (saved.preferred === "razorpay" || saved.preferred === "stripe") merged.preferred = saved.preferred;
    if (typeof saved.currency === "string" && saved.currency) merged.currency = saved.currency;
    return merged;
  } catch {
    return clone(DEFAULT_PAYMENT_CONFIG);
  }
}

/** Encrypt any plaintext secret path (idempotent — skips already-encrypted/empty). */
export function encryptPaymentConfig(cfg: PaymentConfig): PaymentConfig {
  const out = clone(cfg);
  for (const p of SECRET_PATHS) {
    const v = getPath(out, p);
    if (v && !isEncrypted(v)) setPath(out, p, encryptSecret(v));
  }
  return out;
}

/** Decrypt the secret paths for server-side use (plaintext passes through). */
export function decryptPaymentConfig(cfg: PaymentConfig): PaymentConfig {
  const out = clone(cfg);
  for (const p of SECRET_PATHS) {
    const v = getPath(out, p);
    if (v) setPath(out, p, decryptSecret(v));
  }
  return out;
}

/** Persist a config, encrypting any plaintext secrets first. */
export async function savePaymentConfig(cfg: PaymentConfig, tenantId?: string | null): Promise<void> {
  const safe = encryptPaymentConfig(cfg);
  await setTenantSetting(KEY, JSON.stringify(safe), tenantId);
}

export type MaskedPaymentConfig = {
  razorpay: { enabled: boolean; keyId: string; hasKeySecret: boolean; hasWebhookSecret: boolean };
  stripe: { enabled: boolean; publishableKey: string; hasSecretKey: boolean; hasWebhookSecret: boolean };
  preferred: PaymentProvider;
  currency: string;
  envFallback: { razorpay: boolean; stripe: boolean };
};

/** Browser-safe view: no secret values, only "is set" indicators. */
export async function getMaskedPaymentConfig(tenantId?: string | null): Promise<MaskedPaymentConfig> {
  const cfg = await getPaymentConfig(tenantId);
  return {
    razorpay: {
      enabled: cfg.razorpay.enabled,
      keyId: cfg.razorpay.keyId,
      hasKeySecret: !!cfg.razorpay.keySecret,
      hasWebhookSecret: !!cfg.razorpay.webhookSecret,
    },
    stripe: {
      enabled: cfg.stripe.enabled,
      publishableKey: cfg.stripe.publishableKey,
      hasSecretKey: !!cfg.stripe.secretKey,
      hasWebhookSecret: !!cfg.stripe.webhookSecret,
    },
    preferred: cfg.preferred,
    currency: cfg.currency,
    envFallback: { razorpay: razorpayConfigured(), stripe: stripeConfigured() },
  };
}

/**
 * Merge an incoming (masked) update onto the stored config, PRESERVING existing
 * (encrypted) secrets when a secret field is blank/omitted. Non-secret fields
 * always take the incoming value. New plaintext secrets are left for
 * savePaymentConfig to encrypt.
 */
export function mergePaymentConfigUpdate(current: PaymentConfig, body: any): PaymentConfig {
  const next = clone(current);
  const inc = body ?? {};

  // Non-secret, directly-overwritable fields.
  if (inc.razorpay) {
    if (typeof inc.razorpay.enabled === "boolean") next.razorpay.enabled = inc.razorpay.enabled;
    if (typeof inc.razorpay.keyId === "string") next.razorpay.keyId = inc.razorpay.keyId.trim();
  }
  if (inc.stripe) {
    if (typeof inc.stripe.enabled === "boolean") next.stripe.enabled = inc.stripe.enabled;
    if (typeof inc.stripe.publishableKey === "string") next.stripe.publishableKey = inc.stripe.publishableKey.trim();
  }
  if (inc.preferred === "razorpay" || inc.preferred === "stripe") next.preferred = inc.preferred;
  if (typeof inc.currency === "string" && inc.currency.trim()) next.currency = inc.currency.trim().toUpperCase();

  // Secret fields: a non-blank incoming value replaces; blank/omitted keeps existing.
  for (const p of SECRET_PATHS) {
    const incoming = getPath(inc, p);
    const v = typeof incoming === "string" ? incoming.trim() : "";
    if (v) setPath(next, p, v);
    // else: keep current (already in `next` via clone)
  }
  return next;
}

export type ResolvedGateway =
  | { provider: "test"; currency: string; source: "none" }
  | {
      provider: "razorpay";
      keyId: string;
      keySecret: string;
      webhookSecret: string;
      currency: string;
      source: "tenant" | "env";
    }
  | {
      provider: "stripe";
      publishableKey: string;
      secretKey: string;
      webhookSecret: string;
      currency: string;
      source: "tenant" | "env";
    };

/**
 * Resolve the active gateway + live credentials for a tenant (or the platform
 * when tenantId is null/undefined). Tenant config wins; then environment keys;
 * then test mode. Secrets in the result are DECRYPTED — server-side only.
 */
export async function getResolvedGateway(tenantId?: string | null): Promise<ResolvedGateway> {
  const cfg = decryptPaymentConfig(await getPaymentConfig(tenantId));
  const currency = cfg.currency || "INR";

  const rzpOk = cfg.razorpay.enabled && !!cfg.razorpay.keyId && !!cfg.razorpay.keySecret;
  const strOk = cfg.stripe.enabled && !!cfg.stripe.publishableKey && !!cfg.stripe.secretKey;

  const pickRzp = (): ResolvedGateway => ({
    provider: "razorpay",
    keyId: cfg.razorpay.keyId,
    keySecret: cfg.razorpay.keySecret,
    webhookSecret: cfg.razorpay.webhookSecret,
    currency,
    source: "tenant",
  });
  const pickStr = (): ResolvedGateway => ({
    provider: "stripe",
    publishableKey: cfg.stripe.publishableKey,
    secretKey: cfg.stripe.secretKey,
    webhookSecret: cfg.stripe.webhookSecret,
    currency,
    source: "tenant",
  });

  if (rzpOk && strOk) return cfg.preferred === "stripe" ? pickStr() : pickRzp();
  if (rzpOk) return pickRzp();
  if (strOk) return pickStr();

  // Env fallback (the platform's own keys).
  if (razorpayConfigured()) {
    return {
      provider: "razorpay",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
      currency,
      source: "env",
    };
  }
  if (stripeConfigured()) {
    return {
      provider: "stripe",
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
      secretKey: process.env.STRIPE_SECRET_KEY ?? "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
      currency,
      source: "env",
    };
  }
  return { provider: "test", currency, source: "none" };
}
