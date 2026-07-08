import { NextResponse } from "next/server";
import { requireCrmApi } from "@/lib/crm-access";
import { prisma } from "@/lib/prisma";
import { getMessagingIntegrations, normalizePhone } from "@/lib/messaging-settings";

export async function POST(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;

  try {
    const { leadId, leadPhone } = await req.json();
    if (!leadPhone) {
      return NextResponse.json({ error: "Lead phone number is required" }, { status: 400 });
    }

    const config = await getMessagingIntegrations();
    if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioFromPhone) {
      return NextResponse.json(
        { error: "Twilio voice is not configured. Configure SID, Token and From Number in Integrations." },
        { status: 400 }
      );
    }

    const agent = await prisma.user.findUnique({
      where: { id: auth.session!.user.id },
    });

    const rawAgentPhone = agent?.phone || config.whatsappWebNumber || "";
    const agentPhone = normalizePhone(rawAgentPhone);
    if (!agentPhone) {
      return NextResponse.json(
        { error: "Please set your phone number on your user profile first." },
        { status: 400 }
      );
    }

    const targetLeadPhone = normalizePhone(leadPhone);
    const twilioFrom = normalizePhone(config.twilioFromPhone);

    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const appUrl = `${protocol}://${host}`;

    // Place Twilio Call
    const authHeader = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString("base64");
    const params = new URLSearchParams({
      From: twilioFrom,
      To: agentPhone,
      Url: `${appUrl}/api/telephony/outbound-twiml?leadPhone=${encodeURIComponent(targetLeadPhone)}&leadId=${leadId || ""}&userId=${agent!.id}`,
      StatusCallback: `${appUrl}/api/telephony/call-status-callback?leadId=${leadId || ""}&userId=${agent!.id}`,
      StatusCallbackEvent: "completed",
      Record: "true",
    });

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Calls.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const data = await twilioRes.json();
    if (!twilioRes.ok) {
      return NextResponse.json(
        { error: data.message || "Twilio failed to place the call." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Placing call. Twilio will dial your phone first, then connect to the lead.",
      callSid: data.sid,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to initiate call";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
