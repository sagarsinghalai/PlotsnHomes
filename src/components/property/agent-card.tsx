"use client";

import { Phone, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import { whatsAppWebUrl } from "@/lib/messaging-settings";

export function AgentCard({
  agent,
  propertyTitle,
  propertyId,
}: {
  agent: { name: string; email: string; phone: string | null; image: string | null };
  propertyTitle: string;
  propertyId: string;
}) {
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const waMsg = `Hello! I am interested in *${propertyTitle}* (ID: ${propertyId})\n🔗 *Property Link:* ${currentUrl}\n\nPlease share more details and schedule a site visit.`;
  const waUrl = agent.phone ? whatsAppWebUrl(agent.phone, waMsg) : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-600">
          {agent.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{agent.name}</p>
          <p className="text-sm text-slate-500">Licensed agent</p>
        </div>
      </div>
      {agent.phone && <p className="mt-4 text-sm font-mono">{agent.phone}</p>}
      <p className="text-sm text-slate-600">{agent.email}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {agent.phone && (
          <a href={`tel:${agent.phone}`} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white">
            <Phone className="h-3.5 w-3.5" /> Call
          </a>
        )}
        <a href={`mailto:${agent.email}?subject=${encodeURIComponent(propertyTitle)}`} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs">
          <Mail className="h-3.5 w-3.5" /> Email
        </a>
        {waUrl && (
          <a href={waUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        )}
      </div>
      <Link href="/login" className="mt-4 block text-center text-xs text-brand-hover hover:underline">
        Contact Me — schedule a showing
      </Link>
    </div>
  );
}
