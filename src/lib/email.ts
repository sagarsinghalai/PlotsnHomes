import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { getActiveSender } from "@/lib/email-senders";
import { getMessagingIntegrations } from "@/lib/messaging-settings";

const envApiKey = process.env.RESEND_API_KEY?.trim();
function isRealKey(k?: string): boolean {
  return Boolean(k && k !== "re_..." && k.startsWith("re_") && k.length >= 15);
}

const envFrom = process.env.EMAIL_FROM ?? "BrickVest <onboarding@resend.dev>";

export type EmailAttachment = {
  filename: string;
  content: string;      // base64-encoded content
  contentType?: string;
  cid?: string;         // set for inline images referenced via cid: in the HTML
};

export type SendEmailResult = {
  ok: boolean;
  id: string;
  provider: "resend" | "dev" | "smtp";
  delivered: boolean;
  error?: string;
  accepted?: string[];
  rejected?: string[];
};

/**
 * Sends email via Resend when configured; logs to DB when EmailLog model exists.
 * Uses the configured active sender account (from the Email Accounts settings)
 * when present — or the one named by `fromSenderId` — falling back to the
 * RESEND_API_KEY / EMAIL_FROM environment values. Never throws on log failure.
 */
export async function sendEmail({
  to,
  subject,
  html,
  cc,
  bcc,
  attachments,
  fromSenderId,
}: {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  fromSenderId?: string;
}): Promise<SendEmailResult> {
  let provider: "resend" | "dev" | "smtp" = "dev";
  let delivered = false;
  let externalId = "dev";
  let error: string | null = null;
  let accepted: string[] | undefined;
  let rejected: string[] | undefined;

  // 1) Gmail / SMTP takes priority when configured (Integrations → Gmail / company email).
  try {
    const integ = await getMessagingIntegrations();
    if (integ.gmailSmtpUser && integ.gmailSmtpPass) {
      try {
        const nm: any = await import("nodemailer");
        const nodemailer = nm.default ?? nm;
        const port = parseInt(integ.gmailSmtpPort || "587", 10) || 587;
        const transporter = nodemailer.createTransport({
          host: integ.gmailSmtpHost || "smtp.gmail.com",
          port,
          secure: port === 465, // SSL on 465, STARTTLS on 587/others
          auth: { user: integ.gmailSmtpUser, pass: integ.gmailSmtpPass },
        });
        const info = await transporter.sendMail({
          from: integ.gmailSmtpFrom || integ.gmailSmtpUser,
          to,
          ...(cc && (Array.isArray(cc) ? cc.length : cc) ? { cc } : {}),
          ...(bcc && (Array.isArray(bcc) ? bcc.length : bcc) ? { bcc } : {}),
          subject,
          html,
          ...(attachments && attachments.length ? {
            attachments: attachments.map((a) => ({
              filename: a.filename,
              content: Buffer.from(a.content, "base64"),
              contentType: a.contentType,
              ...(a.cid ? { cid: a.cid } : {}),
            })),
          } : {}),
        });
        provider = "smtp"; delivered = true; externalId = info?.messageId ?? "smtp";
        accepted = (info?.accepted ?? []).map((x: any) => (typeof x === "string" ? x : x?.address)).filter(Boolean);
        rejected = (info?.rejected ?? []).map((x: any) => (typeof x === "string" ? x : x?.address)).filter(Boolean);
      } catch (e) {
        error = e instanceof Error ? e.message : "Gmail SMTP send failed";
        provider = "smtp"; delivered = false;
      }
      await persistEmailLog({
        to: Array.isArray(to) ? to.join(", ") : to,
        subject, html, status: delivered ? "SENT" : "FAILED", provider, error,
      });
      return { ok: !error, id: externalId, provider, delivered, error: error ?? undefined, accepted, rejected };
    }
  } catch { /* no SMTP config — continue to Resend */ }

  // 2) Resend — resolve which account to send from (active sender account, else env).
  let from = envFrom;
  let sendKey = envApiKey;
  try {
    const sender = await getActiveSender(fromSenderId);
    if (sender?.fromEmail) from = sender.fromName ? `${sender.fromName} <${sender.fromEmail}>` : sender.fromEmail;
    if (sender?.apiKey && isRealKey(sender.apiKey)) sendKey = sender.apiKey;
  } catch { /* fall back to env */ }

  const resend = isRealKey(sendKey) ? new Resend(sendKey) : null;

  if (resend) {
    try {
      const { data, error: resendError } = await resend.emails.send({
        from,
        to,
        subject,
        html,
        ...(cc && (Array.isArray(cc) ? cc.length : cc) ? { cc } : {}),
        ...(bcc && (Array.isArray(bcc) ? bcc.length : bcc) ? { bcc } : {}),
        ...(attachments && attachments.length ? {
          attachments: attachments.map((a) => ({ filename: a.filename, content: a.content, ...(a.cid ? { content_id: a.cid } : {}) })),
        } : {}),
      } as any);
      if (resendError) {
        error = resendError.message;
        const lower = error.toLowerCase();
        if (
          lower.includes("api key") ||
          lower.includes("invalid") ||
          lower.includes("only send testing emails") ||
          lower.includes("verify a domain")
        ) {
          console.warn(`[BrickVest Email] Resend sandbox mode notice: ${error}. Using dev simulation mode.`);
          provider = "dev";
          delivered = true;
          externalId = `dev-${Date.now()}`;
          error = null;
        }
      } else {
        provider = "resend";
        delivered = true;
        externalId = data?.id ?? "resend";
      }
    } catch (e) {
      const errStr = e instanceof Error ? e.message : "Resend send failed";
      const lower = errStr.toLowerCase();
      if (
        lower.includes("api key") ||
        lower.includes("invalid") ||
        lower.includes("only send testing emails") ||
        lower.includes("verify a domain")
      ) {
        console.warn(`[BrickVest Email] Resend sandbox mode notice: ${errStr}. Using dev simulation mode.`);
        provider = "dev";
        delivered = true;
        externalId = `dev-${Date.now()}`;
        error = null;
      } else {
        error = errStr;
      }
    }
  } else {
    console.log("[BrickVest email simulation]", { to, subject });
    delivered = true;
    externalId = `dev-${Date.now()}`;
  }

  await persistEmailLog({
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
    status: delivered ? "SENT" : "FAILED",
    provider,
    error,
  });

  if (error && resend) {
    throw new Error(error);
  }

  return { ok: true, id: externalId, provider, delivered, error: error ?? undefined };
}

async function persistEmailLog(data: {
  to: string;
  subject: string;
  html: string;
  status: string;
  provider: string;
  error: string | null;
}) {
  try {
    const log = (prisma as { emailLog?: { create: (args: unknown) => Promise<unknown> } })
      .emailLog;
    if (!log?.create) {
      return;
    }
    await log.create({ data });
  } catch (e) {
    console.warn("[BrickVest] EmailLog skip (run: npx prisma generate && restart dev server)", e);
  }
}

export function welcomeEmailHtml(name: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">
      <h1 style="color:#0f172a">Welcome to BrickVest</h1>
      <p>Hi ${name},</p>
      <p>Your account is ready. Browse premium listings, run investment calculators, and connect with verified agents.</p>
      <p><a href="${appUrl}/properties" style="background:#c9a227;color:#0f172a;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:600">Explore properties</a></p>
    </div>
  `;
}

export function inquiryEmailHtml(
  propertyTitle: string,
  symbol: string,
  fromName: string,
  fromEmail: string,
  message: string,
  phone?: string | null
) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="color:#0f172a">New property inquiry</h2>
      <p><strong>Property:</strong> ${propertyTitle} (${symbol})</p>
      <p><strong>From:</strong> ${fromName} &lt;${fromEmail}&gt;</p>
      ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ""}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0" />
      <p>${message.replace(/\n/g, "<br>")}</p>
    </div>
  `;
}

export function inquiryConfirmationHtml(name: string, propertyTitle: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="color:#0f172a">Inquiry received</h2>
      <p>Hi ${name},</p>
      <p>Thank you for your interest in <strong>${propertyTitle}</strong>. A licensed agent will contact you within 1–2 business days.</p>
      <p style="color:#64748b;font-size:14px">BrickVest — Real Estate Investment Exchange</p>
    </div>
  `;
}

export function transactionEmailHtml(
  amount: string,
  description: string,
  symbol?: string
) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="color:#0f172a">Payment confirmed</h2>
      <p><strong>Amount:</strong> ${amount}</p>
      <p><strong>Details:</strong> ${description}</p>
      ${symbol ? `<p><strong>Asset:</strong> ${symbol}</p>` : ""}
      <p>Your transaction is recorded in your BrickVest dashboard.</p>
      <p style="color:#64748b;font-size:14px">Thank you for investing with BrickVest.</p>
    </div>
  `;
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}
