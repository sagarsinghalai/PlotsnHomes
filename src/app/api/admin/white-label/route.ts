import { NextResponse } from "next/server";
import {
  getPartnerSubscriptions,
  getWhiteLabelProfile,
  savePartnerSubscriptions,
  saveWhiteLabelProfile,
} from "@/lib/white-label-store";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { isSuperAdmin } from "@/lib/roles";

// Platform-owner only: white-label profile + partner subscription config.
async function requirePlatformOwner() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Super Admin authorization required" }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const denied = await requirePlatformOwner();
  if (denied) return denied;
  try {
    const [profile, subscriptions] = await Promise.all([
      getWhiteLabelProfile(),
      getPartnerSubscriptions(),
    ]);

    return NextResponse.json({
      profile,
      subscriptions,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch white-label settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const denied = await requirePlatformOwner();
  if (denied) return denied;
  try {
    const body = await req.json();

    if (body.profile) {
      await saveWhiteLabelProfile(body.profile);
    }

    if (Array.isArray(body.subscriptions)) {
      await savePartnerSubscriptions(body.subscriptions);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save white-label settings" }, { status: 500 });
  }
}
