// ---------------------------------------------------------------------------
// reset-users.mjs — DESTRUCTIVE platform reset.
//
// Keeps ONE best account per role (the hierarchy skeleton) + platform config
// (settings, subscription plans, property categories, org/franchise/branch/
// department/team structure). Deletes every other user AND all operational
// data (properties, leads, transactions, projects, media records, etc.).
//
// Works on BOTH local (SQLite) and production (MySQL) via Prisma — the model
// names are identical. Run it inside the prod container with the prod
// DATABASE_URL to reset live.
//
// USAGE:
//   node scripts/reset-users.mjs                 # DRY RUN — shows what it would do, changes nothing
//   node scripts/reset-users.mjs --execute --confirm RESET   # actually performs the reset
//
// ALWAYS back up the database before running with --execute.
// ---------------------------------------------------------------------------
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const EXECUTE = process.argv.includes("--execute");
const CONFIRMED = process.argv[process.argv.indexOf("--confirm") + 1] === "RESET";

// Role hierarchy, high → low.
const ROLE_ORDER = [
  "SUPERADMIN", "PLATFORM_ADMIN", "WHITE_LABEL_ADMIN", "FRANCHISE_ADMIN",
  "BRANCH_MANAGER", "DEPARTMENT_HEAD", "TEAM_LEADER", "EXECUTIVE",
  "EMPLOYEE", "AGENT", "DEMO", "SELLER", "BUYER",
];

// Operational tables to WIPE entirely (Prisma delegate names). Order does not
// matter — we retry until foreign keys clear.
const WIPE = [
  "activityComment", "userActivity", "leadActivity", "leadTask", "lead",
  "favorite", "inquiry", "propertyShowing", "propertyPriceLog", "agentCommission",
  "transaction", "kycProfile", "loanApplication", "meetingInvite", "messageLog",
  "emailLog", "inboundLeadLog", "crmGoal", "bulkJob", "listingDraft",
  "otpCode", "passwordResetToken", "whatsAppCampaign", "auditEvent",
  "subscriptionInvoice", "userSubscription", "brokerageInvoice", "developerTask",
  "project", "developer", "mediaAsset", "property",
];

// Config / structure tables we KEEP (shown for transparency).
const KEEP_TABLES = [
  "systemSetting", "tenantSetting", "ratingSlab", "subscriptionPlan",
  "propertyCategory", "customFieldDef", "organization", "franchise",
  "branch", "department", "team",
];

const isJunk = (s) => /(test|demo|dummy|temp|sample|fake|example|xxx|asdf|qwerty|\d{6,})/i.test(s || "");

function pickKeeperPerRole(users) {
  const byRole = {};
  for (const u of users) (byRole[u.role] ||= []).push(u);
  const keepers = [];
  for (const role of ROLE_ORDER) {
    const list = byRole[role];
    if (!list?.length) continue;
    list.sort((a, b) => {
      // active first
      if (a.active !== b.active) return a.active ? -1 : 1;
      // @plotsnhomes.com first
      const ap = /@plotsnhomes\.com$/i.test(a.email) ? 0 : 1;
      const bp = /@plotsnhomes\.com$/i.test(b.email) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      // non-junk-looking first
      const aj = isJunk(a.email + a.name) ? 1 : 0;
      const bj = isJunk(b.email + b.name) ? 1 : 0;
      if (aj !== bj) return aj - bj;
      // earliest created first
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    keepers.push(list[0]);
  }
  // Any roles present that aren't in ROLE_ORDER (safety): keep one each too.
  for (const role of Object.keys(byRole)) {
    if (!ROLE_ORDER.includes(role)) keepers.push(byRole[role][0]);
  }
  return keepers;
}

async function wipeAll() {
  let remaining = [...WIPE];
  const deleted = {};
  while (remaining.length) {
    const stillFailing = [];
    let progressed = false;
    for (const t of remaining) {
      try {
        const r = await prisma[t].deleteMany({});
        deleted[t] = (deleted[t] || 0) + r.count;
        progressed = true;
      } catch {
        stillFailing.push(t);
      }
    }
    if (!progressed) {
      throw new Error("Could not clear tables (FK blocked): " + stillFailing.join(", "));
    }
    remaining = stillFailing;
  }
  return deleted;
}

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  });
  const keepers = pickKeeperPerRole(users);
  const keeperIds = new Set(keepers.map((k) => k.id));
  const toDelete = users.filter((u) => !keeperIds.has(u.id));

  console.log("\n================ PLATFORM RESET " + (EXECUTE ? "(EXECUTE)" : "(DRY RUN)") + " ================\n");
  console.log("Total users: " + users.length + "   ->   keep " + keepers.length + ", delete " + toDelete.length + "\n");

  console.log("KEEPERS (one best account per role):");
  console.log("  " + "ROLE".padEnd(18) + "EMAIL".padEnd(36) + "NAME");
  for (const k of keepers) {
    console.log("  " + k.role.padEnd(18) + k.email.padEnd(36) + k.name + (k.active ? "" : "  [inactive]"));
  }

  console.log("\nWILL DELETE these users:");
  for (const u of toDelete) {
    console.log("  " + u.role.padEnd(18) + u.email.padEnd(36) + u.name);
  }

  // Count operational data to be wiped.
  console.log("\nWILL WIPE operational data (all rows):");
  let totalRows = 0;
  for (const t of WIPE) {
    let c = 0;
    try { c = await prisma[t].count(); } catch { c = -1; }
    if (c > 0) console.log("  " + t.padEnd(22) + c);
    if (c > 0) totalRows += c;
  }
  console.log("  " + "(total rows)".padEnd(22) + totalRows);

  console.log("\nWILL KEEP (config + hierarchy structure):");
  for (const t of KEEP_TABLES) {
    let c = 0;
    try { c = await prisma[t].count(); } catch { c = -1; }
    console.log("  " + t.padEnd(22) + (c < 0 ? "n/a" : c));
  }

  if (!EXECUTE) {
    console.log("\nDRY RUN only — nothing was changed.");
    console.log("To perform the reset:  node scripts/reset-users.mjs --execute --confirm RESET\n");
    return;
  }
  if (!CONFIRMED) {
    console.log("\n[ABORTED] --execute requires --confirm RESET as a safety check. Nothing changed.\n");
    return;
  }

  console.log("\n>>> EXECUTING RESET...");
  const deleted = await wipeAll();
  console.log("  wiped: " + Object.entries(deleted).filter(([, n]) => n > 0).map(([k, n]) => k + "=" + n).join(", "));

  // Delete every non-keeper user (operational refs are gone; org refs are SetNull).
  const delUsers = await prisma.user.deleteMany({ where: { id: { notIn: [...keeperIds] } } });
  console.log("  deleted users: " + delUsers.count);

  const after = await prisma.user.count();
  console.log("\n>>> DONE. Users remaining: " + after + "\n");
}

main()
  .catch((e) => { console.error("RESET FAILED:", e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
