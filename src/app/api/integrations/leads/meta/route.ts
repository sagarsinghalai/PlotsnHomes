import { NextResponse } from "next/server";
import { getChannel, resolveTenantByChannelSecret } from "@/lib/lead-channels";
import { createInboundLead } from "@/lib/inbound-lead";
import { checkMetaWebhook, exceedsWebhookLimit, safeEqual, MAX_WEBHOOK_BYTES } from "@/lib/meta-webhook";

export const dynamic = "force-dynamic";

// Meta (Facebook) Lead Ads webhook.
// GET  → subscription verification (echo hub.challenge).
// POST → leadgen events: fetch each lead via the Graph API and create it.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  // Accept any tenant's verify token (per-tenant Meta subscription), else global.
  const resolved = await resolveTenantByChannelSecret("meta", token);
  if (resolved && mode === "subscribe") {
    return new NextResponse(challenge || "", { status: 200 });
  }
  const cfg = await getChannel("meta");
  if (mode === "subscribe" && safeEqual(token, cfg?.verifyToken)) {
    return new NextResponse(challenge || "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

async function fetchLead(leadgenId: string, accessToken: string): Promise<Record<string, string>> {
  const res = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?access_token=${encodeURIComponent(accessToken)}`);
  const data = await res.json();
  const out: Record<string, string> = {};
  for (const f of data?.field_data || []) {
    out[String(f.name).toLowerCase()] = Array.isArray(f.values) ? f.values[0] : f.value || "";
  }
  return out;
}

export async function POST(req: Request) {
  // Abuse / DoS guard — reject by declared size BEFORE buffering the body.
  if (exceedsWebhookLimit(Number(req.headers.get("content-length") || 0))) {
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  const cfg = await getChannel("meta"); // getChannel returns DECRYPTED secrets (server-only)
  const raw = await req.text();

  // Backstop: content-length can be absent/spoofed, so re-check actual bytes read.
  if (Buffer.byteLength(raw, "utf8") > MAX_WEBHOOK_BYTES) {
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  // Signature check on the ORIGINAL raw body. In production a missing App
  // Secret fails (never silently skips verification); dev may skip for testing.
  const check = checkMetaWebhook({
    rawBody: raw,
    signatureHeader: req.headers.get("x-hub-signature-256"),
    appSecret: cfg?.appSecret,
    isProduction: process.env.NODE_ENV === "production",
  });
  if (!check.ok) {
    return NextResponse.json({ ok: false, error: check.reason || "Unauthorized" }, { status: 401 });
  }

  if (!cfg?.enabled) return NextResponse.json({ ok: false, error: "Channel disabled" }, { status: 200 });

  let body: any = {};
  try { body = JSON.parse(raw); } catch { /* ignore */ }

  const token = cfg?.pageAccessToken || "";
  const results: any[] = [];
  for (const entry of body?.entry || []) {
    for (const change of entry?.changes || []) {
      const v = change?.value || {};
      const leadgenId = v.leadgen_id || v.leadgenId;
      if (!leadgenId) continue;
      try {
        const fields = token ? await fetchLead(String(leadgenId), token) : {};
        results.push(await createInboundLead({
          channel: "meta",
          name: fields["full_name"] || fields["name"] || "",
          phone: fields["phone_number"] || fields["phone"] || "",
          email: fields["email"] || "",
          message: fields["message"] || "",
          rawPayload: { leadgenId, ...fields },
        }));
      } catch (e: any) {
        await createInboundLead({ channel: "meta", name: "", phone: "", rawPayload: { leadgenId, error: e?.message } });
      }
    }
  }

  return NextResponse.json({ ok: true, processed: results.length });
}
