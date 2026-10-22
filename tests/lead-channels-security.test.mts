/**
 * Security tests for the Meta/lead-channel hardening (Phase 1).
 * Runner: `npm test` (uses tsx — no extra test framework needed).
 *
 * Covers: AES-256-GCM round-trip, wrong-key / corrupted ciphertext fail-safe,
 * credential masking (no secrets leak), secret preservation on update, secret
 * replacement, Meta webhook signature verification, and production fail-safe
 * when the App Secret is missing.
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

// Load .env (DATABASE_URL for the Prisma import chain) before importing app code.
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch { /* ignore */ }

// Deterministic key for the crypto tests.
const KEY_A = "a".repeat(64);
const KEY_B = "b".repeat(64);
process.env.CREDENTIALS_ENC_KEY = KEY_A;

const crypto = await import("@/lib/credentials-crypto");
const meta = await import("@/lib/meta-webhook");
const lc = await import("@/lib/lead-channels");

let pass = 0, fail = 0;
function test(name: string, fn: () => void) {
  try { fn(); pass++; console.log("  ✓", name); }
  catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
}

const SECRET = "EAAG-super-secret-token-123";

test("encrypt/decrypt round-trip", () => {
  const enc = crypto.encryptSecret(SECRET);
  assert.ok(crypto.isEncrypted(enc), "should be prefixed/encrypted");
  assert.notEqual(enc, SECRET, "ciphertext must differ from plaintext");
  assert.equal(crypto.decryptSecret(enc), SECRET, "decrypt should recover plaintext");
});

test("empty input yields empty output", () => {
  assert.equal(crypto.encryptSecret(""), "");
  assert.equal(crypto.decryptSecret(""), "");
});

test("plaintext (pre-migration) passes through decrypt", () => {
  assert.equal(crypto.isEncrypted("plain-value"), false);
  assert.equal(crypto.decryptSecret("plain-value"), "plain-value");
});

test("wrong key fails safe (returns empty, no throw)", () => {
  const enc = crypto.encryptSecret(SECRET);
  process.env.CREDENTIALS_ENC_KEY = KEY_B;
  const out = crypto.decryptSecret(enc);
  process.env.CREDENTIALS_ENC_KEY = KEY_A;
  assert.equal(out, "", "wrong key must not reveal the secret");
});

test("corrupted ciphertext fails safe", () => {
  assert.equal(crypto.decryptSecret("enc:v1:###not-base64###"), "");
  assert.equal(crypto.decryptSecret("enc:v1:" + Buffer.from("short").toString("base64")), "");
});

test("maskChannel strips all secret values but keeps flags", () => {
  const cfg: any = { ...lc.DEFAULT_LEAD_CHANNELS.meta, enabled: true, pageAccessToken: "PAGE", appSecret: "APPSEC", verifyToken: "VTOK" };
  const masked: any = lc.maskChannel("meta", cfg);
  for (const f of lc.SECRET_FIELDS) assert.equal(masked[f], "", `${f} must be blanked`);
  assert.equal(masked._secrets.hasPageAccessToken, true);
  assert.equal(masked._secrets.hasAppSecret, true);
  assert.equal(masked.isConfigured, true);
  const json = JSON.stringify(masked);
  for (const v of ["PAGE", "APPSEC", "VTOK"]) assert.ok(!json.includes(v), `${v} must not appear in masked output`);
});

test("mergeChannelUpdate preserves omitted/blank secrets", () => {
  const current: any = JSON.parse(JSON.stringify(lc.DEFAULT_LEAD_CHANNELS));
  current.meta.appSecret = crypto.encryptSecret("ORIGINAL");
  current.meta.pageAccessToken = crypto.encryptSecret("ORIG-PAGE");
  // body omits appSecret, blanks pageAccessToken, changes a non-secret field
  const body: any = { meta: { enabled: true, label: "FB", pageAccessToken: "", verifyToken: "" } };
  const merged: any = lc.mergeChannelUpdate(current, body);
  assert.equal(merged.meta.appSecret, current.meta.appSecret, "omitted secret preserved");
  assert.equal(merged.meta.pageAccessToken, current.meta.pageAccessToken, "blank secret preserved");
  assert.equal(merged.meta.enabled, true, "non-secret field updated");
});

test("mergeChannelUpdate replaces a provided secret", () => {
  const current: any = JSON.parse(JSON.stringify(lc.DEFAULT_LEAD_CHANNELS));
  current.meta.appSecret = crypto.encryptSecret("ORIGINAL");
  const body: any = { meta: { appSecret: "NEWSECRET" } };
  const merged: any = lc.mergeChannelUpdate(current, body);
  assert.equal(merged.meta.appSecret, "NEWSECRET", "new secret value taken (will be encrypted on save)");
});

test("channel secret encrypt → decrypt round-trip (other channels still work)", () => {
  const cfg: any = { ...lc.DEFAULT_LEAD_CHANNELS.generic, secret: "portal-key" };
  const encd: any = lc.encryptChannelSecrets(cfg);
  assert.ok(crypto.isEncrypted(encd.secret));
  const decd: any = lc.decryptChannelSecrets(encd);
  assert.equal(decd.secret, "portal-key");
});

test("Meta signature verify: valid true, invalid false", () => {
  const raw = JSON.stringify({ entry: [] });
  const sig = meta.computeMetaSignature(raw, "appsec");
  assert.equal(meta.verifyMetaSignature(raw, sig, "appsec"), true);
  assert.equal(meta.verifyMetaSignature(raw, "sha256=deadbeef", "appsec"), false);
  assert.equal(meta.verifyMetaSignature(raw, sig, "wrong-secret"), false);
  assert.equal(meta.verifyMetaSignature(raw, null, "appsec"), false);
});

test("checkMetaWebhook: prod fails safe without App Secret; dev allows", () => {
  const raw = "{}";
  assert.equal(meta.checkMetaWebhook({ rawBody: raw, signatureHeader: null, appSecret: "", isProduction: true }).ok, false);
  assert.equal(meta.checkMetaWebhook({ rawBody: raw, signatureHeader: null, appSecret: "", isProduction: false }).ok, true);
  const sig = meta.computeMetaSignature(raw, "s");
  assert.equal(meta.checkMetaWebhook({ rawBody: raw, signatureHeader: sig, appSecret: "s", isProduction: true }).ok, true);
  assert.equal(meta.checkMetaWebhook({ rawBody: raw, signatureHeader: "sha256=x", appSecret: "s", isProduction: true }).ok, false);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
