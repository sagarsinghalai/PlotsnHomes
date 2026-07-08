import { NextResponse } from "next/server";
import { MessageChannel } from "@prisma/client";
import { receiveIncomingMessage } from "@/lib/messaging";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const message = payload.message;
    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat?.id || "");
    const text = message.text || "";
    const messageId = String(message.message_id || "");

    if (!chatId || !text) {
      return NextResponse.json({ ok: false, error: "Missing chat ID or text" }, { status: 400 });
    }

    await receiveIncomingMessage({
      channel: MessageChannel.TELEGRAM,
      fromPhone: chatId,
      body: text,
      externalId: messageId,
      provider: "telegram",
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Error in Telegram webhook:", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Telegram webhook is active" });
}
