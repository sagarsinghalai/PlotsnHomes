/**
 * Page-level data scope — admin server PAGES must narrow owner-personal records to
 * the viewer's own rows for OWN-scope roles (AGENT/EMPLOYEE/EXECUTIVE), exactly like
 * the CRM APIs do. The pages apply the helpers in `@/lib/crm-access` directly to the
 * same Prisma models, so this test exercises those helpers against real rows: the
 * effective query a page runs is `prisma.<model>.findMany({ where: <helper(...)> })`.
 *
 * Runner: `npx tsx tests/page-data-scope.test.mts`
 *
 * Guards against the leak where a page filters by `{ tenantId }` only, letting an
 * OWN-scope role see the whole tenant's leads / transactions / commissions / goals /
 * wallets — the class fixed on /admin/leads and swept across the other admin pages.
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
const {
  isOwnScopeRole,
  leadScopeForUser,
  ownerScopeForUser,
  transactionScopeForUser,
  commissionScopeForUser,
  walletUserScopeForUser,
} = await import("@/lib/crm-access");
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

const tag = `scope_${Date.now()}`;
// Tenant T (under test) and a second tenant T2 to prove nothing crosses tenants.
let T = "", T2 = "";
let leader = "", agentA = "", agentB = "", agentX = "";
let propA = "";
const ids: Record<string, string> = {};

async function mkUser(email: string, role: any, tenantId: string) {
  const u = await prisma.user.create({
    data: { email: `${email}_${tag}@t.test`, name: email, passwordHash: "x", role, tenantId },
  });
  return u.id;
}

async function setup() {
  const a = await prisma.organization.create({ data: { name: `${tag}_T`, code: `${tag}_T` } });
  const b = await prisma.organization.create({ data: { name: `${tag}_T2`, code: `${tag}_T2` } });
  T = a.id; T2 = b.id;

  leader = await mkUser("leader", Role.WHITE_LABEL_ADMIN, T);
  agentA = await mkUser("agentA", Role.AGENT, T);
  agentB = await mkUser("agentB", Role.AGENT, T);
  agentX = await mkUser("agentX", Role.AGENT, T2);

  // Property listed by agentA (tenant-shared record, but drives a transaction's scope).
  const p = await prisma.property.create({
    data: {
      tenantId: T, symbol: `${tag}_P`, slug: `${tag}-p`, title: "P", description: "d",
      price: 100, address: "a", city: "c", state: "s", zip: "z", agentId: agentA,
    },
  });
  propA = p.id;

  // Leads — owned by A, by B, unassigned (null owner), and one in T2.
  ids.leadA = (await prisma.lead.create({ data: { tenantId: T, name: "LA", ownerId: agentA } })).id;
  ids.leadB = (await prisma.lead.create({ data: { tenantId: T, name: "LB", ownerId: agentB } })).id;
  ids.leadNull = (await prisma.lead.create({ data: { tenantId: T, name: "LN" } })).id;
  ids.leadT2 = (await prisma.lead.create({ data: { tenantId: T2, name: "LX", ownerId: agentX } })).id;

  // Transactions — A's own (userId), B's own, one on A's listed property, and one in T2.
  ids.txA = (await prisma.transaction.create({ data: { tenantId: T, userId: agentA, amount: 1, type: "DEPOSIT" } })).id;
  ids.txB = (await prisma.transaction.create({ data: { tenantId: T, userId: agentB, amount: 1, type: "DEPOSIT" } })).id;
  ids.txProp = (await prisma.transaction.create({ data: { tenantId: T, userId: leader, propertyId: propA, amount: 1, type: "DEPOSIT" } })).id;
  ids.txT2 = (await prisma.transaction.create({ data: { tenantId: T2, userId: agentX, amount: 1, type: "DEPOSIT" } })).id;

  // Commissions — A's, B's.
  ids.commA = (await prisma.agentCommission.create({ data: { tenantId: T, agentId: agentA } })).id;
  ids.commB = (await prisma.agentCommission.create({ data: { tenantId: T, agentId: agentB } })).id;

  // Goals — A's, B's, unassigned.
  ids.goalA = (await prisma.crmGoal.create({ data: { tenantId: T, title: "GA", target: 1, ownerId: agentA } })).id;
  ids.goalB = (await prisma.crmGoal.create({ data: { tenantId: T, title: "GB", target: 1, ownerId: agentB } })).id;
  ids.goalNull = (await prisma.crmGoal.create({ data: { tenantId: T, title: "GN", target: 1 } })).id;
}

async function cleanup() {
  await prisma.agentCommission.deleteMany({ where: { tenantId: { in: [T, T2] } } }).catch(() => {});
  await prisma.transaction.deleteMany({ where: { tenantId: { in: [T, T2] } } }).catch(() => {});
  await prisma.crmGoal.deleteMany({ where: { tenantId: { in: [T, T2] } } }).catch(() => {});
  await prisma.lead.deleteMany({ where: { tenantId: { in: [T, T2] } } }).catch(() => {});
  await prisma.property.deleteMany({ where: { tenantId: { in: [T, T2] } } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { in: [leader, agentA, agentB, agentX].filter(Boolean) } } }).catch(() => {});
  await prisma.tenantSetting.deleteMany({ where: { tenantId: { in: [T, T2].filter(Boolean) } } }).catch(() => {});
  await prisma.organization.deleteMany({ where: { id: { in: [T, T2].filter(Boolean) } } }).catch(() => {});
}

const idsOf = (rows: Array<{ id: string }>) => rows.map((r) => r.id);

// ── Role classification ───────────────────────────────────────────────────────
test("isOwnScopeRole: individual contributors are OWN-scoped, leaders are not", () => {
  for (const r of [Role.AGENT, Role.EMPLOYEE, Role.EXECUTIVE]) assert.equal(isOwnScopeRole(r), true, `${r} is OWN`);
  for (const r of [Role.WHITE_LABEL_ADMIN, Role.FRANCHISE_ADMIN, Role.BRANCH_MANAGER, Role.DEPARTMENT_HEAD, Role.TEAM_LEADER, Role.SUPERADMIN, Role.PLATFORM_ADMIN]) {
    assert.equal(isOwnScopeRole(r), false, `${r} is tenant-wide`);
  }
});

// ── Leads (leadScopeForUser === ownerScopeForUser) ────────────────────────────
test("leads: an OWN-scope agent sees only their own; a leader sees the whole tenant", async () => {
  const forAgent = await prisma.lead.findMany({ where: await leadScopeForUser(Role.AGENT, agentA, T) });
  assert.deepEqual(idsOf(forAgent).sort(), [ids.leadA], "agent sees only leadA");

  const forLeader = await prisma.lead.findMany({ where: await leadScopeForUser(Role.WHITE_LABEL_ADMIN, leader, T) });
  const got = idsOf(forLeader);
  assert.ok(got.includes(ids.leadA) && got.includes(ids.leadB) && got.includes(ids.leadNull), "leader sees all tenant leads");
  assert.ok(!got.includes(ids.leadT2), "leader never crosses tenants");
});

// ── Transactions (userId OR listed-property OR commission) ────────────────────
test("transactions: agent sees own + listed-property deals; leader sees the tenant", async () => {
  const forAgent = await prisma.transaction.findMany({ where: await transactionScopeForUser(Role.AGENT, agentA, T) });
  const got = idsOf(forAgent).sort();
  assert.deepEqual(got, [ids.txA, ids.txProp].sort(), "agentA sees own tx + tx on their listed property");
  assert.ok(!got.includes(ids.txB), "agentA does not see agentB's tx");

  const forLeader = await prisma.transaction.findMany({ where: await transactionScopeForUser(Role.WHITE_LABEL_ADMIN, leader, T) });
  const gl = idsOf(forLeader);
  assert.ok(gl.includes(ids.txA) && gl.includes(ids.txB) && gl.includes(ids.txProp), "leader sees all tenant tx");
  assert.ok(!gl.includes(ids.txT2), "leader never crosses tenants");
});

// ── Commissions ───────────────────────────────────────────────────────────────
test("commissions: agent sees only their own; leader sees the tenant", async () => {
  const forAgent = await prisma.agentCommission.findMany({ where: await commissionScopeForUser(Role.AGENT, agentA, T) });
  assert.deepEqual(idsOf(forAgent).sort(), [ids.commA], "agentA sees only their commission");

  const forLeader = await prisma.agentCommission.findMany({ where: await commissionScopeForUser(Role.WHITE_LABEL_ADMIN, leader, T) });
  assert.deepEqual(idsOf(forLeader).sort(), [ids.commA, ids.commB].sort(), "leader sees all tenant commissions");
});

// ── Goals (ownerScopeForUser) ─────────────────────────────────────────────────
test("goals: agent sees only goals assigned to them; leader sees the tenant", async () => {
  const forAgent = await prisma.crmGoal.findMany({ where: await ownerScopeForUser(Role.AGENT, agentA, T) });
  assert.deepEqual(idsOf(forAgent).sort(), [ids.goalA], "agentA sees only goalA");

  const forLeader = await prisma.crmGoal.findMany({ where: await ownerScopeForUser(Role.WHITE_LABEL_ADMIN, leader, T) });
  const got = idsOf(forLeader);
  assert.ok(got.includes(ids.goalA) && got.includes(ids.goalB) && got.includes(ids.goalNull), "leader sees all tenant goals");
});

// ── Wallets (User list) ───────────────────────────────────────────────────────
test("wallets: agent sees only their own user row; leader sees every user in the tenant", async () => {
  const forAgent = await prisma.user.findMany({ where: await walletUserScopeForUser(Role.AGENT, agentA, T) });
  assert.deepEqual(idsOf(forAgent).sort(), [agentA], "agentA sees only their own wallet");

  const forLeader = await prisma.user.findMany({ where: await walletUserScopeForUser(Role.WHITE_LABEL_ADMIN, leader, T) });
  const got = idsOf(forLeader);
  assert.ok(got.includes(leader) && got.includes(agentA) && got.includes(agentB), "leader sees all tenant users");
  assert.ok(!got.includes(agentX), "leader never sees another tenant's users");
});

// ── Fail-closed on a missing tenant ───────────────────────────────────────────
test("all helpers fail closed to an impossible tenant when tenantId is null", async () => {
  assert.equal((await leadScopeForUser(Role.AGENT, agentA, null)).tenantId, "__no_tenant__");
  assert.equal((await ownerScopeForUser(Role.AGENT, agentA, undefined)).tenantId, "__no_tenant__");
  assert.equal((await transactionScopeForUser(Role.AGENT, agentA, null) as any).tenantId, "__no_tenant__");
  assert.equal((await commissionScopeForUser(Role.AGENT, agentA, null)).tenantId, "__no_tenant__");
  assert.equal((await walletUserScopeForUser(Role.AGENT, agentA, null)).tenantId, "__no_tenant__");
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
