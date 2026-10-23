import { MeetingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { noTenantResponse } from "@/lib/data-access";
import { sendAdminMessage } from "@/lib/messaging";
import { getMessagingIntegrations } from "@/lib/messaging-settings";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  userId: z.string(),
  agentId: z.string().optional(),
  title: z.string().min(2),
  message: z.string().optional(),
  calendlyUrl: z.string().optional(),
  customUrl: z.string().optional(),
  sendVia: z.array(z.enum(["email", "whatsapp", "sms"])).optional(),
});

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const meetings = await prisma.meetingInvite.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true, phone: true } },
      agent: { select: { name: true, email: true, phone: true } },
      createdBy: { select: { name: true } },
    },
  });

  return NextResponse.json(meetings);
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  if (!auth.tenantId) return noTenantResponse();

  try {
    const data = createSchema.parse(await req.json());
    const config = await getMessagingIntegrations(auth.tenantId);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001";

    let user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      const lead = await prisma.lead.findUnique({ where: { id: data.userId } });
      if (lead) {
        user = await prisma.user.findUnique({ where: { email: lead.email } });
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: lead.email,
              name: lead.name,
              phone: lead.phone,
              passwordHash: "external-sso-placeholder",
              role: "BUYER",
            }
          });
        }
      }
    }
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let agentId = data.agentId;
    if (!agentId) {
      const agent = await prisma.user.findFirst({
        where: { role: { in: ["SUPERADMIN", "EMPLOYEE", "AGENT"] }, active: true },
        orderBy: { createdAt: "asc" },
      });
      agentId = agent?.id;
    }

    const meeting = await prisma.meetingInvite.create({
      data: {
        tenantId: auth.tenantId,
        userId: user.id,
        agentId: agentId ?? null,
        createdById: auth.session!.user.id,
        title: data.title,
        message: data.message ?? null,
        calendlyUrl: data.calendlyUrl || config.calendlyUrl || null,
        customUrl: data.customUrl || config.customMeetingUrl || null,
        status: MeetingStatus.INVITED,
      },
    });

    const scheduleUrl = `${appUrl}/meetings/${meeting.token}`;
    const meetingBody =
      (data.message ? `${data.message}\n\n` : "") +
      `Schedule your meeting: ${scheduleUrl}` +
      (meeting.calendlyUrl ? `\nOr book directly: ${meeting.calendlyUrl}` : "");

    const channels = data.sendVia ?? ["email", "whatsapp"];
    const results = [];

    for (const ch of channels) {
      if (ch === "email") {
        results.push(
          await sendAdminMessage({
            channel: "email",
            recipientUserId: user.id,
            sentById: auth.session!.user.id,
            body: meetingBody,
            subject: `Meeting invite: ${data.title}`,
            meetingId: meeting.id,
          })
        );
      }
      if (ch === "whatsapp" && user.phone) {
        results.push(
          await sendAdminMessage({
            channel: config.whatsappMode === "api" ? "whatsapp" : "whatsapp_web",
            recipientUserId: user.id,
            sentById: auth.session!.user.id,
            body: meetingBody,
            meetingId: meeting.id,
          })
        );
      }
      if (ch === "sms" && user.phone) {
        results.push(
          await sendAdminMessage({
            channel: "sms",
            recipientUserId: user.id,
            sentById: auth.session!.user.id,
            body: meetingBody,
            meetingId: meeting.id,
          })
        );
      }
    }

    return NextResponse.json({ ok: true, meeting, scheduleUrl, results });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
