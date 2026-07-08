import { NextResponse } from "next/server";
import { MessageChannel } from "@prisma/client";
import { receiveIncomingMessage } from "@/lib/messaging";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe") {
      return new Response(challenge, { status: 200 });
    }
    return NextResponse.json({ ok: true, message: "WhatsApp webhook is active" });
  } catch (e) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();

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
