import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { touchUserActivity } from "@/lib/user-activity";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ok = await touchUserActivity(session.user.id);
  if (!ok) {
    return NextResponse.json(
      { error: "Session expired — please sign in again", stale: true },
      { status: 401 }
    );
  }
  return NextResponse.json({ ok: true });
}
