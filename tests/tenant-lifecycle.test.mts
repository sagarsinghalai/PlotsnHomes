/**
 * Phase B7 — tenant lifecycle & suspension enforcement.
 * Runner: `npx tsx tests/tenant-lifecycle.test.mts`
 *
 * Proves the state machine (allowed transitions, terminal DELETED), the
 * access gate (ACTIVE/PAST_DUE in; SUSPENDED/PENDING/CANCELLED out), and that
 * the same gate the login/session path uses would block a suspended tenant's
 * user while preserving their data — and let them back in on reactivation.
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
const { isTenantAccessAllowed, canTransition, isTenantStatus } = await import("@/lib/tenant-lifecycle");
const { isOrgAccessAllowed, markLapsedOrgsPastDue } = await import("@/lib/subscription-access");
const { periodEndFromInterval } = await import("@/lib/subscription");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

const tag = `b7_${Date.now()}`;
let orgId = "", userId = "", leadId = "";

async function setup() {
  const org = await prisma.organization.create({ data: { name: `${tag}_Org`, code: `${tag}`, status: "ACTIVE" } });
  orgId = org.id;
  const user = await prisma.user.create({
    data: { email: `${tag}@x.test`, name: "Tenant User", passwordHash: "x", role: "EMPLOYEE", tenantId: orgId },
  });
  userId = user.id;
  const lead = await prisma.lead.create({ data: { name: "Kept lead", tenantId: orgId, ownerId: userId } });
  leadId = lead.id;
}
async function cleanup() {
  await prisma.lead.deleteMany({ where: { id: leadId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.organization.deleteMany({ where: { id: orgId } });
}

// Simulates exactly what auth-options does: load the user's org status and gate.
async function userCanAccess(uId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { id: uId },
    select: { tenantId: true, organizationRel: { select: { status: true } } },
  });
  if (!u) return false;
  return !u.tenantId || isTenantAccessAllowed(u.organizationRel?.status);
}

test("access gate: ACTIVE/PAST_DUE in, others out, null allowed", () => {
  assert.equal(isTenantAccessAllowed("ACTIVE"), true);
  assert.equal(isTenantAccessAllowed("PAST_DUE"), true);
  assert.equal(isTenantAccessAllowed("SUSPENDED"), false);
  assert.equal(isTenantAccessAllowed("PENDING"), false);
  assert.equal(isTenantAccessAllowed("CANCELLED"), false);
  assert.equal(isTenantAccessAllowed("DELETED"), false);
  assert.equal(isTenantAccessAllowed(null), true, "platform user with no tenant is allowed");
});

test("state machine: valid transitions, terminal DELETED, no self-transition", () => {
  assert.equal(canTransition("ACTIVE", "SUSPENDED"), true);
  assert.equal(canTransition("SUSPENDED", "ACTIVE"), true);
  assert.equal(canTransition("PENDING", "ACTIVE"), true);
  assert.equal(canTransition("ACTIVE", "DELETED"), false, "cannot delete straight from active");
  assert.equal(canTransition("CANCELLED", "DELETED"), true);
  assert.equal(canTransition("DELETED", "ACTIVE"), false, "DELETED is terminal");
  assert.equal(canTransition("ACTIVE", "ACTIVE"), false, "no self-transition");
  assert.equal(isTenantStatus("WAT"), false);
});

test("suspending the tenant blocks its user but preserves data", async () => {
  assert.equal(await userCanAccess(userId), true, "active tenant user can access");

  await prisma.organization.update({ where: { id: orgId }, data: { status: "SUSPENDED" } });
  assert.equal(await userCanAccess(userId), false, "suspended tenant user is blocked");

  // Data is preserved through suspension.
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  assert.ok(lead, "the tenant's lead still exists after suspension");

  // Reactivation restores access.
  await prisma.organization.update({ where: { id: orgId }, data: { status: "ACTIVE" } });
  assert.equal(await userCanAccess(userId), true, "reactivated tenant user can access again");
});

test("CUSTOM interval computes a minute-level expiry; LIFETIME never expires", () => {
  const start = new Date("2026-01-01T00:00:00Z");
  const fiveMin = periodEndFromInterval(start, "CUSTOM" as any, 5);
  assert.ok(fiveMin, "CUSTOM with minutes yields an end date");
  assert.equal(fiveMin!.getTime() - start.getTime(), 5 * 60 * 1000, "exactly 5 minutes");
  assert.equal(periodEndFromInterval(start, "LIFETIME" as any), null, "LIFETIME never expires");
  assert.equal(periodEndFromInterval(start, "CUSTOM" as any, 0), null, "CUSTOM with 0 = no expiry");
});

test("an expired subscription blocks access even when status is ACTIVE", () => {
  const past = new Date(Date.now() - 60 * 1000);
  const future = new Date(Date.now() + 60 * 60 * 1000);
  assert.equal(isOrgAccessAllowed({ status: "ACTIVE", subscriptionEndsAt: past }), false, "lapsed sub blocks");
  assert.equal(isOrgAccessAllowed({ status: "ACTIVE", subscriptionEndsAt: future }), true, "active + in-term allows");
  assert.equal(isOrgAccessAllowed({ status: "ACTIVE", subscriptionEndsAt: null }), true, "no expiry (lifetime) allows");
  assert.equal(isOrgAccessAllowed({ status: "SUSPENDED", subscriptionEndsAt: future }), false, "suspended blocks regardless");
});

test("markLapsedOrgsPastDue flips an ACTIVE, expired tenant to PAST_DUE", async () => {
  await prisma.organization.update({
    where: { id: orgId },
    data: { status: "ACTIVE", subscriptionEndsAt: new Date(Date.now() - 60 * 1000) },
  });
  const flipped = await markLapsedOrgsPastDue();
  assert.ok(flipped.includes(orgId), "the lapsed org was transitioned");
  const after = await prisma.organization.findUnique({ where: { id: orgId }, select: { status: true } });
  assert.equal(after?.status, "PAST_DUE");
  // And its user is now blocked (PAST_DUE still allows; expiry is what blocks) —
  // verify the combined gate via the org shape.
  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { status: true, subscriptionEndsAt: true } });
  assert.equal(isOrgAccessAllowed(org), false, "expired PAST_DUE org is blocked by the subscription gate");
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
