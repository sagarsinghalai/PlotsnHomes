import { NextResponse } from "next/server";
import { MessageChannel } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { receiveIncomingMessage } from "@/lib/messaging";
import { createInboundLead } from "@/lib/inbound-lead";
import { verifyMetaSignature, exceedsWebhookLimit, safeEqual } from "@/lib/meta-webhook";
import { getWhatsAppConfig } from "@/lib/whatsapp-settings";
import { runBot } from "@/lib/whatsapp-bot";

export const dynamic = "force-dynamic";

const IS_PROD = process.env.NODE_ENV === "production";

// Meta subscription handshake: echo the challenge ONLY when the verify token
// matches. In production a verify token must be configured (fail closed).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const challenge = searchParams.get("hub.challenge");
    const token = searchParams.get("hub.verify_token");
    const expected = (await getWhatsAppConfig()).verifyToken;

    if (mode === "subscribe") {
      if (expected) {
        if (safeEqual(token, expected)) return new Response(challenge, { status: 200 });
        return new NextResponse("Forbidden", { status: 403 });
      }
      if (IS_PROD) return new NextResponse("Verify token not configured", { status: 403 });
      return new Response(challenge, { status: 200 });
    }
    return NextResponse.json({ ok: true, message: "WhatsApp webhook is active" });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/** Pull a property reference out of the enquiry text, e.g. "(Ref: BV-PROP-12)". */
async function resolvePropertyId(text: string): Promise<string | undefined> {
  const m = text.match(/Ref:\s*([A-Za-z0-9_-]+)/i);
  if (!m) return undefined;
  try {
    const prop = await prisma.property.findUnique({ where: { symbol: m[1] }, select: { id: true } });
    return prop?.id;
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  try {
    // Size guard before buffering.
    if (exceedsWebhookLimit(Number(req.headers.get("content-length") || 0))) {
      return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
    }

    const raw = await req.text();
    const appSecret = (await getWhatsAppConfig()).appSecret;
    const sig = req.headers.get("x-hub-signature-256");
    if (appSecret) {
      if (!verifyMetaSignature(raw, sig, appSecret)) {
        return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
      }
    } else if (IS_PROD) {
      return NextResponse.json({ ok: false, error: "Signature verification not configured" }, { status: 401 });
    }

    const payload = JSON.parse(raw);
    const value = payload.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    let textBody = message.text?.body || "";
    const fromPhone = message.from || "";
    const messageId = message.id || "";
    // The contact's WhatsApp display name (if the user allows it).
    const profileName: string = value?.contacts?.[0]?.profile?.name || "";

    if (message.type === "interactive" && message.interactive) {
      if (message.interactive.type === "button_reply") {
        textBody = message.interactive.button_reply?.title || "";
      } else if (message.interactive.type === "list_reply") {
        textBody = message.interactive.list_reply?.title || "";
      }
    }

    if (!fromPhone || !textBody) {
      return NextResponse.json({ ok: false, error: "Missing sender phone or message body" }, { status: 400 });
    }

    // 1) Capture/record the lead (property-tagged, auto-assigned, de-duplicated).
    //    De-dup inside createInboundLead prevents a new lead on every message.
    const propertyId = await resolvePropertyId(textBody);
    const leadResult = await createInboundLead({
      channel: "whatsapp",
      name: profileName || `WhatsApp ${fromPhone}`,
      phone: `+${fromPhone}`,
      message: textBody,
      sourceLabel: "WhatsApp",
      propertyId,
      rawPayload: { from: fromPhone, name: profileName, messageId, text: textBody },
    });

    // 2) Log the message into the conversation inbox (finds the lead just created
    //    by phone, so this does not create a duplicate) and notify the agent.
    await receiveIncomingMessage({
      channel: MessageChannel.WHATSAPP,
      fromPhone: `+${fromPhone}`,
      body: textBody,
      externalId: messageId,
      provider: "whatsapp_api",
    });

    // 3) Rule-based bot auto-reply (within the 24h window). Best-effort: stays
    //    silent once a human agent is engaged, and never breaks the webhook.
    try {
      await runBot({ leadId: leadResult.leadId, phone: `+${fromPhone}`, text: textBody });
    } catch (e) {
      console.warn("[whatsapp] bot run failed:", (e as Error)?.message);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error in WhatsApp webhook:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
