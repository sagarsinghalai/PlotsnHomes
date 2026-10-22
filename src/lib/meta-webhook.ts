import crypto from "node:crypto";

/** Max accepted webhook body (abuse / DoS guard). */
export const MAX_WEBHOOK_BYTES = 1_000_000; // 1 MB

/**
 * True when a declared body size exceeds the limit. Routes call this with the
 * `Content-Length` header BEFORE buffering the body, so oversized requests are
 * rejected before any expensive processing. A non-finite/negative value (header
 * missing or malformed) returns false — the post-read byte check is the backstop.
 */
export function exceedsWebhookLimit(declaredBytes: number): boolean {
  return Number.isFinite(declaredBytes) && declaredBytes > MAX_WEBHOOK_BYTES;
}

/**
 * Constant-time string equality for short secrets/tokens (verify token, portal
 * secret, google_key). Compares SHA-256 digests so differing lengths do not leak
 * via early return and the comparison time is independent of where bytes differ.
 */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const da = crypto.createHash("sha256").update(a, "utf8").digest();
  const db = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(da, db);
}

export function computeMetaSignature(rawBody: string, appSecret: string): string {
  return "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
}

/**
 * Timing-safe verification of Meta's `X-Hub-Signature-256` header against the
 * ORIGINAL raw request body. Returns false for any missing/invalid input —
 * never throws.
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null | undefined, appSecret: string | null | undefined): boolean {
  if (!appSecret || !signatureHeader) return false;
  const expected = computeMetaSignature(rawBody, appSecret);
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type SignatureCheck = { ok: boolean; reason?: string };

/**
 * Decide whether a Meta webhook POST may proceed.
 * - App Secret present → the signature MUST be valid.
 * - App Secret absent → allowed only outside production (dev/test); in
 *   production a missing secret must fail (never silently skip verification).
 */
export function checkMetaWebhook(opts: {
  rawBody: string;
  signatureHeader: string | null | undefined;
  appSecret: string | null | undefined;
  isProduction: boolean;
}): SignatureCheck {
  const { rawBody, signatureHeader, appSecret, isProduction } = opts;
  if (appSecret) {
    return verifyMetaSignature(rawBody, signatureHeader, appSecret)
      ? { ok: true }
      : { ok: false, reason: "Invalid signature" };
  }
  if (isProduction) {
    return { ok: false, reason: "App Secret not configured — signature verification is required in production" };
  }
  return { ok: true, reason: "dev: signature verification skipped (no App Secret)" };
}
