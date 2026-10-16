"use client";

import {
  AtSign,
  MessageCircle,
  QrCode,
  Send,
  Smartphone,
  Video,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { QrPhoneScanner } from "@/components/ui/qr-phone-scanner";
import { DEFAULT_COUNTRY_CODE } from "@/lib/locale-defaults";
import { parseStoredPhone } from "@/lib/phone-utils";

type UserOption = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  country?: string | null;
};

type Channel = "whatsapp" | "email" | "telegram" | "sms";

const CHANNELS: {
  id: Channel;
  label: string;
  icon: typeof Smartphone;
  color: string;
  activeColor: string;
}[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: Smartphone,
    color: "text-slate-500",
    activeColor: "bg-emerald-500 text-white",
  },
  {
    id: "email",
    label: "Email",
    icon: AtSign,
    color: "text-slate-500",
    activeColor: "bg-slate-800 text-white",
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: MessageCircle,
    color: "text-slate-500",
    activeColor: "bg-sky-500 text-white",
  },
  {
    id: "sms",
    label: "SMS",
    icon: Send,
    color: "text-slate-500",
    activeColor: "bg-violet-600 text-white",
  },
];

export function SendMessagePanel({
  users,
  whatsappMode,
  calendlyUrl,
  customMeetingUrl,
  defaultCountry = DEFAULT_COUNTRY_CODE,
}: {
  users: UserOption[];
  whatsappMode: "api" | "web";
  calendlyUrl: string;
  customMeetingUrl: string;
  defaultCountry?: string;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const recipient = useMemo(
    () => users.find((u) => u.id === userId),
    [users, userId]
  );

  useEffect(() => {
    if (recipient?.phone) {
      setPhone(parseStoredPhone(recipient.phone, recipient.country ?? defaultCountry).e164);
    } else {
      setPhone("");
    }
  }, [recipient, defaultCountry]);

  const needsPhone = channel === "whatsapp" || channel === "sms";
  const needsTelegramId = channel === "telegram";

  const placeholder =
    channel === "whatsapp"
      ? "Type your WhatsApp message..."
      : channel === "email"
        ? "Type your email message..."
        : channel === "telegram"
          ? "Type your Telegram message..."
          : "Type your SMS message...";

  async function sendMessage(includeMeeting = false) {
    if (!userId || !body.trim()) return;
    if (needsPhone && !phone.trim()) {
      setError("Enter a valid phone number with country code (default +91 India).");
      return;
    }
    if (needsTelegramId && !telegramChatId.trim()) {
      setError("Enter the recipient's Telegram Chat ID.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");


    // Removed WhatsApp Web fallback block

    if (includeMeeting) {
      const res = await fetch("/api/admin/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: "Property consultation",
          message: body,
          calendlyUrl: calendlyUrl || undefined,
          customUrl: customMeetingUrl || undefined,
          sendVia: [channel === "whatsapp" ? "whatsapp" : channel, "email"],
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setError(data.error ?? "Meeting send failed");
        return;
      }
      setSuccess("Meeting invite sent with schedule link.");
      if (data.results?.[0]?.webUrl) {
        // Fallback removed, rely on API success msg
      }
      router.refresh();
      return;
    }

    const apiChannel = channel;

    const effectivePhone = channel === "telegram" ? telegramChatId : phone;

    const res = await fetch("/api/admin/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: apiChannel,
        recipientUserId: userId,
        recipientPhone: (needsPhone || needsTelegramId) ? effectivePhone : undefined,
        body,
        subject: channel === "email" ? subject || "Message from BrickVest" : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Send failed");
      return;
    }

    setSuccess(`✅ Message sent via ${data.provider || "WhatsApp API"}.`);
    setBody("");
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5 flex items-center gap-3">
        <div className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
          <Send className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-900 text-lg">Send Message</h2>
          <p className="text-sm text-slate-500">
            WhatsApp, Email, Telegram, or SMS — default country India (+91)
          </p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <Label>Recipient</Label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.email}
                {u.phone ? ` · ${u.phone}` : " · no phone"}
              </option>
            ))}
          </select>
        </div>

        {needsPhone && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Phone number</Label>
              <button
                type="button"
                onClick={() => setShowScanner((s) => !s)}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
              >
                <QrCode className="h-3.5 w-3.5" />
                {showScanner ? "Hide scanner" : "Scan QR"}
              </button>
            </div>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              defaultCountry={recipient?.country ?? defaultCountry}
            />
            {showScanner && (
              <QrPhoneScanner
                onScan={setPhone}
                onClose={() => setShowScanner(false)}
              />
            )}
            <p className="text-xs text-slate-500">
              Select country to change dial code. Profile phone loads automatically when you pick a recipient.
            </p>
          </div>
        )}

        {needsTelegramId && (
          <div className="space-y-2">
            <Label>Telegram Chat ID</Label>
            <input
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="e.g. 123456789"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
            />
            <p className="text-xs text-sky-700">
              Have the user message your bot on Telegram, then check{" "}
              <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="underline font-bold">@userinfobot</a>{" "}
              for their Chat ID. Add your Bot Token in{" "}
              <a href="/admin/integrations" className="underline font-bold">Integrations</a>.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const active = channel === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? c.activeColor : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {c.label}
              </button>
            );
          })}
        </div>

        {channel === "email" && (
          <div>
            <Label>Subject</Label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            />
          </div>
        )}

        <div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={placeholder}
            rows={5}
          />
        </div>

        {/* Per-channel info banners */}
        {channel === "whatsapp" && (
          <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <span>✅</span>
            <span>
              <strong>WhatsApp Business API</strong> — message will be sent directly to the recipient&apos;s phone.
            </span>
          </div>
        )}
        {channel === "email" && (
          <div className="flex items-start gap-2 text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <span>📧</span>
            <span>
              Email sent to <strong>{recipient?.email ?? "recipient"}</strong>. Configure{" "}
              <a href="/admin/integrations" className="underline font-bold">Gmail SMTP or Resend</a>{" "}
              for real delivery.
            </span>
          </div>
        )}
        {channel === "sms" && (
          <div className="flex items-start gap-2 text-xs text-violet-800 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
            <span>💬</span>
            <span>
              SMS via Twilio. Add credentials in{" "}
              <a href="/admin/integrations" className="underline font-bold">Integrations</a>.
            </span>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}

        <div className="space-y-3">
          <Button
            variant="secondary"
            className={`w-full ${channel === "whatsapp" ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500" : ""}`}
            loading={loading}
            disabled={!body.trim() || !userId}
            onClick={() => sendMessage(false)}
          >
            <Send className="h-4 w-4" />
            Send via {CHANNELS.find((c) => c.id === channel)?.label}
          </Button>

          <Button
            variant="gold"
            className="w-full bg-teal-100 text-teal-900 hover:bg-teal-200 border border-teal-200 shadow-none"
            loading={loading}
            disabled={!body.trim() || !userId}
            onClick={() => sendMessage(true)}
          >
            <Video className="h-4 w-4" />
            Schedule Meeting &amp; Send
          </Button>
        </div>
      </div>
    </div>
  );
}
