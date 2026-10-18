import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { sendEmail } from "@/lib/email";

const schema = z.object({
  to: z.string().min(1),
  cc: z.string().optional().default(""),
  bcc: z.string().optional().default(""),
  subject: z.string().optional().default(""),
  html: z.string().optional().default(""),
  fromSenderId: z.string().optional(),
});

// Pull bare email addresses out of a free-text field like "Name <a@b.com>, c@d.com".
function extractEmails(s: string): string[] {
  if (!s) return [];
  const out: string[] = [];
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out.push(m[0]);
  return Array.from(new Set(out));
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const data = schema.parse(await req.json());
    const to = extractEmails(data.to);
    const cc = extractEmails(data.cc);
    const bcc = extractEmails(data.bcc);

    if (to.length === 0) {
      return NextResponse.json({ error: "No valid recipient email in the To field." }, { status: 400 });
    }

    const result = await sendEmail({
      to,
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      subject: data.subject || "(no subject)",
      html: data.html || "",
      fromSenderId: data.fromSenderId,
    });

    return NextResponse.json({
      ok: true,
      delivered: result.delivered,
      provider: result.provider, // "smtp"/"resend" = really sent, "dev" = simulated (verify your domain)
      error: result.error,
      to, cc, bcc,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    const msg = e instanceof Error ? e.message : "Could not send email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
