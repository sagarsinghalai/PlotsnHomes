/**
 * Seed a MINIMAL white-label test hierarchy with known logins (all password
 * "demo1234"). Idempotent — safe to re-run. Run: `npx tsx scripts/seed-wl-hierarchy.mts`
 *
 * Tenant: "Skyline Realty (WL Test)" (code SKYLINE). A single linear chain with
 * exactly ONE account at every level, so allocation/scoping is unambiguous:
 *
 *   WL Admin → Franchise Admin → Branch Manager → Dept Head → Team Leader → Agent → 1 Lead
 *
 * Each account has exactly one subordinate directly below it, and the single lead
 * (owned by the Agent) rolls up the whole chain — so every level should see it.
 * Scope is limited to the Skyline tenant; no other tenant/user is touched.
 */
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const pw = await bcrypt.hash("demo1234", 12);

// 1) Tenant org. Match an existing Skyline org by code (either case) or name so
// re-runs reuse it; only create when truly absent.
const existingOrg = await prisma.organization.findFirst({
  where: { OR: [{ code: "SKYLINE" }, { code: "skyline" }, { name: "Skyline Realty (WL Test)" }] },
});
const org = existingOrg
  ? await prisma.organization.update({ where: { id: existingOrg.id }, data: { status: "ACTIVE" } })
  : await prisma.organization.create({ data: { name: "Skyline Realty (WL Test)", code: "SKYLINE", status: "ACTIVE" } });
const tenantId = org.id;

async function upUser(email: string, name: string, role: Role) {
  return prisma.user.upsert({
    where: { email },
    create: { tenantId, email, name, phone: "+91 90000 00000", passwordHash: pw, role, active: true },
    update: { tenantId, name, passwordHash: pw, role, active: true },
  });
}

// 2) Exactly one user per level (single linear chain).
const wlAdmin = await upUser("wl.admin@skyline.test", "Skyline WL Admin", Role.WHITE_LABEL_ADMIN);
const frAdmin = await upUser("franchise.admin@skyline.test", "Skyline Franchise Admin", Role.FRANCHISE_ADMIN);
const brMgr = await upUser("branch.manager@skyline.test", "Skyline Branch Manager", Role.BRANCH_MANAGER);
const deptHead = await upUser("dept.head@skyline.test", "Skyline Dept Head", Role.DEPARTMENT_HEAD);
const teamLead = await upUser("team.leader@skyline.test", "Skyline Team Leader", Role.TEAM_LEADER);
const agent = await upUser("agent.a@skyline.test", "Skyline Agent", Role.AGENT);

// 3) Org → WL admin link.
await prisma.organization.update({ where: { id: tenantId }, data: { whiteLabelAdminId: wlAdmin.id } });

// 4) Org units (no unique on name → find-or-create by tenant+name). One each.
async function foc<T extends { findFirst: Function; create: Function; update: Function }>(
  model: T, where: any, data: any
): Promise<any> {
  const existing = await (model as any).findFirst({ where });
  if (existing) return (model as any).update({ where: { id: existing.id }, data });
  return (model as any).create({ data: { ...where, ...data } });
}

const franchise = await foc(prisma.franchise, { tenantId, name: "Skyline North" },
  { code: "SKY-FR-NORTH", organizationId: tenantId, franchiseAdminId: frAdmin.id });
const branch = await foc(prisma.branch, { tenantId, name: "North Downtown Branch" },
  { code: "SKY-BR-NDT", franchiseId: franchise.id, branchManagerId: brMgr.id });
const department = await foc(prisma.department, { tenantId, name: "Residential Sales" },
  { code: "SKY-DEPT-RES", branchId: branch.id, departmentHeadId: deptHead.id });
const team = await foc(prisma.team, { tenantId, name: "Team Alpha" },
  { code: "SKY-TEAM-ALPHA", departmentId: department.id, teamLeaderId: teamLead.id });

// 5) Membership + manager chain. Each user carries its FULL ancestor unit chain
// (franchiseId → branchId → departmentId → teamId) so subtree scoping rolls up
// correctly: a leader sees everyone whose unit-id matches, at every level below.
await prisma.user.update({ where: { id: frAdmin.id }, data: { franchiseId: franchise.id, managerId: wlAdmin.id } });
await prisma.user.update({ where: { id: brMgr.id }, data: { franchiseId: franchise.id, branchId: branch.id, managerId: frAdmin.id } });
await prisma.user.update({ where: { id: deptHead.id }, data: { franchiseId: franchise.id, branchId: branch.id, departmentId: department.id, managerId: brMgr.id } });
await prisma.user.update({ where: { id: teamLead.id }, data: { franchiseId: franchise.id, branchId: branch.id, departmentId: department.id, teamId: team.id, managerId: deptHead.id } });
await prisma.user.update({
  where: { id: agent.id },
  data: { franchiseId: franchise.id, branchId: branch.id, departmentId: department.id, teamId: team.id, managerId: teamLead.id },
});

// 6) Remove any extra users previously seeded in this tenant, so every level has
// exactly one subordinate. (Earlier runs created a second agent.)
const keepEmails = [
  "wl.admin@skyline.test", "franchise.admin@skyline.test", "branch.manager@skyline.test",
  "dept.head@skyline.test", "team.leader@skyline.test", "agent.a@skyline.test",
];
const extras = await prisma.user.findMany({ where: { tenantId, email: { notIn: keepEmails } }, select: { id: true } });
if (extras.length) {
  const ids = extras.map((u) => u.id);
  await prisma.lead.deleteMany({ where: { ownerId: { in: ids } } });
  await prisma.user.updateMany({ where: { managerId: { in: ids } }, data: { managerId: null } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

// 7) Exactly ONE lead, owned by the single Agent — it rolls up the whole chain,
// so every level (Team Leader … WL Admin) should see this one record.
await prisma.lead.deleteMany({ where: { tenantId } });
const lead = await prisma.lead.create({
  data: { tenantId, name: "Test Lead (Agent)", email: "", phone: "+91 90000 00001", source: "WL-SEED", ownerId: agent.id },
});

console.log("Tenant:", org.name, tenantId);
console.log("Chain:");
console.log("  WL Admin        ", wlAdmin.email);
console.log("  └ Franchise Admin", frAdmin.email, "(", franchise.name, ")");
console.log("    └ Branch Manager", brMgr.email, "(", branch.name, ")");
console.log("      └ Dept Head    ", deptHead.email, "(", department.name, ")");
console.log("        └ Team Leader", teamLead.email, "(", team.name, ")");
console.log("          └ Agent    ", agent.email);
console.log("            └ Lead   ", lead.name, "→ owner:", agent.email);
console.log("Extra users removed:", extras.length);

await prisma.$disconnect();
