import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { MessageChannel, MessageStatus } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { getMessagingIntegrations } from "@/lib/messaging-settings";

const simulateSchema = z.object({
  senderUserId: z.string().min(1),
  channel: z.enum(["whatsapp", "email", "telegram", "sms"]),
  body: z.string().min(1),
  subject: z.string().optional(),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const adminId = auth.session!.user.id;
  const adminEmail = auth.session!.user.email;

  try {
    const { senderUserId, channel, body, subject } = simulateSchema.parse(await req.json());

    let sender = await prisma.user.findUnique({
      where: { id: senderUserId },
    });
    if (!sender) {
      const lead = await prisma.lead.findUnique({
        where: { id: senderUserId },
      });
      if (lead) {
        sender = await prisma.user.findUnique({
          where: { email: lead.email },
        });
        if (!sender) {
          sender = await prisma.user.create({
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
    if (!sender) {
      return NextResponse.json({ error: "Sender user not found" }, { status: 404 });
    }

    // Map input channel to MessageChannel DB enum
    let dbChannel: MessageChannel = MessageChannel.WHATSAPP;
    if (channel === "email") dbChannel = MessageChannel.EMAIL;
    else if (channel === "telegram") dbChannel = MessageChannel.TELEGRAM;
    else if (channel === "sms") dbChannel = MessageChannel.SMS;

    // Create the incoming message log in the DB
    const log = await prisma.messageLog.create({
      data: {
        channel: dbChannel,
        recipientId: adminId, // admin receives the message
        sentById: sender.id,  // sender is the client user
        toPhone: sender.phone || null,
        toEmail: sender.email,
        subject: subject || null,
        body: body,
        status: MessageStatus.SENT,
        provider: "simulated_incoming",
        externalId: `sim-${Date.now()}`,
      },
    });

    // Notify the admin via email about this incoming message
    const integrations = await getMessagingIntegrations();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";
    const emailSubject = `[BrickVest Alert] New ${channel.toUpperCase()} message from ${sender.name}`;
    const emailHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;padding:24px;background:#ffffff">
        <h2 style="color:#0f172a;margin-top:0;font-size:20px;border-b:1px solid #f1f5f9;padding-bottom:12px">New Message Received</h2>
        <p style="margin-top:16px">You received a new incoming message on <strong>${channel.toUpperCase()}</strong>:</p>
        <div style="background:#f8fafc;padding:16px;border-left:4px solid #e2b73c;border-radius:4px;margin:16px 0;font-size:15px;color:#334155;line-height:1.6">
          ${body.replace(/\n/g, "<br>")}
        </div>
        <p style="margin:20px 0 10px 0"><strong>From:</strong> ${sender.name} (${sender.email})</p>
        ${sender.phone ? `<p style="margin:0 0 20px 0"><strong>Phone:</strong> ${sender.phone}</p>` : ""}
        <p style="margin-top:24px">
          <a href="${appUrl}/admin/messages?userId=${sender.id}" style="display:inline-block;background:#0f172a;color:#ffffff;padding:10px 20px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">
            Reply in Chat Workspace
          </a>
        </p>
      </div>
    `;

    // Send to current admin email
    if (adminEmail) {
      await sendEmail({ to: adminEmail, subject: emailSubject, html: emailHtml }).catch(console.error);
    }

    // Send to config notification email if different
    if (integrations.notificationEmail && integrations.notificationEmail !== adminEmail) {
      await sendEmail({ to: integrations.notificationEmail, subject: emailSubject, html: emailHtml }).catch(console.error);
    }

    return NextResponse.json({ ok: true, message: log });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    const msg = e instanceof Error ? e.message : "Simulation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
