/**
 * Signup payment gateway — gateway selection + verification.
 * Runner: `npx tsx tests/signup-payment.test.mts`
 *
 * With no keys the flow is test mode (verification passes so provisioning runs).
 * With Razorpay keys configured it requires a valid HMAC-signed proof — so a paid
 * tenant can never be provisioned without a verified payment.
 */
import crypto from "node:crypto";
import assert from "node:assert/strict";

// Import prisma FIRST — it loads .env on construction; clear ambient keys AFTER
// so the env-fallback path is deterministic. Also drop any stored global config.
const { prisma } = await import("@/lib/prisma");
await prisma.systemSetting.deleteMany({ where: { key: "payment_gateways" } });
for (const k of ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "NEXT_PUBLIC_RAZORPAY_KEY_ID", "STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"]) {
  delete process.env[k];
}

const { activeSignupGateway, verifySignupPayment } = await import("@/lib/signup-payment");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

test("no gateway configured → test mode, verification passes", async () => {
  assert.equal(await activeSignupGateway(), "test");
  const v = await verifySignupPayment({});
  assert.equal(v.ok, true);
  assert.equal(v.ref, "test-mode");
});

test("Razorpay configured → requires a valid signed proof", async () => {
  process.env.RAZORPAY_KEY_ID = "rzp_test_abcdefghij";
  process.env.RAZORPAY_KEY_SECRET = "secret_abcdefghij";
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = "rzp_test_abcdefghij";
  try {
    assert.equal(await activeSignupGateway(), "razorpay", "razorpay becomes the active gateway");

    const missing = await verifySignupPayment({});
    assert.equal(missing.ok, false, "no proof is rejected (no free provisioning)");

    const sig = crypto.createHmac("sha256", "secret_abcdefghij").update("order_1|pay_1").digest("hex");
    const good = await verifySignupPayment({ razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: sig });
    assert.equal(good.ok, true, "a correctly-signed proof verifies");
    assert.equal(good.ref, "rzp:pay_1");

    const forged = await verifySignupPayment({ razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: "deadbeef" });
    assert.equal(forged.ok, false, "a forged signature is rejected");
  } finally {
    delete process.env.RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  }
});

await runAll();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
