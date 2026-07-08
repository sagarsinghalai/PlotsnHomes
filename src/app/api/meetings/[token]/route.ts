import { MeetingStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { notifyStaffMeetingScheduled } from "@/lib/messaging";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const meeting = await prisma.meetingInvite.findUnique({
    where: { token: params.token },
    include: {
      user: { select: { name: true, email: true } },
      agent: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!meeting) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(meeting);
}

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const data = schema.parse(await req.json());
    const meeting = await prisma.meetingInvite.findUnique({
      where: { token: params.token },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.meetingInvite.update({
      where: { id: meeting.id },
      data: {
        status: MeetingStatus.SCHEDULED,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : new Date(),
        notes: data.notes ?? meeting.notes,
      },
    });

    await notifyStaffMeetingScheduled(updated.id);

    return NextResponse.json({ ok: true, meeting: updated });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Schedule failed" }, { status: 500 });
  }
}
