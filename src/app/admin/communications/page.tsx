import Link from "next/link";
import { SettingsCardGrid } from "@/components/admin/settings-card-grid";
import { Calendar, Mail, MessageCircle, Phone, List } from "lucide-react";

export default function CommunicationsPage() {
  const cards = [
    { href: "/admin/messages", title: "Calls", description: "Log and place calls via integrations.", icon: Phone },
    { href: "/admin/emails", title: "Emails", description: "Email log and outbound.", icon: Mail },
    { href: "/admin/showings", title: "Site Visits", description: "Tour requests and scheduling.", icon: Calendar },
    { href: "/admin/crm", title: "Followups", description: "Tasks and follow-up dates on leads.", icon: List },
    { href: "/admin/messages", title: "WhatsApps", description: "WhatsApp outbound from admin.", icon: MessageCircle },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Conversations</h1>
      <p className="mt-1 text-slate-600">Calls, emails, site visits, follow-ups, WhatsApp</p>
      <div className="mt-8">
        <SettingsCardGrid cards={cards} />
      </div>
      <Link href="/admin/crm" className="inline-block mt-6 text-gold-dark hover:underline">
        ← CRM pipeline
      </Link>
    </div>
  );
}
