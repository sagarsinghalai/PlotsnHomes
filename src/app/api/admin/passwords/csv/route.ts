import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export const dynamic = "force-dynamic";

// DEPRECATED: passwords are no longer stored in readable form, so there is
// nothing to export. This endpoint is kept only to return a clear 410 instead of
// 404 for any old bookmarks/links. (Still Super Admin gated.)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Access Denied: Super Admin authorization required." },
      { status: 403 }
    );
  }
  return NextResponse.json(
    {
      error: "Password export has been removed.",
      detail:
        "Passwords are stored only as one-way hashes and cannot be exported. Use Reset password or Login as user instead.",
    },
    { status: 410 }
  );
}
