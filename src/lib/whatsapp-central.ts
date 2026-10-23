import { MessageChannel, MessageStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppApi } from "@/lib/messaging";
import { resolveTenantForOwnerOrProperty } from "@/lib/tenant";
import {
  getMessagingIntegrations,
  normalizePhone,
  saveMessagingIntegrations,
  whatsAppWebUrl,
} from "@/lib/messaging-settings";
import { getSetting, setSetting, getTenantSetting, setTenantSetting } from "@/lib/system-settings";
import { getWhatsAppWebStatus, sendViaWhatsAppWeb } from "@/lib/whatsapp-web-session";

/**
 * Central company WhatsApp number.
 *
 * Two ways to connect the number that notifications go out from:
 *   1. "cloud" — Meta WhatsApp Cloud API (token + phone number ID, verified against Graph API)
 *   2. "web"   — WhatsApp Web linked device (scan QR with the company phone)
 *
 * `sendCentralWhatsApp` picks whichever is connected and usable, so the rest of the
 * app can fire notifications to leads / customers / agents without caring how the
 * number is wired up.
 */

export const CENTRAL_KEYS = {
  METHOD: "whatsapp_central_method", // "cloud" | "web" | ""
  CLOUD_VERIFIED_NAME: "whatsapp_cloud_verified_name",
  CLOUD_DISPLAY_NUMBER: "whatsapp_cloud_display_number",
  CLOUD_QUALITY: "whatsapp_cloud_quality_rating",
  CLOUD_CONNECTED_AT: "whatsapp_cloud_connected_at",
} as const;

export type CentralMethod = "cloud" | "web" | "";

export type WhatsAppCloudInfo = {
  connected: boolean;
  verifiedName: string;
  displayNumber: string;
  qualityRating: string;
  connectedAt: string;
};

const GRAPH_VERSION = process.env.WHATSAPP_API_VERSION || "v19.0";

/**
 * Verify a WhatsApp Cloud API credential pair against Meta's Graph API.
 * Returns the phone number's business details on success, or throws with the
 * Meta error message on failure.
 */
export async function verifyWhatsAppCloud(token: string, phoneNumberId: string) {
  if (!token || !phoneNumberId) {
    throw new Error("Access token and phone number ID are both required.");
  }

  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(phoneNumberId)}` +
    `?fields=verified_name,display_phone_number,quality_rating,code_verification_status`;

  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch (e) {
    throw new Error(
      e instanceof Error ? `Network error reaching Meta: ${e.message}` : "Network error reaching Meta.",
    );
  }

  const data = (await res.json()) as {
    verified_name?: string;
    display_phone_number?: string;
    quality_rating?: string;
    code_verification_status?: string;
    error?: { message?: string };
  };

  if (!res.ok) {
    throw new Error(
      data.error?.message ||
        "Meta rejected these credentials. Check the access token and phone number ID.",
    );
  }

  return {
    verifiedName: data.verified_name || "",
    displayNumber: data.display_phone_number || "",
    qualityRating: data.quality_rating || "UNKNOWN",
    codeVerificationStatus: data.code_verification_status || "",
  };
}

/**
 * Verify + persist a Cloud API connection and make it the active central method.
 */
export async function connectWhatsAppCloud(token: string, phoneNumberId: string, tenantId?: string | null) {
  const info = await verifyWhatsAppCloud(token, phoneNumberId);

  await saveMessagingIntegrations({
    whatsappMode: "api",
    whatsappApiToken: token,
    whatsappPhoneNumberId: phoneNumberId,
    whatsappFromNumber: info.displayNumber || undefined,
  }, tenantId);

  await Promise.all([
    setTenantSetting(CENTRAL_KEYS.METHOD, "cloud", tenantId),
    setTenantSetting(CENTRAL_KEYS.CLOUD_VERIFIED_NAME, info.verifiedName, tenantId),
    setTenantSetting(CENTRAL_KEYS.CLOUD_DISPLAY_NUMBER, info.displayNumber, tenantId),
    setTenantSetting(CENTRAL_KEYS.CLOUD_QUALITY, info.qualityRating, tenantId),
    setTenantSetting(CENTRAL_KEYS.CLOUD_CONNECTED_AT, new Date().toISOString(), tenantId),
  ]);

  return info;
}

export async function getWhatsAppCloudInfo(tenantId?: string | null): Promise<WhatsAppCloudInfo> {
  const config = await getMessagingIntegrations(tenantId);
  const [verifiedName, displayNumber, qualityRating, connectedAt] = await Promise.all([
    getTenantSetting(CENTRAL_KEYS.CLOUD_VERIFIED_NAME, tenantId),
    getTenantSetting(CENTRAL_KEYS.CLOUD_DISPLAY_NUMBER, tenantId),
    getTenantSetting(CENTRAL_KEYS.CLOUD_QUALITY, tenantId),
    getTenantSetting(CENTRAL_KEYS.CLOUD_CONNECTED_AT, tenantId),
  ]);

  return {
    connected: Boolean(config.whatsappApiToken && config.whatsappPhoneNumberId && connectedAt),
    verifiedName,
    displayNumber,
    qualityRating,
    connectedAt,
  };
}

export async function getCentralMethod(tenantId?: string | null): Promise<CentralMethod> {
  return (await getTenantSetting(CENTRAL_KEYS.METHOD, tenantId)) as CentralMethod;
}

export async function setCentralMethod(method: CentralMethod, tenantId?: string | null) {
  await setTenantSetting(CENTRAL_KEYS.METHOD, method, tenantId);
}

export type CentralStatus = {
  activeMethod: CentralMethod;
  cloud: WhatsAppCloudInfo;
  web: ReturnType<typeof getWhatsAppWebStatus>;
  /** True when at least one method can actually deliver a message right now. */
  ready: boolean;
};

export async function getCentralStatus(tenantId?: string | null): Promise<CentralStatus> {
  const [activeMethod, cloud] = await Promise.all([getCentralMethod(tenantId), getWhatsAppCloudInfo(tenantId)]);
  const web = getWhatsAppWebStatus();
  const ready = cloud.connected || web.status === "ready";
  return { activeMethod, cloud, web, ready };
}

export type CentralSendResult = {
  ok: boolean;
  method: "cloud" | "web" | "link" | "none";
  externalId?: string;
  webUrl?: string;
  error?: string;
};

/**
 * Send a single WhatsApp message from the central company number.
 * Prefers the active method, then falls back to any other connected method,
 * and finally to a click-to-chat wa.me link so the message is never silently lost.
 */
export async function sendCentralWhatsApp(
  toPhone: string,
  body: string,
  tenantId?: string | null,
): Promise<CentralSendResult> {
  const phone = (toPhone || "").trim();
  if (!phone) return { ok: false, method: "none", error: "No phone number for recipient." };
  if (!body.trim()) return { ok: false, method: "none", error: "Message body is empty." };

  const [activeMethod, config] = await Promise.all([getCentralMethod(tenantId), getMessagingIntegrations(tenantId)]);
  const cloudReady = Boolean(config.whatsappApiToken && config.whatsappPhoneNumberId);
  const webReady = getWhatsAppWebStatus().status === "ready";

  // Ordered list of transports to attempt, active method first.
  const order: Array<"cloud" | "web"> =
    activeMethod === "web" ? ["web", "cloud"] : ["cloud", "web"];

  let lastError = "";
  for (const method of order) {
    try {
      if (method === "cloud" && cloudReady) {
        const result = await sendWhatsAppApi(phone, body, config);
        return { ok: true, method: "cloud", externalId: result.externalId };
      }
      if (method === "web" && webReady) {
        const result = await sendViaWhatsAppWeb(phone, body);
        return { ok: true, method: "web", externalId: result.externalId };
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Send failed";
    }
  }

  // Nothing connected — hand back a wa.me link so an operator can still send manually.
  if (!cloudReady && !webReady) {
    return {
      ok: false,
      method: "link",
      webUrl: whatsAppWebUrl(phone, body),
      error: "No central WhatsApp number is connected. Connect Cloud API or WhatsApp Web first.",
    };
  }

  return { ok: false, method: "none", error: lastError || "Failed to send WhatsApp message." };
}

// ─── Audience broadcast ──────────────────────────────────────────────────────

export type NotifyAudience = "leads" | "customers" | "agents";

export type Recipient = { id: string; name: string; phone: string };

/** Resolve the phone list for a broadcast audience. */
export async function resolveAudience(audience: NotifyAudience): Promise<Recipient[]> {
  if (audience === "leads") {
    const leads = await prisma.lead.findMany({
      where: { phone: { not: null } },
      select: { id: true, name: true, phone: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return leads
      .filter((l) => l.phone && l.phone.trim())
      .map((l) => ({ id: l.id, name: l.name, phone: l.phone! }));
  }

  const roles: Role[] =
    audience === "agents" ? [Role.AGENT, Role.EMPLOYEE] : [Role.BUYER, Role.SELLER];

  const users = await prisma.user.findMany({
    where: { role: { in: roles }, phone: { not: null }, active: true },
    select: { id: true, name: true, phone: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return users
    .filter((u) => u.phone && u.phone.trim())
    .map((u) => ({ id: u.id, name: u.name, phone: u.phone! }));
}

export type BroadcastResult = {
  audience: string;
  total: number;
  sent: number;
  failed: number;
  method: string;
  errors: string[];
};

/**
 * Replace merge fields in a message body. Supports both single- and
 * double-brace styles so CRM templates ({{name}}) and this panel's {name}
 * both work. Unknown/blank fields collapse to empty (or "there" for name).
 */
export function personalize(
  body: string,
  vars: { name?: string; email?: string; property?: string } = {},
): string {
  return body
    .replace(/\{\{?\s*name\s*\}?\}/gi, vars.name?.trim() || "there")
    .replace(/\{\{?\s*email\s*\}?\}/gi, vars.email?.trim() || "")
    .replace(/\{\{?\s*property\s*\}?\}/gi, vars.property?.trim() || "");
}

/** Core loop shared by every broadcast: send + log each recipient. */
export async function broadcastToRecipients(
  recipients: Array<{ id?: string | null; name?: string; phone: string }>,
  body: string,
  sentById: string,
  label: string,
): Promise<BroadcastResult> {
  const errors: string[] = [];
  let sent = 0;
  let failed = 0;
  let method = "none";

  const senderTenant = await resolveTenantForOwnerOrProperty(sentById);
  for (const r of recipients) {
    const personalized = personalize(body, { name: r.name });
    const result = await sendCentralWhatsApp(r.phone, personalized, senderTenant);
    if (result.ok) {
      sent += 1;
      method = result.method;
    } else {
      failed += 1;
      if (result.error && errors.length < 5) errors.push(`${r.phone}: ${result.error}`);
    }

    await prisma.messageLog
      .create({
        data: {
          tenantId: senderTenant,
          channel: result.method === "web" ? MessageChannel.WHATSAPP_WEB : MessageChannel.WHATSAPP,
          recipientId: r.id ?? null,
          sentById,
          toPhone: normalizePhone(r.phone),
          body: personalized,
          status: result.ok ? MessageStatus.SENT : MessageStatus.FAILED,
          provider: result.ok ? `central_${result.method}` : "central_error",
          externalId: result.externalId ?? null,
          webUrl: result.webUrl ?? null,
          error: result.error ?? null,
        },
      })
      .catch(() => {});
  }

  return { audience: label, total: recipients.length, sent, failed, method, errors };
}

/**
 * Broadcast a notification from the central number to an audience.
 * `{name}` in the body is replaced with each recipient's name.
 * Every attempt is written to MessageLog for auditing.
 */
export async function broadcastCentralWhatsApp(
  audience: NotifyAudience,
  body: string,
  sentById: string,
): Promise<BroadcastResult> {
  const recipients = await resolveAudience(audience);
  const result = await broadcastToRecipients(
    // Leads aren't Users, so don't attach their id as a MessageLog recipient.
    recipients.map((r) => ({ ...r, id: audience === "leads" ? null : r.id })),
    body,
    sentById,
    audience,
  );
  return result;
}

/** Dedupe + validate a raw phone list (from paste or a CSV/XLSX upload). */
export function cleanPhoneList(phones: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of phones) {
    const trimmed = (raw || "").trim();
    if (!trimmed) continue;
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) continue; // skip headers / junk
    if (seen.has(digits)) continue;
    seen.add(digits);
    out.push(trimmed);
  }
  return out;
}

/** Broadcast to an explicit list of phone numbers. */
export async function broadcastToPhones(
  phones: string[],
  body: string,
  sentById: string,
): Promise<BroadcastResult> {
  const cleaned = cleanPhoneList(phones);
  return broadcastToRecipients(
    cleaned.map((phone) => ({ phone })),
    body,
    sentById,
    "list",
  );
}

// ─── New-lead alert to the assigned agent ────────────────────────────────────

const money = (n?: number | null) => (n ? `₹${Math.round(n).toLocaleString("en-IN")}` : "—");

/**
 * Fire a WhatsApp alert to the agent a new lead was assigned to.
 * Fire-and-forget: never throws, so it can't break lead creation.
 */
export async function notifyAgentNewLead(leadId: string): Promise<void> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        owner: { select: { id: true, name: true, phone: true } },
        property: { select: { title: true, symbol: true } },
      },
    });
    if (!lead?.owner?.phone) return; // no assigned agent or no phone → nothing to do

    const budget =
      lead.budgetMin || lead.budgetMax
        ? `\nBudget: ${money(lead.budgetMin)} – ${money(lead.budgetMax)}`
        : "";
    const property = lead.property
      ? `\nProperty: ${lead.property.title} (${lead.property.symbol})`
      : "";

    const body =
      `🔔 New lead assigned to you\n\n` +
      `Name: ${lead.name}\n` +
      `Phone: ${lead.phone ?? "—"}\n` +
      `Email: ${lead.email}\n` +
      `Source: ${lead.source}` +
      property +
      budget +
      (lead.notes ? `\nNotes: ${lead.notes.slice(0, 200)}` : "");

    const result = await sendCentralWhatsApp(lead.owner.phone, body, lead.tenantId);

    await prisma.messageLog
      .create({
        data: {
          tenantId: lead.tenantId,
          channel:
            result.method === "web" ? MessageChannel.WHATSAPP_WEB : MessageChannel.WHATSAPP,
          recipientId: lead.owner.id,
          sentById: lead.owner.id,
          toPhone: normalizePhone(lead.owner.phone),
          body,
          status: result.ok ? MessageStatus.SENT : MessageStatus.FAILED,
          provider: result.ok ? `lead_alert_${result.method}` : "lead_alert_error",
          externalId: result.externalId ?? null,
          webUrl: result.webUrl ?? null,
          error: result.error ?? null,
        },
      })
      .catch(() => {});
  } catch (e) {
    console.error("notifyAgentNewLead failed:", e);
  }
}
