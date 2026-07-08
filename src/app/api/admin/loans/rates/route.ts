import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import { prisma } from "@/lib/prisma";
import { DEFAULT_BANKS } from "@/lib/loan-banks";

const RATE_PREFIX = "loan_rate_";
const BANKS_KEY = "loan_rate_banks_list";

const saveSchema = z.object({
  slug: z.string().min(1),
  bank: z.string().min(1),
  rate: z.number().min(0).max(50),
});

const deleteSchema = z.object({
  slug: z.string().min(1),
});

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const [rateSettings, bankListSetting, nameSettings] = await Promise.all([
      prisma.systemSetting.findMany({ where: { key: { startsWith: RATE_PREFIX } } }),
      prisma.systemSetting.findUnique({ where: { key: BANKS_KEY } }),
      prisma.systemSetting.findMany({ where: { key: { startsWith: "loan_bank_name_" } } }),
    ]);

    const customSlugs: string[] = bankListSetting ? JSON.parse(bankListSetting.value) : [];

    const allSlugs = [
      ...DEFAULT_BANKS.map((b) => b.slug),
      ...customSlugs.filter((s) => !DEFAULT_BANKS.find((d) => d.slug === s)),
    ];

    const bankNamesMap: Record<string, string> = {};
    for (const b of DEFAULT_BANKS) bankNamesMap[b.slug] = b.bank;
    for (const s of nameSettings) {
      const slug = s.key.replace("loan_bank_name_", "");
      bankNamesMap[slug] = s.value;
    }

    const ratesMap: Record<string, number> = {};
    for (const s of rateSettings) {
      ratesMap[s.key.replace(RATE_PREFIX, "")] = parseFloat(s.value);
    }

    const updatedAtMap: Record<string, string> = {};
    for (const s of rateSettings) {
      updatedAtMap[s.key.replace(RATE_PREFIX, "")] = s.updatedAt.toISOString();
    }

    const banks = allSlugs.map((slug) => {
      const def = DEFAULT_BANKS.find((b) => b.slug === slug);
      return {
        slug,
        bank: bankNamesMap[slug] ?? def?.bank ?? slug,
        rate: ratesMap[slug] ?? def?.rate ?? 8.5,
        isCustom: !def,
        updatedAt: updatedAtMap[slug] ?? null,
      };
    });

    return NextResponse.json({ ok: true, banks });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not fetch rates" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { slug, bank, rate } = saveSchema.parse(body);

    await prisma.systemSetting.upsert({
      where: { key: RATE_PREFIX + slug },
      create: { key: RATE_PREFIX + slug, value: rate.toString() },
      update: { value: rate.toString() },
    });

    const isDefault = DEFAULT_BANKS.find((b) => b.slug === slug);
    if (!isDefault) {
      await prisma.systemSetting.upsert({
        where: { key: "loan_bank_name_" + slug },
        create: { key: "loan_bank_name_" + slug, value: bank },
        update: { value: bank },
      });

      const bankListSetting = await prisma.systemSetting.findUnique({ where: { key: BANKS_KEY } });
      const current: string[] = bankListSetting ? JSON.parse(bankListSetting.value) : [];
      if (!current.includes(slug)) {
        await prisma.systemSetting.upsert({
          where: { key: BANKS_KEY },
          create: { key: BANKS_KEY, value: JSON.stringify([...current, slug]) },
          update: { value: JSON.stringify([...current, slug]) },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Could not save rate" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { slug } = deleteSchema.parse(body);

    if (DEFAULT_BANKS.find((b) => b.slug === slug)) {
      return NextResponse.json(
        { error: "Cannot delete a default bank — edit its rate instead." },
        { status: 400 }
      );
    }

    await prisma.systemSetting.deleteMany({
      where: { key: { in: [RATE_PREFIX + slug, "loan_bank_name_" + slug] } },
    });

    const bankListSetting = await prisma.systemSetting.findUnique({ where: { key: BANKS_KEY } });
    if (bankListSetting) {
      const current: string[] = JSON.parse(bankListSetting.value);
      await prisma.systemSetting.update({
        where: { key: BANKS_KEY },
        data: { value: JSON.stringify(current.filter((s) => s !== slug)) },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Could not delete bank" }, { status: 500 });
  }
}
