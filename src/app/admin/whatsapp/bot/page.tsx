import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { hasCrmAccess } from "@/lib/roles";
import { WhatsAppBotClient } from "@/components/admin/whatsapp-bot-client";

export const dynamic = "force-dynamic";

export default async function WhatsAppBotPage() {
  const session = await getSession();
  if (!session?.user || !hasCrmAccess(session.user.role)) {
    redirect("/dashboard?error=Staff+access+required");
  }
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <WhatsAppBotClient />
    </div>
  );
}
