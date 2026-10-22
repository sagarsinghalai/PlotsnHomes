import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin-api";
import { getLeadChannels, getMaskedLeadChannels, saveLeadChannels, mergeChannelUpdate, type LeadChannels } from "@/lib/lead-channels";

export async function GET() {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;
    // Secrets are stripped — only booleans + an isConfigured flag are returned.
    const [channels, users, teams] = await Promise.all([
      getMaskedLeadChannels(),
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
    const body = (await req.json()) as Partial<LeadChannels>;
    // Preserve existing (encrypted) secrets when a field is blank/omitted;
    // new secrets get encrypted inside saveLeadChannels.
    const current = await getLeadChannels();
    const merged = mergeChannelUpdate(current, body);
    await saveLeadChannels(merged);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
