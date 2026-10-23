import { NextResponse } from "next/server";
import { requireCrmApi } from "@/lib/crm-access";
import { prisma } from "@/lib/prisma";
import { getPrimaryTenantId } from "@/lib/tenant";
import {
  getMessagingIntegrations,
  normalizePhone,
  whatsAppWebUrl,
} from "@/lib/messaging-settings";
import { sendWhatsAppApi, sendSms, sendViaGmail } from "@/lib/messaging";
import { sendEmail } from "@/lib/email";
import { MessageChannel, MessageStatus } from "@prisma/client";

type RecipientInput = {
  name: string;
  phone?: string;
  email?: string;
  property?: string;
  owner?: string;
  budgetMin?: string;
  budgetMax?: string;
};

// Convert WhatsApp-style formatting (*bold* _italic_ ~strike~ ```mono```, bullets,
// numbered lists, bare URLs) into HTML so it renders in email.
function waMarkdownToHtml(src: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/```([\s\S]+?)```/g, "<code>$1</code>")
      .replace(/\*(.+?)\*/g, "<strong>$1</strong>")
      .replace(/_(.+?)_/g, "<em>$1</em>")
      .replace(/~(.+?)~/g, "<del>$1</del>")
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>');
  const lines = src.split(/\r?\n/);
  const out: string[] = [];
  let list: "ul" | "ol" | null = null;
  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const ln of lines) {
    const bullet = ln.match(/^\s*•\s+(.*)$/);
    const num = ln.match(/^\s*\d+\.\s+(.*)$/);
    if (bullet) {
      if (list !== "ul") { closeList(); out.push("<ul>"); list = "ul"; }
      out.push(`<li>${inline(bullet[1])}</li>`);
    } else if (num) {
      if (list !== "ol") { closeList(); out.push("<ol>"); list = "ol"; }
      out.push(`<li>${inline(num[1])}</li>`);
    } else {
      closeList();
      out.push(ln.trim() === "" ? "<br>" : `${inline(ln)}<br>`);
    }
  }
  closeList();
  return out.join("");
}

// Replace all supported {{variables}} with this recipient's values.
function compileVars(text: string, r: RecipientInput): string {
  return (text || "")
    .replace(/\{\{name\}\}/g, r.name || "Client")
    .replace(/\{\{email\}\}/g, r.email || "")
    .replace(/\{\{phone\}\}/g, r.phone || "")
    .replace(/\{\{property\}\}/g, r.property || "")
    .replace(/\{\{owner\}\}/g, r.owner || "")
    .replace(/\{\{budgetMin\}\}/g, r.budgetMin || "")
    .replace(/\{\{budgetMax\}\}/g, r.budgetMax || "");
}

export async function POST(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;

  try {
    const { channels, recipients, body, subject, templateType, mediaUrl, buttons, listItems } = await req.json();

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json({ error: "At least one channel is required." }, { status: 400 });
    }
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: "Recipients list is required." }, { status: 400 });
    }
    if (!body?.trim()) {
      return NextResponse.json({ error: "Message body template is required." }, { status: 400 });
    }

    const config = await getMessagingIntegrations();
    const results: { name: string; phone: string; email: string; status: string; log: string }[] = [];

    // Process in sequential order
    for (const r of recipients as RecipientInput[]) {
      // Find matching user in database to link logs if possible
      let matchedUser = null;
      if (r.email) {
        matchedUser = await prisma.user.findFirst({ where: { email: r.email } });
      }
      if (!matchedUser && r.phone) {
        const cleaned = r.phone.replace(/\D/g, "");
        if (cleaned.length >= 8) {
          matchedUser = await prisma.user.findFirst({
            where: { phone: { contains: cleaned.slice(-8) } }
          });
        }
      }

      // Compile body — substitutes every supported {{variable}} for this contact.
      const compiledBody = compileVars(body, r);

      const toPhone = r.phone?.trim() || "";
      const toEmail = r.email?.trim() || "";

      let overallSuccess = true;
      let logs: string[] = [];

      for (const ch of channels) {
        if (ch === "whatsapp" && !toPhone) {
          continue;
        }
        if (ch === "sms" && !toPhone) {
          continue;
        }
        if (ch === "email" && !toEmail) {
          continue;
        }

        let channelEnum: MessageChannel;
        let status: MessageStatus = MessageStatus.SENT;
        let provider = "bulk_campaign";
        let externalId: string | null = null;
        let errorMsg: string | null = null;
        let webUrl: string | null = null;

        try {
          if (ch === "whatsapp") {
            channelEnum = MessageChannel.WHATSAPP;
            const res = await sendWhatsAppApi(toPhone, compiledBody, config, { templateType, mediaUrl, buttons, listItems });
            provider = res.provider;
            externalId = res.externalId;
            logs.push(`WhatsApp API OK`);
          } else if (ch === "email") {
            channelEnum = MessageChannel.EMAIL;
            const compiledSubject = compileVars(subject || `Campaign Message from ${config.companyName}`, r);
            const html = `<div style="font-family:system-ui,sans-serif;max-width:560px;line-height:1.5">${waMarkdownToHtml(compiledBody)}</div>`;

            const gmail = await sendViaGmail(toEmail, compiledSubject, html, config);
            if (gmail) {
              provider = gmail.provider;
              externalId = gmail.externalId;
            } else {
              const res = await sendEmail({ to: toEmail, subject: compiledSubject, html });
              provider = res.provider;
              externalId = res.id;
            }

            // Send WhatsApp / SMS notification to real recipient if they have a phone number
            if (toPhone) {
              try {
                const alertBody = `Hi ${r.name || "there"}, we've sent you an email: "${compiledSubject}". Please check your inbox (${toEmail}).`;
                if (config.whatsappMode === "api" && config.whatsappApiToken) {
                  await sendWhatsAppApi(toPhone, alertBody, config);
                } else if (config.twilioAccountSid && config.twilioAuthToken && config.twilioFromPhone) {
                  await sendSms(toPhone, alertBody, config);
                }
              } catch (err) {
                console.error("Failed to send WhatsApp/SMS alert for bulk email:", err);
              }
            }
            logs.push("Email Sent OK");
          } else if (ch === "sms") {
            channelEnum = MessageChannel.SMS;
            const res = await sendSms(toPhone, compiledBody, config);
            provider = res.provider;
            externalId = res.externalId;
            logs.push("SMS Sent OK");
          } else {
            throw new Error(`Unsupported channel: ${ch}`);
          }
        } catch (err) {
          overallSuccess = false;
          status = MessageStatus.FAILED;
          errorMsg = err instanceof Error ? err.message : "Send failed";
          logs.push(`${ch.toUpperCase()} Failed: ${errorMsg}`);
        }

        // Persist message log in database
        await prisma.messageLog.create({
          data: {
            tenantId: auth.tenantId ?? (await getPrimaryTenantId()),
            channel: channelEnum!,
            recipientId: matchedUser?.id || null,
            sentById: auth.session!.user.id,
            toPhone: toPhone || null,
            toEmail: ch === "email" ? toEmail : null,
            subject: ch === "email" ? (subject || null) : null,
            body: compiledBody,
            status,
            provider,
            externalId,
            webUrl,
            error: errorMsg,
          },
        }).catch(console.error);
      }

      if (logs.length === 0) {
        overallSuccess = false;
        logs.push("No matching contact channel info");
      }

      results.push({
        name: r.name,
        phone: toPhone,
        email: toEmail,
        status: overallSuccess ? "SENT" : "PARTIAL_FAILED",
        log: logs.join(", "),
      });
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Failed to run campaign";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
