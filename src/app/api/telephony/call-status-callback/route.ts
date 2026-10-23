import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrimaryTenantId } from "@/lib/tenant";
import { refreshLeadScore } from "@/lib/lead-scoring";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let leadId = searchParams.get("leadId") || "";
    const userId = searchParams.get("userId") || null;
    const isInbound = searchParams.get("inbound") === "true";

    const text = await req.text();
    const twilioBody = new URLSearchParams(text);
    
    const callStatus = twilioBody.get("CallStatus") || "completed";
    const callDuration = twilioBody.get("CallDuration") || "0";
    const recordingUrl = twilioBody.get("RecordingUrl") || "";
    const direction = twilioBody.get("Direction") || (isInbound ? "inbound" : "outbound-api");
    const fromVal = twilioBody.get("From") || "";

    // If inbound call from unknown number, auto-create a lead
    if (isInbound && !leadId && fromVal) {
      const cleaned = fromVal.replace(/\D/g, "");
      // Double check if lead exists now
      let existingLead = await prisma.lead.findFirst({
        where: {
          phone: { contains: cleaned.slice(-8) }
        }
      });

      if (!existingLead) {
        existingLead = await prisma.lead.create({
          data: {
            tenantId: await getPrimaryTenantId(),
            name: `Inbound Call ${fromVal}`,
            phone: fromVal,
            email: `${cleaned}@plotsnhomes.com`,
            source: "Telephony",
            stage: "NEW",
            notes: "Auto-created from inbound Twilio phone call.",
          }
        });
      }
      leadId = existingLead.id;
    }

    if (leadId) {
      const dirLabel = direction.toLowerCase().includes("inbound") ? "Incoming" : "Outgoing";
      const durationMinSec = `${Math.floor(Number(callDuration) / 60)}m ${Number(callDuration) % 60}s`;
      
      let message = `${dirLabel} Call: ${callStatus.toUpperCase()}. Duration: ${durationMinSec}.`;
      if (recordingUrl) {
        message += ` Recording: [Listen here](${recordingUrl})`;
      }

      const callLeadTenant =
        (await prisma.lead.findUnique({ where: { id: leadId }, select: { tenantId: true } }))?.tenantId
        ?? (await getPrimaryTenantId());
      await prisma.leadActivity.create({
        data: {
          tenantId: callLeadTenant,
          leadId,
          userId,
          type: "CALL",
          message,
        },
      });

      // Also log inside MessageLog (chat workspace history) as a PLATFORM message
      try {
        const leadObj = await prisma.lead.findUnique({
          where: { id: leadId },
        });

        if (leadObj) {
          let clientUser = await prisma.user.findFirst({
            where: { email: leadObj.email }
          });
          if (!clientUser && leadObj.phone) {
            const cleanPhone = leadObj.phone.replace(/\D/g, "");
            clientUser = await prisma.user.findFirst({
              where: { phone: { contains: cleanPhone.slice(-8) } }
            });
          }

          if (clientUser) {
            const isCallInbound = direction.toLowerCase().includes("inbound");
            await prisma.messageLog.create({
              data: {
                tenantId: leadObj.tenantId,
                channel: "PLATFORM",
                sentById: isCallInbound ? clientUser.id : (userId || clientUser.id),
                recipientId: isCallInbound ? (userId || null) : clientUser.id,
                body: `📞 ${dirLabel} Phone Call: ${callStatus.toUpperCase()}.\nDuration: ${durationMinSec}.${recordingUrl ? `\nRecording: ${recordingUrl}` : ""}`,
                status: "SENT",
                provider: "twilio_voice",
                toPhone: leadObj.phone,
                toEmail: leadObj.email,
              }
            });
          }
        }
      } catch (err) {
        console.error("Failed to log call in chat workspace:", err);
      }

      await refreshLeadScore(leadId);
    }

    // Always reply with TwiML Response
    const xml = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (e) {
    console.error("Error logging call status callback:", e);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
      headers: {
        "Content-Type": "application/xml",
      },
      status: 200, // Still return 200 to Twilio to avoid retries
    });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
