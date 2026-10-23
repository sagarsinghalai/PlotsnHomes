/**
 * Phase B8 — security & regression gate (the release gate).
 * Runner: `npx tsx tests/security-gate.test.mts`
 *
 * Sections:
 *  A. Structural — every tenant-owned model carries a NON-NULL tenantId + index.
 *  B. Functional — negative cross-tenant: a row created in tenant A is never
 *     returned by a tenant-B-scoped query, across many entities.
 *  C. Authz — role gates (CRM access, superadmin, data scope) behave.
 *  D. Integration isolation — WhatsApp number & lead-channel secret resolve to
 *     the owning tenant and leak nothing for an unknown value.
 *  E. SQLite ↔ MySQL parity — the generated MySQL schema keeps tenantId non-null
 *     and the TenantSetting model.
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
process.env.CREDENTIALS_ENC_KEY = process.env.CREDENTIALS_ENC_KEY || "a".repeat(64);

const { prisma } = await import("@/lib/prisma");
const { tenantScope } = await import("@/lib/data-access");
const { leadScopeForUser } = await import("@/lib/crm-access");
const { hasCrmAccess, isSuperAdmin, isCustomerRole, roleDataScope } = await import("@/lib/roles");
const { saveWhatsAppConfig, resolveTenantByPhoneNumberId } = await import("@/lib/whatsapp-settings");
const { getLeadChannels, saveLeadChannels, resolveTenantByChannelSecret } = await import("@/lib/lead-channels");
const { Role } = await import("@prisma/client");

const TENANT_MODELS = [
  "Lead", "Property", "Project", "Developer", "Inquiry", "Transaction",
  "LeadActivity", "LeadTask", "AgentCommission", "BrokerageInvoice", "CrmGoal",
  "BulkJob", "InboundLeadLog", "MessageLog", "EmailLog", "MeetingInvite",
  "PropertyShowing", "KycProfile", "LoanApplication", "UserActivity",
  "WhatsAppCampaign", "Franchise", "Branch", "Department", "Team",
];

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

const tag = `b8_${Date.now()}`;
let aId = "", bId = "";
const createdByModel: Record<string, { a: string; b: string }> = {};

// Factories for models with simple required fields (no required FK relations).
function factory(model: string, who: "a" | "b"): Record<string, any> | null {
  const u = `${who}_${tag}`;
  switch (model) {
    case "lead": return { name: `Lead ${u}` };
    case "developer": return { name: `Dev ${u}` };
    case "whatsAppCampaign": return { name: `Camp ${u}` };
    case "crmGoal": return { title: `Goal ${u}`, target: 10 };
    case "franchise": return { name: `Fr ${u}`, code: `FR_${u}` };
    case "branch": return { name: `Br ${u}`, code: `BR_${u}` };
    case "department": return { name: `Dp ${u}`, code: `DP_${u}` };
    case "team": return { name: `Tm ${u}`, code: `TM_${u}` };
    case "inboundLeadLog": return { channel: "generic", status: "RECEIVED", payload: "{}" };
    default: return null;
  }
}
const SWEEP = ["lead", "developer", "whatsAppCampaign", "crmGoal", "franchise", "branch", "department", "team", "inboundLeadLog"];

async function setup() {
  const a = await prisma.organization.create({ data: { name: `${tag}_A`, code: `${tag}_A` } });
  const b = await prisma.organization.create({ data: { name: `${tag}_B`, code: `${tag}_B` } });
  aId = a.id; bId = b.id;
  for (const model of SWEEP) {
    const ra = await (prisma as any)[model].create({ data: { tenantId: aId, ...factory(model, "a") } });
    const rb = await (prisma as any)[model].create({ data: { tenantId: bId, ...factory(model, "b") } });
    createdByModel[model] = { a: ra.id, b: rb.id };
  }
}
async function cleanup() {
  for (const model of SWEEP) {
    const ids = createdByModel[model];
    if (ids) await (prisma as any)[model].deleteMany({ where: { id: { in: [ids.a, ids.b] } } }).catch(() => {});
  }
  await prisma.tenantSetting.deleteMany({ where: { tenantId: { in: [aId, bId].filter(Boolean) } } }).catch(() => {});
  await prisma.organization.deleteMany({ where: { id: { in: [aId, bId].filter(Boolean) } } }).catch(() => {});
}

// ── A. Structural ────────────────────────────────────────────────────────────
test("every tenant-owned model has a NON-NULL tenantId column + index", () => {
  const schema = fs.readFileSync(path.resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
  const blocks = new Map<string, string>();
  const re = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(schema))) blocks.set(m[1], m[2]);
  for (const model of TENANT_MODELS) {
    const body = blocks.get(model);
    assert.ok(body, `model ${model} must exist`);
    assert.match(body!, /\n\s*tenantId\s+String(?!\?)/, `${model}.tenantId must be non-null`);
    assert.match(body!, /@@index\(\[tenantId\]\)/, `${model} must index tenantId`);
  }
  // User.tenantId stays nullable (platform-level users).
  assert.match(blocks.get("User")!, /\n\s*tenantId\s+String\?/, "User.tenantId stays nullable");
});

// ── B. Functional negative cross-tenant ──────────────────────────────────────
for (const model of SWEEP) {
  test(`cross-tenant: ${model} scoped to A excludes B's row`, async () => {
    const ids = createdByModel[model];
    const rows = await (prisma as any)[model].findMany({ where: { ...tenantScope(aId) } });
    const got = rows.map((r: any) => r.id);
    assert.ok(got.includes(ids.a), `tenant A must see its own ${model}`);
    assert.ok(!got.includes(ids.b), `tenant A must NOT see tenant B's ${model}`);
  });
}

test("lead scope (role-aware) is tenant-first and never crosses tenants", async () => {
  const where = leadScopeForUser(Role.SUPERADMIN, "someUser", aId);
  const rows = await prisma.lead.findMany({ where });
  const got = rows.map((r) => r.id);
  assert.ok(got.includes(createdByModel.lead.a));
  assert.ok(!got.includes(createdByModel.lead.b), "even a superadmin is bound to one tenant");
});

// ── C. Authz ──────────────────────────────────────────────────────────────────
test("role gates: CRM access, superadmin, customer, data scope", () => {
  assert.equal(hasCrmAccess(Role.AGENT), true);
  assert.equal(hasCrmAccess(Role.BUYER), false, "customers have no CRM access");
  assert.equal(hasCrmAccess(Role.SELLER), false);
  assert.equal(isSuperAdmin(Role.SUPERADMIN), true);
  assert.equal(isSuperAdmin(Role.PLATFORM_ADMIN), true);
  assert.equal(isSuperAdmin(Role.AGENT), false);
  assert.equal(isCustomerRole(Role.BUYER), true);
  assert.equal(roleDataScope(Role.EMPLOYEE), "OWN");
  assert.equal(roleDataScope(Role.SUPERADMIN), "GLB");
});

test("leadScopeForUser always applies a tenant filter (fail-closed on null)", () => {
  const forNull = leadScopeForUser(Role.AGENT, "u1", null);
  assert.equal(forNull.tenantId, "__no_tenant__", "null tenant yields an impossible filter");
  const own = leadScopeForUser(Role.AGENT, "u1", aId);
  assert.equal(own.tenantId, aId);
  assert.equal(own.ownerId, "u1", "OWN-scope role is also narrowed to its own rows");
});

// ── D. Integration isolation ─────────────────────────────────────────────────
test("WhatsApp number & channel secret resolve only to the owning tenant", async () => {
  await saveWhatsAppConfig(
    { enabled: true, displayNumber: "+1", phoneNumberId: `PN_${tag}_A`, apiVersion: "v20.0", accessToken: "t", appSecret: "s", verifyToken: "v" },
    aId,
  );
  await saveWhatsAppConfig(
    { enabled: true, displayNumber: "+2", phoneNumberId: `PN_${tag}_B`, apiVersion: "v20.0", accessToken: "t", appSecret: "s", verifyToken: "v" },
    bId,
  );
  assert.equal(await resolveTenantByPhoneNumberId(`PN_${tag}_A`), aId);
  assert.equal(await resolveTenantByPhoneNumberId(`PN_${tag}_B`), bId);
  assert.equal(await resolveTenantByPhoneNumberId(`PN_${tag}_UNKNOWN`), null, "unknown number leaks no tenant");

  const chA = await getLeadChannels(aId); chA.generic.secret = `S_${tag}_A`; await saveLeadChannels(chA, aId);
  const chB = await getLeadChannels(bId); chB.generic.secret = `S_${tag}_B`; await saveLeadChannels(chB, bId);
  assert.equal((await resolveTenantByChannelSecret("generic", `S_${tag}_A`))?.tenantId, aId);
  assert.equal((await resolveTenantByChannelSecret("generic", `S_${tag}_B`))?.tenantId, bId);
  assert.equal(await resolveTenantByChannelSecret("generic", "wrong"), null, "wrong secret leaks no tenant");
});

// ── E. SQLite ↔ MySQL parity ─────────────────────────────────────────────────
test("MySQL schema keeps tenantId non-null + TenantSetting (parity)", () => {
  const p = path.resolve(process.cwd(), "prisma/schema.mysql.prisma");
  assert.ok(fs.existsSync(p), "prisma/schema.mysql.prisma must be generated (run `npm run schema:mysql`)");
  const mysql = fs.readFileSync(p, "utf8");
  assert.match(mysql, /provider\s*=\s*"mysql"/, "provider must be mysql");
  assert.match(mysql, /model\s+TenantSetting\s*\{/, "TenantSetting must carry over to MySQL");
  const blocks = new Map<string, string>();
  const re = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(mysql))) blocks.set(m[1], m[2]);
  for (const model of TENANT_MODELS) {
    assert.match(blocks.get(model)!, /\n\s*tenantId\s+String(?!\?)/, `${model}.tenantId must stay non-null on MySQL`);
  }
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
