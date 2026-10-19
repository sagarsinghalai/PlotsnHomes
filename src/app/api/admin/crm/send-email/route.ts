import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { sendEmail, type EmailAttachment } from "@/lib/email";

const mediaSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional().default("attachment"),
  kind: z.string().optional(),
  mime: z.string().optional().default(""),
  url: z.string(),            // data: URL
  size: z.number().optional(),
});

const schema = z.object({
  to: z.string().min(1),
  cc: z.string().optional().default(""),
  bcc: z.string().optional().default(""),
  subject: z.string().optional().default(""),
  html: z.string().optional().default(""),
  attachments: z.array(mediaSchema).optional().default([]),
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

function dataUrlParts(url: string): { contentType: string; base64: string } | null {
  const m = /^data:([^;]+);base64,([\s\S]*)$/.exec(url || "");
  if (!m) return null;
  return { contentType: m[1], base64: m[2] };
}
function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/gif": "gif",
    "image/webp": "webp", "image/svg+xml": "svg", "application/pdf": "pdf",
  };
  return map[mime] || (mime.split("/")[1] || "bin");
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

    const emailAttachments: EmailAttachment[] = [];

    // 1) Inline data-URL <img> in the body → real inline (cid) attachments so they
    //    render in the recipient's email (clients strip raw data: image URLs).
    let html = data.html || "";
    let imgIdx = 0;
    html = html.replace(/<img\b[^>]*?src="(data:[^"]+)"[^>]*>/gi, (tag, dataUrl) => {
      const parts = dataUrlParts(dataUrl);
      if (!parts) return tag;
      imgIdx += 1;
      const cid = `inline${imgIdx}@crm`;
      emailAttachments.push({
        filename: `image${imgIdx}.${extFromMime(parts.contentType)}`,
        content: parts.base64,
        contentType: parts.contentType,
        cid,
      });
      return tag.replace(dataUrl, `cid:${cid}`);
    });

    // 2) The attachment list (images chosen "attach"/"both", PDFs, files).
    for (const m of data.attachments) {
      const parts = dataUrlParts(m.url);
      if (!parts) continue;
      emailAttachments.push({
        filename: m.name || `attachment.${extFromMime(parts.contentType)}`,
        content: parts.base64,
        contentType: m.mime || parts.contentType,
      });
    }

    const result = await sendEmail({
      to,
      cc: cc.length ? cc : undefined,
      bcc: bcc.length ? bcc : undefined,
      subject: data.subject || "(no subject)",
      html,
      attachments: emailAttachments.length ? emailAttachments : undefined,
      fromSenderId: data.fromSenderId,
    });

    return NextResponse.json({
      ok: true,
      delivered: result.delivered,
      provider: result.provider, // "smtp"/"resend" = really sent, "dev" = simulated
      error: result.error,
      accepted: result.accepted,
      rejected: result.rejected,
      to, cc, bcc,
      attachmentCount: emailAttachments.length,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    const msg = e instanceof Error ? e.message : "Could not send email";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
