// ─────────────────────────────────────────────────────────────────────────
// Generates prisma/schema.mysql.prisma from the canonical prisma/schema.prisma
// (which is SQLite for local dev). It:
//   1. Swaps the datasource provider  sqlite -> mysql
//   2. Adds `@db.Text` to EVERY plain String column, so free-text / JSON values
//      can't overflow MySQL's default VARCHAR(191) ("value too long for column"
//      -> Prisma P2000, which aborts `prisma db push` during the Hostinger build).
//
// To stay valid, a String column is kept as VARCHAR (NOT turned into TEXT) when
// MySQL needs to index it — i.e. it is a primary key (@id / @@id), @unique /
// @@unique, part of an @@index, or a foreign-key scalar (listed in a @relation
// `fields: [...]`). MySQL can't index a TEXT column without a prefix length, so
// those must remain VARCHAR. Everything else becomes TEXT automatically, so
// adding a new free-text field never needs a change here.
//
// Run automatically by `npm run build:hostinger`. The output file is generated —
// do not edit it directly.
// ─────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "prisma", "schema.prisma");
const OUT = join(root, "prisma", "schema.mysql.prisma");

const src = readFileSync(SRC, "utf8");

if (!/provider\s*=\s*"sqlite"/.test(src)) {
  throw new Error('Expected prisma/schema.prisma to use provider "sqlite" (the local source of truth).');
}

const lines = src.split(/\r?\n/);

// ── Pass 1: for each model, collect the String columns that must stay VARCHAR
// because MySQL needs to index them (PK / unique / @@index / FK scalar). ──────
const protectedByModel = {}; // model -> Set<fieldName>
{
  let model = null;
  const bracketFields = (line) => {
    // Pull identifiers out of `[a, b(sort: Desc), c]`, ignoring modifiers/lengths.
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

    // Block-level: @@id([...]), @@unique([...]), @@index([...])
    if (/^\s*@@(id|unique|index)\s*\(/.test(line)) {
      for (const f of bracketFields(line)) set.add(f);
      continue;
    }
    // A field declaration: `name  Type ...attrs`
    const fm = line.match(/^\s*(\w+)\s+\S+/);
    if (fm) {
      const field = fm[1];
      if (/@id\b/.test(line) || /@unique\b/.test(line)) set.add(field);
      // Foreign-key scalars named in a relation's fields: [...]
      const rel = line.match(/fields:\s*\[([^\]]+)\]/);
      if (rel) for (const f of rel[1].split(",").map((s) => s.trim())) set.add(f);
    }
  }
}

// ── Pass 2: turn every unprotected String scalar into @db.Text. ───────────────
let model = null;
let applied = 0;
const converted = [];
const out = lines
  .map((line) => {
    const mm = line.match(/^\s*model\s+(\w+)\s*\{/);
    if (mm) { model = mm[1]; return line; }
    if (/^\s*\}/.test(line)) { model = null; return line; }
    if (!model) return line;

    const fm = line.match(/^\s*(\w+)\s+String(\?)?(\s|$)/);
    if (!fm) return line;                       // not a plain String scalar
    const field = fm[1];
    if (line.includes("@db.")) return line;      // already typed
    if (protectedByModel[model]?.has(field)) return line; // indexed/PK/unique/FK

    applied++;
    converted.push(`${model}.${field}`);
    return line.replace(/\s+$/, "") + " @db.Text";
  })
  .join("\n");

const mysql =
  "// AUTO-GENERATED from prisma/schema.prisma by scripts/generate-mysql-schema.mjs — DO NOT EDIT.\n" +
  out.replace(/provider\s*=\s*"sqlite"/, 'provider = "mysql"');

writeFileSync(OUT, mysql);
console.log(`Wrote prisma/schema.mysql.prisma (provider=mysql, @db.Text on ${applied} String columns).`);
