import { NextResponse } from "next/server";
import { getCustomPages, saveCustomPage, deleteCustomPage } from "@/lib/webpage-editor-store";
import { getSession } from "@/lib/auth";

export async function GET() {
  const pages = await getCustomPages();
  return NextResponse.json({ pages });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.title || !body.slug) {
      return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
    }

    const savedPage = await saveCustomPage(body);
    return NextResponse.json({ ok: true, page: savedPage });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to save page" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Page ID is required" }, { status: 400 });
  }

  await deleteCustomPage(id);
  return NextResponse.json({ ok: true });
}
