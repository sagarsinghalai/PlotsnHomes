import { getLeadChannels, SECRET_FIELDS } from "@/lib/lead-channels";
import { checkEncKeyReadiness, type EncKeyReadiness } from "@/lib/enc-key-status";

/**
 * Deployment readiness checks for credential encryption.
 *
 * IMPORTANT: nothing here ever returns, logs or embeds the encryption key or any
 * stored credential — only booleans, counts and generic, actionable messages.
 * Safe to expose to an admin reader and to print in server logs.
 */

// Re-exported so callers (and tests) have a single import surface for readiness.
export { checkEncKeyReadiness, type EncKeyReadiness };

export type CredentialsReadiness = {
  ok: boolean;
  encKey: EncKeyReadiness;
  /**
   * Channels that have at least one encrypted secret stored. Present only when
   * the DB was inspected. If the key is missing while this is non-empty, those
   * integrations are BROKEN (ciphertext cannot be read).
   */
  channelsWithEncryptedSecrets?: string[];
  /** Human-readable, secret-free messages describing any problem. */
  messages: string[];
};

/**
 * Full readiness. `includeStoredSecrets` additionally inspects the stored
 * lead-channel config (raw, still-encrypted — never decrypted here) to report
 * which channels would be unreadable if the key is misconfigured.
 */
export async function checkCredentialsReadiness(opts?: { includeStoredSecrets?: boolean }): Promise<CredentialsReadiness> {
  const encKey = checkEncKeyReadiness();
  const messages: string[] = [];

  if (!encKey.present) {
    messages.push("CREDENTIALS_ENC_KEY is not set. Stored integration credentials cannot be encrypted or decrypted. Set it (openssl rand -hex 32) before storing or using integration secrets.");
  } else if (!encKey.configured) {
    messages.push("CREDENTIALS_ENC_KEY is set but too short (minimum 16 characters). Use a 32-byte hex key: openssl rand -hex 32.");
  } else if (!encKey.usingRecommendedHexKey) {
    messages.push("CREDENTIALS_ENC_KEY is usable but not a 64-char hex key; a 32-byte hex key (openssl rand -hex 32) is recommended.");
  }

  let channelsWithEncryptedSecrets: string[] | undefined;
  if (opts?.includeStoredSecrets) {
    try {
      const all = await getLeadChannels(); // raw config — secrets stay encrypted
      channelsWithEncryptedSecrets = Object.entries(all)
        .filter(([, cfg]) => SECRET_FIELDS.some((f) => {
          const v = (cfg as unknown as Record<string, unknown>)[f];
          return typeof v === "string" && v.startsWith("enc:v1:");
        }))
        .map(([key]) => key);
      if (!encKey.configured && channelsWithEncryptedSecrets.length > 0) {
        messages.push(`${channelsWithEncryptedSecrets.length} channel(s) have encrypted credentials that are currently unreadable: ${channelsWithEncryptedSecrets.join(", ")}.`);
      }
    } catch {
      messages.push("Could not read stored lead-channel settings to assess impact (database unavailable).");
    }
  }

  // Not ready if the key is unusable, or if it is usable-but-weak only as a warning.
  const ok = encKey.configured;
  return { ok, encKey, channelsWithEncryptedSecrets, messages };
}
