import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";
import { isSuperAdmin } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { CustomFieldsEditor } from "@/components/admin/custom-fields-editor";

export const dynamic = "force-dynamic";

const LABELS: Record<string, string> = {
  user: "User",
  lead: "Lead",
  call: "Call",
  site_visit: "Site Visit",
  followup: "Followup",
  booking: "Booking",
};

export default async function CustomFieldsCategoryPage({ params }: { params: { category: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    redirect("/dashboard?error=Platform+owner+access+required");
  }
  const defs = await prisma.customFieldDef.findMany({
    where: { category: params.category },
    orderBy: { createdAt: "asc" },
  });
  const label = LABELS[params.category] || params.category;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">{label} Custom Fields</h1>
      <p className="mt-1 text-sm text-slate-500">
        Add fields for {label.toLowerCase()} records. They appear in the {label.toLowerCase()} form and their values
        are saved with each record in the database.
      </p>
      <div className="mt-6">
        <CustomFieldsEditor category={params.category} initialDefs={defs as any} />
      </div>
    </div>
  );
}
