/**
 * Stage D — account activate/deactivate authorization (canManageUser).
 * Runner: `npx tsx tests/user-management.test.mts`
 *
 * Pure-logic gate: who may manage whose account. Platform owner → anyone;
 * tenant/parent admins → only strictly-lower accounts within their own subtree;
 * never a super admin, never cross-tenant, never yourself.
 */
import assert from "node:assert/strict";

const { canManageUser } = await import("@/lib/user-management");

let pass = 0, fail = 0;
function test(name: string, fn: () => void) {
  try { fn(); pass++; console.log("  ✓", name); }
  catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
}

const sa = { id: "sa", role: "SUPERADMIN", tenantId: "P" };
const wlA = { id: "wlA", role: "WHITE_LABEL_ADMIN", tenantId: "A" };
const wlB = { id: "wlB", role: "WHITE_LABEL_ADMIN", tenantId: "B" };
const agentA = { id: "agA", role: "AGENT", tenantId: "A", franchiseId: "fr1", branchId: "br1" };
const agentB = { id: "agB", role: "AGENT", tenantId: "B" };
const frA = { id: "frAadmin", role: "FRANCHISE_ADMIN", tenantId: "A", franchiseId: "fr1" };
const agentA_otherFr = { id: "agA2", role: "AGENT", tenantId: "A", franchiseId: "fr2" };

test("platform owner can manage anyone (but not another super admin, not self)", () => {
  assert.equal(canManageUser(sa, wlA), true);
  assert.equal(canManageUser(sa, agentB), true);
  assert.equal(canManageUser(sa, { id: "sa2", role: "PLATFORM_ADMIN", tenantId: "P" }), false, "no super-admin target");
  assert.equal(canManageUser(sa, sa), false, "no self");
});

test("WL admin manages lower roles only within their own tenant", () => {
  assert.equal(canManageUser(wlA, agentA), true, "agent in same tenant");
  assert.equal(canManageUser(wlA, agentB), false, "cross-tenant blocked");
  assert.equal(canManageUser(wlA, wlB), false, "cannot manage another WL admin");
  assert.equal(canManageUser(wlA, wlA), false, "no self");
  assert.equal(canManageUser(wlA, sa), false, "never a super admin");
});

test("franchise admin is confined to their own franchise", () => {
  assert.equal(canManageUser(frA, agentA), true, "agent in same franchise");
  assert.equal(canManageUser(frA, agentA_otherFr), false, "agent in a different franchise blocked");
  assert.equal(canManageUser(frA, wlA), false, "cannot manage up the chain");
});

test("an agent can manage nobody", () => {
  assert.equal(canManageUser(agentA, agentA_otherFr), false);
  assert.equal(canManageUser(agentA, { id: "x", role: "BUYER", tenantId: "A" }), false);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
