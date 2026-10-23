/**
 * Phase B3 — backfill tenantId for existing rows.
 *
 * Strategy (per the approved decision):
 *   1. Pick the PRIMARY org = the Organization with the most users.
 *   2. Assign users with no tenantId to the primary org.
 *   3. For each tenant-owned model, set tenantId = the owning user's tenant where
 *      derivable (looped per org via relation filters); sweep the remainder
 *      (no owner / no derivable link) to the PRIMARY org.
 *   4. Structure models (Franchise/Branch/Department/Team) derive from the org
 *      hierarchy; remainder -> primary.
 *   5. Validate: no tenant-owned row is left with a null tenantId.
 *
 * Safe: backs up the SQLite DB first; columns stay NULLABLE (enforcement is B5);
 * refuses a non-local target without CONFIRM_MIGRATION=1; prints counts only.
 *
 * Run:  node scripts/backfill-tenants.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {}

const DB_URL = process.env.DATABASE_URL || "";
const isSqlite = /^file:/.test(DB_URL) || /\.db(\?|$)/.test(DB_URL);
if (!isSqlite && process.env.CONFIRM_MIGRATION !== "1") {
  console.error("Refusing to modify a non-local (non-sqlite) database without CONFIRM_MIGRATION=1. Aborting.");
  process.exit(1);
}

// Back up the sqlite file before writing.
if (isSqlite) {
  const rel = DB_URL.replace(/^file:/, "").replace(/\?.*$/, "");
  const candidates = [path.resolve(process.cwd(), "prisma", rel), path.resolve(process.cwd(), rel)];
  const src = candidates.find((p) => fs.existsSync(p));
  if (src) {
    const bak = `${src}.bak-${Date.now()}`;
    fs.copyFileSync(src, bak);
    console.log(`Backup: ${path.basename(bak)}`);
  } else {
    console.warn("Could not locate the sqlite file to back up; continuing (dev).");
  }
}

const prisma = new PrismaClient();

// Tenant-owned models with an owning-user RELATION (used to derive tenant).
const OWNED = [
  ["lead", "owner"], ["property", "agent"], ["agentCommission", "agent"],
  ["transaction", "user"], ["kycProfile", "user"], ["loanApplication", "user"],
  ["bulkJob", "createdBy"], ["messageLog", "sentBy"], ["meetingInvite", "createdBy"],
  ["crmGoal", "owner"], ["leadActivity", "user"], ["leadTask", "user"],
  ["propertyShowing", "user"], ["inquiry", "user"], ["userActivity", "contact"],
];
// Tenant-owned models with no user link -> all remainder to primary.
const NO_LINK = ["project", "developer", "brokerageInvoice", "emailLog", "inboundLeadLog", "whatsAppCampaign"];

async function main() {
  const orgs = await prisma.organization.findMany({ select: { id: true, name: true } });
  if (orgs.length === 0) { console.error("No Organizations exist — create one first."); process.exit(1); }

  // Primary = most users.
  const counts = await prisma.user.groupBy({ by: ["tenantId"], _count: { _all: true } });
  let primary = orgs[0].id, best = -1;
  for (const o of orgs) {
    const c = counts.find((x) => x.tenantId === o.id)?._count._all ?? 0;
    if (c > best) { best = c; primary = o.id; }
  }
  console.log(`Primary org: ${orgs.find((o) => o.id === primary)?.name} (${best} users).`);

  // 1. Users with no tenant -> primary.
  const u = await prisma.user.updateMany({ where: { tenantId: null }, data: { tenantId: primary } });
  console.log(`Users assigned to primary: ${u.count}`);

  // 2. Owned models: derive from owner per org, then sweep remainder to primary.
  for (const [m, rel] of OWNED) {
    let derived = 0;
    for (const o of orgs) {
      const r = await prisma[m].updateMany({ where: { tenantId: null, [rel]: { tenantId: o.id } }, data: { tenantId: o.id } });
      derived += r.count;
    }
    const sweep = await prisma[m].updateMany({ where: { tenantId: null }, data: { tenantId: primary } });
    console.log(`  ${m.padEnd(18)} derived ${String(derived).padStart(5)}  +remainder->primary ${String(sweep.count).padStart(4)}`);
  }

  // 3. No-link models: all to primary.
  for (const m of NO_LINK) {
    const r = await prisma[m].updateMany({ where: { tenantId: null }, data: { tenantId: primary } });
    console.log(`  ${m.padEnd(18)} ->primary ${String(r.count).padStart(5)}`);
  }

  // 4. Structure models via the org hierarchy, remainder -> primary.
  const struct = [
    ["franchise", (oid) => ({ organizationId: oid })],
    ["branch", (oid) => ({ franchise: { organizationId: oid } })],
    ["department", (oid) => ({ branch: { franchise: { organizationId: oid } } })],
    ["team", (oid) => ({ department: { branch: { franchise: { organizationId: oid } } } })],
  ];
  for (const [m, where] of struct) {
    let derived = 0;
    for (const o of orgs) {
      const r = await prisma[m].updateMany({ where: { tenantId: null, ...where(o.id) }, data: { tenantId: o.id } });
      derived += r.count;
    }
    const sweep = await prisma[m].updateMany({ where: { tenantId: null }, data: { tenantId: primary } });
    console.log(`  ${m.padEnd(18)} derived ${String(derived).padStart(5)}  +remainder->primary ${String(sweep.count).padStart(4)}`);
  }

  // 5. Validate: no nulls remain.
  const ALL = [...OWNED.map((x) => x[0]), ...NO_LINK, ...struct.map((x) => x[0])];
  let nulls = 0;
  for (const m of ALL) {
    const c = await prisma[m].count({ where: { tenantId: null } });
    if (c > 0) { console.log(`  ! ${m} still has ${c} null tenantId`); nulls += c; }
  }
  console.log(nulls === 0 ? "\n✔ Validation passed: every tenant-owned row has a tenantId." : `\n✗ ${nulls} rows still null — investigate.`);
}

main().catch((e) => { console.error("Backfill failed:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
