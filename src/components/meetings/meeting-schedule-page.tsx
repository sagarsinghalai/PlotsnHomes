"use client";

import { Calendar, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type MeetingData = {
  token: string;
  title: string;
  message: string | null;
  calendlyUrl: string | null;
  customUrl: string | null;
  status: string;
  user: { name: string; email: string };
  agent: { name: string; email: string } | null;
};

function getCalLink(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname.startsWith("/") ? parsed.pathname.substring(1) : parsed.pathname;
  } catch (e) {
    return url.replace(/https?:\/\/(www\.)?cal\.com\//, "");
  }
}

export function MeetingSchedulePage({ meeting }: { meeting: MeetingData }) {
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(meeting.status === "SCHEDULED");
  const [error, setError] = useState("");

  async function handleAutoConfirm(timeStr: string, autoNotes: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/meetings/${meeting.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: new Date(timeStr).toISOString(),
          notes: autoNotes,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save booking details");
        return;
      }
      setDone(true);
    } catch (err) {
      setError("Failed to automatically record your booking");
    } finally {
      setLoading(false);
    }
  }

  async function confirmSchedule() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/meetings/${meeting.token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
        notes,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed");
      return;
    }
    setDone(true);
  }

  // 1. Calendly Event Listener
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.event && e.data.event === "calendly.event_scheduled") {
        console.log("Calendly event received:", e.data);
        handleAutoConfirm(new Date().toISOString(), "Automatically confirmed via Calendly booking.");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // 2. Cal.com Script loader and Event Listener
  useEffect(() => {
    if (!meeting.calendlyUrl || !meeting.calendlyUrl.includes("cal.com")) return;

    const initCal = () => {
      const Cal = (window as any).Cal;
      if (Cal) {
        const calLink = getCalLink(meeting.calendlyUrl || "");
        Cal("inline", {
          elementOrSelector: "#cal-inline-embed",
          calLink: calLink,
          config: {
            name: meeting.user.name,
            email: meeting.user.email,
          }
        });

        Cal("on", {
          action: "*",
          callback: (e: any) => {
            console.log("Cal.com event received:", e.detail);
            if (e.detail && (e.detail.type === "bookingSuccessful" || e.detail.type === "bookingSuccessfulV2")) {
              const startTime = e.detail.data?.startTime || new Date().toISOString();
              handleAutoConfirm(startTime, "Automatically confirmed via Cal.com booking.");
            }
          }
        });
      }
    };

    if (!(window as any).Cal) {
      (function (C: any, A, L) {
        let p = function (a: any, ar: any) { a.q.push(ar); };
        let d = C.document;
        C.Cal = C.Cal || function () {
          let cal = C.Cal;
          let ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement("script")).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api: any = function () { p(api, arguments); };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === "string") {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ["initNamespace", namespace]);
            } else p(cal, ar);
            return;
          }
          p(cal, ar);
        };
      })(window, "https://app.cal.com/embed/embed.js", "init");

      const Cal = (window as any).Cal;
      if (Cal) {
        Cal("init", { origin: "https://app.cal.com" });
        initCal();
      }
    } else {
      initCal();
    }
  }, [meeting.calendlyUrl, meeting.user.name, meeting.user.email]);

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
          <Calendar className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Meeting scheduled</h1>
          <p className="mt-2 text-slate-600">
            {meeting.agent?.name ?? "Your agent"} has been notified by email and WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-slate-900">{meeting.title}</h1>
      <p className="mt-2 text-slate-600">Hi {meeting.user.name}, schedule your consultation below.</p>
      {meeting.message && (
        <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{meeting.message}</p>
      )}

      {meeting.calendlyUrl && (
        <div className="mt-8 rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 text-sm font-medium border-b border-slate-200">
            {meeting.calendlyUrl.includes("cal.com") ? "Book via Cal.com" : "Book via Calendly"}
          </div>
          {meeting.calendlyUrl.includes("cal.com") ? (
            <div id="cal-inline-embed" className="w-full h-[600px] bg-white" />
          ) : (
            <iframe
              src={meeting.calendlyUrl}
              title="Calendly"
              className="w-full h-[600px] border-0"
            />
          )}
        </div>
      )}

      {meeting.customUrl && (
        <a
          href={meeting.customUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 font-semibold text-slate-900 hover:bg-gold-dark"
        >
          <Video className="h-5 w-5" />
          Join meeting link
        </a>
      )}

      <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold">Or confirm a time</h2>
        <div>
          <Label>Preferred date &amp; time</Label>
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <div>
          <Label>Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything you'd like us to know..."
            rows={3}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button variant="gold" className="w-full" loading={loading} onClick={confirmSchedule}>
          Confirm meeting — notify agent
        </Button>
        {meeting.agent && (
          <p className="text-xs text-center text-slate-500">
            Agent {meeting.agent.name} ({meeting.agent.email}) will be notified.
          </p>
        )}
      </div>
    </div>
  );
}

