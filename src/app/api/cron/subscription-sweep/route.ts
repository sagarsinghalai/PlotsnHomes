import { NextResponse } from "next/server";
import { markLapsedOrgsPastDue } from "@/lib/subscription-access";
import { sweepSubscriptionEmails } from "@/lib/subscription-emails";

export const dynamic = "force-dynamic";

/**
 * Stage E — subscription expiry sweep.
 *
 * Flips ACTIVE tenants whose subscription has lapsed to PAST_DUE so the console
 * and reports reflect reality. Access is ALREADY blocked at the auth gate the
 * moment a subscription expires (isOrgAccessAllowed), so this sweep is the
 * proactive bookkeeping half — run it on a schedule (see docs/CUSTOM_DOMAINS.md
 * and the vercel.json cron entry). For minute-level grants, run it every minute.
 *
 * Auth: set CRON_SECRET and present it as `Authorization: Bearer <secret>`,
 * an `x-cron-secret` header, or `?key=<secret>`. With no CRON_SECRET set the
 * route is callable only outside production (dev convenience).
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const url = new URL(req.url);
  const provided =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("x-cron-secret") ||
    url.searchParams.get("key") ||
    "";
  return provided === secret;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const flipped = await markLapsedOrgsPastDue();
    // Notify partners: lapse notices for those just flipped + renewal reminders
    // for those ending soon (deduped). Best-effort — never fails the sweep.
    const emails = await sweepSubscriptionEmails(flipped).catch(() => ({ reminders: 0, lapses: 0 }));
    return NextResponse.json({ ok: true, transitioned: flipped.length, ids: flipped, emails });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Sweep failed" }, { status: 500 });
  }
}

export const POST = GET;
