import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { getPrimaryTenantId } from "@/lib/tenant";
import { sendEmail } from "@/lib/email";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const messages = await prisma.messageLog.findMany({
      where: {
        OR: [
          { recipientId: session.user.id },
          { sentById: session.user.id }
        ]
      },
      orderBy: { createdAt: "asc" },
      include: {
        sentBy: { select: { name: true, role: true } },
        recipient: { select: { name: true, role: true } }
      }
    });

    return NextResponse.json({ ok: true, messages });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { body } = await req.json();
    if (!body?.trim()) {
      return NextResponse.json({ error: "Message body is required" }, { status: 400 });
    }

    // Lookup lead to find assigned agent (owner)
    const lead = await prisma.lead.findFirst({
      where: { email: session.user.email },
      include: { owner: true }
    });

    let recipientId = lead?.ownerId;
    let recipientEmail = lead?.owner?.email;
    let recipientName = lead?.owner?.name;

    // Fallback to superadmin if no agent assigned
    if (!recipientId) {
      const adminUser = await prisma.user.findFirst({
        where: { role: "SUPERADMIN" }
      });
      if (adminUser) {
        recipientId = adminUser.id;
        recipientEmail = adminUser.email;
        recipientName = adminUser.name;
      }
    }

    if (!recipientId) {
      return NextResponse.json({ error: "No agent or administrator is currently assigned to support you." }, { status: 400 });
    }

    // Create Message Log
    const message = await prisma.messageLog.create({
      data: {
        tenantId: session.user.tenantId ?? (await getPrimaryTenantId()),
        channel: "PLATFORM",
        sentById: session.user.id,
        recipientId,
        body: body.trim(),
        status: "SENT",
        provider: "platform",
      },
    });

    // Notify agent via email
    if (recipientEmail) {
      const emailHtml = `
        <div style="font-family:system-ui,sans-serif;max-width:560px;padding:20px;border:1px solid #e2e8f0;border-radius:12px">
          <h2 style="color:#0f172a">New message from client</h2>
          <p><strong>Client:</strong> ${session.user.name} (${session.user.email})</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0" />
          <p style="white-space:pre-wrap;background:#f8fafc;padding:12px;border-radius:8px">${body.trim()}</p>
          <p style="margin-top:20px"><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/admin/messages" style="background:#3347b0;color:#0f172a;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:600">Reply in Chat Workspace</a></p>
        </div>
      `;
      await sendEmail({
        to: recipientEmail,
        subject: `[New Message] ${session.user.name} sent you a message`,
        html: emailHtml,
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true, message });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to send message";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
