import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMessagingIntegrations, normalizePhone } from "@/lib/messaging-settings";
import { getCompanySettings } from "@/lib/company-settings";

export async function POST(req: Request) {
  try {
    const text = await req.text();
    const twilioBody = new URLSearchParams(text);
    const fromVal = twilioBody.get("From") || "";

    const config = await getMessagingIntegrations();
    const company = await getCompanySettings();

    let lead = null;
    let targetPhone = "";
    let leadId = "";
    let userId = "";

    // Suffix match lookup
    if (fromVal) {
      const digits = fromVal.replace(/\D/g, "");
      if (digits.length >= 8) {
        lead = await prisma.lead.findFirst({
          where: {
            phone: {
              contains: digits.slice(-8),
            },
          },
          include: { owner: true },
        });
      }
    }

    if (lead) {
      leadId = lead.id;
      if (lead.owner && lead.owner.phone) {
        targetPhone = normalizePhone(lead.owner.phone);
        userId = lead.owner.id;
      }
    }

    // Fallback to company default phone or Twilio web number
    if (!targetPhone) {
      const fallback = company.phone || config.whatsappWebNumber || "";
      targetPhone = normalizePhone(fallback);
    }

    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const appUrl = `${protocol}://${host}`;

    const callbackUrl = `${appUrl}/api/telephony/call-status-callback?leadId=${encodeURIComponent(leadId)}&userId=${encodeURIComponent(userId)}&inbound=true`;

    let xml = "";
    if (targetPhone) {
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling PlotsnHomes. We are forwarding your call to an agent now. Please hold.</Say>
  <Dial record="record-from-answer-dual" action="${callbackUrl}" method="POST">
    <Number>${targetPhone}</Number>
  </Dial>
</Response>`;
    } else {
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Thank you for calling PlotsnHomes. All of our agents are busy right now. Please try again later or send us an email.</Say>
</Response>`;
    }

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (e) {
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">A telephony system error occurred. We cannot connect your call right now.</Say>
</Response>`;
    return new Response(errorXml, {
      headers: {
        "Content-Type": "application/xml",
      },
      status: 500,
    });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
