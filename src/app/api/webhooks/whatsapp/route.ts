import { NextResponse } from "next/server";
import { MessageChannel } from "@prisma/client";
import { receiveIncomingMessage } from "@/lib/messaging";
import { verifyMetaSignature, exceedsWebhookLimit, safeEqual } from "@/lib/meta-webhook";

const IS_PROD = process.env.NODE_ENV === "production";

// Meta subscription handshake: echo the challenge ONLY when the verify token
// matches. In production a verify token must be configured (fail closed).
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const challenge = searchParams.get("hub.challenge");
    const token = searchParams.get("hub.verify_token");
    const expected = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    if (mode === "subscribe") {
      if (expected) {
        if (safeEqual(token, expected)) return new Response(challenge, { status: 200 });
        return new NextResponse("Forbidden", { status: 403 });
      }
      // No verify token configured: allow only outside production.
      if (IS_PROD) return new NextResponse("Verify token not configured", { status: 403 });
      return new Response(challenge, { status: 200 });
    }
    return NextResponse.json({ ok: true, message: "WhatsApp webhook is active" });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    // Size guard before buffering.
    if (exceedsWebhookLimit(Number(req.headers.get("content-length") || 0))) {
      return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
    }

    // Verify X-Hub-Signature-256 over the raw body using the WhatsApp app secret.
    // Present → must be valid. Absent → allowed only outside production.
    const raw = await req.text();
    const appSecret = process.env.WHATSAPP_APP_SECRET || "";
    const sig = req.headers.get("x-hub-signature-256");
    if (appSecret) {
      if (!verifyMetaSignature(raw, sig, appSecret)) {
        return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
      }
    } else if (IS_PROD) {
      return NextResponse.json({ ok: false, error: "Signature verification not configured" }, { status: 401 });
    }

    const payload = JSON.parse(raw);

    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    let textBody = message.text?.body || "";
    const fromPhone = message.from || "";
    const messageId = message.id || "";

    // Handle interactive button or list replies
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

    await receiveIncomingMessage({
      channel: MessageChannel.WHATSAPP,
      fromPhone: `+${fromPhone}`,
      body: textBody,
      externalId: messageId,
      provider: "whatsapp_api",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error in WhatsApp webhook:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}
