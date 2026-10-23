import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { getChannel } from "@/lib/lead-channels";
import { createInboundLead } from "@/lib/inbound-lead";

// Fire a sample lead through the real ingestion pipeline (bypasses the
// enabled/secret checks so admins can test before going live).
export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;
    const { channel } = await req.json();
    const cfg = await getChannel(channel, auth.tenantId);
    if (!cfg) return NextResponse.json({ success: false, error: "Unknown channel" }, { status: 400 });

    const stamp = Date.now().toString().slice(-5);
    const result = await createInboundLead({
      channel,
      name: `Test Lead ${stamp}`,
      phone: `+9199999${stamp}`,
      email: `test${stamp}@example.com`,
      message: `Sample ${cfg.label} lead created from the admin test button.`,
      tenantId: auth.tenantId,
      rawPayload: { test: true, channel },
    });
    return NextResponse.json({ success: true, result });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
