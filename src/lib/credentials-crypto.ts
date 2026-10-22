import crypto from "crypto";

/**
 * Authenticated encryption (AES-256-GCM) for credentials stored at rest.
 *
 * Format: `enc:v1:<base64(iv[12] || authTag[16] || ciphertext)>`.
 * The key comes from the `CREDENTIALS_ENC_KEY` env secret (never hardcoded):
 * a 64-char hex string is used directly as 32 bytes, otherwise any sufficiently
 * long passphrase is derived to 32 bytes via SHA-256.
 *
 * Decryption restricted to server-side callers. Plaintext (pre-migration)
 * values are returned as-is so the integration keeps working during the
 * transition; corrupted ciphertext or a wrong key fails safe (returns "")
 * without ever throwing or logging the secret.
 */
const PREFIX = "enc:v1:";
const MIN_KEY_LEN = 16;

export function hasEncKey(): boolean {
  const k = process.env.CREDENTIALS_ENC_KEY;
  return typeof k === "string" && k.length >= MIN_KEY_LEN;
}

/** Throws a clear (secret-free) error when the key is missing/too weak. */
export function assertEncKey(): void {
  if (!hasEncKey()) {
    throw new Error(
      "CREDENTIALS_ENC_KEY is not set (or is shorter than 16 chars). Set a strong secret in the environment before storing credentials."
    );
  }
}

function getKey(): Buffer {
  assertEncKey();
  const raw = process.env.CREDENTIALS_ENC_KEY as string;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return crypto.createHash("sha256").update(raw, "utf8").digest();
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/** Encrypt a plaintext secret. Empty input → "" (nothing to protect). */
export function encryptSecret(plain: string | null | undefined): string {
  if (!plain) return "";
  if (isEncrypted(plain)) return plain; // already encrypted — idempotent
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

/** Decrypt a stored secret (server-side only). Plaintext passes through. */
export function decryptSecret(value: string | null | undefined): string {
  if (!value) return "";
  if (!isEncrypted(value)) return value; // pre-migration plaintext — still usable
  try {
    const key = getKey();
    const buf = Buffer.from(value.slice(PREFIX.length), "base64");
    if (buf.length < 29) throw new Error("ciphertext too short");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
  } catch {
    // Fail safe: never throw, never leak the secret, never touch stored data.
    // Distinguish a deployment/config fault (missing key) from a per-value
    // fault so operators get an actionable signal. The stored ciphertext is
    // left intact — callers get "" and must not persist that back.
    if (!hasEncKey()) {
      console.error("[credentials-crypto] CONFIG ERROR: CREDENTIALS_ENC_KEY is missing or too short — stored credentials cannot be decrypted. Set the key in the environment. (ciphertext preserved; no secret logged)");
    } else {
      console.warn("[credentials-crypto] could not decrypt a stored secret (wrong CREDENTIALS_ENC_KEY or corrupted value). Ciphertext preserved; no secret logged.");
    }
    return "";
  }
}

/** Masked indicator for UI — never the real value. */
export function maskSecret(value: string | null | undefined): string {
  return value ? "••••••••" : "";
}
