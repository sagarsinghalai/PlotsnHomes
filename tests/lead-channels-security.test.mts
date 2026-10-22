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
import nodeCrypto from "node:crypto";

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
const rd = await import("@/lib/readiness");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
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

// --- Phase 1.1 hardening regression tests ---

test("missing encryption key: encrypt throws, decrypt fails safe (no throw)", () => {
  const enc = crypto.encryptSecret(SECRET); // under KEY_A
  delete process.env.CREDENTIALS_ENC_KEY;
  try {
    assert.equal(crypto.hasEncKey(), false);
    assert.throws(() => crypto.assertEncKey(), /CREDENTIALS_ENC_KEY/);
    assert.throws(() => crypto.encryptSecret("x"), /CREDENTIALS_ENC_KEY/);
    assert.equal(crypto.decryptSecret(enc), ""); // fail-safe, config error logged
  } finally {
    process.env.CREDENTIALS_ENC_KEY = KEY_A; // restore for later tests
  }
});

test("decryption failure preserves stored ciphertext (merge does not blank)", () => {
  const current: any = JSON.parse(JSON.stringify(lc.DEFAULT_LEAD_CHANNELS));
  const corrupt = "enc:v1:" + Buffer.from("not-a-real-ciphertext").toString("base64");
  current.meta.appSecret = corrupt; // simulates an undecryptable stored value
  assert.equal(crypto.decryptSecret(corrupt), ""); // confirms it is undecryptable
  const merged: any = lc.mergeChannelUpdate(current, { meta: { enabled: true } } as any);
  assert.equal(merged.meta.appSecret, corrupt, "undecryptable ciphertext must be preserved, not blanked");
});

test("masked config contains no plaintext and no enc:v1: blobs", () => {
  const cfg: any = { ...lc.DEFAULT_LEAD_CHANNELS.meta, pageAccessToken: "PLAINTOKEN", appSecret: crypto.encryptSecret("ENCSECRET"), verifyToken: "PLAINVERIFY" };
  const json = JSON.stringify(lc.maskChannel("meta", cfg));
  assert.ok(!json.includes("enc:v1:"), "no ciphertext blobs in masked output");
  for (const v of ["PLAINTOKEN", "PLAINVERIFY", "ENCSECRET"]) assert.ok(!json.includes(v), `${v} must not leak`);
});

test("oversized webhook detection (content-length guard)", () => {
  assert.equal(meta.exceedsWebhookLimit(meta.MAX_WEBHOOK_BYTES + 1), true);
  assert.equal(meta.exceedsWebhookLimit(meta.MAX_WEBHOOK_BYTES), false);
  assert.equal(meta.exceedsWebhookLimit(0), false);
  assert.equal(meta.exceedsWebhookLimit(NaN), false); // missing/malformed header → backstop handles it
});

test("signature is bound to the exact raw body (tamper → reject)", () => {
  const raw = JSON.stringify({ entry: [{ id: "1", changes: [{ value: { leadgen_id: "L1" } }] }] });
  const sig = meta.computeMetaSignature(raw, "appsec");
  // Known-answer: HMAC-SHA256 hex is deterministic for (body, secret).
  const expected = "sha256=" + nodeCrypto.createHmac("sha256", "appsec").update(raw, "utf8").digest("hex");
  assert.equal(sig, expected);
  assert.equal(meta.verifyMetaSignature(raw, sig, "appsec"), true);
  assert.equal(meta.verifyMetaSignature(raw + " ", sig, "appsec"), false, "one extra byte must invalidate");
});

test("safeEqual is correct (equal true, differing/length-mismatch/empty false)", () => {
  assert.equal(meta.safeEqual("token-123", "token-123"), true);
  assert.equal(meta.safeEqual("token-123", "token-124"), false);
  assert.equal(meta.safeEqual("short", "a-much-longer-value"), false);
  assert.equal(meta.safeEqual("", ""), false);
  assert.equal(meta.safeEqual("x", null), false);
});

test("encryption is idempotent (migration re-run safe) and reversible", () => {
  const cfg: any = { ...lc.DEFAULT_LEAD_CHANNELS.meta, appSecret: "S1", verifyToken: "V1" };
  const once: any = lc.encryptChannelSecrets(cfg);
  const twice: any = lc.encryptChannelSecrets(once); // re-running must not double-encrypt
  assert.equal(twice.appSecret, once.appSecret, "second pass must be a no-op (already enc:v1:)");
  assert.equal(twice.verifyToken, once.verifyToken);
  const dec: any = lc.decryptChannelSecrets(twice);
  assert.equal(dec.appSecret, "S1");
  assert.equal(dec.verifyToken, "V1");
});

test("readiness: configured hex key reports ready, leaks nothing", async () => {
  process.env.CREDENTIALS_ENC_KEY = KEY_A; // 64-char hex
  const r = await rd.checkCredentialsReadiness({ includeStoredSecrets: true });
  assert.equal(r.ok, true);
  assert.equal(r.encKey.configured, true);
  assert.equal(r.encKey.present, true);
  assert.equal(r.encKey.usingRecommendedHexKey, true);
  assert.ok(Array.isArray(r.channelsWithEncryptedSecrets));
  assert.ok(!JSON.stringify(r).includes(KEY_A), "the key value must never appear in readiness output");
});

test("readiness: missing key reports not-ready with actionable message", async () => {
  delete process.env.CREDENTIALS_ENC_KEY;
  try {
    const r = await rd.checkCredentialsReadiness(); // env-only (no DB)
    assert.equal(r.ok, false);
    assert.equal(r.encKey.present, false);
    assert.equal(r.encKey.configured, false);
    assert.ok(r.messages.some((m) => m.includes("CREDENTIALS_ENC_KEY")), "must name the missing env var");
  } finally {
    process.env.CREDENTIALS_ENC_KEY = KEY_A;
  }
});

test("readiness: short key reports present-but-not-configured", () => {
  process.env.CREDENTIALS_ENC_KEY = "too-short";
  try {
    const r = rd.checkEncKeyReadiness();
    assert.equal(r.present, true);
    assert.equal(r.configured, false);
    assert.equal(r.usingRecommendedHexKey, false);
  } finally {
    process.env.CREDENTIALS_ENC_KEY = KEY_A;
  }
});

await runAll();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
