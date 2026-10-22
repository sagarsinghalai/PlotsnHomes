import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasCrmAccess, isSuperAdmin } from "@/lib/roles";
import { WhatsAppInboxClient } from "@/components/admin/whatsapp-inbox-client";

export const dynamic = "force-dynamic";

export default async function WhatsAppInboxPage() {
  const session = await getSession();
  if (!session?.user || !hasCrmAccess(session.user.role)) {
    redirect("/dashboard?error=Staff+access+required");
  }
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <WhatsAppInboxClient canSeeAll={isSuperAdmin(session.user.role)} />
    </div>
  );
}
