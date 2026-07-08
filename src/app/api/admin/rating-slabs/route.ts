import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getRatingSlabs, upsertRatingSlab, seedDefaultRatingSlabs } from "@/lib/system-settings";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "yieldRate";
  await seedDefaultRatingSlabs();
  const slabs = await getRatingSlabs(type);
  return NextResponse.json(slabs);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { label, minYield, maxYield, color, sortOrder, type } = body;
  if (!label || minYield === undefined) {
    return NextResponse.json({ error: "label and minYield are required" }, { status: 400 });
  }
  const slab = await upsertRatingSlab({ label, minYield, maxYield, color, sortOrder, type });
  return NextResponse.json(slab, { status: 201 });
}
