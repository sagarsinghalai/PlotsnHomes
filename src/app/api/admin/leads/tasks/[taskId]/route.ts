import { NextResponse } from "next/server";
import { z } from "zod";
import { leadScopeForUser, requireCrmApi } from "@/lib/crm-access";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(1).optional(),
  dueAt: z.string().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { taskId: string } }) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;

  try {
    const taskRow = await prisma.leadTask.findUnique({
      where: { id: params.taskId },
      include: { lead: { select: { id: true, ownerId: true } } },
    });
    if (!taskRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const scope = leadScopeForUser(auth.session.user.role, auth.userId);
    if (scope.ownerId && taskRow.lead.ownerId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = patchSchema.parse(await req.json());
    const task = await prisma.leadTask.update({
      where: { id: params.taskId },
      data: {
        ...(data.completed !== undefined && { completed: data.completed }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.dueAt !== undefined && { dueAt: data.dueAt ? new Date(data.dueAt) : null }),
      },
    });
    return NextResponse.json({ ok: true, task });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { taskId: string } }) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;

  try {
    const taskRow = await prisma.leadTask.findUnique({
      where: { id: params.taskId },
      include: { lead: { select: { ownerId: true } } },
    });
    if (!taskRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const scope = leadScopeForUser(auth.session.user.role, auth.userId);
    if (scope.ownerId && taskRow.lead.ownerId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.leadTask.delete({ where: { id: params.taskId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
