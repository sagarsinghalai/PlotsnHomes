"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Phone, RefreshCw, Play, FileText, CheckCircle } from "lucide-react";

export function TelephonySimulator({ companyPhone, twilioFromPhone, leads }: {
  companyPhone: string;
  twilioFromPhone: string;
  leads: { id: string; name: string; phone: string | null }[];
}) {
  // Inbound Call state
  const [inboundFrom, setInboundFrom] = useState("");
  const [inboundTwiml, setInboundTwiml] = useState("");
  const [inboundLoading, setInboundLoading] = useState(false);

  // Call Status Log state
  const [logLeadId, setLogLeadId] = useState(leads[0]?.id || "");
  const [logDuration, setLogDuration] = useState("125");
  const [logStatus, setLogStatus] = useState("completed");
  const [logDirection, setLogDirection] = useState("outbound-api");
  const [logRecording, setLogRecording] = useState("https://api.twilio.com/2010-04-01/Accounts/AC/Recordings/RE12345");
  const [logLoading, setLogLoading] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  async function handleSimulateInbound() {
    if (!inboundFrom) return;
    setInboundLoading(true);
    setInboundTwiml("");
    try {
      const res = await fetch("/api/telephony/inbound", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          From: inboundFrom,
          To: twilioFromPhone || "+15551234567",
        }).toString(),
      });
      const text = await res.text();
      setInboundTwiml(text);
    } catch (err) {
      setInboundTwiml("Error executing TwiML route.");
    } finally {
      setInboundLoading(false);
    }
  }

  async function handleSimulateLogging() {
    setLogLoading(true);
    setLogSuccess(false);
    try {
      const lead = leads.find((l) => l.id === logLeadId);
      const res = await fetch(`/api/telephony/call-status-callback?leadId=${logLeadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          CallStatus: logStatus,
          CallDuration: logDuration,
          RecordingUrl: logRecording,
          Direction: logDirection,
          From: twilioFromPhone,
          To: lead?.phone || "+15559876543",
        }).toString(),
      });
      if (res.ok) {
        setLogSuccess(true);
        setTimeout(() => setLogSuccess(false), 3000);
      }
    } catch (err) {
      alert("Failed to submit status callback.");
    } finally {
      setLogLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 mt-6">
      {/* Inbound Simulator */}
      <div className="rounded-2xl border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-slate-900 border-b pb-2">
          <Phone className="h-5 w-5 text-emerald-600" />
          <h2>Inbound Call Router Simulator</h2>
        </div>
        <p className="text-xs text-slate-500">
          Simulate a lead calling your virtual Twilio number. The system will suffix-match the number in database and route the call to the assigned agent.
        </p>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Caller Phone Number (e.g. Lead's phone)</Label>
            <select
              className="w-full text-xs rounded-xl border px-3 py-2 mt-1 bg-slate-50"
              value={inboundFrom}
              onChange={(e) => setInboundFrom(e.target.value)}
            >
              <option value="">-- Select Test Lead --</option>
              {leads.map((l) => (
                <option key={l.id} value={l.phone || ""}>
                  {l.name} ({l.phone || "No phone"})
                </option>
              ))}
              <option value="+919999999999">Unknown Caller (+91 99999 99999)</option>
            </select>
          </div>

          <Button
            type="button"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-2 h-auto"
            onClick={handleSimulateInbound}
            disabled={inboundLoading || !inboundFrom}
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            Simulate Inbound Call Webhook
          </Button>

          {inboundTwiml && (
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 font-bold uppercase">TwiML XML Response (Twilio Router Output)</Label>
              <pre className="text-[10px] bg-slate-900 text-slate-200 rounded-xl p-3 overflow-x-auto max-h-40 font-mono whitespace-pre-wrap leading-normal">
                {inboundTwiml}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Logging Simulator */}
      <div className="rounded-2xl border bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 font-semibold text-slate-900 border-b pb-2">
          <FileText className="h-5 w-5 text-sky-600" />
          <h2>Call Logging Simulator</h2>
        </div>
        <p className="text-xs text-slate-500">
          Simulate Twilio posting a call-completion callback. This updates the CRM lead activities with call status, duration, and audio recordings.
        </p>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Target Lead</Label>
            <select
              className="w-full text-xs rounded-xl border px-3 py-2 mt-1 bg-slate-50"
              value={logLeadId}
              onChange={(e) => setLogLeadId(e.target.value)}
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Duration (seconds)</Label>
              <Input
                type="number"
                value={logDuration}
                onChange={(e) => setLogDuration(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <select
                className="w-full text-xs rounded-xl border px-3 py-2 mt-1 bg-slate-50"
                value={logStatus}
                onChange={(e) => setLogStatus(e.target.value)}
              >
                <option value="completed">Completed</option>
                <option value="no-answer">No Answer</option>
                <option value="busy">Busy</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Recording URL</Label>
            <Input
              type="text"
              value={logRecording}
              onChange={(e) => setLogRecording(e.target.value)}
              className="mt-1 text-xs font-mono"
            />
          </div>

          <Button
            type="button"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs py-2 h-auto"
            onClick={handleSimulateLogging}
            disabled={logLoading || !logLeadId}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Simulate Twilio Status Callback
          </Button>

          {logSuccess && (
            <p className="text-xs text-emerald-700 bg-emerald-50 rounded-xl p-2 font-semibold flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Call logged successfully! Check lead activity feed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
