import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import {
  audienceFiltersSchema,
  getSavedAudiences,
  resolveAudienceFilters,
} from "@/lib/audiences";
import {
  broadcastCentralWhatsApp,
  broadcastToPhones,
  broadcastToRecipients,
  sendCentralWhatsApp,
  type NotifyAudience,
} from "@/lib/whatsapp-central";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  message: z.string().min(1, "Message is required."),
  // One of the following selects the recipients:
  phone: z.string().optional(), // single/test send
  audience: z.enum(["leads", "customers", "agents"]).optional(), // quick audience
  phones: z.array(z.string()).optional(), // custom list (paste / CSV / XLSX)
  filters: audienceFiltersSchema.optional(), // ad-hoc segment from the builder
  audienceId: z.string().optional(), // a saved segment
});

/**
 * Send a notification from the central company WhatsApp number.
 * Provide `phone` for a one-off/test send, `audience` to broadcast to a saved
 * audience, or `phones` for a custom list pasted or uploaded (CSV/XLSX).
 */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { message, phone, audience, phones, filters, audienceId } = parsed.data;

  if (!phone && !audience && !(phones && phones.length) && !filters && !audienceId) {
    return NextResponse.json(
      { ok: false, error: "Provide recipients: a phone, audience, custom list, or segment." },
      { status: 400 },
    );
  }

  // Single/test send.
  if (phone) {
    const result = await sendCentralWhatsApp(phone, message, auth.tenantId);
    return NextResponse.json(
      { ok: result.ok, mode: "single", result },
      { status: result.ok ? 200 : 400 },
    );
  }

  // Segment broadcast — a saved audience (by id) or an ad-hoc filter set.
  if (audienceId || filters) {
    let seg = filters;
    let label = "segment";
    if (audienceId) {
      const saved = (await getSavedAudiences()).find((a) => a.id === audienceId);
      if (!saved) {
        return NextResponse.json({ ok: false, error: "Saved audience not found." }, { status: 404 });
      }
      seg = saved.filters;
      label = saved.name;
    }
    const recipients = await resolveAudienceFilters(seg!);
    if (recipients.length === 0) {
      return NextResponse.json(
        { ok: false, mode: "broadcast", summary: { audience: label, total: 0, sent: 0, failed: 0, method: "none", errors: [] }, error: "No recipients match this audience." },
        { status: 400 },
      );
    }
    const summary = await broadcastToRecipients(recipients, message, auth.session!.user.id, label);
    return NextResponse.json({ ok: summary.sent > 0, mode: "broadcast", summary });
  }

  // Custom list broadcast (pasted numbers or CSV/XLSX upload).
  if (phones && phones.length) {
    const summary = await broadcastToPhones(phones, message, auth.session!.user.id);
    if (summary.total === 0) {
      return NextResponse.json(
        { ok: false, mode: "broadcast", summary, error: "No valid phone numbers in the list." },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: summary.sent > 0, mode: "broadcast", summary });
  }

  // Saved audience broadcast.
  const summary = await broadcastCentralWhatsApp(
    audience as NotifyAudience,
    message,
    auth.session!.user.id,
  );
  return NextResponse.json({ ok: summary.sent > 0, mode: "broadcast", summary });
}
