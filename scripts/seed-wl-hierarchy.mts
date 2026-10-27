/**
 * Seed a clean white-label test hierarchy with known logins (all password
 * "demo1234"), plus reset two stuck WL-admin passwords. Idempotent — safe to
 * re-run. Run: `npx tsx scripts/seed-wl-hierarchy.mts`
 *
 * Tenant: "Skyline Realty (WL Test)" (code SKYLINE)
 *   WL Admin ─ Franchise Admin ─ Branch Manager ─ Dept Head ─ Team Leader ─ Agents
 * Leads are owned by different users so owner-level visibility can be tested.
 */
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const pw = await bcrypt.hash("demo1234", 12);

// 1) Tenant org (unique by code).
const org = await prisma.organization.upsert({
  where: { code: "SKYLINE" },
  create: { name: "Skyline Realty (WL Test)", code: "SKYLINE", status: "ACTIVE" },
  update: { status: "ACTIVE" },
});
const tenantId = org.id;

async function upUser(email: string, name: string, role: Role) {
  return prisma.user.upsert({
    where: { email },
    create: { tenantId, email, name, phone: "+91 90000 00000", passwordHash: pw, role, active: true },
    update: { tenantId, name, passwordHash: pw, role, active: true },
  });
}

// 2) One user per level.
const wlAdmin = await upUser("wl.admin@skyline.test", "Skyline WL Admin", Role.WHITE_LABEL_ADMIN);
const frAdmin = await upUser("franchise.admin@skyline.test", "Skyline Franchise Admin", Role.FRANCHISE_ADMIN);
const brMgr = await upUser("branch.manager@skyline.test", "Skyline Branch Manager", Role.BRANCH_MANAGER);
const deptHead = await upUser("dept.head@skyline.test", "Skyline Dept Head", Role.DEPARTMENT_HEAD);
const teamLead = await upUser("team.leader@skyline.test", "Skyline Team Leader", Role.TEAM_LEADER);
const agentA = await upUser("agent.a@skyline.test", "Skyline Agent A", Role.AGENT);
const agentB = await upUser("agent.b@skyline.test", "Skyline Agent B", Role.AGENT);

// 3) Org → WL admin link.
await prisma.organization.update({ where: { id: tenantId }, data: { whiteLabelAdminId: wlAdmin.id } });

// 4) Org units (no unique on name → find-or-create by tenant+name).
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

// 5) Membership + manager chain (each reports up one level).
await prisma.user.update({ where: { id: frAdmin.id }, data: { franchiseId: franchise.id, managerId: wlAdmin.id } });
await prisma.user.update({ where: { id: brMgr.id }, data: { franchiseId: franchise.id, branchId: branch.id, managerId: frAdmin.id } });
await prisma.user.update({ where: { id: deptHead.id }, data: { branchId: branch.id, departmentId: department.id, managerId: brMgr.id } });
await prisma.user.update({ where: { id: teamLead.id }, data: { departmentId: department.id, teamId: team.id, managerId: deptHead.id } });
for (const a of [agentA, agentB]) {
  await prisma.user.update({
    where: { id: a.id },
    data: { franchiseId: franchise.id, branchId: branch.id, departmentId: department.id, teamId: team.id, managerId: teamLead.id },
  });
}

// 6) Leads owned by different users (tagged so re-runs stay idempotent).
await prisma.lead.deleteMany({ where: { tenantId, source: "WL-SEED" } });
const leadSpecs: Array<[string, typeof agentA]> = [
  ["Rhea (Agent A lead 1)", agentA], ["Sam (Agent A lead 2)", agentA], ["Nina (Agent A lead 3)", agentA],
  ["Omar (Agent B lead 1)", agentB], ["Priya (Agent B lead 2)", agentB],
  ["Carl (Team Leader lead)", teamLead],
  ["Deepa (WL Admin lead)", wlAdmin],
];
for (const [name, owner] of leadSpecs) {
  await prisma.lead.create({
    data: { tenantId, name, email: "", phone: "+91 90000 00001", source: "WL-SEED", ownerId: owner.id },
  });
}

// 7) Reset the two stuck WL-admin passwords to demo1234.
const reset = await prisma.user.updateMany({
  where: { email: { in: ["bhavya@gmail.com", "sagar@apexpremier.com"] } },
  data: { passwordHash: pw },
});

console.log("Tenant:", org.name, tenantId);
console.log("Users:", [wlAdmin, frAdmin, brMgr, deptHead, teamLead, agentA, agentB].map((u) => `${u.email} [${u.role}]`).join("\n       "));
console.log("Units:", { franchise: franchise.name, branch: branch.name, department: department.name, team: team.name });
console.log("Leads seeded:", leadSpecs.length, "(3 Agent A, 2 Agent B, 1 Team Leader, 1 WL Admin)");
console.log("Passwords reset (bhavya/sagar):", reset.count);

await prisma.$disconnect();
