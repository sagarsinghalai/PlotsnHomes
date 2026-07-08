import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const leadPhone = searchParams.get("leadPhone") || "";
    const leadId = searchParams.get("leadId") || "";
    const userId = searchParams.get("userId") || "";

    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const host = req.headers.get("host");
    const appUrl = `${protocol}://${host}`;

    const callbackUrl = `${appUrl}/api/telephony/call-status-callback?leadId=${encodeURIComponent(leadId)}&userId=${encodeURIComponent(userId)}`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Connecting you to the lead. Please hold.</Say>
  <Dial record="record-from-answer-dual" action="${callbackUrl}" method="POST">
    <Number>${leadPhone}</Number>
  </Dial>
</Response>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (e) {
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">A server error occurred. Cannot place call.</Say>
</Response>`;
    return new Response(errorXml, {
      headers: {
        "Content-Type": "application/xml",
      },
      status: 500,
    });
  }
}

// Twilio may also do a GET request depending on settings
export async function GET(req: Request) {
  return POST(req);
}
