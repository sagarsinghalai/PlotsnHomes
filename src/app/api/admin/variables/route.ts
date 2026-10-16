import { NextResponse } from "next/server";
import {
  getGlobalCustomVariables,
  getSystemVariables,
  saveGlobalCustomVariables,
  saveSystemVariables,
} from "@/lib/variables-store";

export async function GET() {
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
