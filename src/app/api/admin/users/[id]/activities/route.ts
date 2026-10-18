import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const SCHED_KEY = "crm_scheduling_link";
const TYPES = ["NOTE", "EMAIL", "CALL", "TASK", "MEETING"] as const;

// body is rich HTML that may embed images as data URLs, so allow a generous size.
const BODY_MAX = 10_000_000;

const createSchema = z.object({
  type: z.enum(TYPES),
  subject: z.string().max(300).optional().nullable(),
  body: z.string().max(BODY_MAX).optional().nullable(),
  outcome: z.string().max(300).optional().nullable(),
  dueAt: z.string().optional().nullable(),
  meetingAt: z.string().optional().nullable(),
  meetingLink: z.string().max(1000).optional().nullable(),
});

const patchSchema = z.object({
  activityId: z.string().optional(),
  subject: z.string().max(300).optional().nullable(),
  body: z.string().max(BODY_MAX).optional().nullable(),
  outcome: z.string().max(300).optional().nullable(),
  dueAt: z.string().optional().nullable(),
  meetingAt: z.string().optional().nullable(),
  meetingLink: z.string().max(1000).optional().nullable(),
  completed: z.boolean().optional(),
  pinned: z.boolean().optional(),
  setSchedulingLink: z.string().max(1000).optional(),
});

async function getSchedulingLink(): Promise<string> {
  const s = await prisma.systemSetting.findUnique({ where: { key: SCHED_KEY }, select: { value: true } });
  return s?.value ?? "";
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const [activities, schedulingLink] = await Promise.all([
    prisma.userActivity.findMany({
      where: { contactId: params.id },
      orderBy: { createdAt: "desc" },
      include: { comments: { orderBy: { createdAt: "asc" } } },
    }),
    getSchedulingLink(),
  ]);
  return NextResponse.json({ activities, schedulingLink });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const raw = await req.json();
    const admin = auth.session?.user?.id
      ? await prisma.user.findUnique({ where: { id: auth.session.user.id }, select: { name: true, userId: true } })
      : null;

    // Add a comment to an existing activity.
    if (raw?.comment && raw?.commentActivityId) {
      const body = String(raw.comment).trim();
      if (!body) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
      const owner = await prisma.userActivity.findFirst({ where: { id: raw.commentActivityId, contactId: params.id }, select: { id: true } });
      if (!owner) return NextResponse.json({ error: "Activity not found" }, { status: 404 });
      const comment = await prisma.activityComment.create({
        data: {
          activityId: raw.commentActivityId,
          body,
          authorId: auth.session?.user?.id ?? null,
          authorName: admin?.name ?? "Admin",
          authorUserId: admin?.userId ?? null,
        },
      });
      return NextResponse.json({ ok: true, comment });
    }

    const data = createSchema.parse(raw);

    const activity = await prisma.userActivity.create({
      data: {
        contactId: params.id,
        type: data.type,
        subject: data.subject || null,
        body: data.body || null,
        outcome: data.outcome || null,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
        meetingAt: data.meetingAt ? new Date(data.meetingAt) : null,
        meetingLink: data.meetingLink || null,
        authorId: auth.session?.user?.id ?? null,
        authorName: admin?.name ?? "Admin",
        authorUserId: admin?.userId ?? null,
      },
    });
    return NextResponse.json({ ok: true, activity });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Could not create activity" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const data = patchSchema.parse(await req.json());

    // Save the global scheduling link (Calendly / Cal.com) setting.
    if (data.setSchedulingLink !== undefined) {
      await prisma.systemSetting.upsert({
        where: { key: SCHED_KEY },
        create: { key: SCHED_KEY, value: data.setSchedulingLink },
        update: { value: data.setSchedulingLink },
      });
      return NextResponse.json({ ok: true, schedulingLink: data.setSchedulingLink });
    }

    if (!data.activityId) return NextResponse.json({ error: "activityId is required" }, { status: 400 });
    const existing = await prisma.userActivity.findFirst({ where: { id: data.activityId, contactId: params.id } });
    if (!existing) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

    const editor = auth.session?.user?.id
      ? await prisma.user.findUnique({ where: { id: auth.session.user.id }, select: { name: true, userId: true } })
      : null;

    const activity = await prisma.userActivity.update({
      where: { id: data.activityId },
      data: {
        ...(data.subject !== undefined && { subject: data.subject || null }),
        ...(data.body !== undefined && { body: data.body || null }),
        ...(data.outcome !== undefined && { outcome: data.outcome || null }),
        ...(data.dueAt !== undefined && { dueAt: data.dueAt ? new Date(data.dueAt) : null }),
        ...(data.meetingAt !== undefined && { meetingAt: data.meetingAt ? new Date(data.meetingAt) : null }),
        ...(data.meetingLink !== undefined && { meetingLink: data.meetingLink || null }),
        ...(data.completed !== undefined && { completed: data.completed }),
        ...(data.pinned !== undefined && { pinned: data.pinned }),
        // Record who made this edit & when (audit trail).
        editedById: auth.session?.user?.id ?? null,
        editedByName: editor?.name ?? "Admin",
        editedByUserId: editor?.userId ?? null,
        editedAt: new Date(),
      },
      include: { comments: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json({ ok: true, activity });
  } catch (e) {
    if (e instanceof z.ZodError) return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Could not update activity" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);

  // Delete a single comment on an activity.
  const commentId = searchParams.get("commentId");
  if (commentId) {
    const comment = await prisma.activityComment.findFirst({
      where: { id: commentId, activity: { contactId: params.id } },
      select: { id: true },
    });
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    await prisma.activityComment.delete({ where: { id: commentId } });
    return NextResponse.json({ ok: true });
  }

  const activityId = searchParams.get("activityId");
  if (!activityId) return NextResponse.json({ error: "activityId is required" }, { status: 400 });

  const existing = await prisma.userActivity.findFirst({ where: { id: activityId, contactId: params.id } });
  if (!existing) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

  await prisma.userActivity.delete({ where: { id: activityId } });
  return NextResponse.json({ ok: true });
}
