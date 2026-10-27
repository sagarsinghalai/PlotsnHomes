/**
 * Per-tenant payment gateway config — encryption at rest, masking, secret-
 * preserving merge, and gateway resolution precedence (tenant → env → test).
 * Runner: `npx tsx tests/payment-settings.test.mts`
 */
import assert from "node:assert/strict";

// Import prisma FIRST — it loads .env on construction; we clear the ambient
// gateway keys AFTER that so env-fallback behaviour is deterministic.
const { prisma } = await import("@/lib/prisma");
process.env.CREDENTIALS_ENC_KEY = "0".repeat(64);
for (const k of ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "NEXT_PUBLIC_RAZORPAY_KEY_ID", "STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"]) {
  delete process.env[k];
}

const { isEncrypted } = await import("@/lib/credentials-crypto");
const {
  DEFAULT_PAYMENT_CONFIG,
  encryptPaymentConfig,
  decryptPaymentConfig,
  mergePaymentConfigUpdate,
  savePaymentConfig,
  getMaskedPaymentConfig,
  getResolvedGateway,
} = await import("@/lib/payment-settings");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)); }

test("encrypt → decrypt round-trips secrets; ciphertext is not plaintext", () => {
  const cfg = clone(DEFAULT_PAYMENT_CONFIG);
  cfg.razorpay = { enabled: true, keyId: "rzp_test_123", keySecret: "rzp_secret_xyz", webhookSecret: "whk_rzp" };
  cfg.stripe = { enabled: true, publishableKey: "pk_test_123", secretKey: "sk_test_secret", webhookSecret: "whsec_1" };
  const enc = encryptPaymentConfig(cfg);
  assert.ok(isEncrypted(enc.razorpay.keySecret), "keySecret encrypted");
  assert.ok(isEncrypted(enc.stripe.secretKey), "secretKey encrypted");
  assert.notEqual(enc.razorpay.keySecret, "rzp_secret_xyz");
  // Public fields are never encrypted.
  assert.equal(enc.razorpay.keyId, "rzp_test_123");
  assert.equal(enc.stripe.publishableKey, "pk_test_123");
  const dec = decryptPaymentConfig(enc);
  assert.equal(dec.razorpay.keySecret, "rzp_secret_xyz");
  assert.equal(dec.stripe.secretKey, "sk_test_secret");
  assert.equal(dec.stripe.webhookSecret, "whsec_1");
});

test("merge preserves existing secret when incoming is blank, replaces when provided", () => {
  const current = decryptPaymentConfig(decryptPaymentConfig(clone(DEFAULT_PAYMENT_CONFIG)));
  current.razorpay = { enabled: true, keyId: "rzp_a", keySecret: "old_secret", webhookSecret: "old_whk" };
  // Blank secret → keep old; new keyId → take it; enable stripe with a new secret.
  const merged = mergePaymentConfigUpdate(current, {
    razorpay: { keyId: "rzp_b", keySecret: "" },
    stripe: { enabled: true, publishableKey: "pk_new", secretKey: "sk_new" },
    preferred: "stripe",
    currency: "usd",
  });
  assert.equal(merged.razorpay.keyId, "rzp_b", "non-secret overwritten");
  assert.equal(merged.razorpay.keySecret, "old_secret", "blank secret preserved");
  assert.equal(merged.stripe.secretKey, "sk_new", "new secret taken");
  assert.equal(merged.stripe.enabled, true);
  assert.equal(merged.preferred, "stripe");
  assert.equal(merged.currency, "USD", "currency upper-cased");
});

test("masked config never exposes secret values", async () => {
  const tenantId = `test-pay-${Date.now()}`;
  try {
    const cfg = clone(DEFAULT_PAYMENT_CONFIG);
    cfg.razorpay = { enabled: true, keyId: "rzp_live_x", keySecret: "topsecret", webhookSecret: "whk" };
    await savePaymentConfig(cfg, tenantId);
    const masked = await getMaskedPaymentConfig(tenantId);
    assert.equal(masked.razorpay.keyId, "rzp_live_x");
    assert.equal(masked.razorpay.hasKeySecret, true);
    assert.equal((masked as any).razorpay.keySecret, undefined, "no secret field in masked output");
    const json = JSON.stringify(masked);
    assert.ok(!json.includes("topsecret"), "secret value never serialized to the client");
  } finally {
    await prisma.tenantSetting.deleteMany({ where: { tenantId } });
  }
});

test("resolution precedence: tenant config → env → test", async () => {
  const tenantId = `test-pay-res-${Date.now()}`;
  try {
    // No config, no env → test mode.
    assert.equal((await getResolvedGateway(tenantId)).provider, "test");

    // Env only (platform fallback) → env razorpay.
    process.env.RAZORPAY_KEY_ID = "rzp_test_envkeyid";
    process.env.RAZORPAY_KEY_SECRET = "env_secret_longenough";
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_envkeyid";
    let r = await getResolvedGateway(tenantId);
    assert.equal(r.provider, "razorpay");
    assert.equal((r as any).source, "env");

    // Tenant's own Stripe config wins over env razorpay.
    const cfg = clone(DEFAULT_PAYMENT_CONFIG);
    cfg.stripe = { enabled: true, publishableKey: "pk_test_tenant", secretKey: "sk_test_tenant", webhookSecret: "" };
    cfg.preferred = "stripe";
    await savePaymentConfig(cfg, tenantId);
    r = await getResolvedGateway(tenantId);
    assert.equal(r.provider, "stripe");
    assert.equal((r as any).source, "tenant");
    assert.equal((r as any).secretKey, "sk_test_tenant", "resolved secret is decrypted");
  } finally {
    for (const k of ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "NEXT_PUBLIC_RAZORPAY_KEY_ID"]) delete process.env[k];
    await prisma.tenantSetting.deleteMany({ where: { tenantId } });
  }
});

await runAll();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
