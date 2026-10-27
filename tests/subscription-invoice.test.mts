/**
 * Subscription invoices — generated on signup and on renew/grant, and scoped
 * per organization. Runner: `npx tsx tests/subscription-invoice.test.mts`
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch { /* ignore */ }

const { prisma } = await import("@/lib/prisma");
const { provisionTenantSignup } = await import("@/lib/signup");
const { applyTenantGrant } = await import("@/lib/subscription-grant");
const { subscriptionInvoiceNumber, providerFromRef, getSubscriptionInvoices } = await import("@/lib/subscription-invoice");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

const tag = `si_${Date.now()}`;
let planId = "", orgId = "";

async function setup() {
  const plan = await prisma.subscriptionPlan.create({
    data: { name: `${tag} Plan`, slug: `${tag}-plan`, interval: "CUSTOM", durationMinutes: 5, price: 49, currency: "usd", active: true },
  });
  planId = plan.id;
}
async function cleanup() {
  if (orgId) await prisma.subscriptionInvoice.deleteMany({ where: { organizationId: orgId } }).catch(() => {});
  await prisma.userSubscription.deleteMany({ where: { planId } }).catch(() => {});
  if (orgId) await prisma.user.deleteMany({ where: { tenantId: orgId } }).catch(() => {});
  if (orgId) await prisma.organization.deleteMany({ where: { id: orgId } }).catch(() => {});
  await prisma.subscriptionPlan.deleteMany({ where: { id: planId } }).catch(() => {});
}

test("invoice number is zero-padded with a year prefix", () => {
  assert.match(subscriptionInvoiceNumber(7), /^SUB-INV-\d{4}-00007$/);
});

test("providerFromRef maps payment refs to providers", () => {
  assert.equal(providerFromRef("rzp:pay_1"), "razorpay");
  assert.equal(providerFromRef("stripe:pi_1"), "stripe");
  assert.equal(providerFromRef("test-mode"), "test");
  assert.equal(providerFromRef(null), "test");
  assert.equal(providerFromRef("something"), "manual");
});

test("signup generates a subscription invoice for the tenant", async () => {
  const res = await provisionTenantSignup({
    planSlug: `${tag}-plan`,
    name: "Agency Owner",
    email: `${tag}@x.test`,
    password: "supersecret123",
    companyName: `${tag} Realty`,
  });
  assert.ok(res.ok, "provisioning succeeds");
  if (!res.ok) return;
  orgId = res.orgId;

  const invoices = await getSubscriptionInvoices(orgId);
  assert.equal(invoices.length, 1, "one invoice after signup");
  const inv = invoices[0];
  assert.equal(inv.kind, "signup");
  assert.equal(inv.status, "TEST", "no real payment ref → TEST status");
  assert.equal(inv.amount, 49);
  assert.equal(inv.planName, `${tag} Plan`);
  assert.equal(inv.organizationId, orgId);
  assert.match(inv.invoiceNumber, /^SUB-INV-/);
});

test("renew generates a second (renewal) invoice", async () => {
  const r = await applyTenantGrant(orgId, { mode: "renew" });
  assert.ok(r.ok, "renew succeeds");
  const invoices = await getSubscriptionInvoices(orgId);
  assert.equal(invoices.length, 2, "two invoices after a renewal");
  const renewal = invoices.find((i) => i.kind === "renewal");
  assert.ok(renewal, "a renewal invoice exists");
  assert.equal(renewal?.status, "COMPLIMENTARY", "owner renewal is complimentary (no in-app charge)");
  assert.equal(renewal?.provider, "manual");
});

test("getSubscriptionInvoices is scoped to one organization", async () => {
  const other = await getSubscriptionInvoices(`nonexistent_${tag}`);
  assert.equal(other.length, 0, "a different org sees none of this tenant's invoices");
});

try {
  await setup();
  await runAll();
} finally {
  await cleanup();
  await prisma.$disconnect();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
