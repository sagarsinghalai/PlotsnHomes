/**
 * Mid-level hierarchy scoping — a leader sees only their own org-unit subtree,
 * not the whole tenant. Runner: `npx tsx tests/mid-level-scope.test.mts`
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { Role } from "@prisma/client";

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
const { resolveScopeOwnerIds, leadScopeForUser } = await import("@/lib/crm-access");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

const tag = `mls_${Date.now()}`;
let T = "";
const U: Record<string, string> = {};

async function setup() {
  const org = await prisma.organization.create({ data: { name: `${tag} Org`, code: `${tag}-ORG`, status: "ACTIVE" } });
  T = org.id;
  const fr = await prisma.franchise.create({ data: { tenantId: T, name: `${tag} Fr`, code: `${tag}-FR`, organizationId: T } });
  const br = await prisma.branch.create({ data: { tenantId: T, name: `${tag} Br`, code: `${tag}-BR`, franchiseId: fr.id } });
  const team = await prisma.team.create({ data: { tenantId: T, name: `${tag} Team`, code: `${tag}-TEAM` } });

  async function user(key: string, role: Role, membership: Record<string, string | null>) {
    const u = await prisma.user.create({
      data: { tenantId: T, email: `${tag}-${key}@x.test`, name: key, passwordHash: "x", role, active: true, ...membership },
    });
    U[key] = u.id;
    return u.id;
  }
  const inFr = { franchiseId: fr.id };
  const inBr = { franchiseId: fr.id, branchId: br.id };
  const inTeam = { franchiseId: fr.id, branchId: br.id, teamId: team.id };
  await user("frAdmin", Role.FRANCHISE_ADMIN, inFr);
  await user("brMgr", Role.BRANCH_MANAGER, inBr);
  await user("teamLead", Role.TEAM_LEADER, inTeam);
  await user("agent1", Role.AGENT, inTeam);
  await user("agent2", Role.AGENT, inTeam);
  await user("outsider", Role.AGENT, { franchiseId: null, branchId: null, teamId: null });

  for (const owner of ["agent1", "agent2", "outsider"]) {
    await prisma.lead.create({ data: { tenantId: T, name: `${tag} lead ${owner}`, email: "", source: "MLS-SEED", ownerId: U[owner] } });
  }
}

async function cleanup() {
  if (!T) return;
  await prisma.lead.deleteMany({ where: { tenantId: T } }).catch(() => {});
  await prisma.user.deleteMany({ where: { tenantId: T } }).catch(() => {});
  await prisma.team.deleteMany({ where: { tenantId: T } }).catch(() => {});
  await prisma.branch.deleteMany({ where: { tenantId: T } }).catch(() => {});
  await prisma.franchise.deleteMany({ where: { tenantId: T } }).catch(() => {});
  await prisma.organization.deleteMany({ where: { id: T } }).catch(() => {});
}

const sortedSet = (a: string[] | null) => (a === null ? null : [...a].sort());

test("franchise admin resolves to the whole franchise subtree", async () => {
  const ids = sortedSet(await resolveScopeOwnerIds(Role.FRANCHISE_ADMIN, U.frAdmin, T));
  assert.deepEqual(ids, [U.frAdmin, U.brMgr, U.teamLead, U.agent1, U.agent2].sort(), "all franchise members, not the outsider");
  assert.ok(!ids!.includes(U.outsider));
});

test("team leader resolves to only their team members", async () => {
  const ids = sortedSet(await resolveScopeOwnerIds(Role.TEAM_LEADER, U.teamLead, T));
  assert.deepEqual(ids, [U.teamLead, U.agent1, U.agent2].sort(), "team members only");
  assert.ok(!ids!.includes(U.brMgr) && !ids!.includes(U.frAdmin), "not users above the team");
});

test("an agent resolves to only themselves", async () => {
  assert.deepEqual(await resolveScopeOwnerIds(Role.AGENT, U.agent1, T), [U.agent1]);
});

test("a white-label admin resolves to the whole tenant (null = no narrowing)", async () => {
  assert.equal(await resolveScopeOwnerIds(Role.WHITE_LABEL_ADMIN, U.frAdmin, T), null);
});

test("a mid-level leader with no unit assigned fails closed to their own", async () => {
  assert.deepEqual(await resolveScopeOwnerIds(Role.TEAM_LEADER, U.outsider, T), [U.outsider]);
});

test("leadScopeForUser narrows a team leader's leads to their team's", async () => {
  const where = await leadScopeForUser(Role.TEAM_LEADER, U.teamLead, T);
  const rows = await prisma.lead.findMany({ where });
  const owners = new Set(rows.map((r) => r.ownerId));
  assert.ok(owners.has(U.agent1) && owners.has(U.agent2), "sees team agents' leads");
  assert.ok(!owners.has(U.outsider), "never sees the outsider's lead");
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
