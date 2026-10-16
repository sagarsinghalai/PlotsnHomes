import { NextResponse } from "next/server";
import { getCustomPageBySlug } from "@/lib/webpage-editor-store";

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const page = await getCustomPageBySlug(params.slug);
  if (!page || page.status !== "published") {
    return NextResponse.json({ error: "Page not found or not published" }, { status: 404 });
  }
  return NextResponse.json({ page });
}
