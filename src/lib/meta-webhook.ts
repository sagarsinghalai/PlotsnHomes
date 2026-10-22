import crypto from "crypto";

/** Max accepted webhook body (abuse / DoS guard). */
export const MAX_WEBHOOK_BYTES = 1_000_000; // 1 MB

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
