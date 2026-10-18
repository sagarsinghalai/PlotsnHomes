import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// Public User IDs are random, non-sequential and non-enumerable so they cannot
// be guessed or walked by an attacker (unlike the old USR-10001, USR-10002…
// sequence). They are display/search identifiers only — all relational joins
// use the database cuid primary key (User.id), never this value.
//
// Format: USR-XXXXXXXXXX  (10 chars from a Crockford base32 alphabet that omits
// the ambiguous letters I, L, O and U). ~32^10 ≈ 1.1e15 possibilities.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ID_LEN = 10;

export function formatUserId(_num?: number): string {
  // Kept for backwards-compatibility; now always returns a secure random ID.
  return generateSecureUserId();
}

export function generateSecureUserId(): string {
  const bytes = randomBytes(ID_LEN);
  let out = "";
  for (let i = 0; i < ID_LEN; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return `USR-${out}`;
}

async function generateUniqueUserId(used?: Set<string>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateSecureUserId();
    if (used?.has(candidate)) continue;
    const clash = await prisma.user.findFirst({
      where: { userId: candidate },
      select: { id: true },
    });
    if (!clash) {
      used?.add(candidate);
      return candidate;
    }
  }
  // Extremely unlikely fallback — widen with a timestamp suffix.
  return `${generateSecureUserId()}${Date.now().toString(36).toUpperCase().slice(-4)}`;
}

export async function generateNextUserId(): Promise<string> {
  return generateUniqueUserId();
}

export async function ensureAllUsersHaveUserId(): Promise<void> {
  try {
    const usersWithoutId = await prisma.user.findMany({
      where: { OR: [{ userId: null }, { userId: "" }] },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (usersWithoutId.length === 0) return;

    const used = new Set<string>();
    for (const u of usersWithoutId) {
      const newUserId = await generateUniqueUserId(used);
      await prisma.user.update({ where: { id: u.id }, data: { userId: newUserId } });
    }
  } catch (err) {
    console.error("Error ensuring user IDs:", err);
  }
}

// One-time hardening: replace every existing (possibly sequential) public User
// ID with a fresh secure random one.
export async function regenerateAllUserIds(): Promise<number> {
  const all = await prisma.user.findMany({ select: { id: true } });
  const used = new Set<string>();
  let updated = 0;
  for (const u of all) {
    const newUserId = await generateUniqueUserId(used);
    await prisma.user.update({ where: { id: u.id }, data: { userId: newUserId } });
    updated++;
  }
  return updated;
}
