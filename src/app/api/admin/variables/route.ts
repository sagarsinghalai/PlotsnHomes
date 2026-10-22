import { NextResponse } from "next/server";
import {
  getGlobalCustomVariables,
  getSystemVariables,
  saveGlobalCustomVariables,
  saveSystemVariables,
} from "@/lib/variables-store";
import { requireCrmApi } from "@/lib/crm-access";

export async function GET() {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    const [systemVariables, globalCustomVariables] = await Promise.all([
      getSystemVariables(),
      getGlobalCustomVariables(),
    ]);

    return NextResponse.json({
      systemVariables,
      globalCustomVariables,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch variables" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireCrmApi();
  if (auth.error) return auth.error;
  try {
    const body = await req.json();

    if (Array.isArray(body.systemVariables)) {
      await saveSystemVariables(body.systemVariables);
    }

    if (Array.isArray(body.globalCustomVariables)) {
      await saveGlobalCustomVariables(body.globalCustomVariables);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save variables" }, { status: 500 });
  }
}
