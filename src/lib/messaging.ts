import { MessageChannel, MessageStatus } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import {
  getMessagingIntegrations,
  normalizePhone,
  whatsAppWebUrl,
} from "@/lib/messaging-settings";
import { prisma } from "@/lib/prisma";

export type SendMessageInput = {
  channel: "whatsapp" | "whatsapp_web" | "email" | "telegram" | "sms" | "platform";
  recipientUserId: string;
  sentById: string;
  body: string;
  subject?: string;
  meetingId?: string;
  forceWeb?: boolean;
  /** Override profile phone — used when admin edits number in send panel */
  recipientPhone?: string;
};

export type SendMessageResult = {
  ok: boolean;
  channel: MessageChannel;
  status: MessageStatus;
  provider: string;
  webUrl?: string;
  error?: string;
  logId: string;
};

export async function sendWhatsAppApi(
  toPhone: string,
  body: string,
  config: Awaited<ReturnType<typeof getMessagingIntegrations>>,
  template?: { templateType?: string; mediaUrl?: string; buttons?: string[]; listItems?: string[] }
) {
  if (!config.whatsappApiToken || !config.whatsappPhoneNumberId) {
    throw new Error("WhatsApp API not configured — add token & phone number ID in Integrations");
  }

  let payload: any = {
    messaging_product: "whatsapp",
    to: normalizePhone(toPhone).replace(/^\+/, ""),
    type: "text",
    text: { body },
  };

  if (template?.templateType) {
    const isButtons = template.templateType === "Text + Buttons" && template.buttons && template.buttons.length > 0;
    const isList = template.templateType === "Text + Lists" && template.listItems && template.listItems.length > 0;

    if (isButtons) {
      payload = {
        messaging_product: "whatsapp",
        to: normalizePhone(toPhone).replace(/^\+/, ""),
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: body },
          action: {
            buttons: template.buttons!.filter(Boolean).slice(0, 3).map((btn, i) => {
              const item = typeof btn === "string" ? { label: btn } : btn;
              return {
                type: "reply",
                reply: { id: `btn_${i}`, title: item.label.substring(0, 20) }
              };
            })
          }
        }
      };
    } else if (isList) {
      payload = {
        messaging_product: "whatsapp",
        to: normalizePhone(toPhone).replace(/^\+/, ""),
        type: "interactive",
        interactive: {
          type: "list",
          body: { text: body },
          action: {
            button: "Select Option",
            sections: [
              {
                title: "Options",
                rows: template.listItems!.filter(Boolean).slice(0, 10).map((item, i) => ({
                  id: `list_${i}`, title: item.substring(0, 24)
                }))
              }
            ]
          }
        }
      };
    } else if (template.mediaUrl && template.templateType !== "Text Template") {
      let mediaType = "document";
      if (template.templateType === "Text + Image") mediaType = "image";
      else if (template.templateType === "Text + Video") mediaType = "video";
      else if (template.templateType === "Text + Audio") mediaType = "audio";

      payload = {
        messaging_product: "whatsapp",
        to: normalizePhone(toPhone).replace(/^\+/, ""),
        type: mediaType,
        [mediaType]: { link: template.mediaUrl, caption: body }
      };
    }
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${config.whatsappPhoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.whatsappApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message ?? "WhatsApp API send failed");
  }
  return { provider: "whatsapp_api", externalId: data.messages?.[0]?.id ?? "wa" };
}

export async function sendTelegram(chatId: string, body: string, config: Awaited<ReturnType<typeof getMessagingIntegrations>>) {
  if (!config.telegramBotToken) {
    throw new Error("Telegram bot token not configured — add it in Admin > Integrations > Telegram Bot Token");
  }
  // chatId can be a numeric chat ID (e.g. 123456789) or @username
  const cleanedChatId = chatId.trim();
  if (!cleanedChatId) {
    throw new Error("Telegram chat ID is required");
  }
  const res = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: cleanedChatId, text: body }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.description ?? "Telegram send failed");
  }
  return { provider: "telegram", externalId: String(data.result?.message_id ?? "") };
}

export async function sendSms(toPhone: string, body: string, config: Awaited<ReturnType<typeof getMessagingIntegrations>>) {
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioFromPhone) {
    throw new Error("Twilio SMS not configured — add SID, token & from number in Integrations");
  }

  const auth = Buffer.from(`${config.twilioAccountSid}:${config.twilioAuthToken}`).toString("base64");
  const params = new URLSearchParams({
    To: normalizePhone(toPhone),
    From: config.twilioFromPhone,
    Body: body,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.twilioAccountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message ?? "SMS send failed");
  }
  return { provider: "twilio_sms", externalId: data.sid ?? "sms" };
}

export async function sendViaGmail(
  to: string,
  subject: string,
  html: string,
  config: Awaited<ReturnType<typeof getMessagingIntegrations>>
) {
  if (!config.gmailSmtpUser || !config.gmailSmtpPass) {
    return null;
  }
  try {
    const nodemailer = await import("nodemailer").catch(() => null);
    if (!nodemailer) return null;

    const smtpPort = parseInt(config.gmailSmtpPort || "587", 10) || 587;
    const transporter = nodemailer.createTransport({
      host: config.gmailSmtpHost || "smtp.gmail.com",
      port: smtpPort,
      secure: smtpPort === 465, // SSL on 465, STARTTLS on 587/others
      auth: {
        user: config.gmailSmtpUser,
        pass: config.gmailSmtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: config.gmailSmtpFrom || config.gmailSmtpUser,
      to,
      subject,
      html,
    });
    return { provider: "gmail_smtp", externalId: info.messageId ?? "gmail" };
  } catch {
    return null;
  }
}

export async function sendAdminMessage(input: SendMessageInput): Promise<SendMessageResult> {
  let recipient = await prisma.user.findUnique({
    where: { id: input.recipientUserId },
  });
  if (!recipient) {
    const lead = await prisma.lead.findUnique({
      where: { id: input.recipientUserId },
    });
    if (lead) {
      recipient = await prisma.user.findUnique({
        where: { email: lead.email },
      });
      if (!recipient) {
        recipient = await prisma.user.create({
          data: {
            email: lead.email,
            name: lead.name,
            phone: lead.phone,
            passwordHash: "external-sso-placeholder",
            role: "BUYER",
          },
        });
      }
    }
  }
  if (!recipient) {
    // Try Developer
    const developer = await prisma.developer.findUnique({
      where: { id: input.recipientUserId },
    });
    if (developer && developer.email) {
      recipient = await prisma.user.findUnique({
        where: { email: developer.email },
      });
      if (!recipient) {
        recipient = await prisma.user.create({
          data: {
            email: developer.email,
            name: developer.name,
            phone: developer.phone,
            passwordHash: "external-sso-placeholder",
            role: "BUYER",
          },
        });
      }
    } else if (developer && !developer.email) {
      // Developer with no email — create a placeholder
      const placeholderEmail = `dev-${developer.id}@internal.brickvest`;
      recipient = await prisma.user.findUnique({ where: { email: placeholderEmail } });
      if (!recipient) {
        recipient = await prisma.user.create({
          data: {
            email: placeholderEmail,
            name: developer.name,
            phone: developer.phone,
            passwordHash: "external-sso-placeholder",
            role: "BUYER",
          },
        });
      }
    }
  }
  if (!recipient) {
    throw new Error("Recipient not found");
  }

  const config = await getMessagingIntegrations();
  let channel: MessageChannel;
  let status: MessageStatus = MessageStatus.SENT;
  let provider = "dev";
  let externalId: string | null = null;
  let webUrl: string | undefined;
  let error: string | null = null;

  const toPhone = input.recipientPhone?.trim() || recipient.phone || "";
  const toEmail = recipient.email;

  try {
    switch (input.channel) {
      case "whatsapp":
      case "whatsapp_web": {
        if (!toPhone) throw new Error("Recipient has no phone number on profile");

        const useApi =
          input.channel === "whatsapp" &&
          !input.forceWeb &&
          config.whatsappMode === "api" &&
          config.whatsappApiToken;

        if (useApi) {
          channel = MessageChannel.WHATSAPP;
          const result = await sendWhatsAppApi(toPhone, input.body, config);
          provider = result.provider;
          externalId = result.externalId;
        } else {
          channel = MessageChannel.WHATSAPP_WEB;
          webUrl = whatsAppWebUrl(toPhone, input.body);
          provider = "whatsapp_web";
          status = MessageStatus.OPENED_WEB;
        }
        break;
      }
      case "email": {
        channel = MessageChannel.EMAIL;
        const subject = input.subject ?? `Message from ${config.companyName}`;
        const html = `<div style="font-family:system-ui,sans-serif;max-width:560px"><p>${input.body.replace(/\n/g, "<br>")}</p></div>`;

        const gmail = await sendViaGmail(toEmail, subject, html, config);
        if (gmail) {
          provider = gmail.provider;
          externalId = gmail.externalId;
        } else {
          const result = await sendEmail({ to: toEmail, subject, html });
          provider = result.provider;
          externalId = result.id;
        }

        // Send WhatsApp / SMS notification to real recipient if they have a phone number
        if (toPhone) {
          try {
            const alertBody = `Hi ${recipient.name || "there"}, we've sent you an email: "${subject}". Please check your inbox (${toEmail}).`;
            if (config.whatsappMode === "api" && config.whatsappApiToken) {
              await sendWhatsAppApi(toPhone, alertBody, config);
            } else if (config.twilioAccountSid && config.twilioAuthToken && config.twilioFromPhone) {
              await sendSms(toPhone, alertBody, config);
            }
          } catch (err) {
            console.error("Failed to send WhatsApp/SMS alert for email:", err);
          }
        }
        break;
      }
      case "telegram": {
        channel = MessageChannel.TELEGRAM;
        if (!toPhone) throw new Error("Recipient phone/chat ID required for Telegram");
        const result = await sendTelegram(toPhone, input.body, config);
        provider = result.provider;
        externalId = result.externalId;
        break;
      }
      case "sms": {
        channel = MessageChannel.SMS;
        if (!toPhone) throw new Error("Recipient has no phone number on profile");
        const result = await sendSms(toPhone, input.body, config);
        provider = result.provider;
        externalId = result.externalId;
        break;
      }
      case "platform": {
        channel = MessageChannel.PLATFORM;
        provider = "platform";
        status = MessageStatus.SENT;
        break;
      }
      default:
        throw new Error("Unknown channel");
    }
  } catch (e) {
    channel =
      input.channel === "platform"
        ? MessageChannel.PLATFORM
        : input.channel === "whatsapp_web" || input.channel === "whatsapp"
          ? input.forceWeb || config.whatsappMode === "web"
            ? MessageChannel.WHATSAPP_WEB
            : MessageChannel.WHATSAPP
          : input.channel === "email"
            ? MessageChannel.EMAIL
            : input.channel === "telegram"
              ? MessageChannel.TELEGRAM
              : MessageChannel.SMS;
    status = MessageStatus.FAILED;
    error = e instanceof Error ? e.message : "Send failed";
    provider = "error";
  }

  const log = await prisma.messageLog.create({
    data: {
      channel,
      recipientId: recipient.id,
      sentById: input.sentById,
      toPhone: toPhone || null,
      toEmail: channel === MessageChannel.EMAIL ? toEmail : null,
      subject: input.subject ?? null,
      body: input.body,
      status,
      provider,
      externalId,
      webUrl: webUrl ?? null,
      error,
      meetingId: input.meetingId ?? null,
    },
  });

  return {
    ok: status !== MessageStatus.FAILED,
    channel,
    status,
    provider,
    webUrl,
    error: error ?? undefined,
    logId: log.id,
  };
}

export async function notifyStaffMeetingScheduled(meetingId: string) {
  const meeting = await prisma.meetingInvite.findUnique({
    where: { id: meetingId },
    include: {
      user: true,
      agent: true,
      createdBy: true,
    },
  });
  if (!meeting) return;

  const config = await getMessagingIntegrations();
  const when = meeting.scheduledAt
    ? meeting.scheduledAt.toLocaleString()
    : "Time TBD";

  const staff = [meeting.agent, meeting.createdBy].filter(Boolean);
  const uniqueStaff = Array.from(new Map(staff.map((s) => [s!.id, s!])).values());

  const alertBody = `New meeting scheduled with ${meeting.user.name} (${meeting.user.email}).\nTitle: ${meeting.title}\nWhen: ${when}\nPhone: ${meeting.user.phone ?? "N/A"}`;

  for (const person of uniqueStaff) {
    if (person.email) {
      await sendEmail({
        to: person.email,
        subject: `Meeting scheduled — ${meeting.title}`,
        html: `<p>${alertBody.replace(/\n/g, "<br>")}</p>`,
      }).catch(() => {});
    }

    if (config.notificationEmail && person.role === "SUPERADMIN") {
      await sendEmail({
        to: config.notificationEmail,
        subject: `[${config.companyName}] Meeting scheduled — ${meeting.title}`,
        html: `<p>${alertBody.replace(/\n/g, "<br>")}</p>`,
      }).catch(() => {});
    }

    if (person.phone) {
      await sendAdminMessage({
        channel: config.whatsappMode === "api" ? "whatsapp" : "whatsapp_web",
        recipientUserId: person.id,
        sentById: meeting.createdById,
        body: alertBody,
        meetingId: meeting.id,
      }).catch(() => {});
    }
  }
}

export async function receiveIncomingMessage({
  channel,
  fromPhone,
  body,
  subject,
  externalId,
  provider,
}: {
  channel: MessageChannel;
  fromPhone: string;
  body: string;
  subject?: string;
  externalId?: string;
  provider: string;
}) {
  const cleaned = fromPhone.replace(/\D/g, "");
  if (!cleaned) return null;

  // 1. Search User table
  let user = await prisma.user.findFirst({
    where: { phone: { contains: cleaned.slice(-8) } }
  });

  // 2. Search Lead table
  let lead = await prisma.lead.findFirst({
    where: { phone: { contains: cleaned.slice(-8) } },
    include: { owner: true }
  });

  // If User not found but Lead exists, find or create a User for them
  if (!user && lead) {
    user = await prisma.user.findUnique({
      where: { email: lead.email }
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: lead.email,
          name: lead.name,
          phone: fromPhone,
          passwordHash: "external-sso-placeholder",
          role: "BUYER",
        }
      });
    }
  }

  // If neither exists, auto-create a Lead and User
  if (!user && !lead) {
    const uniqueEmail = `inbound-${cleaned}@brickvest.com`;
    lead = await prisma.lead.create({
      data: {
        name: `Inbound Lead ${fromPhone}`,
        phone: fromPhone,
        email: uniqueEmail,
        source: "Inbound Messaging",
        stage: "NEW",
        notes: "Auto-created from inbound message webhook.",
      },
      include: { owner: true }
    });
    user = await prisma.user.create({
      data: {
        email: uniqueEmail,
        name: `Inbound Lead ${fromPhone}`,
        phone: fromPhone,
        passwordHash: "external-sso-placeholder",
        role: "BUYER",
      }
    });
  }

  // Determine recipient agent ID
  let recipientId = lead?.ownerId;
  if (!recipientId) {
    const admin = await prisma.user.findFirst({
      where: { role: "SUPERADMIN" }
    });
    recipientId = admin?.id || "";
  }

  // Create message log
  const log = await prisma.messageLog.create({
    data: {
      channel,
      recipientId: recipientId || null,
      sentById: user!.id,
      toPhone: fromPhone,
      toEmail: user!.email,
      subject: subject || null,
      body,
      status: MessageStatus.SENT,
      provider,
      externalId: externalId || `webhook-${Date.now()}`,
    }
  });

  return log;
}

