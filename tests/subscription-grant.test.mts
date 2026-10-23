/**
 * Renewal + manual grant/extend.
 * Runner: `npx tsx tests/subscription-grant.test.mts`
 *
 * Renewing from the plan and granting minutes both reactivate a lapsed tenant
 * and reset its expiry; "extend" stacks onto a still-active term; a tenant with
 * no plan cannot be renewed.
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
const { applyTenantGrant } = await import("@/lib/subscription-grant");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

const tag = `grant_${Date.now()}`;
let planId = "", orgId = "", noPlanOrgId = "", userId = "", subId = "";

async function setup() {
  const plan = await prisma.subscriptionPlan.create({
    data: { name: `${tag} Plan`, slug: `${tag}-plan`, interval: "CUSTOM", durationMinutes: 10, price: 10, currency: "usd", active: true },
  });
  planId = plan.id;
  const org = await prisma.organization.create({
    data: { name: `${tag}_Org`, code: `${tag}`, status: "PAST_DUE", planId, subscriptionEndsAt: new Date(Date.now() - 60 * 1000) },
  });
  orgId = org.id;
  const user = await prisma.user.create({
    data: { email: `${tag}@x.test`, name: "Owner", passwordHash: "x", role: "WHITE_LABEL_ADMIN", tenantId: orgId },
  });
  userId = user.id;
  const sub = await prisma.userSubscription.create({
    data: { userId, organizationId: orgId, planId, amount: 10, currency: "usd", status: "PAST_DUE", currentPeriodEnd: new Date(Date.now() - 60 * 1000) },
  });
  subId = sub.id;
  const np = await prisma.organization.create({ data: { name: `${tag}_NoPlan`, code: `${tag}np`, status: "ACTIVE" } });
  noPlanOrgId = np.id;
}
async function cleanup() {
  await prisma.userSubscription.deleteMany({ where: { planId } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
  await prisma.organization.deleteMany({ where: { id: { in: [orgId, noPlanOrgId].filter(Boolean) } } }).catch(() => {});
  await prisma.subscriptionPlan.deleteMany({ where: { id: planId } }).catch(() => {});
}

test("renew reactivates a lapsed tenant with a fresh plan term (~10 min)", async () => {
  const before = Date.now();
  const res = await applyTenantGrant(orgId, { mode: "renew" });
  assert.ok(res.ok, "renew succeeds");
  if (!res.ok) return;
  const end = res.endsAt!.getTime();
  assert.ok(end - before >= 9 * 60 * 1000 && end - before <= 11 * 60 * 1000, "~10 minutes out");
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { status: true, subscriptionEndsAt: true } });
  assert.equal(org?.status, "ACTIVE", "tenant reactivated");
  const sub = await prisma.userSubscription.findUnique({ where: { id: subId }, select: { status: true } });
  assert.equal(sub?.status, "ACTIVE", "subscription reactivated");
});

test("grant from now replaces the term when not extending", async () => {
  const before = Date.now();
  const res = await applyTenantGrant(orgId, { mode: "grant", minutes: 5 });
  assert.ok(res.ok);
  if (!res.ok) return;
  const end = res.endsAt!.getTime();
  assert.ok(end - before >= 4 * 60 * 1000 && end - before <= 6 * 60 * 1000, "~5 minutes from now");
});

test("grant with extend stacks onto a still-active term", async () => {
  const future = new Date(Date.now() + 60 * 60 * 1000); // 1h out
  await prisma.organization.update({ where: { id: orgId }, data: { status: "ACTIVE", subscriptionEndsAt: future } });
  const res = await applyTenantGrant(orgId, { mode: "grant", minutes: 30, extend: true });
  assert.ok(res.ok);
  if (!res.ok) return;
  const delta = res.endsAt!.getTime() - future.getTime();
  assert.ok(Math.abs(delta - 30 * 60 * 1000) < 2000, "added 30 min on top of the current end");
});

test("a tenant with no plan cannot be renewed", async () => {
  const res = await applyTenantGrant(noPlanOrgId, { mode: "renew" });
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.status, 400);
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
