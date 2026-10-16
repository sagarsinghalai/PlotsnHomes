"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import { WhatsAppConnect } from "@/components/admin/whatsapp-connect";
import { Input, Label } from "@/components/ui/input";
import { DEFAULT_COUNTRY_CODE } from "@/lib/locale-defaults";

type IntegrationsFormProps = {
  initial: {
    whatsappMode: "api" | "web";
    whatsappApiToken: string;
    whatsappPhoneNumberId: string;
    whatsappFromNumber: string;
    whatsappWebNumber: string;
    telegramBotToken: string;
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioFromPhone: string;
    calendlyUrl: string;
    customMeetingUrl: string;
    notificationEmail: string;
    gmailSmtpHost: string;
    gmailSmtpUser: string;
    gmailSmtpPass: string;
    gmailSmtpFrom: string;
    companyName: string;
  };
  whatsappTemplates?: { id: string; name: string; body: string }[];
};

export function IntegrationsForm({ initial, whatsappTemplates = [] }: IntegrationsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setForm(initial), [initial]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    // The WhatsApp fields are owned by the WhatsAppConnect panel (which verifies
    // and saves them via its own endpoints) — don't let a plain Save overwrite them.
    const {
      whatsappMode: _wm,
      whatsappApiToken: _wt,
      whatsappPhoneNumberId: _wp,
      whatsappFromNumber: _wf,
      whatsappWebNumber: _ww,
      ...saveable
    } = form;
    void _wm; void _wt; void _wp; void _wf; void _ww;
    const res = await fetch("/api/admin/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saveable),
    });
    setLoading(false);
    if (res.ok) {
      setMsg("Integrations saved.");
      router.refresh();
    } else {
      const data = await res.json();
      setMsg(data.error ?? "Save failed");
    }
  }

  return (
    <form onSubmit={save} className="space-y-8 max-w-3xl">
      <WhatsAppConnect
        initialPhoneNumberId={initial.whatsappPhoneNumberId}
        tokenSet={Boolean(initial.whatsappApiToken)}
        templates={whatsappTemplates}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Telegram &amp; SMS (Twilio)</h2>
        
        <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 text-xs text-sky-800 space-y-1">
          <p className="font-bold">📱 How to set up Telegram:</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Open Telegram and message <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="underline font-bold">@BotFather</a></li>
            <li>Type <code className="bg-sky-100 px-1 rounded">/newbot</code> and follow the steps to create a bot</li>
            <li>Copy the bot token (looks like <code className="bg-sky-100 px-1 rounded">123456:ABCdef...</code>) and paste below</li>
            <li>Have your recipient message your bot once — then check <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="underline font-bold">@userinfobot</a> for their Chat ID</li>
            <li>Enter that Chat ID in the Messaging Hub when sending via Telegram</li>
          </ol>
        </div>
        <Label>Telegram bot token</Label>
        <Input
          type="password"
          value={form.telegramBotToken}
          onChange={(e) => set("telegramBotToken", e.target.value)}
          placeholder="123456789:ABCdefGHIjklMNO..."
        />

        <div className="rounded-xl bg-violet-50 border border-violet-200 p-3 text-xs text-violet-800 space-y-1">
          <p className="font-bold">💬 How to set up SMS (Twilio):</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Sign up at <a href="https://www.twilio.com" target="_blank" rel="noreferrer" className="underline font-bold">twilio.com</a> (free trial gives test credits)</li>
            <li>From your dashboard, copy <strong>Account SID</strong> and <strong>Auth Token</strong></li>
            <li>Get a Twilio phone number (your "From" number)</li>
            <li>Paste all 3 values below, then SMS will work!</li>
          </ol>
        </div>
        <Label>Twilio Account SID</Label>
        <Input
          value={form.twilioAccountSid}
          onChange={(e) => set("twilioAccountSid", e.target.value)}
          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        />
        <Label>Twilio Auth Token</Label>
        <Input
          type="password"
          value={form.twilioAuthToken}
          onChange={(e) => set("twilioAuthToken", e.target.value)}
          placeholder="your_auth_token"
        />
        <Label>Twilio from phone (SMS — default +91)</Label>
        <PhoneInput
          value={form.twilioFromPhone}
          onChange={(v) => set("twilioFromPhone", v)}
          defaultCountry={DEFAULT_COUNTRY_CODE}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Meetings (Calendly / Cal.com / custom URL)</h2>
        <Label>Default Scheduler link (Calendly / Cal.com)</Label>
        <Input
          value={form.calendlyUrl}
          onChange={(e) => set("calendlyUrl", e.target.value)}
          placeholder="https://calendly.com/... or https://cal.com/..."
        />
        <Label>Custom meeting URL (Zoom / Google Meet)</Label>
        <Input
          value={form.customMeetingUrl}
          onChange={(e) => set("customMeetingUrl", e.target.value)}
          placeholder="https://meet.google.com/..."
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Gmail / company email notifications</h2>
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800 space-y-1">
          <p className="font-bold">📧 How to set up Gmail SMTP (send real emails):</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Go to your Google Account &gt; Security &gt; <strong>2-Step Verification</strong> (must be ON)</li>
            <li>Then go to <strong>App passwords</strong> and create one for "Mail"</li>
            <li>Copy the 16-character app password</li>
            <li>Fill in your Gmail address and that app password below</li>
            <li>All emails sent via BrickVest will now deliver to real inboxes!</li>
          </ol>
          <p className="text-blue-600">Alternatively, add <code className="bg-blue-100 px-1 rounded">RESEND_API_KEY</code> to your <code>.env</code> file for Resend delivery.</p>
        </div>
        <Label>Notification inbox (receives alerts)</Label>
        <Input
          value={form.notificationEmail}
          onChange={(e) => set("notificationEmail", e.target.value)}
          placeholder="admin@yourcompany.com"
        />
        <Label>SMTP host</Label>
        <Input
          value={form.gmailSmtpHost}
          onChange={(e) => set("gmailSmtpHost", e.target.value)}
          placeholder="smtp.gmail.com"
        />
        <Label>Gmail / SMTP user</Label>
        <Input
          value={form.gmailSmtpUser}
          onChange={(e) => set("gmailSmtpUser", e.target.value)}
          placeholder="you@gmail.com"
        />
        <Label>App password (16-char Gmail app password)</Label>
        <Input
          type="password"
          value={form.gmailSmtpPass}
          onChange={(e) => set("gmailSmtpPass", e.target.value)}
          placeholder="xxxx xxxx xxxx xxxx"
        />
        <Label>From address</Label>
        <Input
          value={form.gmailSmtpFrom}
          onChange={(e) => set("gmailSmtpFrom", e.target.value)}
          placeholder="BrickVest <you@gmail.com>"
        />
        <Label>Company name</Label>
        <Input
          value={form.companyName}
          onChange={(e) => set("companyName", e.target.value)}
        />
      </section>

      {msg && <p className="text-sm text-slate-600">{msg}</p>}
      <Button type="submit" variant="gold" loading={loading}>
        Save integrations
      </Button>
    </form>
  );
}
