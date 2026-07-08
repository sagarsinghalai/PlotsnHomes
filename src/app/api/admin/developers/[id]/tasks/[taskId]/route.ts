import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  deadline: z.string().optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const existing = await prisma.developerTask.findFirst({
      where: { id: params.taskId, developerId: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = patchSchema.parse(body);

    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "DONE") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const task = await prisma.developerTask.update({
      where: { id: params.taskId },
      data: updateData,
    });

    return NextResponse.json({ ok: true, task });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Could not update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const existing = await prisma.developerTask.findFirst({
      where: { id: params.taskId, developerId: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.developerTask.delete({
      where: { id: params.taskId },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not delete task" },
      { status: 500 }
    );
  }
}
