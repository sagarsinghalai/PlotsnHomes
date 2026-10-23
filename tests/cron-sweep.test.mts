/**
 * Stage E — subscription expiry sweep endpoint.
 * Runner: `npx tsx tests/cron-sweep.test.mts`
 *
 * The /api/cron/subscription-sweep route rejects without the secret, and with it
 * flips ACTIVE-but-lapsed tenants to PAST_DUE.
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

process.env.CRON_SECRET = "test-cron-secret";

const { prisma } = await import("@/lib/prisma");
const { GET } = await import("@/app/api/cron/subscription-sweep/route");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

const tag = `cron_${Date.now()}`;
let orgId = "";

async function setup() {
  const org = await prisma.organization.create({
    data: { name: `${tag}_Org`, code: `${tag}`, status: "ACTIVE", subscriptionEndsAt: new Date(Date.now() - 60 * 1000) },
  });
  orgId = org.id;
}
async function cleanup() {
  await prisma.organization.deleteMany({ where: { id: orgId } }).catch(() => {});
}

test("rejects a request without the secret", async () => {
  const res = await GET(new Request("http://localhost/api/cron/subscription-sweep"));
  assert.equal(res.status, 401);
});

test("with the secret, flips the lapsed tenant to PAST_DUE", async () => {
  const res = await GET(new Request("http://localhost/api/cron/subscription-sweep", {
    headers: { "x-cron-secret": "test-cron-secret" },
  }));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.ok(body.ids.includes(orgId), "our lapsed org was transitioned");
  const after = await prisma.organization.findUnique({ where: { id: orgId }, select: { status: true } });
  assert.equal(after?.status, "PAST_DUE");
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
