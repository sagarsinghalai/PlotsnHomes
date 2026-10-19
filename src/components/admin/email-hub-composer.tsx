"use client";

import { useCallback, useEffect, useState } from "react";
import { sendHubEmail } from "@/app/admin/emails/hub/actions";
import { Mail, Search, CheckCircle2, AlertTriangle, Loader2, Users } from "lucide-react";
import type { MessageTemplate } from "@/lib/crm-settings";
import { EmailAudienceBuilder } from "@/components/admin/email-audience-builder";

type Contact = {
  name: string;
  email: string;
  source: string;
};

export function EmailHubComposer({
  contacts,
  templates = [],
}: {
  contacts: Contact[];
  templates?: MessageTemplate[];
}) {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Quick broadcast state
  const [broadcastAudience, setBroadcastAudience] = useState("leads");
  const [savedAudiences, setSavedAudiences] = useState<{ id: string; name: string }[]>([]);
  const [broadcastBusy, setBroadcastBusy] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");

  const loadSavedAudiences = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/audiences", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSavedAudiences(data.audiences ?? []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadSavedAudiences();
  }, [loadSavedAudiences]);

  const filteredContacts = searchQuery.trim()
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectContact = (contact: Contact) => {
    setRecipient(contact.email);
    setSearchQuery(`${contact.name} (${contact.email})`);
    setShowSuggestions(false);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      if (template) {
        setHtmlBody(template.body);
        if (template.subject) {
          setSubject(template.subject);
        }
      }
    }
  };

  const handleQuickBroadcast = async () => {
    if (!subject.trim()) {
      setBroadcastMsg("Write a subject line above before broadcasting.");
      return;
    }
    if (!htmlBody.trim()) {
      setBroadcastMsg("Write an email body above before broadcasting.");
      return;
    }
    setBroadcastBusy(true);
    setBroadcastMsg("");
    try {
      const payload = broadcastAudience.startsWith("saved:")
        ? { subject, html: htmlBody, audienceId: broadcastAudience.replace(/^saved:/, "") }
        : { subject, html: htmlBody, filters: { base: broadcastAudience } };

      const res = await fetch("/api/admin/emails/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      const s = data.summary;
      setBroadcastMsg(
        s
          ? `Broadcast: ${s.sent} sent, ${s.failed} failed (of ${s.total}).`
          : (data.error ?? "Broadcast failed."),
      );
    } catch (e) {
      setBroadcastMsg(e instanceof Error ? e.message : "Broadcast failed.");
    } finally {
      setBroadcastBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !subject.trim() || !htmlBody.trim()) {
      setResult({ success: false, message: "Please fill out all fields." });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      await sendHubEmail(recipient, subject, htmlBody);
      setResult({ success: true, message: `Email successfully sent to ${recipient}!` });
      setSubject("");
      setHtmlBody("");
      setRecipient("");
      setSearchQuery("");
      setSelectedTemplateId("");
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to send email.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Compose Form */}
      <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
          <Mail className="h-5 w-5 text-brand-hover" /> Compose Message
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Contact Search / Select */}
          <div className="relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Select Contact (Database Search)
            </label>
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Type name or email to search contacts..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  if (!e.target.value) {
                    setRecipient("");
                  }
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand"
              />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && filteredContacts.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1.5">
                {filteredContacts.map((c, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectContact(c)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 transition text-sm flex flex-col"
                  >
                    <span className="font-medium text-slate-900">{c.name}</span>
                    <span className="text-xs text-slate-500">{c.email} • {c.source}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom / Direct Email Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Recipient Email Address
            </label>
            <input
              type="email"
              placeholder="recipient@example.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand"
            />
          </div>

          {/* Template Selection */}
          {templates.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Template (Optional)
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand"
              >
                <option value="">-- Select a Template --</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.channel})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              placeholder="Enter email subject line"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand"
            />
          </div>

          {/* Message HTML Body */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Message Body (HTML Supported)
            </label>
            <textarea
              placeholder="<p>Dear Valued Client,</p><p>We are pleased to share...</p>"
              rows={8}
              value={htmlBody}
              onChange={(e) => setHtmlBody(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none font-mono transition focus:border-brand"
            />
          </div>

          {/* Result Alert */}
          {result && (
            <div
              className={`rounded-xl border p-4 text-sm flex gap-3 items-start ${
                result.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50 transition"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending Email...
              </>
            ) : (
              "Send Outbound Email →"
            )}
          </button>
        </form>

        {/* Broadcast to Audience Section */}
        <div className="mt-8 pt-8 border-t border-slate-200 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" /> Broadcast to Audience
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter your DB contacts by stage, role, or activity, and send this subject/body in bulk.
            </p>
          </div>

          {/* Quick Broadcast dropdown & button */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1 space-y-1">
                <label className="block text-xs font-semibold text-indigo-900">
                  Broadcast to audience
                </label>
                <select
                  value={broadcastAudience}
                  onChange={(e) => setBroadcastAudience(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none transition focus:border-indigo-400"
                >
                  <option value="leads">All leads</option>
                  <option value="customers">Customers (buyers &amp; sellers)</option>
                  <option value="agents">Agents &amp; staff</option>
                  {savedAudiences.length > 0 && (
                    <optgroup label="Saved audiences">
                      {savedAudiences.map((a) => (
                        <option key={a.id} value={`saved:${a.id}`}>
                          {a.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              <button
                type="button"
                disabled={broadcastBusy}
                onClick={() => void handleQuickBroadcast()}
                className="bg-brand hover:bg-brand-hover text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 shadow-sm"
              >
                {broadcastBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Broadcast now"}
              </button>
            </div>
            {broadcastMsg && <p className="text-xs text-slate-700 break-words">{broadcastMsg}</p>}
          </div>

          <EmailAudienceBuilder
            subject={subject}
            html={htmlBody}
            onAudienceChange={loadSavedAudiences}
            selectedAudienceKey={broadcastAudience}
            onSelectAudienceKey={setBroadcastAudience}
          />
        </div>
      </div>

      {/* Info Sidebar */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="font-semibold text-slate-900 mb-2">DB Contacts Info</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            This workspace currently contains <strong>{contacts.length}</strong> active contacts
            queried directly from your registered users and lead records database.
          </p>
          <div className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-500 space-y-2">
            <div>
              💡 <strong>Instant Selection</strong>: Start typing a contact's name or email address in the search box to load their details.
            </div>
            <div>
              📧 <strong>Custom Recipient</strong>: You can also send to any custom email not saved in the DB by typing directly in the Recipient field.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Email Status Logs</h3>
          <p className="text-xs text-slate-500 mb-4">
            Verify sent email logs, statuses, and delivery providers in detail.
          </p>
          <a
            href="/admin/emails"
            className="inline-block rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            View full outbound log →
          </a>
        </div>
      </div>
    </div>
  );
}
