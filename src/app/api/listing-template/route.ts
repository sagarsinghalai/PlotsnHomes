import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildListingTemplate } from "@/lib/listing-template";

export const dynamic = "force-dynamic";

// Download the complete Excel listing template (seller or admin). Optional
// ?category=<spec id> scopes it to one property type.
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const category = new URL(req.url).searchParams.get("category") || undefined;
  const buf = buildListingTemplate(category);
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plotsnhomes-listing-template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
