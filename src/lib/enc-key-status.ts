/**
 * Zero-dependency status of the CREDENTIALS_ENC_KEY environment secret.
 *
 * Intentionally imports NOTHING (no crypto, no Prisma, no app modules) so it is
 * safe to use from the Next.js instrumentation hook, which is compiled for a
 * constrained runtime. It only inspects the env var's presence/shape and never
 * returns, logs or embeds the key value.
 */
export const MIN_KEY_LEN = 16;

export type EncKeyReadiness = {
  /** Set and long enough to be usable (>= MIN_KEY_LEN chars). */
  configured: boolean;
  /** Something is set, even if too short (distinguishes "absent" from "weak"). */
  present: boolean;
  /** Using the recommended 64-char hex (32-byte) key rather than a derived passphrase. */
  usingRecommendedHexKey: boolean;
};

export function checkEncKeyReadiness(): EncKeyReadiness {
  const raw = process.env.CREDENTIALS_ENC_KEY;
  const present = typeof raw === "string" && raw.length > 0;
  return {
    configured: present && (raw as string).length >= MIN_KEY_LEN,
    present,
    usingRecommendedHexKey: typeof raw === "string" && /^[0-9a-fA-F]{64}$/.test(raw),
  };
}
