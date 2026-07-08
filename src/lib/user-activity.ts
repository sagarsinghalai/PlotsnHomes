import { prisma } from "@/lib/prisma";

export function isUserOnline(lastActiveAt: Date | null | undefined): boolean {
  if (!lastActiveAt) return false;
  return Date.now() - lastActiveAt.getTime() < 15 * 60 * 1000;
}

export function activityLabel(lastActiveAt: Date | null | undefined): {
  label: string;
  tone: "online" | "recent" | "offline";
} {
  if (!lastActiveAt) {
    return { label: "Never", tone: "offline" };
  }
  const mins = (Date.now() - lastActiveAt.getTime()) / 60000;
  if (mins < 15) return { label: "Online", tone: "online" };
  if (mins < 60 * 24 * 7) {
    return {
      label: `${Math.floor(mins / 60)}h ago`,
      tone: "recent",
    };
  }
  return { label: "Inactive", tone: "offline" };
}

/** Returns false when the user no longer exists (e.g. after db reseed). */
export async function touchUserActivity(userId: string): Promise<boolean> {
  const result = await prisma.user.updateMany({
    where: { id: userId, active: true },
    data: { lastActiveAt: new Date() },
  });
  return result.count > 0;
}
