import { prisma } from "@/lib/prisma";
import { DEFAULT_RATING_SLABS, DEFAULT_SLABS_MAP } from "@/lib/calculations";

export const SETTING_KEYS = {
  DEFAULT_INTEREST_RATE: "default_interest_rate",
  DEFAULT_YIELD_RATE: "default_yield_rate",
  DEFAULT_CAP_RATE: "default_cap_rate",
} as const;

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.DEFAULT_INTEREST_RATE]: "6.5",
  [SETTING_KEYS.DEFAULT_YIELD_RATE]: "5.5",
  [SETTING_KEYS.DEFAULT_CAP_RATE]: "5.0",
};

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return row?.value ?? DEFAULTS[key] ?? "";
}

export async function getPlatformRates() {
  const [interest, yieldRate, cap] = await Promise.all([
    getSetting(SETTING_KEYS.DEFAULT_INTEREST_RATE),
    getSetting(SETTING_KEYS.DEFAULT_YIELD_RATE),
    getSetting(SETTING_KEYS.DEFAULT_CAP_RATE),
  ]);
  return {
    defaultInterestRate: parseFloat(interest) || 6.5,
    defaultYieldRate: parseFloat(yieldRate) || 5.5,
    defaultCapRate: parseFloat(cap) || 5.0,
  };
}

export async function setSetting(key: string, value: string) {
  return prisma.systemSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}

export async function seedDefaultSettings() {
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}

// ─── Rating Slabs ────────────────────────────────────────────────────────────

export async function getRatingSlabs(type: string = "yieldRate") {
  const slabs = await prisma.ratingSlab.findMany({
    where: { type },
    orderBy: { sortOrder: "asc" },
  });
  if (slabs.length === 0) return DEFAULT_SLABS_MAP[type] ?? [];
  return slabs;
}

export async function upsertRatingSlab(data: {
  id?: string;
  label: string;
  minYield: number;
  maxYield?: number | null;
  color?: string;
  sortOrder?: number;
  type?: string;
}) {
  if (data.id) {
    return prisma.ratingSlab.update({
      where: { id: data.id },
      data: {
        label: data.label,
        minYield: data.minYield,
        maxYield: data.maxYield ?? null,
        color: data.color ?? "#22c55e",
        sortOrder: data.sortOrder ?? 0,
        ...(data.type && { type: data.type }),
      },
    });
  }
  return prisma.ratingSlab.create({
    data: {
      label: data.label,
      minYield: data.minYield,
      maxYield: data.maxYield ?? null,
      color: data.color ?? "#22c55e",
      sortOrder: data.sortOrder ?? 0,
      type: data.type ?? "yieldRate",
    },
  });
}

export async function deleteRatingSlab(id: string) {
  return prisma.ratingSlab.delete({ where: { id } });
}

export async function seedDefaultRatingSlabs() {
  for (const [type, defaultSlabs] of Object.entries(DEFAULT_SLABS_MAP)) {
    const existing = await prisma.ratingSlab.count({ where: { type } });
    if (existing > 0) continue;
    for (let i = 0; i < defaultSlabs.length; i++) {
      const slab = defaultSlabs[i];
      await prisma.ratingSlab.create({
        data: {
          label: slab.label,
          minYield: slab.minYield,
          maxYield: slab.maxYield ?? null,
          color: slab.color ?? "#22c55e",
          sortOrder: i,
          type: type,
        },
      });
    }
  }
}

// ─── BHK Configurations ──────────────────────────────────────────────────────

export const DEFAULT_BHK_CONFIGURATIONS = [
  "1BHK",
  "1.5BHK",
  "2BHK",
  "2.5BHK",
  "3BHK",
  "3.5BHK",
  "4BHK",
  "4.5BHK",
  "5BHK",
  "6BHK",
  "7BHK",
  "7+BHK",
  "Simplex",
  "Duplex",
  "Triplex",
  "Penthouse"
];

export async function getBhkConfigurations(): Promise<string[]> {
  const raw = await getSetting("bhk_configurations");
  if (!raw) return DEFAULT_BHK_CONFIGURATIONS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return DEFAULT_BHK_CONFIGURATIONS;
  } catch (e) {
    return DEFAULT_BHK_CONFIGURATIONS;
  }
}

export async function saveBhkConfigurations(configs: string[]) {
  return setSetting("bhk_configurations", JSON.stringify(configs));
}

