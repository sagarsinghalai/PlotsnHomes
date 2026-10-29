import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { isSuperAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// List custom-field definitions for a category (e.g. "user").
export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const category = new URL(req.url).searchParams.get("category") || "";
  const defs = await prisma.customFieldDef.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ defs });
}

// Create a field definition (superadmin only — these affect everyone).
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  if (!isSuperAdmin(auth.session.user.role)) {
    return NextResponse.json({ error: "Only a Super Admin can add fields." }, { status: 403 });
  }
  try {
    const body = await req.json();
    if (!body.category || !body.label) {
      return NextResponse.json({ error: "Category and label are required." }, { status: 400 });
    }
    const def = await prisma.customFieldDef.create({
      data: {
        category: String(body.category),
        label: String(body.label),
        fieldType: String(body.fieldType || "text"),
        options: body.options ? String(body.options) : null,
        required: !!body.required,
      },
    });
    return NextResponse.json({ ok: true, def });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to create field." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  if (!isSuperAdmin(auth.session.user.role)) {
    return NextResponse.json({ error: "Only a Super Admin can delete fields." }, { status: 403 });
  }
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.customFieldDef.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
