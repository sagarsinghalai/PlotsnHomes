import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { generatePasswordLogsCSV, getAllPasswordLogs } from "@/lib/password-history-logger";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json(
      { error: "Access Denied: Super Admin authorization required to export password logs." },
      { status: 403 }
    );
  }

  const csvContent = generatePasswordLogsCSV();
  const logs = getAllPasswordLogs();

  const url = new URL(req.url);
  const format = url.searchParams.get("format");

  if (format === "json") {
    return NextResponse.json({
      success: true,
      totalLogs: logs.length,
      logs,
    });
  }

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="user_password_logs_${Date.now()}.csv"`,
    },
  });
}
