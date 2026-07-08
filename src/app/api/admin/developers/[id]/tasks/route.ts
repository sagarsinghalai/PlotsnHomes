import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "CANCELLED"]).optional(),
  deadline: z.string().optional().nullable(),
});

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const developer = await prisma.developer.findUnique({
      where: { id: params.id },
    });
    if (!developer) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    const tasks = await prisma.developerTask.findMany({
      where: { developerId: params.id },
      orderBy: [
        { status: "asc" },
        { deadline: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ ok: true, tasks });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Could not fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const developer = await prisma.developer.findUnique({
      where: { id: params.id },
    });
    if (!developer) {
      return NextResponse.json({ error: "Developer not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = createSchema.parse(body);

    const task = await prisma.developerTask.create({
      data: {
        developerId: params.id,
        title: data.title,
        description: data.description || null,
        priority: data.priority ?? "MEDIUM",
        status: data.status ?? "TODO",
        deadline: data.deadline ? new Date(data.deadline) : null,
      },
    });

    return NextResponse.json({ ok: true, task }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json(
      { error: "Could not create task" },
      { status: 500 }
    );
  }
}
