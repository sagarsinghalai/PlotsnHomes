"use client";

import Link from "next/link";
import { Calendar, ExternalLink } from "lucide-react";

type Meeting = {
  id: string;
  token: string;
  title: string;
  status: string;
  scheduledAt: string | null;
  calendlyUrl: string | null;
  customUrl: string | null;
  createdAt: string;
  user: { name: string; email: string; phone: string | null };
  agent: { name: string; email: string; phone: string | null } | null;
  createdBy: { name: string };
};

export function MeetingsList({ meetings }: { meetings: Meeting[] }) {
  return (
    <div className="space-y-4">
      {meetings.map((m) => (
        <div
          key={m.id}
          className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold-dark" />
              <h3 className="font-semibold text-slate-900">{m.title}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  m.status === "SCHEDULED"
                    ? "bg-emerald-100 text-emerald-800"
                    : m.status === "INVITED"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {m.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Client: {m.user.name} ({m.user.email})
              {m.user.phone ? ` · ${m.user.phone}` : ""}
            </p>
            {m.agent && (
              <p className="text-sm text-slate-500">
                Agent: {m.agent.name} · {m.agent.email}
                {m.agent.phone ? ` · ${m.agent.phone}` : ""}
              </p>
            )}
            {m.scheduledAt && (
              <p className="text-sm text-emerald-700 mt-1">
                Scheduled: {new Date(m.scheduledAt).toLocaleString()}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-1">
              Created {new Date(m.createdAt).toLocaleString()} by {m.createdBy.name}
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <Link
              href={`/meetings/${m.token}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-sm text-gold-dark hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Client schedule page
            </Link>
            {m.calendlyUrl && (
              <a
                href={m.calendlyUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-slate-500 hover:underline"
              >
                {m.calendlyUrl.includes("cal.com") ? "Cal.com link" : "Calendly link"}
              </a>
            )}
          </div>
        </div>
      ))}
      {meetings.length === 0 && (
        <p className="text-center text-slate-500 py-12">
          No meetings yet. Use Send Message → Schedule Meeting &amp; Send.
        </p>
      )}
    </div>
  );
}
