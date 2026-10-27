import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getWhiteLabelProfile } from "@/lib/white-label-store";
import { getTenantSetting, setTenantSetting } from "@/lib/system-settings";

/**
 * Subscription lifecycle emails to white-label partners — renewal reminders,
 * lapse/suspended notices, and payment-failed notices. Sent via the shared email
 * layer (Resend when configured, else logged to Admin → Emails in dev). Branded
 * with the platform company (the merchant of record) and the partner's workspace.
 */
type Recipient = { email: string; name: string; orgName: string };

async function recipientFor(orgId: string): Promise<Recipient | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, whiteLabelAdmin: { select: { email: true, name: true } } },
  });
  if (!org) return null;
  let email = org.whiteLabelAdmin?.email ?? "";
  let name = org.whiteLabelAdmin?.name ?? "there";
  if (!email) {
    const admin = await prisma.user.findFirst({
      where: { tenantId: orgId, role: "WHITE_LABEL_ADMIN", active: true },
      select: { email: true, name: true },
    });
    if (admin) { email = admin.email; name = admin.name ?? name; }
  }
  if (!email) return null;
  return { email, name, orgName: org.name };
}

type Brand = { company: string; supportEmail: string; appUrl: string; billingUrl: string };
async function brand(): Promise<Brand> {
  const p = await getWhiteLabelProfile();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
  return { company: p.companyName, supportEmail: p.supportEmail, appUrl, billingUrl: `${appUrl}/admin/billing` };
}

function shell(b: Brand, heading: string, body: string, cta?: { href: string; label: string }): string {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
    <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#92700c;font-weight:700">${b.company}</p>
    <h1 style="font-size:20px;margin:6px 0 12px">${heading}</h1>
    ${body}
    ${cta ? `<p style="margin:20px 0"><a href="${cta.href}" style="background:#3347b0;color:#fff;padding:12px 22px;text-decoration:none;border-radius:8px;font-weight:600">${cta.label}</a></p>` : ""}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
    <p style="font-size:12px;color:#64748b">Questions? Contact ${b.supportEmail}. This notice was sent by ${b.company}.</p>
  </div>`;
}

export async function sendRenewalReminder(orgId: string, endsAt: Date): Promise<boolean> {
  const to = await recipientFor(orgId);
  if (!to) return false;
  const b = await brand();
  const when = endsAt.toLocaleString();
  const html = shell(
    b,
    "Your workspace subscription is ending soon",
    `<p>Hi ${to.name},</p>
     <p>Your <strong>${to.orgName}</strong> workspace subscription ends on <strong>${when}</strong>. Renew before then to avoid any interruption to your team's access.</p>`,
    { href: b.billingUrl, label: "Renew now" }
  );
  await sendEmail({ to: to.email, subject: `Action needed: ${to.orgName} subscription ends ${when}`, html });
  return true;
}

export async function sendLapseNotice(orgId: string): Promise<boolean> {
  const to = await recipientFor(orgId);
  if (!to) return false;
  const b = await brand();
  const html = shell(
    b,
    "Your workspace subscription has lapsed",
    `<p>Hi ${to.name},</p>
     <p>Access to the <strong>${to.orgName}</strong> workspace is paused because the subscription has expired. Your data is safe — renew to restore access for you and your team right away.</p>`,
    { href: b.billingUrl, label: "Renew to restore access" }
  );
  await sendEmail({ to: to.email, subject: `${to.orgName} subscription lapsed — renew to restore access`, html });
  return true;
}

export async function sendPaymentFailed(orgId: string, detail?: string): Promise<boolean> {
  const to = await recipientFor(orgId);
  if (!to) return false;
  const b = await brand();
  const html = shell(
    b,
    "We couldn't process your payment",
    `<p>Hi ${to.name},</p>
     <p>A payment for your <strong>${to.orgName}</strong> workspace subscription did not go through${detail ? ` (${detail})` : ""}. Please update your payment details and try again to keep your workspace active.</p>`,
    { href: b.billingUrl, label: "Retry payment" }
  );
  await sendEmail({ to: to.email, subject: `Payment failed for ${to.orgName} — action needed`, html });
  return true;
}

const REMINDER_KEY = "sub_reminder_for";
const REMINDER_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // notify when ending within 3 days

/**
 * Sweep helper: email renewal reminders for ACTIVE tenants ending within the
 * window (deduped per period-end), and lapse notices for the orgs just flipped
 * to PAST_DUE. Best-effort — never throws into the caller. Returns counts.
 */
export async function sweepSubscriptionEmails(flippedIds: string[], now: Date = new Date()): Promise<{ reminders: number; lapses: number }> {
  let reminders = 0;
  let lapses = 0;

  for (const id of flippedIds) {
    try { if (await sendLapseNotice(id)) lapses++; } catch { /* best-effort */ }
  }

  try {
    const soon = await prisma.organization.findMany({
      where: {
        status: "ACTIVE",
        subscriptionEndsAt: { gt: now, lte: new Date(now.getTime() + REMINDER_WINDOW_MS) },
      },
      select: { id: true, subscriptionEndsAt: true },
    });
    for (const org of soon) {
      if (!org.subscriptionEndsAt) continue;
      const marker = org.subscriptionEndsAt.toISOString();
      try {
        const already = await getTenantSetting(REMINDER_KEY, org.id);
        if (already === marker) continue; // already reminded for this period
        if (await sendRenewalReminder(org.id, org.subscriptionEndsAt)) {
          await setTenantSetting(REMINDER_KEY, marker, org.id);
          reminders++;
        }
      } catch { /* best-effort per org */ }
    }
  } catch { /* best-effort */ }

  return { reminders, lapses };
}
