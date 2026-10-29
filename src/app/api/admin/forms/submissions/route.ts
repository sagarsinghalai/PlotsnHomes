import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { isSuperAdmin } from "@/lib/roles";
import { getFormById, getSubmissions } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const form = await getFormById(id);
  if (!form) return NextResponse.json({ submissions: [] });
  if (!isSuperAdmin(auth.session.user.role) && form.tenantId !== auth.tenantId) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }

  const submissions = await getSubmissions(id);
  return NextResponse.json({ submissions });
}
