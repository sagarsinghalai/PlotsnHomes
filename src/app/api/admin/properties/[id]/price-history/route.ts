import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-api";
import { calculatePropertyAppreciation, logPropertyPriceChange } from "@/lib/price-history";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const metrics = await calculatePropertyAppreciation(params.id);
    return NextResponse.json({ ok: true, metrics });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to fetch price history" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { price, ratePerSqft, stage, notes } = body;

    if (!price || typeof price !== "number") {
      return NextResponse.json({ error: "Valid price number is required" }, { status: 400 });
    }

    await logPropertyPriceChange({
      propertyId: params.id,
      price,
      ratePerSqft,
      stage: stage || "Current Price",
      changedByUserId: auth.session.user.id,
      changedByName: auth.session.user.name || "Admin",
      notes: notes || "Manual price adjustment",
    });

    const metrics = await calculatePropertyAppreciation(params.id);
    return NextResponse.json({ ok: true, metrics });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to log price change" }, { status: 500 });
  }
}
