import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function currentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

// Load the signed-in user's in-progress listing draft (for the resume popup).
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const draft = await prisma.listingDraft.findUnique({ where: { userId } });
  if (!draft) return NextResponse.json({ draft: null });

  let data: unknown = {};
  try {
    data = JSON.parse(draft.data);
  } catch {
    data = {};
  }
  return NextResponse.json({
    draft: { step: draft.step, data, updatedAt: draft.updatedAt },
  });
}

// Upsert the draft as the user moves through the wizard.
export async function PUT(req: Request) {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const step = Number.isFinite(body?.step) ? Math.max(0, Math.trunc(body.step)) : 0;
  const data = JSON.stringify(body?.data ?? {});

  await prisma.listingDraft.upsert({
    where: { userId },
    create: { userId, step, data },
    update: { step, data },
  });

  return NextResponse.json({ ok: true });
}

// Discard the draft (Cancel in the resume popup, or after a successful submit).
export async function DELETE() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.listingDraft.deleteMany({ where: { userId } });
  return NextResponse.json({ ok: true });
}
