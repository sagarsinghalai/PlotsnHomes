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

async function setup() {
  const a = await prisma.organization.create({ data: { name: `${tag}_A`, code: `${tag}a` } });
  const b = await prisma.organization.create({ data: { name: `${tag}_B`, code: `${tag}b` } });
  aId = a.id; bId = b.id;
}
async function cleanup() {
  await prisma.tenantSetting.deleteMany({ where: { tenantId: { in: [aId, bId].filter(Boolean) } } }).catch(() => {});
  await prisma.organization.deleteMany({ where: { id: { in: [aId, bId].filter(Boolean) } } }).catch(() => {});
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

try {
  await setup();
  await runAll();
} finally {
  await cleanup();
  await prisma.$disconnect();
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
