// ─────────────────────────────────────────────────────────────────────────
// Generates prisma/schema.mysql.prisma from the canonical prisma/schema.prisma
// (which is SQLite for local dev). It swaps the datasource provider sqlite->mysql
// and widens free-text / JSON String columns to @db.Text so their values can't
// overflow MySQL's default VARCHAR(191) ("value too long" -> Prisma P2000, which
// aborts `prisma db push` during the Hostinger build).
//
// Rules for turning a String column into @db.Text (applied automatically so new
// free-text fields need no change here):
//   • A column MySQL must index — primary key (@id/@@id), @unique/@@unique, an
//     @@index member, or a foreign-key scalar (a @relation `fields: [...]`) —
//     stays VARCHAR. MySQL can't index TEXT without a prefix length.
//   • MySQL forbids a DEFAULT on a TEXT column. So:
//       - no @default            -> @db.Text
//       - nullable + @default    -> @db.Text and the @default is dropped
//                                   (nullable stays optional, so no insert/build break)
//       - NOT NULL + @default    -> left as VARCHAR (these are short status/flag/
//                                   config values that never overflow), EXCEPT the
//                                   few already-TEXT-in-prod blobs listed in
//                                   FORCE_TEXT, which keep their default so the
//                                   generated client keeps the field optional.
//
// Run automatically by `npm run build:hostinger`. The output is generated — do
// not edit prisma/schema.mysql.prisma directly.
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "prisma", "schema.prisma");
const OUT = join(root, "prisma", "schema.mysql.prisma");

// NOT NULL String columns with a @default are left as VARCHAR (see rules above):
// MySQL forbids a DEFAULT on TEXT, and dropping the default would make the field
// required in the generated client (build break). These defaulted columns hold
// short values (status/flags) or JSON arrays that fit VARCHAR(191) in practice;
// if one genuinely needs to grow, make it nullable in prisma/schema.prisma and it
// will auto-convert to TEXT. FORCE_TEXT is intentionally empty.
const FORCE_TEXT = {};

const src = readFileSync(SRC, "utf8");
if (!/provider\s*=\s*"sqlite"/.test(src)) {
  throw new Error('Expected prisma/schema.prisma to use provider "sqlite" (the local source of truth).');
}
const lines = src.split(/\r?\n/);

// ── Pass 1: per model, collect String columns that must stay VARCHAR (indexed). ─
const protectedByModel = {};
{
  let model = null;
  const bracketFields = (line) => {
    const m = line.match(/\[([^\]]+)\]/);
    if (!m) return [];
    return m[1].split(",").map((s) => s.trim().replace(/[([].*$/, "").trim()).filter(Boolean);
  };
  for (const line of lines) {
    const mm = line.match(/^\s*model\s+(\w+)\s*\{/);
    if (mm) { model = mm[1]; protectedByModel[model] = new Set(); continue; }
    if (/^\s*\}/.test(line)) { model = null; continue; }
    if (!model) continue;
    const set = protectedByModel[model];
    if (/^\s*@@(id|unique|index)\s*\(/.test(line)) { for (const f of bracketFields(line)) set.add(f); continue; }
    const fm = line.match(/^\s*(\w+)\s+\S+/);
    if (fm) {
      const field = fm[1];
      if (/@id\b/.test(line) || /@unique\b/.test(line)) set.add(field);
      const rel = line.match(/fields:\s*\[([^\]]+)\]/);
      if (rel) for (const f of rel[1].split(",").map((s) => s.trim())) set.add(f);
    }
  }
}

// ── Pass 2: apply @db.Text (and drop @default where required). ────────────────
let model = null;
let applied = 0;
const out = lines
  .map((line) => {
    const mm = line.match(/^\s*model\s+(\w+)\s*\{/);
    if (mm) { model = mm[1]; return line; }
    if (/^\s*\}/.test(line)) { model = null; return line; }
    if (!model) return line;

    const fm = line.match(/^\s*(\w+)\s+String(\?)?(\s|$)/);
    if (!fm) return line;                              // not a plain String scalar
    const field = fm[1];
    if (line.includes("@db.")) return line;            // already typed
    if (protectedByModel[model]?.has(field)) return line; // indexed/PK/unique/FK

    // Separate any trailing `//` comment so appended attributes don't land inside
    // it (no schema @default contains `//`, so this split is safe).
    const ci = line.indexOf("//");
    let code = ci >= 0 ? line.slice(0, ci) : line;
    const comment = ci >= 0 ? line.slice(ci).trimEnd() : "";

    // Look at the column's default (if any). Only a simple string-literal default
    // is handled here; a short one (status/currency/flags) means the column can't
    // overflow, so we leave it VARCHAR. A JSON-blob default ("[]"/"{}") marks a
    // column that CAN grow, so it must become TEXT.
    const defMatch = code.match(/@default\("([^"]*)"\)/);
    const hasDefault = /@default\(/.test(code);
    const blobDefault = defMatch && (defMatch[1] === "[]" || defMatch[1] === "{}");

    // Keep VARCHAR when there is a default that is NOT a JSON blob (short values),
    // or a non-string-literal default we don't rewrite (e.g. cuid()).
    if (hasDefault && !blobDefault) return line;

    applied++;
    code = code.replace(/\s+$/, "");
    if (blobDefault) {
      // MySQL forbids a *literal* DEFAULT on TEXT but allows an *expression*
      // default (MySQL 8.0.13+). Rewrite @default("[]") -> @default(dbgenerated("('[]')"))
      // so the column stays TEXT, keeps a working default, and stays optional in
      // the generated client (no required-field build break, no null reads).
      code = code.replace(/@default\("([^"]*)"\)/, (_m, v) => `@default(dbgenerated("('${v}')"))`);
    }
    code += " @db.Text";
    return comment ? `${code} ${comment}` : code;
  })
  .join("\n");

const mysql =
  "// AUTO-GENERATED from prisma/schema.prisma by scripts/generate-mysql-schema.mjs — DO NOT EDIT.\n" +
  out.replace(/provider\s*=\s*"sqlite"/, 'provider = "mysql"');

writeFileSync(OUT, mysql);
console.log(`Wrote prisma/schema.mysql.prisma (provider=mysql, @db.Text on ${applied} String columns).`);
