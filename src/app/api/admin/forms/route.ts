import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { isSuperAdmin } from "@/lib/roles";
import { getForms, saveForm, deleteForm, getFormById, getMetrics } from "@/lib/forms-store";

export const dynamic = "force-dynamic";

// List the viewer's forms (superadmin sees all) with their metrics.
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const owner = isSuperAdmin(auth.session.user.role);
  const forms = await getForms(owner ? undefined : auth.tenantId);
  const withMetrics = await Promise.all(
    forms.map(async (f) => ({ ...f, metrics: await getMetrics(f.id) }))
  );
  return NextResponse.json({ forms: withMetrics });
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    if (!body.name) return NextResponse.json({ error: "Form name is required" }, { status: 400 });
    // A tenant admin can only edit their own forms; a superadmin can edit any.
    if (body.id) {
      const existing = await getFormById(body.id);
      if (existing && !isSuperAdmin(auth.session.user.role) && existing.tenantId !== auth.tenantId) {
        return NextResponse.json({ error: "Not allowed to edit this form." }, { status: 403 });
      }
    }
    const saved = await saveForm(body, auth.tenantId);
    return NextResponse.json({ ok: true, form: saved });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to save form" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await getFormById(id);
  if (existing && !isSuperAdmin(auth.session.user.role) && existing.tenantId !== auth.tenantId) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  }
  await deleteForm(id);
  return NextResponse.json({ ok: true });
}
