import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const targetUserId = url.searchParams.get("userId");

  try {
    if (targetUserId) {
      let queryUserId = targetUserId;
      const lead = await prisma.lead.findUnique({ where: { id: targetUserId } });
      if (lead) {
        const user = await prisma.user.findUnique({ where: { email: lead.email } });
        if (user) {
          queryUserId = user.id;
        }
      }
      if (queryUserId === targetUserId) {
        // Try resolving as a Developer ID
        const developer = await prisma.developer.findUnique({ where: { id: targetUserId } });
        if (developer) {
          const email = developer.email ?? `dev-${developer.id}@internal.plotsnhomes`;
          const user = await prisma.user.findUnique({ where: { email } });
          if (user) {
            queryUserId = user.id;
          }
        }
      }

      // Find all message logs involving this user as either recipient or sender
      const messages = await prisma.messageLog.findMany({
        where: {
          OR: [
            { recipientId: queryUserId },
            { sentById: queryUserId },
            { recipientId: targetUserId },
            { sentById: targetUserId },
          ],
        },
        orderBy: { createdAt: "asc" },
        include: {
          sentBy: { select: { id: true, name: true, email: true, role: true } },
          recipient: { select: { id: true, name: true, email: true, role: true } },
        },
      });
      return NextResponse.json({ messages });
    }

    // Otherwise, fetch general recent logs (similar to page.tsx server-side fetch)
    const logs = await prisma.messageLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        recipient: { select: { name: true, email: true } },
        sentBy: { select: { name: true } },
      },
    });
    return NextResponse.json({ logs });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Fetch failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
