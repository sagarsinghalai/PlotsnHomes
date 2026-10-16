import { NextResponse } from "next/server";
import {
  getPartnerSubscriptions,
  getWhiteLabelProfile,
  savePartnerSubscriptions,
  saveWhiteLabelProfile,
} from "@/lib/white-label-store";

export async function GET() {
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
