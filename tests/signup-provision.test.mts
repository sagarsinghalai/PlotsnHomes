/**
 * Stage C — self-serve signup provisioning.
 * Runner: `npx tsx tests/signup-provision.test.mts`
 *
 * A signup against a plan creates the tenant (ACTIVE, with plan + expiry), its
 * White Label Admin (role + tenant), and an org-linked active subscription; a
 * CUSTOM minute plan sets a minute-level expiry; a duplicate email is rejected.
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

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

const tag = `su_${Date.now()}`;
const email = `${tag}@x.test`;
let planId = "", orgId = "", adminId = "";

async function setup() {
  const plan = await prisma.subscriptionPlan.create({
    data: { name: `${tag} Plan`, slug: `${tag}-plan`, interval: "CUSTOM", durationMinutes: 2, price: 49, currency: "usd", active: true },
  });
  planId = plan.id;
}
async function cleanup() {
  await prisma.userSubscription.deleteMany({ where: { planId } }).catch(() => {});
  if (orgId) await prisma.user.deleteMany({ where: { tenantId: orgId } }).catch(() => {});
  if (orgId) await prisma.organization.deleteMany({ where: { id: orgId } }).catch(() => {});
  await prisma.subscriptionPlan.deleteMany({ where: { id: planId } }).catch(() => {});
}

test("signup provisions tenant + WL admin + org-linked subscription with minute expiry", async () => {
  const before = Date.now();
  const res = await provisionTenantSignup({
    planSlug: `${tag}-plan`,
    name: "Agency Owner",
    email,
    password: "supersecret123",
    companyName: `${tag} Realty`,
    domain: `${tag}-realty.test`,
  });
  assert.ok(res.ok, "provisioning succeeds");
  if (!res.ok) return;
  orgId = res.orgId; adminId = res.adminId;

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  assert.equal(org?.status, "ACTIVE", "tenant is active");
  assert.equal(org?.planId, planId, "tenant records its plan");
  assert.equal(org?.whiteLabelAdminId, adminId, "tenant admin is linked");
  assert.ok(org?.subscriptionEndsAt, "has an expiry");
  const endMs = org!.subscriptionEndsAt!.getTime();
  assert.ok(endMs > before && endMs - before <= 3 * 60 * 1000, "expiry ~2 minutes out");

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  assert.equal(admin?.role, "WHITE_LABEL_ADMIN");
  assert.equal(admin?.tenantId, orgId, "admin belongs to the new tenant");

  const sub = await prisma.userSubscription.findFirst({ where: { organizationId: orgId } });
  assert.ok(sub, "subscription created");
  assert.equal(sub?.status, "ACTIVE");
  assert.equal(sub?.planId, planId);
});

test("duplicate email is rejected", async () => {
  const res = await provisionTenantSignup({
    planSlug: `${tag}-plan`,
    name: "Dup",
    email,
    password: "supersecret123",
    companyName: `${tag} Dup`,
  });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.status, 409);
});

test("unknown plan is rejected", async () => {
  const res = await provisionTenantSignup({
    planSlug: "does-not-exist",
    name: "X",
    email: `${tag}-2@x.test`,
    password: "supersecret123",
    companyName: "X Co",
  });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.status, 404);
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
