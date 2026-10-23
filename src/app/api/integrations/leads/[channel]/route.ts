import { NextResponse } from "next/server";
import { getChannel, resolveTenantByChannelSecret } from "@/lib/lead-channels";
import { createInboundLead } from "@/lib/inbound-lead";
import { exceedsWebhookLimit, safeEqual } from "@/lib/meta-webhook";

export const dynamic = "force-dynamic";

// Public inbound webhook for portal / generic channels (Justdial, MagicBricks,
// 99acres, generic, …). Validates the per-channel secret, maps the incoming
// body via the channel's field-map, and drops the lead into the CRM.
async function readBody(req: Request): Promise<Record<string, any>> {
  const ct = req.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) return await req.json();
    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const obj: Record<string, any> = {};
      fd.forEach((v, k) => { obj[k] = typeof v === "string" ? v : ""; });
      return obj;
    }
    // Try JSON, else querystring fallback
    const txt = await req.text();
    try { return JSON.parse(txt); } catch { return Object.fromEntries(new URLSearchParams(txt)); }
  } catch {
    return {};
  }
}

// case-insensitive, dotted-path lookup (supports "lead.name")
function pick(obj: Record<string, any>, keys: string | undefined): string {
  if (!keys) return "";
  for (const key of keys.split("|").map((k) => k.trim())) {
    if (!key) continue;
    // direct
    if (obj[key] != null && obj[key] !== "") return String(obj[key]);
    // case-insensitive direct
    const ciKey = Object.keys(obj).find((k) => k.toLowerCase() === key.toLowerCase());
    if (ciKey && obj[ciKey] != null && obj[ciKey] !== "") return String(obj[ciKey]);
    // dotted path
    if (key.includes(".")) {
      const val = key.split(".").reduce<any>((o, p) => (o && typeof o === "object" ? o[p] : undefined), obj);
      if (val != null && val !== "") return String(val);
    }
  }
  return "";
}

export async function POST(req: Request, { params }: { params: { channel: string } }) {
  const channel = params.channel;
  if (exceedsWebhookLimit(Number(req.headers.get("content-length") || 0))) {
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }
  // Identify the tenant by the presented secret first; fall back to the global
  // channel config (single-tenant / not-yet-per-tenant).
  const url = new URL(req.url);
  const provided = req.headers.get("x-webhook-secret") || url.searchParams.get("key") || "";
  const resolved = await resolveTenantByChannelSecret(channel, provided);
  const tenantId = resolved?.tenantId ?? null;
  const cfg = resolved?.cfg ?? (await getChannel(channel)); // decrypted secret for comparison
  if (!cfg) return NextResponse.json({ ok: false, error: "Unknown channel" }, { status: 404 });

  // When not matched to a tenant by secret, validate against the global secret.
  if (!resolved && cfg.secret && !safeEqual(provided, cfg.secret)) {
    return NextResponse.json({ ok: false, error: "Invalid secret" }, { status: 401 });
  }

  if (!cfg.enabled) {
    return NextResponse.json({ ok: false, error: "Channel disabled" }, { status: 200 });
  }

  const body = await readBody(req);
  const fm = cfg.fieldMap || {};
  const result = await createInboundLead({
    channel,
    name: pick(body, fm.name || "name|full_name|fullName|customer_name"),
    phone: pick(body, fm.phone || "phone|mobile|mobile_number|phone_number|contact"),
    email: pick(body, fm.email || "email|email_id"),
    message: pick(body, fm.message || "message|requirements|remarks|query"),
    tenantId,
    rawPayload: body,
  });

  // Always 200 so the platform doesn't retry; status conveys the outcome.
  return NextResponse.json({ ok: result.status === "CREATED" || result.status === "DUPLICATE", ...result });
}
