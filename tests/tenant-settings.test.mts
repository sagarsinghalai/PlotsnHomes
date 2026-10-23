/**
 * Phase B6 — per-tenant settings & integration isolation.
 * Runner: `npx tsx tests/tenant-settings.test.mts`
 *
 * Proves each tenant has its own WhatsApp number/credentials, bot config, lead
 * channels and campaign templates — tenant A's config is never served to tenant
 * B — and that the inbound WhatsApp number and channel-secret resolvers map a
 * message back to the owning tenant.
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

// Deterministic encryption key for the credential round-trips.
process.env.CREDENTIALS_ENC_KEY = process.env.CREDENTIALS_ENC_KEY || "a".repeat(64);

const { prisma } = await import("@/lib/prisma");
const { getTenantSetting, setTenantSetting, getSetting, setSetting } = await import("@/lib/system-settings");
const { getWhatsAppConfig, saveWhatsAppConfig, resolveTenantByPhoneNumberId } = await import("@/lib/whatsapp-settings");
const { getBotConfig, saveBotConfig, DEFAULT_BOT_CONFIG } = await import("@/lib/whatsapp-bot");
const { getChannel, saveLeadChannels, getLeadChannels, resolveTenantByChannelSecret } = await import("@/lib/lead-channels");
const { getCrmSettings, saveCrmSettings } = await import("@/lib/crm-settings");

let pass = 0, fail = 0;
const queue: Array<[string, () => void | Promise<void>]> = [];
function test(name: string, fn: () => void | Promise<void>) { queue.push([name, fn]); }
async function runAll() {
  for (const [name, fn] of queue) {
    try { await fn(); pass++; console.log("  ✓", name); }
    catch (e: any) { fail++; console.error("  ✗", name, "\n     ", e?.message); }
  }
}

const tag = `b6_${Date.now()}`;
let orgAId = "", orgBId = "";
const KEYS = ["whatsapp_business", "whatsapp_bot", "lead_channels", "crm_message_templates", `probe_${tag}`];

async function setup() {
  const a = await prisma.organization.create({ data: { name: `${tag}_A`, code: `${tag}_A` } });
  const b = await prisma.organization.create({ data: { name: `${tag}_B`, code: `${tag}_B` } });
  orgAId = a.id; orgBId = b.id;
}
async function cleanup() {
  await prisma.tenantSetting.deleteMany({ where: { tenantId: { in: [orgAId, orgBId].filter(Boolean) } } });
  await prisma.systemSetting.deleteMany({ where: { key: `probe_${tag}` } });
  await prisma.organization.deleteMany({ where: { id: { in: [orgAId, orgBId].filter(Boolean) } } });
}

test("tenant setting is isolated per tenant, with global fallback", async () => {
  await setSetting(`probe_${tag}`, "GLOBAL");
  await setTenantSetting(`probe_${tag}`, "A-VALUE", orgAId);
  assert.equal(await getTenantSetting(`probe_${tag}`, orgAId), "A-VALUE", "A sees its own value");
  assert.equal(await getTenantSetting(`probe_${tag}`, orgBId), "GLOBAL", "B falls back to global");
});

test("each tenant has its own WhatsApp number & credentials", async () => {
  await saveWhatsAppConfig(
    { enabled: true, displayNumber: "+91 1111111111", phoneNumberId: "PNID_A", apiVersion: "v20.0", accessToken: "tokenA", appSecret: "secretA", verifyToken: "vtA" },
    orgAId,
  );
  await saveWhatsAppConfig(
    { enabled: true, displayNumber: "+91 2222222222", phoneNumberId: "PNID_B", apiVersion: "v20.0", accessToken: "tokenB", appSecret: "secretB", verifyToken: "vtB" },
    orgBId,
  );
  const a = await getWhatsAppConfig(orgAId);
  const b = await getWhatsAppConfig(orgBId);
  assert.equal(a.phoneNumberId, "PNID_A");
  assert.equal(b.phoneNumberId, "PNID_B");
  assert.equal(a.accessToken, "tokenA", "secrets decrypt back to each tenant's own value");
  assert.notEqual(a.displayNumber, b.displayNumber, "numbers must differ per tenant");
});

test("inbound WhatsApp number resolves to the owning tenant", async () => {
  assert.equal(await resolveTenantByPhoneNumberId("PNID_A"), orgAId);
  assert.equal(await resolveTenantByPhoneNumberId("PNID_B"), orgBId);
  assert.equal(await resolveTenantByPhoneNumberId("UNKNOWN"), null, "unknown number resolves to no tenant");
});

test("each tenant has its own bot config", async () => {
  await saveBotConfig({ ...DEFAULT_BOT_CONFIG, enabled: true, welcomeMessage: "Welcome to A" }, orgAId);
  await saveBotConfig({ ...DEFAULT_BOT_CONFIG, enabled: false, welcomeMessage: "Welcome to B" }, orgBId);
  const a = await getBotConfig(orgAId);
  const b = await getBotConfig(orgBId);
  assert.equal(a.welcomeMessage, "Welcome to A");
  assert.equal(b.welcomeMessage, "Welcome to B");
  assert.equal(a.enabled, true);
  assert.equal(b.enabled, false);
});

test("each tenant has its own lead channels; secret resolves to its tenant", async () => {
  const chA = await getLeadChannels(orgAId);
  chA.generic.enabled = true;
  chA.generic.secret = `secretA_${tag}`;
  await saveLeadChannels(chA, orgAId);

  const chB = await getLeadChannels(orgBId);
  chB.generic.enabled = true;
  chB.generic.secret = `secretB_${tag}`;
  await saveLeadChannels(chB, orgBId);

  const gotA = await getChannel("generic", orgAId);
  const gotB = await getChannel("generic", orgBId);
  assert.equal(gotA?.secret, `secretA_${tag}`, "A's secret decrypts to A's value");
  assert.equal(gotB?.secret, `secretB_${tag}`);

  const resolvedA = await resolveTenantByChannelSecret("generic", `secretA_${tag}`);
  const resolvedB = await resolveTenantByChannelSecret("generic", `secretB_${tag}`);
  assert.equal(resolvedA?.tenantId, orgAId, "A's webhook secret maps to tenant A");
  assert.equal(resolvedB?.tenantId, orgBId);
  assert.equal(await resolveTenantByChannelSecret("generic", "nope"), null);
});

test("each tenant has its own campaign/message templates", async () => {
  await saveCrmSettings({ messageTemplates: [{ id: "a1", name: "A tmpl", channel: "whatsapp", body: "A" }] }, orgAId);
  await saveCrmSettings({ messageTemplates: [{ id: "b1", name: "B tmpl", channel: "whatsapp", body: "B" }] }, orgBId);
  const a = await getCrmSettings(orgAId);
  const b = await getCrmSettings(orgBId);
  assert.equal(a.messageTemplates[0]?.id, "a1");
  assert.equal(b.messageTemplates[0]?.id, "b1");
  assert.notDeepEqual(a.messageTemplates, b.messageTemplates, "templates must differ per tenant");
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
