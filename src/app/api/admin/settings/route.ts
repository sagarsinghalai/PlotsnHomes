import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-api";
import {
  SETTING_KEYS,
  getPlatformRates,
  setSetting,
} from "@/lib/system-settings";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  defaultInterestRate: z.number().min(0).max(30).optional(),
  defaultYieldRate: z.number().min(0).max(30).optional(),
  defaultCapRate: z.number().min(0).max(30).optional(),
  applyToAllProperties: z.boolean().optional(),
});

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  const rates = await getPlatformRates();
  return NextResponse.json(rates);
}

export async function PATCH(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    if (data.defaultInterestRate !== undefined) {
      await setSetting(
        SETTING_KEYS.DEFAULT_INTEREST_RATE,
        String(data.defaultInterestRate)
      );
    }
    if (data.defaultYieldRate !== undefined) {
      await setSetting(
        SETTING_KEYS.DEFAULT_YIELD_RATE,
        String(data.defaultYieldRate)
      );
    }
    if (data.defaultCapRate !== undefined) {
      await setSetting(SETTING_KEYS.DEFAULT_CAP_RATE, String(data.defaultCapRate));
    }

    if (data.applyToAllProperties) {
      const rates = await getPlatformRates();
      await prisma.property.updateMany({
        data: {
          ...(data.defaultInterestRate !== undefined && {
            interestRate: data.defaultInterestRate,
          }),
          ...(data.defaultYieldRate !== undefined && {
            yieldRate: data.defaultYieldRate,
          }),
          ...(data.defaultCapRate !== undefined && {
            capRate: data.defaultCapRate,
          }),
        },
      });
      void rates;
    }

    const rates = await getPlatformRates();
    return NextResponse.json({ ok: true, ...rates });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message }, { status: 400 });
    }
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
