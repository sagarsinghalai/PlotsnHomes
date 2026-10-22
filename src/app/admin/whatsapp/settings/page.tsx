import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/roles";
import { WhatsAppSettingsClient } from "@/components/admin/whatsapp-settings-client";

export const dynamic = "force-dynamic";

export default async function WhatsAppSettingsPage() {
  const session = await getSession();
  if (!session?.user || !isSuperAdmin(session.user.role)) {
    redirect("/dashboard?error=Platform+owner+access+required");
  }
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <WhatsAppSettingsClient />
    </div>
  );
}
