import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import {
  audienceFiltersSchema,
  getSavedAudiences,
  resolveAudienceFiltersByEmail,
  type AudienceFilters,
} from "@/lib/audiences";
import { sendEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  subject: z.string().min(1, "Subject is required."),
  html: z.string().min(1, "HTML body is required."),
  filters: audienceFiltersSchema.optional(),
  audienceId: z.string().optional(),
});

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

  const { subject, html, filters, audienceId } = parsed.data;

  let targetFilters: AudienceFilters | undefined = filters;
  if (audienceId) {
    const saved = (await getSavedAudiences()).find((a) => a.id === audienceId);
    if (!saved) {
      return NextResponse.json({ ok: false, error: "Saved audience not found." }, { status: 404 });
    }
    targetFilters = saved.filters;
  }

  if (!targetFilters) {
    return NextResponse.json({ ok: false, error: "Audience filters are required." }, { status: 400 });
  }

  const recipients = await resolveAudienceFiltersByEmail(targetFilters);
  if (recipients.length === 0) {
    return NextResponse.json(
      { ok: false, summary: { total: 0, sent: 0, failed: 0 }, error: "No recipients with email addresses match this audience." },
      { status: 400 },
    );
  }

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    const personalizedHtml = html.replace(/\{name\}/g, r.name);

    try {
      await sendEmail({
        to: r.email,
        subject,
        html: personalizedHtml,
      });
      sent++;
    } catch (err) {
      console.error(`Broadcast email failed for ${r.email}:`, err);
      failed++;
    }

    if (i < recipients.length - 1) {
      await new Promise((res) => setTimeout(res, 300));
    }
  }

  return NextResponse.json({
    ok: sent > 0,
    summary: {
      total: recipients.length,
      sent,
      failed,
    },
  });
}
