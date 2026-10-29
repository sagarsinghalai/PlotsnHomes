import { NextResponse } from "next/server";
import { getFormBySlug, addSubmission } from "@/lib/forms-store";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Public: accept a form submission, store it, and (optionally) create a CRM lead.
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const form = await getFormBySlug(params.slug);
  if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const data: Record<string, string> = {};
  for (const f of form.fields) {
    const raw = body[f.id];
    const val = raw == null ? "" : String(raw).trim();
    if (f.required && !val) {
      return NextResponse.json({ error: `"${f.label}" is required.` }, { status: 400 });
    }
    data[f.id] = val;
  }

  const sub = await addSubmission(form.id, data, {
    referrer: req.headers.get("referer") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  });

  // Optionally push into the CRM as a lead (best-effort; never blocks the submit).
  if (form.settings.createLead && form.tenantId) {
    try {
      const byLabel = (re: RegExp) => {
        const field = form.fields.find((f) => re.test(f.label));
        return field ? data[field.id] : "";
      };
      const byType = (t: string) => {
        const field = form.fields.find((f) => f.type === t);
        return field ? data[field.id] : "";
      };
      const name = byLabel(/name/i) || "Form lead";
      const email = byType("email") || byLabel(/email/i) || "";
      const phone = byType("phone") || byLabel(/phone|mobile|contact/i) || null;
      await prisma.lead.create({
        data: {
          tenantId: form.tenantId,
          name,
          email,
          phone: phone || null,
          source: `Form: ${form.name}`,
        },
      });
    } catch {
      /* lead creation is a bonus — the submission is already stored */
    }
  }

  return NextResponse.json({
    ok: true,
    id: sub.id,
    message: form.settings.successMessage || "Thanks! Your response has been recorded.",
  });
}
