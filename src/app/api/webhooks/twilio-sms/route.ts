import { NextResponse } from "next/server";
import { MessageChannel } from "@prisma/client";
import { receiveIncomingMessage } from "@/lib/messaging";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    
    const fromPhone = params.get("From") || "";
    const body = params.get("Body") || "";
    const messageSid = params.get("MessageSid") || "";

    if (!fromPhone || !body) {
      return new Response("Missing From or Body parameters", { status: 400 });
    }

    await receiveIncomingMessage({
      channel: MessageChannel.SMS,
      fromPhone,
      body,
      externalId: messageSid,
      provider: "twilio_sms",
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    return new Response(xml, {
      headers: { "Content-Type": "application/xml" },
    });
  } catch (e) {
    console.error("Error in Twilio SMS webhook:", e);
    return new Response("Webhook Error", { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Twilio SMS webhook is active" });
}
