/**
 * Phase B4 — negative cross-tenant isolation tests.
 * Runner: `npx tsx tests/tenant-isolation.test.mts`
 *
 * Proves the tenant-scoping layer (leadScopeForUser / tenantScope) fails CLOSED:
 * a user in tenant A can never read tenant B's leads, a manager sees the whole
 * tenant but not another, an OWN-scoped agent sees only their own rows within
 * their tenant, and a null tenant matches nothing.
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

// Load .env (DATABASE_URL for the Prisma import chain) before importing app code.
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
const { leadScopeForUser } = await import("@/lib/crm-access");
const { tenantScope } = await import("@/lib/data-access");
const { Role } = await import("@prisma/client");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

const tag = `b4test_${Date.now()}`;
let orgAId = "", orgBId = "";
let mgrAId = "", agentAId = "";
let leadAMgrId = "", leadAAgentId = "", leadBId = "";

async function setup() {
  const orgA = await prisma.organization.create({
    data: { name: `${tag}_OrgA`, code: `${tag}_A` },
  });
  const orgB = await prisma.organization.create({
    data: { name: `${tag}_OrgB`, code: `${tag}_B` },
  });
  orgAId = orgA.id; orgBId = orgB.id;

  const mgrA = await prisma.user.create({
    data: { email: `${tag}_mgrA@x.test`, name: "Mgr A", passwordHash: "x", role: Role.EMPLOYEE, tenantId: orgAId },
  });
  const agentA = await prisma.user.create({
    data: { email: `${tag}_agentA@x.test`, name: "Agent A", passwordHash: "x", role: Role.AGENT, tenantId: orgAId },
  });
  mgrAId = mgrA.id; agentAId = agentA.id;

  // Lead in A owned by the manager, a lead in A owned by the agent, a lead in B.
  const leadAMgr = await prisma.lead.create({
    data: { name: "Lead A (mgr)", tenantId: orgAId, ownerId: mgrAId },
  });
  const leadAAgent = await prisma.lead.create({
    data: { name: "Lead A (agent)", tenantId: orgAId, ownerId: agentAId },
  });
  const leadB = await prisma.lead.create({
    data: { name: "Lead B", tenantId: orgBId, ownerId: mgrAId },
  });
  leadAMgrId = leadAMgr.id; leadAAgentId = leadAAgent.id; leadBId = leadB.id;
}

async function cleanup() {
  await prisma.lead.deleteMany({ where: { id: { in: [leadAMgrId, leadAAgentId, leadBId].filter(Boolean) } } });
  await prisma.user.deleteMany({ where: { id: { in: [mgrAId, agentAId].filter(Boolean) } } });
  await prisma.organization.deleteMany({ where: { id: { in: [orgAId, orgBId].filter(Boolean) } } });
}

const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

test("EMPLOYEE (OWN scope) in tenant A sees only own A lead, never B's", async () => {
  // EMPLOYEE maps to the OWN data scope in this role model, so it is narrowed
  // to its own leads — and always within its own tenant.
  const where = leadScopeForUser(Role.EMPLOYEE, mgrAId, orgAId);
  const rows = await prisma.lead.findMany({ where });
  const got = ids(rows);
  assert.ok(got.includes(leadAMgrId), "employee should see their own A lead");
  assert.ok(!got.includes(leadAAgentId), "employee (OWN) must NOT see the agent's A lead");
  assert.ok(!got.includes(leadBId), "employee must NOT see tenant B's lead");
});

test("same manager scoped to tenant B never returns A's leads", async () => {
  const where = leadScopeForUser(Role.EMPLOYEE, mgrAId, orgBId);
  const rows = await prisma.lead.findMany({ where });
  const got = ids(rows);
  assert.ok(got.includes(leadBId), "scope(B) should see B's lead");
  assert.ok(!got.includes(leadAMgrId) && !got.includes(leadAAgentId), "scope(B) must NOT see A's leads");
});

test("OWN-scoped agent sees only their own lead within their tenant", async () => {
  const where = leadScopeForUser(Role.AGENT, agentAId, orgAId);
  const rows = await prisma.lead.findMany({ where });
  const got = ids(rows);
  assert.ok(got.includes(leadAAgentId), "agent should see their own A lead");
  assert.ok(!got.includes(leadAMgrId), "agent must NOT see the manager's A lead (OWN scope)");
  assert.ok(!got.includes(leadBId), "agent must NOT see tenant B's lead");
});

test("null tenant matches none of our leads (fail-closed)", async () => {
  const where = leadScopeForUser(Role.EMPLOYEE, mgrAId, null);
  const rows = await prisma.lead.findMany({ where });
  const got = ids(rows);
  assert.ok(!got.includes(leadAMgrId) && !got.includes(leadAAgentId) && !got.includes(leadBId),
    "null tenant must leak nothing");
});

test("tenantScope(A) findMany excludes tenant B rows", async () => {
  const rows = await prisma.lead.findMany({ where: { ...tenantScope(orgAId) } });
  const got = ids(rows);
  assert.ok(got.includes(leadAMgrId) && got.includes(leadAAgentId), "tenantScope(A) should include A's leads");
  assert.ok(!got.includes(leadBId), "tenantScope(A) must exclude B's lead");
});

test("superadmin is still tenant-bound (one tenant only)", async () => {
  const where = leadScopeForUser(Role.SUPERADMIN, mgrAId, orgAId);
  const rows = await prisma.lead.findMany({ where });
  const got = ids(rows);
  assert.ok(got.includes(leadAMgrId) && got.includes(leadAAgentId), "superadmin sees their tenant");
  assert.ok(!got.includes(leadBId), "superadmin must NOT cross into tenant B");
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
