/**
 * One-time migration: encrypt any PLAINTEXT credentials stored in the
 * `lead_channels` SystemSetting (Meta Page Access Token / App Secret / Verify
 * Token, Google key, portal secrets) using AES-256-GCM.
 *
 * Safe by design:
 *  - Creates a backup copy (`lead_channels_backup_<timestamp>`) before writing.
 *  - Skips values already encrypted (idempotent — safe to re-run).
 *  - Never blanks a secret and never discards unreadable values.
 *  - Never prints secret values (only per-field counts).
 *
 * Run:  node scripts/encrypt-lead-channel-secrets.mjs
 * Requires env: DATABASE_URL, CREDENTIALS_ENC_KEY  (loaded from .env if present)
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// --- load .env (for CREDENTIALS_ENC_KEY; Prisma loads DATABASE_URL itself) ---
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

function getKey() {
  const raw = process.env.CREDENTIALS_ENC_KEY;
  if (!raw || raw.length < 16) {
    console.error("ERROR: CREDENTIALS_ENC_KEY is not set (or too short). Aborting without changes.");
    process.exit(1);
  }
  return /^[0-9a-fA-F]{64}$/.test(raw) ? Buffer.from(raw, "hex") : crypto.createHash("sha256").update(raw, "utf8").digest();
}
function encrypt(plain, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, ct]).toString("base64");
}

const prisma = new PrismaClient();

async function main() {
  const key = getKey();
  const row = await prisma.systemSetting.findUnique({ where: { key: "lead_channels" } });
  if (!row?.value) {
    console.log("No lead_channels setting found — nothing to migrate.");
    return;
  }

  // Backup first (value copied verbatim; not printed).
  const backupKey = `lead_channels_backup_${Date.now()}`;
  await prisma.systemSetting.create({ data: { key: backupKey, value: row.value } });
  console.log(`Backup created: SystemSetting "${backupKey}".`);

  let cfg;
  try { cfg = JSON.parse(row.value); } catch {
    console.error("ERROR: lead_channels value is not valid JSON. Left unchanged (backup kept).");
    process.exit(1);
  }

  const summary = {};
  for (const channel of Object.keys(cfg)) {
    const ch = cfg[channel];
    if (!ch || typeof ch !== "object") continue;
    let n = 0;
    for (const f of SECRET_FIELDS) {
      const v = ch[f];
      if (typeof v === "string" && v && !v.startsWith(PREFIX)) { ch[f] = encrypt(v, key); n++; }
    }
    if (n) summary[channel] = n;
  }

  await prisma.systemSetting.update({ where: { key: "lead_channels" }, data: { value: JSON.stringify(cfg) } });
  const total = Object.values(summary).reduce((a, b) => a + b, 0);
  console.log(total ? `Encrypted ${total} plaintext secret field(s): ${JSON.stringify(summary)}` : "No plaintext secrets found (already encrypted).");
  console.log("Done. Verify the integration still works, then you may delete the backup key.");
}

main().catch((e) => { console.error("Migration failed:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
