/**
 * White-label org-hierarchy management authorization.
 * Runner: `npx tsx tests/org-access.test.mts`
 *
 * canManageOrgUnits: platform owners and white-label admins may manage the org
 * hierarchy; lower roles may not. (Tenant scoping is enforced in the route.)
 */
import assert from "node:assert/strict";

const { canManageOrgUnits } = await import("@/lib/org-access");

let pass = 0, fail = 0;
function test(name: string, fn: () => void) {
  try { fn(); pass++; console.log("  ✓", name); }
  catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
}

test("platform owner + white-label admin may manage org units", () => {
  assert.equal(canManageOrgUnits("SUPERADMIN"), true);
  assert.equal(canManageOrgUnits("PLATFORM_ADMIN"), true);
  assert.equal(canManageOrgUnits("WHITE_LABEL_ADMIN"), true);
});

test("lower roles and anonymous may not", () => {
  assert.equal(canManageOrgUnits("FRANCHISE_ADMIN"), false);
  assert.equal(canManageOrgUnits("AGENT"), false);
  assert.equal(canManageOrgUnits("BUYER"), false);
  assert.equal(canManageOrgUnits(null), false);
  assert.equal(canManageOrgUnits(undefined), false);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
