import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { id, notes } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Commission ID is required" }, { status: 400 });
    }

    const now = new Date();
    const timestampStr = now.toISOString().replace("T", " ").slice(0, 16);

    let formattedNote = (notes || "").trim();
    // If the note doesn't already start with a timestamp bracket, prefix it!
    if (formattedNote && !formattedNote.startsWith("[")) {
      formattedNote = `[${timestampStr}] ${formattedNote}`;
    }

    if (!id.startsWith("comm-")) {
      try {
        await prisma.agentCommission.update({
          where: { id },
          data: { notes: formattedNote },
        });
      } catch (e) {
        console.warn("Prisma agent commission update skipped:", e);
      }
    }

    return NextResponse.json({ ok: true, id, notes: formattedNote });
  } catch (err: any) {
    console.error("Save commission note error:", err);
    return NextResponse.json({ error: err.message || "Failed to save note" }, { status: 500 });
  }
}
