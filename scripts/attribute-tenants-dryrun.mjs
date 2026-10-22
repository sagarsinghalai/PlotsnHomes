/**
 * READ-ONLY dry-run tenant attribution (Phase B2).
 *
 * For each tenant-owned model, derives the would-be tenant from the row's owning
 * user (Lead.owner, Property.agent, …) and reports how many rows are:
 *   - resolved : owning user exists AND already has a tenantId
 *   - pending  : owning user exists but has no tenantId yet (resolves once users
 *                are assigned to an Organization in B3)
 *   - orphaned : no owning user / no derivable link (needs an explicit rule)
 * Models with no user link at all are listed separately.
 *
 * Prints COUNTS ONLY — never names, phones, emails or any PII. Changes nothing.
 *
 * Run:  node scripts/attribute-tenants-dryrun.mjs
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

const prisma = new PrismaClient();

// model (Prisma client key) -> owning-user id field + relation name
const OWNED = [
  ["lead", "ownerId", "owner"],
  ["property", "agentId", "agent"],
  ["agentCommission", "agentId", "agent"],
  ["transaction", "userId", "user"],
  ["kycProfile", "userId", "user"],
  ["loanApplication", "userId", "user"],
  ["bulkJob", "createdById", "createdBy"],
  ["messageLog", "sentById", "sentBy"],
  ["meetingInvite", "createdById", "createdBy"],
  ["crmGoal", "ownerId", "owner"],
  ["leadActivity", "userId", "user"],
  ["leadTask", "userId", "user"],
  ["propertyShowing", "userId", "user"],
  ["inquiry", "userId", "user"],
  ["userActivity", "contactId", "contact"],
];

// Models with no direct user link — attributed by rule in B3 (e.g. to primary org).
const NO_USER_LINK = ["project", "developer", "brokerageInvoice", "emailLog", "inboundLeadLog", "whatsAppCampaign"];

function pad(s, n) { return String(s).padEnd(n); }
function padn(s, n) { return String(s).padStart(n); }

async function main() {
  console.log("Tenant attribution dry-run (read-only, counts only)\n");
  console.log(pad("Model", 20), padn("total", 7), padn("resolved", 9), padn("pending", 8), padn("orphan", 7));
  console.log("-".repeat(54));

  let totals = { total: 0, resolved: 0, pending: 0, orphaned: 0 };
  for (const [m, idField, rel] of OWNED) {
    const rows = await prisma[m].findMany({ select: { [idField]: true, [rel]: { select: { tenantId: true } } } });
    let resolved = 0, pending = 0, orphaned = 0;
    for (const r of rows) {
      const ownerId = r[idField];
      const t = r[rel]?.tenantId;
      if (!ownerId) orphaned++;
      else if (t) resolved++;
      else pending++;
    }
    totals.total += rows.length; totals.resolved += resolved; totals.pending += pending; totals.orphaned += orphaned;
    console.log(pad(m, 20), padn(rows.length, 7), padn(resolved, 9), padn(pending, 8), padn(orphaned, 7));
  }
  console.log("-".repeat(54));
  console.log(pad("SUBTOTAL", 20), padn(totals.total, 7), padn(totals.resolved, 9), padn(totals.pending, 8), padn(totals.orphaned, 7));

  console.log("\nModels with no direct user link (attribute by rule in B3):");
  for (const m of NO_USER_LINK) {
    const count = await prisma[m].count();
    console.log("  " + pad(m, 20), padn(count, 7));
  }

  // How many users have a tenant yet? (drives 'pending' above)
  const totalUsers = await prisma.user.count();
  const usersWithTenant = await prisma.user.count({ where: { tenantId: { not: null } } });
  const orgCount = await prisma.organization.count();
  console.log(`\nUsers with a tenant assigned: ${usersWithTenant}/${totalUsers}. Organizations: ${orgCount}.`);
  console.log(
    totals.pending > 0
      ? "\n→ 'pending' rows resolve automatically once users are assigned to an Organization (B3). Given the decision to treat existing data as ONE tenant, B3 will create a primary org, assign all users to it, and backfill every row."
      : "\n→ No pending rows."
  );
}

main().catch((e) => { console.error("Dry-run failed:", e.message); process.exit(1); }).finally(() => prisma.$disconnect());
