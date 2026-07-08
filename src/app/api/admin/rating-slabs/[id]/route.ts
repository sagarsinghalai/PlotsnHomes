import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { upsertRatingSlab, deleteRatingSlab } from "@/lib/system-settings";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const { label, minYield, maxYield, color, sortOrder, type } = body;
  if (!label || minYield === undefined) {
    return NextResponse.json({ error: "label and minYield are required" }, { status: 400 });
  }
  const slab = await upsertRatingSlab({ id, label, minYield, maxYield, color, sortOrder, type });
  return NextResponse.json(slab);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await deleteRatingSlab(id);
  return NextResponse.json({ ok: true });
}
