import { NextResponse } from "next/server";
import crypto from "crypto";
import { getChannel } from "@/lib/lead-channels";
import { createInboundLead } from "@/lib/inbound-lead";

export const dynamic = "force-dynamic";

// Meta (Facebook) Lead Ads webhook.
// GET  → subscription verification (echo hub.challenge).
// POST → leadgen events: fetch each lead via the Graph API and create it.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const cfg = await getChannel("meta");
  if (mode === "subscribe" && cfg?.verifyToken && token === cfg.verifyToken) {
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
  const cfg = await getChannel("meta");
  const raw = await req.text();

  // Validate the X-Hub-Signature-256 HMAC when an app secret is configured.
  if (cfg?.appSecret) {
    const sig = req.headers.get("x-hub-signature-256") || "";
    const expected = "sha256=" + crypto.createHmac("sha256", cfg.appSecret).update(raw).digest("hex");
    try {
      if (!sig || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
      }
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }
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
