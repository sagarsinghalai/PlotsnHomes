import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { getLeadChannels, saveLeadChannels, type LeadChannels } from "@/lib/lead-channels";

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;
    const [channels, users, teams] = await Promise.all([
      getLeadChannels(),
      prisma.user.findMany({ where: { active: true }, select: { id: true, name: true, email: true, role: true }, orderBy: { name: "asc" } }),
      prisma.team.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    ]);
    return NextResponse.json({ success: true, channels, users, teams });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;
    const body = (await req.json()) as LeadChannels;
    // Merge against defaults/current to keep shape sane.
    const current = await getLeadChannels();
    const merged: any = { ...current };
    (Object.keys(current) as (keyof LeadChannels)[]).forEach((k) => {
      if (body[k]) merged[k] = { ...current[k], ...body[k], fieldMap: { ...current[k].fieldMap, ...body[k]?.fieldMap } };
    });
    await saveLeadChannels(merged);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
