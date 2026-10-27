/**
 * Subscription lifecycle emails — recipient resolution, reminder dedup, and the
 * sweep helper. Runner: `npx tsx tests/subscription-emails.test.mts`
 * (Email sending runs in dev-simulation mode; no real mail is sent.)
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
// Force dev-simulation for email (never hit a real provider from a test).
delete process.env.RESEND_API_KEY;

const { prisma } = await import("@/lib/prisma");
const { sendLapseNotice, sweepSubscriptionEmails } = await import("@/lib/subscription-emails");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

const tag = `se_${Date.now()}`;
let orgId = "", adminId = "";

async function setup() {
  const org = await prisma.organization.create({
    data: { name: `${tag} Agency`, code: `${tag}-AG`, status: "ACTIVE", subscriptionEndsAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  orgId = org.id;
  const admin = await prisma.user.create({
    data: { tenantId: orgId, email: `${tag}-admin@x.test`, name: "Partner Owner", passwordHash: "x", role: "WHITE_LABEL_ADMIN", active: true },
  });
  adminId = admin.id;
  await prisma.organization.update({ where: { id: orgId }, data: { whiteLabelAdminId: adminId } });
}
async function cleanup() {
  if (orgId) {
    await prisma.tenantSetting.deleteMany({ where: { tenantId: orgId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { tenantId: orgId } }).catch(() => {});
    await prisma.organization.deleteMany({ where: { id: orgId } }).catch(() => {});
  }
}

test("lapse notice resolves the workspace admin and sends", async () => {
  assert.equal(await sendLapseNotice(orgId), true, "sends to the WL admin");
});

test("lapse notice returns false when no org/recipient exists", async () => {
  assert.equal(await sendLapseNotice(`nope_${tag}`), false);
});

test("sweep reminds a soon-expiring tenant and stores a period-end dedup marker", async () => {
  const first = await sweepSubscriptionEmails([], new Date());
  assert.ok(first.reminders >= 1, "reminds the soon-expiring tenant at least once");

  const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { subscriptionEndsAt: true } });
  const marker = await prisma.tenantSetting.findFirst({ where: { tenantId: orgId, key: "sub_reminder_for" } });
  assert.equal(marker?.value, org?.subscriptionEndsAt?.toISOString(), "marker records the exact period-end that was reminded");
});

test("a second sweep does not re-remind the same tenant for the same period", async () => {
  const before = await prisma.emailLog.count({ where: { to: { contains: `${tag}-admin@x.test` } } }).catch(() => -1);
  await sweepSubscriptionEmails([], new Date());
  if (before >= 0) {
    const after = await prisma.emailLog.count({ where: { to: { contains: `${tag}-admin@x.test` } } });
    assert.equal(after, before, "no new reminder email for the already-reminded period");
  }
});

test("sweep counts lapse notices for flipped ids", async () => {
  const res = await sweepSubscriptionEmails([orgId], new Date());
  assert.ok(res.lapses >= 1, "a flipped org with an admin gets a lapse notice");
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
