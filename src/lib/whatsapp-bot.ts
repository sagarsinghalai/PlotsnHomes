import { prisma } from "@/lib/prisma";
import { getTenantSetting, setTenantSetting } from "@/lib/system-settings";
import { sendWhatsAppText } from "@/lib/whatsapp-cloud";
import { getPrimaryTenantId, resolveTenantForOwnerOrProperty } from "@/lib/tenant";

/**
 * Rule-based WhatsApp auto-reply bot ("recorded responses"). Replies within the
 * 24-hour service window (free-form is allowed because the user just messaged),
 * matches keyword rules, and hands off to the assigned human agent on request.
 * It goes silent once a human is engaged, so it never talks over your team.
 */

const KEY = "whatsapp_bot";
const HANDOFF_WINDOW_MS = 24 * 60 * 60 * 1000;
const BOT_PROVIDER = "whatsapp_bot";
const CUSTOMER_ROLES = new Set(["BUYER", "SELLER", "DEMO"]);

export type BotRule = { id: string; keywords: string[]; reply: string };

export interface WhatsAppBotConfig {
  enabled: boolean;
  welcomeMessage: string;
  fallbackMessage: string;
  handoffKeywords: string[];
  handoffMessage: string;
  rules: BotRule[];
}

export const DEFAULT_BOT_CONFIG: WhatsAppBotConfig = {
  enabled: false,
  welcomeMessage:
    "Hi! Thanks for reaching out. I'm the PlotsnHomes assistant. Reply with:\n• PRICE – pricing & payment plans\n• VISIT – book a site visit\n• AGENT – talk to our team",
  fallbackMessage:
    "Thanks for your message! Reply PRICE, VISIT, or AGENT, and a team member will also get back to you shortly.",
  handoffKeywords: ["agent", "human", "representative", "call me", "talk to someone"],
  handoffMessage: "Sure — connecting you with one of our property experts. They'll reply here shortly. 🙌",
  rules: [
    { id: "price", keywords: ["price", "cost", "payment", "budget"], reply: "Happy to help with pricing! Our team will share the latest price sheet and payment plans for this property shortly. Meanwhile, is this for investment or end-use?" },
    { id: "visit", keywords: ["visit", "site visit", "tour", "see"], reply: "Great! We'd love to arrange a site visit. What day and time works best for you? Our team will confirm the appointment." },
  ],
};

export async function getBotConfig(tenantId?: string | null): Promise<WhatsAppBotConfig> {
  const raw = await getTenantSetting(KEY, tenantId);
  if (!raw) return { ...DEFAULT_BOT_CONFIG };
  try {
    return { ...DEFAULT_BOT_CONFIG, ...(JSON.parse(raw) as Partial<WhatsAppBotConfig>) };
  } catch {
    return { ...DEFAULT_BOT_CONFIG };
  }
}

export async function saveBotConfig(cfg: WhatsAppBotConfig, tenantId?: string | null): Promise<void> {
  await setTenantSetting(KEY, JSON.stringify(cfg), tenantId);
}

type RunInput = { leadId?: string | null; phone: string; text: string; tenantId?: string | null };
export type BotResult = { action: "silent" | "welcome" | "rule" | "fallback" | "handoff"; reply?: string; sent?: boolean; ruleId?: string };

/** True when a human agent has already stepped into this conversation. */
async function humanEngaged(leadId: string | null | undefined, phone: string): Promise<boolean> {
  // Explicit handoff recorded recently.
  if (leadId) {
    const handoff = await prisma.leadActivity.findFirst({
      where: { leadId, type: "BOT_HANDOFF", createdAt: { gte: new Date(Date.now() - HANDOFF_WINDOW_MS) } },
      select: { id: true },
    });
    if (handoff) return true;
  }
  // A staff member has sent a (non-bot) WhatsApp message to this contact.
  const staffMsg = await prisma.messageLog.findFirst({
    where: {
      channel: "WHATSAPP",
      toPhone: phone,
      provider: { not: BOT_PROVIDER },
      sentBy: { is: { role: { notIn: Array.from(CUSTOMER_ROLES) as any } } },
    },
    select: { id: true },
  });
  return !!staffMsg;
}

async function logBotMessage(leadId: string | null | undefined, phone: string, body: string, ok: boolean) {
  try {
    let sentById: string | null = null;
    let recipientId: string | null = null;
    if (leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { ownerId: true, email: true } });
      sentById = lead?.ownerId ?? null;
      if (lead?.email) {
        const u = await prisma.user.findUnique({ where: { email: lead.email }, select: { id: true } });
        recipientId = u?.id ?? null;
      }
    }
    if (!sentById) {
      const admin = await prisma.user.findFirst({ where: { role: "SUPERADMIN" }, select: { id: true } });
      sentById = admin?.id ?? null;
    }
    if (!sentById) return; // cannot satisfy the required sender; skip logging
    await prisma.messageLog.create({
      data: {
        tenantId: await resolveTenantForOwnerOrProperty(sentById),
        channel: "WHATSAPP",
        sentById,
        recipientId,
        toPhone: phone,
        body,
        status: ok ? "SENT" : "FAILED",
        provider: BOT_PROVIDER,
      },
    });
  } catch { /* logging must never break the bot */ }
}

export async function runBot({ leadId, phone, text, tenantId }: RunInput): Promise<BotResult> {
  const cfg = await getBotConfig(tenantId);
  if (!cfg.enabled) return { action: "silent" };

  if (await humanEngaged(leadId, phone)) return { action: "silent" };

  const lower = (text || "").toLowerCase();
  let action: BotResult["action"] = "fallback";
  let reply = cfg.fallbackMessage;
  let ruleId: string | undefined;

  if (cfg.handoffKeywords.some((k) => k && lower.includes(k.toLowerCase()))) {
    action = "handoff";
    reply = cfg.handoffMessage;
    if (leadId) {
      const leadTenant =
        (await prisma.lead.findUnique({ where: { id: leadId }, select: { tenantId: true } }))?.tenantId
        ?? (await getPrimaryTenantId());
      await prisma.leadActivity.create({
        data: { tenantId: leadTenant, leadId, type: "BOT_HANDOFF", message: "Lead requested a human agent on WhatsApp." },
      }).catch(() => {});
    }
  } else {
    const rule = cfg.rules.find((r) => r.keywords.some((k) => k && lower.includes(k.toLowerCase())));
    if (rule) {
      action = "rule";
      reply = rule.reply;
      ruleId = rule.id;
    } else {
      // Welcome on the first bot interaction; fallback afterwards.
      const priorBot = await prisma.messageLog.findFirst({ where: { toPhone: phone, provider: BOT_PROVIDER }, select: { id: true } });
      if (!priorBot) { action = "welcome"; reply = cfg.welcomeMessage; }
    }
  }

  if (!reply?.trim()) return { action: "silent" };

  const sendRes = await sendWhatsAppText(phone, reply, tenantId);
  await logBotMessage(leadId, phone, reply, sendRes.ok);
  return { action, reply, sent: sendRes.ok, ruleId };
}
