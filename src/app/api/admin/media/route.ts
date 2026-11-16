import { NextResponse } from "next/server";
import { readdir, stat, unlink } from "fs/promises";
import path from "path";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { detectMediaKind } from "@/lib/media-limits";

export const dynamic = "force-dynamic";

// GET: list media assets (optionally filtered by ?kind=). ?sync=1 imports any
// files already in /public/uploads that aren't recorded yet.
export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  if (url.searchParams.get("sync") === "1") {
    await syncUploadsFolder();
  }
  const kind = url.searchParams.get("kind") || undefined;
  const q = url.searchParams.get("q")?.trim();

  const media = await prisma.mediaAsset.findMany({
    where: {
      ...(kind && kind !== "all" ? { kind } : {}),
      ...(q
        ? { OR: [{ title: { contains: q } }, { fileName: { contains: q } }, { description: { contains: q } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 600,
  });
  return NextResponse.json({ media });
}

// PATCH: edit a media item's title / description / alt text.
export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const { id, title, description, altText } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const media = await prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(altText !== undefined && { altText }),
      },
    });
    return NextResponse.json({ ok: true, media });
  } catch {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }
}

// DELETE: remove a media item (and its local file, best-effort).
export async function DELETE(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (asset.url?.startsWith("/uploads/")) {
    try {
      await unlink(path.join(process.cwd(), "public", asset.url.replace(/^\/+/, "")));
    } catch {
      /* file already gone — ignore */
    }
  }
  await prisma.mediaAsset.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

// Import local /public/uploads files that aren't yet in the media table, so the
// library reflects media uploaded before it existed.
async function syncUploadsFolder() {
  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    const files = await readdir(dir).catch(() => [] as string[]);
    if (!files.length) return;
    const existing = new Set(
      (
        await prisma.mediaAsset.findMany({
          where: { url: { startsWith: "/uploads/" } },
          select: { url: true },
        })
      ).map((m) => m.url)
    );
    const toCreate: Array<{ url: string; title: string; fileName: string; kind: string; size: number; createdAt: Date }> = [];
    for (const name of files) {
      const url = `/uploads/${name}`;
      if (existing.has(url)) continue;
      let size = 0;
      let createdAt = new Date();
      try {
        const s = await stat(path.join(dir, name));
        size = s.size;
        createdAt = s.birthtime && s.birthtime.getTime() > 0 ? s.birthtime : s.mtime;
      } catch {
        /* keep defaults */
      }
      const kind = detectMediaKind("", name) || "raw";
      toCreate.push({ url, title: name, fileName: name, kind, size, createdAt });
    }
    if (toCreate.length) await prisma.mediaAsset.createMany({ data: toCreate });
  } catch (e) {
    console.warn("[media sync] failed:", e);
  }
}
