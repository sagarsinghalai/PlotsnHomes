/**
 * Roles & permissions completeness — every menu item is present for every role.
 * Runner: `npx tsx tests/permissions-sync.test.mts`
 *
 * Guards the Roles & Permissions page: no schema item may be missing from any
 * role (which would hide it in the UI and fail route checks closed). Also pins
 * the key fix — WHITE_LABEL_ADMIN can reach Organizations & Franchises but not
 * the platform-owner settings.
 */
import assert from "node:assert/strict";

const { PERMISSIONS_SCHEMA, DEFAULT_PERMISSIONS } = await import("@/lib/permissions");

let pass = 0, fail = 0;
function test(name: string, fn: () => void) {
  try { fn(); pass++; console.log("  ✓", name); }
  catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
}

const ALL_KEYS: string[] = PERMISSIONS_SCHEMA.flatMap((h: any) => h.subheads.map((s: any) => s.key));
const GROUPS = Object.keys(DEFAULT_PERMISSIONS);

test("every schema item exists for every role (nothing missed)", () => {
  for (const group of GROUPS) {
    const cfg = (DEFAULT_PERMISSIONS as any)[group];
    for (const key of ALL_KEYS) {
      const cell = cfg[key];
      assert.ok(cell, `${group} is missing permission item "${key}"`);
      for (const op of ["view", "add", "edit", "delete"]) {
        assert.equal(typeof cell[op], "boolean", `${group}.${key}.${op} must be a boolean`);
      }
    }
  }
});

test("white-label admin: full CRM + own org hierarchy, but not platform governance", () => {
  const wl = (DEFAULT_PERMISSIONS as any).WHITE_LABEL_ADMIN;
  assert.equal(wl.organization_units.view, true, "WL admin can see Organizations & Franchises");
  assert.equal(wl.organization_units.add, true, "WL admin can create org units");
  assert.equal(wl.users_accounts.view, true);
  assert.equal(wl.platform.view, false, "platform-owner settings stay hidden");
  assert.equal(wl.roles_permissions.view, false, "the global role matrix stays platform-owner only");
  assert.equal(wl.white_label_hub.view, false, "the white-label/subscription hub stays platform-owner only");
});

test("customers (BUYER) have no admin-management items", () => {
  const b = (DEFAULT_PERMISSIONS as any).BUYER;
  assert.equal(b.organization_units.view, false);
  assert.equal(b.all_leads.view, false);
  assert.equal(b.platform.view, false);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
