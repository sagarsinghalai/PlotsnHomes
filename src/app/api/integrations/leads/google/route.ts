import { NextResponse } from "next/server";
import { getChannel, resolveTenantByChannelSecret } from "@/lib/lead-channels";
import { createInboundLead } from "@/lib/inbound-lead";
import { exceedsWebhookLimit, safeEqual } from "@/lib/meta-webhook";

export const dynamic = "force-dynamic";

// Google Ads Lead Form webhook. Google POSTs JSON containing a shared
// `google_key` and a `user_column_data` array; it expects a 200 with `{}`.
export async function POST(req: Request) {
  // Abuse / DoS guard — reject by declared size before buffering the body.
  if (exceedsWebhookLimit(Number(req.headers.get("content-length") || 0))) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* ignore */ }

  // Resolve the tenant by the presented google_key; fall back to global config.
  const resolved = await resolveTenantByChannelSecret("google", body?.google_key);
  const tenantId = resolved?.tenantId ?? null;
  const cfg = resolved?.cfg ?? (await getChannel("google"));

  if (!resolved && cfg?.googleKey) {
    if (!safeEqual(body?.google_key, cfg.googleKey)) {
      return NextResponse.json({ error: "Invalid google_key" }, { status: 401 });
    }
  }
  if (!cfg?.enabled) return NextResponse.json({ error: "Channel disabled" }, { status: 200 });

  const cols: Record<string, string> = {};
  for (const c of body?.user_column_data || []) {
    cols[String(c.column_id || "").toUpperCase()] = c.string_value ?? c.value ?? "";
  }

  await createInboundLead({
    channel: "google",
    name: cols["FULL_NAME"] || cols["NAME"] || [cols["FIRST_NAME"], cols["LAST_NAME"]].filter(Boolean).join(" "),
    phone: cols["PHONE_NUMBER"] || cols["PHONE"] || "",
    email: cols["EMAIL"] || "",
    message: cols["CITY"] ? `City: ${cols["CITY"]}` : "",
    tenantId,
    rawPayload: { lead_id: body?.lead_id, campaign_id: body?.campaign_id, is_test: body?.is_test, cols },
  });

  // Google expects a 200 with an empty JSON object.
  return NextResponse.json({});
}
