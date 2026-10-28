/**
 * Per-tenant role-permission matrix.
 * Runner: `npx tsx tests/role-permissions-tenant.test.mts`
 *
 * A tenant's saved matrix applies only to that tenant; others fall back to the
 * global/default matrix. The global default is unchanged by a tenant override.
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
const { getRolePermissions } = await import("@/lib/permissions");
const { setTenantSetting } = await import("@/lib/system-settings");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

const tag = `rpt_${Date.now()}`;
let aId = "", bId = "";
// Capture and restore the real global matrix so these tests never leave the dev DB
// with a restricted ceiling.
let priorGlobal: string | null = null;

async function setup() {
  const existing = await prisma.systemSetting.findUnique({ where: { key: "user_role_permissions" } });
  priorGlobal = existing?.value ?? null;
  // Start from a clean, fully-permissive global ceiling ("{}" merges to the full
  // defaults) so these tests don't depend on whatever the dev app has saved.
  await setTenantSetting("user_role_permissions", "{}", null);
  const a = await prisma.organization.create({ data: { name: `${tag}_A`, code: `${tag}a` } });
  const b = await prisma.organization.create({ data: { name: `${tag}_B`, code: `${tag}b` } });
  aId = a.id; bId = b.id;
}
async function cleanup() {
  await prisma.tenantSetting.deleteMany({ where: { tenantId: { in: [aId, bId].filter(Boolean) } } }).catch(() => {});
  await prisma.organization.deleteMany({ where: { id: { in: [aId, bId].filter(Boolean) } } }).catch(() => {});
  // Restore (or clear) the global matrix exactly as it was before the run.
  if (priorGlobal == null) {
    await prisma.systemSetting.deleteMany({ where: { key: "user_role_permissions" } }).catch(() => {});
  } else {
    await prisma.systemSetting.update({ where: { key: "user_role_permissions" }, data: { value: priorGlobal } }).catch(() => {});
  }
}

test("a tenant's saved matrix applies only to that tenant", async () => {
  // Default: WHITE_LABEL_ADMIN can view the WhatsApp hub. Tenant A turns it off.
  const baseline = await getRolePermissions(bId);
  assert.equal(baseline.WHITE_LABEL_ADMIN.whatsapp_hub.view, true, "default has WhatsApp hub on");

  await setTenantSetting(
    "user_role_permissions",
    JSON.stringify({ WHITE_LABEL_ADMIN: { whatsapp_hub: { view: false, add: false, edit: false, delete: false } } }),
    aId,
  );

  const forA = await getRolePermissions(aId);
  const forB = await getRolePermissions(bId);
  assert.equal(forA.WHITE_LABEL_ADMIN.whatsapp_hub.view, false, "tenant A's override applies to A");
  assert.equal(forB.WHITE_LABEL_ADMIN.whatsapp_hub.view, true, "tenant B is unaffected");

  // Unspecified items still fall back to defaults for A (nothing missed).
  assert.equal(forA.WHITE_LABEL_ADMIN.organization_units.view, true, "A keeps default org-units access");
});

test("the global default is untouched by a tenant override", async () => {
  const global = await getRolePermissions();
  assert.equal(global.WHITE_LABEL_ADMIN.whatsapp_hub.view, true, "global/default unchanged");
});

test("a tenant cannot escalate above the owner's global ceiling", async () => {
  // Owner (global) turns Billing OFF for the ADMIN template — the ceiling.
  await setTenantSetting(
    "user_role_permissions",
    JSON.stringify({ ADMIN: { billing: { view: false, add: false, edit: false, delete: false } } }),
    null,
  );
  // Tenant B tries to grant ADMIN full Billing anyway.
  await setTenantSetting(
    "user_role_permissions",
    JSON.stringify({ ADMIN: { billing: { view: true, add: true, edit: true, delete: true } } }),
    bId,
  );
  const forB = await getRolePermissions(bId);
  assert.equal(forB.ADMIN.billing.view, false, "tenant can't re-enable what the owner turned off");
  assert.equal(forB.ADMIN.billing.edit, false, "…for any action, not just view");
});

test("delegated admin tiers are capped at the global ADMIN ceiling", async () => {
  // With Billing off for ADMIN globally, every delegated admin loses it too —
  // even though their own template defaults to Billing on.
  const forB = await getRolePermissions(bId);
  assert.equal(forB.WHITE_LABEL_ADMIN.billing.view, false, "white-label admin capped by ADMIN ceiling");
  assert.equal(forB.FRANCHISE_ADMIN.billing.view, false, "franchise admin capped by ADMIN ceiling");
  assert.equal(forB.TEAM_LEADER.billing.view, false, "team leader capped by ADMIN ceiling");
});

test("the platform owner (SUPERADMIN) is never capped", async () => {
  // SUPERADMIN stays full regardless of any ceiling — owner rights are absolute.
  const forB = await getRolePermissions(bId);
  assert.equal(forB.SUPERADMIN.billing.view, true, "SUPERADMIN keeps full access");
});

test("a tenant may still restrict within the ceiling", async () => {
  // The owner allows Reports for ADMIN (default on). Tenant A turns it off → off
  // for A only; tenant B keeps it. Restricting down is always allowed.
  await setTenantSetting(
    "user_role_permissions",
    JSON.stringify({ ADMIN: { reports: { view: false, add: false, edit: false, delete: false } } }),
    aId,
  );
  const forA = await getRolePermissions(aId);
  const forB = await getRolePermissions(bId);
  assert.equal(forA.ADMIN.reports.view, false, "tenant A restricted Reports for itself");
  assert.equal(forB.ADMIN.reports.view, true, "tenant B keeps Reports (within ceiling)");
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
