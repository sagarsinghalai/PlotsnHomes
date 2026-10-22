/**
 * Controlled rotation of CREDENTIALS_ENC_KEY for stored lead-channel secrets.
 *
 * Rotation is NOT just changing the env var: existing ciphertext is bound to the
 * old key and would become unreadable. This script re-encrypts every stored
 * secret from the OLD key to the NEW key, atomically and reversibly.
 *
 * Guarantees:
 *  - Decrypts each value with the OLD key; if ANY value fails to decrypt, the
 *    whole run ABORTS with no write (values stay on the old key — nothing lost).
 *  - Encrypts with the NEW key and VERIFIES each re-encrypted value decrypts back
 *    to the exact original before writing; any mismatch ABORTS with no write.
 *  - Writes the fully re-encrypted blob ONCE, after backing up the previous value
 *    to SystemSetting "lead_channels_prekeyrotate_<ts>".
 *  - Never prints secret values (only per-field counts and channel/field names).
 *  - Idempotent-safe: re-running with the same NEW key (as OLD) is a no-op write.
 *
 * Run (PowerShell):
 *   $env:CREDENTIALS_ENC_KEY_OLD="<old>"; $env:CREDENTIALS_ENC_KEY_NEW="<new>"; `
 *   node scripts/rotate-credentials-key.mjs
 *
 * After a successful run, set CREDENTIALS_ENC_KEY = the NEW key in the
 * environment and redeploy. Keep the backup key until the app is verified.
 *
 * Recovery: restore SystemSetting "lead_channels" from the printed backup key
 * and set CREDENTIALS_ENC_KEY back to the OLD key.
 *
 * A non-local (non-sqlite) target requires CONFIRM_MIGRATION=1.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {}

const PREFIX = "enc:v1:";
const SECRET_FIELDS = ["verifyToken", "pageAccessToken", "appSecret", "googleKey", "secret"];

function deriveKey(raw, label) {
  if (!raw || raw.length < 16) {
    console.error(`ERROR: ${label} is not set (or shorter than 16 chars). Aborting without changes.`);
    process.exit(1);
  }
  return /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : crypto.createHash("sha256").update(raw, "utf8").digest();
}
function isEnc(v) { return typeof v === "string" && v.startsWith(PREFIX); }
function encrypt(plain, key) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(String(plain), "utf8"), c.final()]);
  return PREFIX + Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64");
}
/** Returns { ok, plain }. Plaintext (non-prefixed) passes through as-is. */
function decrypt(value, key) {
  if (!value) return { ok: true, plain: "" };
  if (!isEnc(value)) return { ok: true, plain: value };
  try {
    const buf = Buffer.from(value.slice(PREFIX.length), "base64");
    if (buf.length < 29) throw new Error("too short");
    const d = crypto.createDecipheriv("aes-256-gcm", key, buf.subarray(0, 12));
    d.setAuthTag(buf.subarray(12, 28));
    return { ok: true, plain: Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8") };
  } catch {
    return { ok: false, plain: "" };
  }
}
function assertSafeTarget() {
  const url = process.env.DATABASE_URL || "";
  const isSqlite = /^file:/.test(url) || /\.db(\?|$)/.test(url);
  let label = "unknown";
  try {
    if (isSqlite) label = "sqlite " + url.replace(/^file:/, "");
    else { const u = new URL(url); label = `${u.protocol.replace(":", "")} ${u.host}${u.pathname}`; }
  } catch { label = isSqlite ? "sqlite (local file)" : "non-sqlite"; }
  console.log(`Target database: ${label}`);
  if (!isSqlite && process.env.CONFIRM_MIGRATION !== "1") {
    console.error("Refusing to modify a non-local (non-sqlite) database without CONFIRM_MIGRATION=1. Aborting; no changes made.");
    process.exit(1);
  }
}

const prisma = new PrismaClient();

async function main() {
  assertSafeTarget();
  const oldKey = deriveKey(process.env.CREDENTIALS_ENC_KEY_OLD, "CREDENTIALS_ENC_KEY_OLD");
  const newKey = deriveKey(process.env.CREDENTIALS_ENC_KEY_NEW, "CREDENTIALS_ENC_KEY_NEW");

  const row = await prisma.systemSetting.findUnique({ where: { key: "lead_channels" } });
  if (!row?.value) { console.log("No lead_channels setting — nothing to rotate."); return; }

  let cfg;
  try { cfg = JSON.parse(row.value); } catch { console.error("ERROR: lead_channels is not valid JSON. Aborting."); process.exit(1); }

  // Pass 1: decrypt everything with the OLD key. Abort if anything fails.
  const plains = {}; // channel -> field -> plaintext
  let total = 0;
  for (const channel of Object.keys(cfg)) {
    const ch = cfg[channel];
    if (!ch || typeof ch !== "object") continue;
    for (const f of SECRET_FIELDS) {
      const v = ch[f];
      if (typeof v !== "string" || !v) continue;
      const d = decrypt(v, oldKey);
      if (!d.ok) {
        console.error(`ERROR: "${channel}.${f}" could not be decrypted with the OLD key. Aborting; NO changes written. (Fix the old key or the value, then retry.)`);
        process.exit(1);
      }
      (plains[channel] ||= {})[f] = d.plain;
      total++;
    }
  }
  if (!total) { console.log("No stored secrets to rotate."); return; }

  // Pass 2: re-encrypt with the NEW key and verify each re-decrypts to the original.
  const next = JSON.parse(JSON.stringify(cfg));
  for (const channel of Object.keys(plains)) {
    for (const f of Object.keys(plains[channel])) {
      const plain = plains[channel][f];
      const enc = encrypt(plain, newKey);
      const check = decrypt(enc, newKey);
      if (!check.ok || check.plain !== plain) {
        console.error(`ERROR: verification failed for "${channel}.${f}" under the NEW key. Aborting; NO changes written.`);
        process.exit(1);
      }
      next[channel][f] = enc;
    }
  }

  // Backup, then write once.
  const backupKey = `lead_channels_prekeyrotate_${Date.now()}`;
  await prisma.systemSetting.create({ data: { key: backupKey, value: row.value } });
  await prisma.systemSetting.update({ where: { key: "lead_channels" }, data: { value: JSON.stringify(next) } });
  console.log(`Backup: SystemSetting "${backupKey}".`);
  console.log(`Rotated ${total} secret field(s) to the new key.`);
  console.log("Next: set CREDENTIALS_ENC_KEY = the NEW key in the environment, redeploy, verify, then delete the backup key.");
}

main().catch((e) => { console.error("Rotation failed:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
