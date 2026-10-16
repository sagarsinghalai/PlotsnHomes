import { prisma } from "@/lib/prisma";

export function formatUserId(num: number): string {
  return `USR-${String(num).padStart(5, "0")}`;
}

export async function generateNextUserId(): Promise<string> {
  const lastUser = await prisma.user.findFirst({
    where: { userId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { userId: true },
  });

  if (!lastUser || !lastUser.userId) {
    // Count total users to estimate initial sequence number
    const count = await prisma.user.count();
    return formatUserId(10001 + count);
  }

  const match = lastUser.userId.match(/USR-(\d+)/i);
  if (match && match[1]) {
    const nextNum = parseInt(match[1], 10) + 1;
    return formatUserId(nextNum);
  }

  const count = await prisma.user.count();
  return formatUserId(10001 + count + Math.floor(Math.random() * 100));
}

export async function ensureAllUsersHaveUserId(): Promise<void> {
  try {
    const usersWithoutId = await prisma.user.findMany({
      where: { OR: [{ userId: null }, { userId: "" }] },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true },
    });

    if (usersWithoutId.length === 0) return;

    let startNum = 10001;
    const existingWithId = await prisma.user.findMany({
      where: { userId: { not: null } },
      select: { userId: true },
    });

    const usedNums = new Set<number>();
    existingWithId.forEach((u) => {
      if (u.userId) {
        const m = u.userId.match(/USR-(\d+)/i);
        if (m && m[1]) usedNums.add(parseInt(m[1], 10));
      }
    });

    for (const u of usersWithoutId) {
      while (usedNums.has(startNum)) {
        startNum++;
      }
      const newUserId = formatUserId(startNum);
      usedNums.add(startNum);
      await prisma.user.update({
        where: { id: u.id },
        data: { userId: newUserId },
      });
      startNum++;
    }
  } catch (err) {
    console.error("Error ensuring user IDs:", err);
  }
}
