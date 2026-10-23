/**
 * Stage B — per-domain public tenant resolution.
 * Runner: `npx tsx tests/public-tenant.test.mts`
 *
 * A visitor's host resolves to the owning tenant: exact custom domain first,
 * then a subdomain label matching the org code, else the primary tenant. Port
 * and case are ignored; a DELETED org never resolves.
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

const { prisma } = await import("@/lib/prisma");
const { resolvePublicTenantId } = await import("@/lib/public-tenant");
const { getPrimaryTenantId } = await import("@/lib/tenant");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

const tag = `pt_${Date.now()}`;
let acmeId = "", brickId = "", deletedId = "", primaryId = "";

async function setup() {
  const acme = await prisma.organization.create({
    data: { name: `${tag}_Acme`, code: `acme${tag}`, domain: `acme-${tag}.com` },
  });
  const brick = await prisma.organization.create({
    data: { name: `${tag}_Brick`, code: `brick${tag}`, domain: `brick-${tag}.com` },
  });
  const deleted = await prisma.organization.create({
    data: { name: `${tag}_Dead`, code: `dead${tag}`, domain: `dead-${tag}.com`, status: "DELETED" },
  });
  acmeId = acme.id; brickId = brick.id; deletedId = deleted.id;
  primaryId = await getPrimaryTenantId();
}
async function cleanup() {
  await prisma.organization.deleteMany({ where: { id: { in: [acmeId, brickId, deletedId].filter(Boolean) } } });
}

test("exact custom domain resolves to its tenant (port + case ignored)", async () => {
  assert.equal(await resolvePublicTenantId(`acme-${tag}.com`), acmeId);
  assert.equal(await resolvePublicTenantId(`ACME-${tag}.COM:3001`), acmeId, "case + port ignored");
  assert.equal(await resolvePublicTenantId(`brick-${tag}.com`), brickId);
});

test("subdomain label resolves by org code", async () => {
  assert.equal(await resolvePublicTenantId(`acme${tag}.platform.test`), acmeId);
  assert.equal(await resolvePublicTenantId(`brick${tag}.localhost`), brickId);
});

test("unknown host falls back to the primary tenant", async () => {
  assert.equal(await resolvePublicTenantId("totally-unknown-host.example"), primaryId);
  assert.equal(await resolvePublicTenantId(""), primaryId);
  assert.equal(await resolvePublicTenantId(null), primaryId);
});

test("a DELETED org's domain does NOT resolve (falls back to primary)", async () => {
  assert.equal(await resolvePublicTenantId(`dead-${tag}.com`), primaryId);
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
