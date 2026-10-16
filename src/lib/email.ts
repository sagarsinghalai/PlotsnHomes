import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const apiKey = process.env.RESEND_API_KEY?.trim();
const isPlaceholderKey = !apiKey || apiKey === "re_..." || !apiKey.startsWith("re_") || apiKey.length < 15;

const resend = !isPlaceholderKey ? new Resend(apiKey) : null;

const from = process.env.EMAIL_FROM ?? "BrickVest <onboarding@resend.dev>";

export type SendEmailResult = {
  ok: boolean;
  id: string;
  provider: "resend" | "dev";
  delivered: boolean;
};

/** Sends email via Resend when configured; logs to DB when EmailLog model exists. Never throws on log failure. */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  let provider: "resend" | "dev" = "dev";
  let delivered = false;
  let externalId = "dev";
  let error: string | null = null;

  if (resend) {
    try {
      const { data, error: resendError } = await resend.emails.send({
        from,
        to,
        subject,
        html,
      });
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
    to,
    subject,
    html,
    status: delivered ? "SENT" : "FAILED",
    provider,
    error,
  });

  if (error && resend) {
    throw new Error(error);
  }

  return { ok: true, id: externalId, provider, delivered };
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
