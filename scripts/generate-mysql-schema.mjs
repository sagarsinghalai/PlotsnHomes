// ─────────────────────────────────────────────────────────────────────────
// Generates prisma/schema.mysql.prisma from the canonical prisma/schema.prisma
// (which is SQLite for local dev). It:
//   1. Swaps the datasource provider  sqlite -> mysql
//   2. Adds `@db.Text` to long free-text / JSON fields so they don't overflow
//      MySQL's default VARCHAR(191) at runtime ("Data too long for column").
//
// Run automatically by `npm run build:hostinger`. You normally never run it by
// hand. The output file is generated — do not edit it directly.
//
// ▸ If you add a new model field that stores long text or a JSON blob, add its
//   { Model: [fields] } entry to TEXT_FIELDS below so it becomes TEXT in prod.
//   (Do NOT add @id / @unique / indexed / foreign-key columns here — MySQL can't
//    index a TEXT column without a prefix length, and db push would fail.)
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "prisma", "schema.prisma");
const OUT = join(root, "prisma", "schema.mysql.prisma");

/** Model -> String fields that must become @db.Text on MySQL. */
const TEXT_FIELDS = {
  Property: ["description", "images", "priceHistory", "videos", "pdfs", "features", "customFields", "virtualTourUrl"],
  Lead: ["notes", "requirements", "suggestedPropertyIds"],
  LeadActivity: ["message"],
  Transaction: ["description", "notes"],
  Inquiry: ["message"],
  EmailLog: ["html", "error"],
  SystemSetting: ["value"],
  MessageLog: ["body", "webUrl", "error"],
  MeetingInvite: ["message", "calendlyUrl", "customUrl", "notes"],
  KycProfile: ["adminNotes"],
  LoanApplication: ["purpose", "adminNotes"],
  PropertyShowing: ["message"],
  BulkJob: ["error"],
  Developer: ["description"],
  DeveloperTask: ["description"],
  BrokerageInvoice: ["propertyAddress", "lineItemsJson", "notes"],
  SubscriptionPlan: ["description", "featuresJson"],
  UserSubscription: ["notes"],
  CustomFieldDef: ["options"],
  UserActivity: ["body", "subject", "outcome"],
  ActivityComment: ["body"],
};

const src = readFileSync(SRC, "utf8");

if (!/provider\s*=\s*"sqlite"/.test(src)) {
  throw new Error("Expected prisma/schema.prisma to use provider \"sqlite\" (the local source of truth).");
}

const lines = src.split(/\r?\n/);
let currentModel = null;
let applied = 0;

const out = lines.map((line) => {
  const modelMatch = line.match(/^\s*model\s+(\w+)\s*\{/);
  if (modelMatch) { currentModel = modelMatch[1]; return line; }
  if (/^\s*\}/.test(line)) { currentModel = null; return line; }

  if (currentModel && TEXT_FIELDS[currentModel]) {
    const field = line.trim().split(/\s+/)[0];
    const isTarget = TEXT_FIELDS[currentModel].includes(field);
    const isString = /^\s*\w+\s+String\b/.test(line);
    if (isTarget && isString && !line.includes("@db.Text")) {
      applied++;
      return line.replace(/\s+$/, "") + " @db.Text";
    }
  }
  return line;
}).join("\n");

const expected = Object.values(TEXT_FIELDS).reduce((n, f) => n + f.length, 0);
if (applied !== expected) {
  throw new Error(`@db.Text applied to ${applied} fields but expected ${expected}. ` +
    `A field in TEXT_FIELDS no longer matches prisma/schema.prisma — update the map.`);
}

const mysql = "// AUTO-GENERATED from prisma/schema.prisma by scripts/generate-mysql-schema.mjs — DO NOT EDIT.\n" +
  out.replace(/provider\s*=\s*"sqlite"/, 'provider = "mysql"');

writeFileSync(OUT, mysql);
console.log(`Wrote prisma/schema.mysql.prisma (provider=mysql, @db.Text on ${applied} fields).`);
