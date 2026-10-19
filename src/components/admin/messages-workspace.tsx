"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Smartphone,
  AtSign,
  MessageCircle,
  Video,
  User,
  Clock,
  Check,
  AlertCircle,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Search,
  CheckCheck,
  Mail,
  MessageSquare,
  Play,
  ArrowDownCircle,
  Phone,
  ArrowLeft,
  Calendar,
  File as FileIcon,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { parseStoredPhone } from "@/lib/phone-utils";
import { cn } from "@/lib/utils";

type UserOption = {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  country?: string | null;
};

type ButtonItem = { label: string; url?: string };

type MessageTemplate = {
  id: string;
  name: string;
  channel: "whatsapp" | "email" | "sms";
  subject?: string;
  body: string;
  templateType?: string;
  mediaUrl?: string;
  mediaName?: string;
  buttons?: ButtonItem[];
  listItems?: ButtonItem[];
};

type Channel = "whatsapp" | "email" | "telegram" | "sms" | "platform";

const CHANNELS: {
  id: Channel;
  label: string;
  icon: typeof Smartphone;
  color: string;
  activeColor: string;
}[] = [
  {
    id: "platform",
    label: "Platform Chat",
    icon: MessageSquare,
    color: "text-slate-500",
    activeColor: "bg-amber-500 text-white hover:bg-amber-600",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: Smartphone,
    color: "text-slate-500",
    activeColor: "bg-emerald-500 text-white hover:bg-emerald-600",
  },
  {
    id: "email",
    label: "Email",
    icon: AtSign,
    color: "text-slate-500",
    activeColor: "bg-slate-800 text-white hover:bg-slate-900",
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: MessageCircle,
    color: "text-slate-500",
    activeColor: "bg-sky-500 text-white hover:bg-sky-600",
  },
  {
    id: "sms",
    label: "SMS",
    icon: Send,
    color: "text-slate-500",
    activeColor: "bg-violet-600 text-white hover:bg-violet-750",
  },
];

type MessageLogItem = {
  id: string;
  channel: string;
  recipientId: string | null;
  recipient: { name: string; email: string } | null;
  sentById: string;
  sentBy: { id: string; name: string; email: string; role: string } | null;
  toPhone: string | null;
  toEmail: string | null;
  subject: string | null;
  body: string;
  status: string;
  provider: string;
  webUrl: string | null;
  error: string | null;
  createdAt: string;
};

export function MessagesWorkspace({
  users,
  whatsappMode,
  calendlyUrl,
  customMeetingUrl,
  defaultCountry = "IN",
  templates = [],
  properties = [],
  currentUserId,
  initialUserId = "",
}: {
  users: UserOption[];
  whatsappMode: "api" | "web";
  calendlyUrl: string;
  customMeetingUrl: string;
  defaultCountry?: string;
  templates?: MessageTemplate[];
  properties?: { id: string; title: string; symbol: string }[];
  currentUserId: string;
  initialUserId?: string;
}) {
  const router = useRouter();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Auto-select contact when navigating from lead detail page
  useEffect(() => {
    if (initialUserId && users.some((u) => u.id === initialUserId)) {
      setSelectedUserId(initialUserId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUserId]);
  
  // Composer state
  const [channel, setChannel] = useState<Channel>("whatsapp");
  const [body, setBody] = useState("");
  const [subject, setSubject] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [createdMeeting, setCreatedMeeting] = useState<{ token: string; webUrl?: string } | null>(null);
  const [calling, setCalling] = useState(false);

  const handleCallClick = async () => {
    if (!phone) {
      alert("No phone number available for this contact.");
      return;
    }
    setCalling(true);
    try {
      const res = await fetch("/api/telephony/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: selectedUserId,
          leadPhone: phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Call placed! Twilio is dialing your phone first, then it will connect you to the recipient.");
      } else {
        alert(data.error || "Failed to start call");
      }
    } catch (err) {
      alert("Failed to connect call via Twilio");
    } finally {
      setCalling(false);
    }
  };

  // Template select state
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id ?? "");
  const [waMediaInstruction, setWaMediaInstruction] = useState(false);

  // Derived: the currently selected template object (for media URL access during send)
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) ?? null,
    [templates, selectedTemplateId]
  );

  // Simulator state
  const [simChannel, setSimChannel] = useState<Channel>("whatsapp");
  const [simBody, setSimBody] = useState("");
  const [simLoading, setSimLoading] = useState(false);

  // Messages log
  const [messages, setMessages] = useState<MessageLogItem[]>([]);
  const [globalLogs, setGlobalLogs] = useState<MessageLogItem[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Active recipient selection
  const recipient = useMemo(
    () => users.find((u) => u.id === selectedUserId),
    [users, selectedUserId]
  );

  // Sync phone number
  useEffect(() => {
    if (recipient?.phone) {
      setPhone(parseStoredPhone(recipient.phone, recipient.country ?? defaultCountry).e164);
    } else {
      setPhone("");
    }
    setErrorMsg("");
    setSuccessMsg("");
    setSelectedTemplateId("");
  }, [recipient, defaultCountry]);

  // Fetch individual chat history with polling
  const fetchMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/messages?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Error fetching conversation messages:", err);
    }
  };

  useEffect(() => {
    if (!selectedUserId) return;
    
    fetchMessages(selectedUserId);

    const interval = setInterval(() => {
      fetchMessages(selectedUserId);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedUserId]);

  // Fetch global recent logs when no user selected
  const fetchGlobalLogs = async () => {
    try {
      const res = await fetch("/api/admin/messages");
      if (res.ok) {
        const data = await res.json();
        setGlobalLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error fetching global logs:", err);
    }
  };

  useEffect(() => {
    if (selectedUserId) return;
    fetchGlobalLogs();

    const interval = setInterval(() => {
      fetchGlobalLogs();
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedUserId]);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

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

  // Apply template logic
  const handleApplyTemplate = (templateId: string, propertyId: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;
    if (!recipient) return;

    const prop = properties.find((p) => p.id === propertyId);
    
    let compiledBody = tpl.body;
    compiledBody = compiledBody.replace(/\{\{name\}\}/g, recipient.name ?? "");
    compiledBody = compiledBody.replace(/\{\{property\}\}/g, prop ? `${prop.title} (${prop.symbol})` : "our property");
    compiledBody = compiledBody.replace(/\{\{email\}\}/g, recipient.email ?? "");
    
    // Fallback: If using WhatsApp Web (QR mode) which doesn't support native buttons,
    // we format buttons and lists into the text body payload.
    // NEVER append mediaUrl to body — it shows as an ugly raw link in WhatsApp.
    if (whatsappMode === "web") {
      // NOTE: media is handled separately via Web Share API or file download — NOT appended here.
      if (tpl.templateType === "Text + Buttons" && tpl.buttons && tpl.buttons.length > 0) {
        compiledBody += "\n\n*Reply Options:*\n" + tpl.buttons.map((b, i) => {
          const item = typeof b === "string" ? { label: b } : b;
          return item.url ? `${i + 1}️⃣ ${item.label}\n   👉 ${item.url}` : `${i + 1}️⃣ ${item.label}`;
        }).join("\n");
      }
      if (tpl.templateType === "Text + Lists" && tpl.listItems && tpl.listItems.length > 0) {
        compiledBody += "\n\n*Menu Options:*\n" + tpl.listItems.map(item => {
          const li = typeof item === "string" ? { label: item } : item;
          return li.url ? `• ${li.label}\n   👉 ${li.url}` : `• ${li.label}`;
        }).join("\n");
      }
    }

    setBody(compiledBody);

    if (tpl.subject && tpl.channel === "email") {
      let compiledSubject = tpl.subject;
      compiledSubject = compiledSubject.replace(/\{\{name\}\}/g, recipient.name ?? "");
      compiledSubject = compiledSubject.replace(/\{\{property\}\}/g, prop ? prop.symbol : "");
      setSubject(compiledSubject);
    }

    if (tpl.channel) {
      setChannel(tpl.channel);
    }
  };

  // Send message API caller
  const handleSendMessage = async (includeMeeting = false) => {
    if (!selectedUserId || !body.trim()) return;
    if ((channel === "whatsapp" || channel === "sms") && !phone.trim()) {
      setErrorMsg("Enter a valid phone number with country code.");
      return;
    }
    if (channel === "telegram" && !telegramChatId.trim()) {
      setErrorMsg("Enter the recipient's Telegram Chat ID.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (includeMeeting) {
      const res = await fetch("/api/admin/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
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
        setErrorMsg(data.error ?? "Meeting send failed");
        return;
      }
      setSuccessMsg("Meeting invite sent successfully.");
      if (data.results?.[0]?.webUrl) {
        // Fallback removed, rely on API success msg
      }
      setBody("");
      fetchMessages(selectedUserId);
      router.refresh();
      return;
    }

    const apiChannel = channel;

    // For Telegram, pass telegramChatId as recipientPhone field (backend uses it as chat_id)
    const effectivePhone = channel === "telegram" ? telegramChatId : phone;

    const res = await fetch("/api/admin/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: apiChannel,
        recipientUserId: selectedUserId,
        recipientPhone: (channel === "whatsapp" || channel === "sms" || channel === "telegram") ? effectivePhone : undefined,
        body,
        subject: channel === "email" ? subject || "Message from BrickVest" : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(data.error ?? "Send failed");
      return;
    }

    setSuccessMsg(`✅ Message sent via ${data.provider || "WhatsApp API"}.`);
    setBody("");
    fetchMessages(selectedUserId);
    router.refresh();
  };

  // Direct WhatsApp Cloud API send (for WhatsApp channel with media/text templates)
  const handleSendWhatsApp = async () => {
    if (isSending) return;
    if (!phone.trim()) {
      setErrorMsg("Enter a valid phone number with country code.");
      return;
    }
    if (!body.trim()) {
      setErrorMsg("Message body cannot be empty.");
      return;
    }

    setIsSending(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const cleanNumber = phone.replace(/\D/g, "");

      // Determine messageType from selected template
      let messageType = "text";
      if (selectedTemplate) {
        if (selectedTemplate.templateType === "Text + Image") messageType = "image";
        else if (selectedTemplate.templateType === "Text + Document") messageType = "document";
        else if (selectedTemplate.templateType === "Text + Audio") messageType = "audio";
      }

      const mediaUrl = selectedTemplate?.mediaUrl || null;

      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: cleanNumber,
          messageType,
          text: body || "",
          mediaUrl,
          caption: body || "",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "WhatsApp send failed");
      }

      setSuccessMsg("✅ Sent successfully on WhatsApp.");
      setBody("");
      fetchMessages(selectedUserId);
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unable to send WhatsApp message.";
      setErrorMsg(msg);
    } finally {
      setIsSending(false);
    }
  };

  // Simulate Incoming Reply
  const handleSimulateReply = async () => {
    if (!selectedUserId || !simBody.trim()) return;
    setSimLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/messages/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUserId: selectedUserId,
          channel: simChannel,
          body: simBody,
          subject: simChannel === "email" ? "Re: Message from BrickVest" : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSimBody("");
        setSuccessMsg(`Simulated incoming ${simChannel} reply received.`);
        fetchMessages(selectedUserId);
      } else {
        setErrorMsg(data.error || "Simulation failed");
      }
    } catch (err) {
      setErrorMsg("Error simulating incoming message");
    } finally {
      setSimLoading(false);
    }
  };

  // Filtered users for sidebar search
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        (u.userId ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone && u.phone.includes(searchTerm))
    );
  }, [users, searchTerm]);

  return (
    <div className="grid gap-0 lg:grid-cols-12 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 shadow-sm overflow-hidden h-[calc(100vh-18rem)] lg:h-[680px] min-h-[550px]">
      
      {/* Sidebar: User List */}
      <div className={cn(
        "lg:col-span-4 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full overflow-hidden",
        selectedUserId ? "hidden lg:flex" : "flex"
      )}>
        <div className="p-4 border-b border-slate-150 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Conversations</span>
            <button
              onClick={() => {
                if (selectedUserId) fetchMessages(selectedUserId);
                else fetchGlobalLogs();
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
              title="Refresh lists"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by User ID (e.g. USR-10001), name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-brand transition"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100">
          {filteredUsers.map((u) => {
            const isSelected = u.id === selectedUserId;
            // Get initials
            const initials = u.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            // Simple role styles
            const roleColor =
              u.role === "BUYER"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : u.role === "SELLER"
                  ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                  : u.role === "AGENT"
                    ? "bg-amber-50 text-amber-700 border-amber-100"
                    : u.role === "DEVELOPER"
                      ? "bg-violet-50 text-violet-700 border-violet-200"
                      : "bg-slate-100 text-slate-700 border-slate-200";

            return (
              <button
                key={u.id}
                onClick={() => setSelectedUserId(u.id)}
                className={`w-full text-left p-3.5 flex items-center gap-3 transition hover:bg-slate-50 ${
                  isSelected ? "bg-amber-50/60 hover:bg-amber-50/60 border-l-4 border-brand" : ""
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-slate-800 text-xs truncate">{u.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 border rounded-full font-semibold ${roleColor}`}>
                      {u.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                  {u.phone && <p className="text-[10px] text-slate-400 mt-0.5">{u.phone}</p>}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
              </button>
            );
          })}
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">No matching users found</div>
          )}
        </div>
      </div>

      {/* Main Console Pane */}
      <div className={cn(
        "lg:col-span-8 flex flex-col bg-white h-full relative overflow-hidden",
        selectedUserId ? "flex" : "hidden lg:flex"
      )}>
        {recipient ? (
          <>
            {/* Console Header */}
            <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUserId("")}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 lg:hidden mr-1"
                  title="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center font-bold text-brand text-sm border border-brand/20 flex-shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{recipient.name}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>{recipient.email}</span>
                    {recipient.phone && (
                      <>
                        <span className="text-slate-350">•</span>
                        <span>{phone}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {recipient.phone && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="secondary"
                      className="bg-sky-50 hover:bg-sky-100 text-sky-850 border-sky-200 px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold"
                      onClick={handleCallClick}
                      loading={calling}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>Call via Twilio</span>
                    </Button>
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-250 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Phone className="h-3.5 w-3.5 text-slate-500" />
                      <span>Direct Call</span>
                    </a>
                  </div>
                )}
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full capitalize">
                  {recipient.role.toLowerCase()}
                </span>
              </div>
            </div>

            {/* Chat History Pane */}
            <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[200px]">
                  <MessageSquare className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-xs font-medium">No conversation history yet</p>
                  <p className="text-[11px] text-slate-400 mt-1">Send a message below or use simulation to test receiving replies.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutbound = msg.sentById === currentUserId || msg.provider !== "simulated_incoming";
                  const dateStr = new Date(msg.createdAt).toLocaleString(undefined, {
                    hour: "numeric",
                    minute: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  // Select channel icon
                  let channelIcon = <Smartphone className="h-3 w-3" />;
                  let channelLabel = "WhatsApp";
                  let channelColor = "bg-emerald-500 text-white";

                  if (msg.channel === "EMAIL") {
                    channelIcon = <AtSign className="h-3 w-3" />;
                    channelLabel = "Email";
                    channelColor = "bg-slate-700 text-white";
                  } else if (msg.channel === "TELEGRAM") {
                    channelIcon = <MessageCircle className="h-3 w-3" />;
                    channelLabel = "Telegram";
                    channelColor = "bg-sky-500 text-white";
                  } else if (msg.channel === "SMS") {
                    channelIcon = <Send className="h-3 w-3" />;
                    channelLabel = "SMS";
                    channelColor = "bg-violet-600 text-white";
                  } else if (msg.channel === "PLATFORM") {
                    channelIcon = <MessageSquare className="h-3 w-3" />;
                    channelLabel = "Platform";
                    channelColor = "bg-amber-500 text-white";
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOutbound ? "justify-end" : "justify-start"} items-end gap-2`}
                    >
                      {/* Incoming avatar (optional, show for client) */}
                      {!isOutbound && (
                        <div className="h-6 w-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-[9px] text-slate-600 flex-shrink-0">
                          {recipient.name[0]}
                        </div>
                      )}

                      <div className="max-w-[75%] space-y-1">
                        {/* Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                            isOutbound
                              ? "bg-slate-900 text-white rounded-br-none"
                              : "bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm"
                          }`}
                        >
                          {msg.subject && msg.channel === "EMAIL" && (
                            <div className="font-bold border-b border-white/20 pb-1.5 mb-1.5 flex items-center gap-1.5">
                              <Mail className="h-3 w-3" />
                              Subject: {msg.subject}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                        </div>

                        {/* Timestamp & Status info */}
                        <div
                          className={`flex items-center gap-2 text-[10px] text-slate-400 ${
                            isOutbound ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium ${channelColor}`}
                            title={channelLabel}
                          >
                            {channelIcon}
                            <span>{channelLabel}</span>
                          </span>
                          <span>{dateStr}</span>
                          
                          {isOutbound && (
                            <span className="flex items-center">
                              {msg.status === "SENT" && (
                                <span title="Sent">
                                  <Check className="h-3 w-3 text-sky-500" />
                                </span>
                              )}
                              {msg.status === "OPENED_WEB" && (
                                <span title="Opened Web link">
                                  <CheckCheck className="h-3 w-3 text-emerald-500" />
                                </span>
                              )}
                              {msg.status === "FAILED" && (
                                <span title={`Failed: ${msg.error ?? "Unknown error"}`}>
                                  <AlertCircle className="h-3 w-3 text-red-500" />
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Template Selector Widget */}
            {templates.length > 0 && (
              <div className="bg-slate-50 border-t border-b border-slate-150 px-4 py-3 space-y-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>Apply Message Template</span>
                  </div>
                  {selectedTemplateId && (
                    <button
                      onClick={() => {
                        setSelectedTemplateId("");
                        setBody("");
                        setSubject("");
                        setWaMediaInstruction(false);
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 font-medium hover:underline"
                    >
                      Clear Fields
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-[180px]">
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => {
                        setSelectedTemplateId(e.target.value);
                        setWaMediaInstruction(false);
                        if (e.target.value) {
                          handleApplyTemplate(e.target.value, selectedPropertyId);
                        }
                      }}
                      className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-800"
                    >
                      <option value="">-- Select Template --</option>
                      {templates.map((tpl) => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedTemplateId &&
                    templates.find((t) => t.id === selectedTemplateId)?.body.includes("{{property}}") && (
                      <div className="min-w-[180px]">
                        <select
                          value={selectedPropertyId}
                          onChange={(e) => {
                            setSelectedPropertyId(e.target.value);
                            handleApplyTemplate(selectedTemplateId, e.target.value);
                          }}
                          className="w-full text-xs rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-slate-800"
                        >
                          {properties.map((prop) => (
                            <option key={prop.id} value={prop.id}>
                              {prop.title} ({prop.symbol})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                </div>

                {selectedTemplate && selectedTemplate.mediaUrl &&
                  selectedTemplate.templateType !== "Text Template" &&
                  selectedTemplate.templateType !== "Text + Buttons" &&
                  selectedTemplate.templateType !== "Text + Lists" && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 flex items-center gap-3 mt-2">
                      {selectedTemplate.templateType === "Text + Image" && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedTemplate.mediaUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {selectedTemplate.templateType === "Text + Document" && (
                        <div className="w-10 h-10 rounded-lg bg-sky-600 flex items-center justify-center text-white flex-shrink-0">
                          <FileIcon className="h-5 w-5" />
                        </div>
                      )}
                      {(selectedTemplate.templateType === "Text + Audio" || selectedTemplate.templateType === "Text + Video") && (
                        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                          <Music className="h-5 w-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {selectedTemplate.mediaName || (selectedTemplate.templateType === "Text + Image" ? "template-image.jpg" : selectedTemplate.templateType === "Text + Document" ? "template-document.pdf" : "template-audio.mp3")}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {selectedTemplate.templateType?.replace("Text + ", "") ?? ""} Attachment — will be sent through WhatsApp Cloud API.
                        </p>
                        {selectedTemplate.templateType === "Text + Audio" && (
                          <audio controls src={selectedTemplate.mediaUrl} className="w-full h-8 mt-1.5" />
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Message Composer & Reply Simulator */}
            <div className="p-4 border-t border-slate-200 bg-white space-y-4 flex-shrink-0">
              
              {/* Channel Selector */}
              <div className="flex flex-wrap gap-2">
                {CHANNELS.map((c) => {
                  const Icon = c.icon;
                  const active = channel === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setChannel(c.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                        active ? c.activeColor : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {/* Subject & Override Phone */}
              <div className="grid gap-3 sm:grid-cols-2">
                {channel === "email" && (
                  <div className="col-span-2">
                    <Label className="text-[10px] text-slate-400 uppercase font-bold mb-1">Email Subject</Label>
                    <input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject line"
                      className="w-full text-xs rounded-xl border border-slate-200 px-4 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-500 transition"
                    />
                  </div>
                )}

                {needsPhone && (
                  <div className="col-span-2">
                    <Label className="text-[10px] text-slate-400 uppercase font-bold mb-1">Phone Number</Label>
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      defaultCountry={recipient?.country ?? defaultCountry}
                    />
                  </div>
                )}

                {needsTelegramId && (
                  <div className="col-span-2">
                    <Label className="text-[10px] text-slate-400 uppercase font-bold mb-1">Telegram Chat ID</Label>
                    <input
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="e.g. 123456789"
                      className="w-full text-xs rounded-xl border border-slate-200 px-4 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                    />
                    <p className="text-[10px] text-sky-700 mt-1">
                      Get Chat ID: have user message your bot → check{" "}
                      <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="underline font-bold">@userinfobot</a>{" "}
                      on Telegram. Then add your Bot Token in{" "}
                      <a href="/admin/integrations" className="underline font-bold">Integrations</a>.
                    </p>
                  </div>
                )}
              </div>

              {/* Body Composer */}
              <div>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={placeholder}
                  rows={3}
                  className="w-full text-xs rounded-2xl border border-slate-200 focus:outline-none p-3.5 focus:ring-1 focus:ring-slate-500"
                />
              </div>

              {/* Per-channel info banners */}
              {channel === "whatsapp" && (
                <div className="flex items-start gap-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
                  <span className="text-base leading-none">✅</span>
                  <span><strong>WhatsApp Business API</strong> — message will be sent directly to the recipient's phone.</span>
                </div>
              )}
              {channel === "email" && (
                <div className="flex items-start gap-2 text-[11px] text-slate-700 bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2.5">
                  <span className="text-base leading-none">📧</span>
                  <span>
                    Email is sent to <strong>{recipient?.email}</strong>. Configure Gmail SMTP or Resend API in{" "}
                    <a href="/admin/integrations" className="underline font-bold">Integrations</a>{" "}
                    to ensure real delivery.
                  </span>
                </div>
              )}
              {channel === "sms" && (
                <div className="flex items-start gap-2 text-[11px] text-violet-800 bg-violet-50 border border-violet-200 rounded-xl px-3.5 py-2.5">
                  <span className="text-base leading-none">💬</span>
                  <span>
                    SMS via Twilio. Add your Twilio credentials in{" "}
                    <a href="/admin/integrations" className="underline font-bold">Integrations</a>{" "}
                    to send real SMS messages.
                  </span>
                </div>
              )}

              {errorMsg && <p className="text-xs text-red-600 font-semibold">{errorMsg}</p>}
              {successMsg && <p className="text-xs text-emerald-600 font-semibold">{successMsg}</p>}


              {/* Composer Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {channel === "whatsapp" ? (
                  <Button
                    variant="secondary"
                    className="flex-1 text-xs py-2 h-auto bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500"
                    loading={isSending}
                    disabled={!body.trim() || isSending}
                    onClick={handleSendWhatsApp}
                  >
                    <Send className="h-3.5 w-3.5" />
                    {isSending ? "Sending..." : "Send via WhatsApp"}
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    className="flex-1 text-xs py-2 h-auto"
                    loading={loading}
                    disabled={!body.trim() || loading}
                    onClick={() => handleSendMessage(false)}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Send via {CHANNELS.find((c) => c.id === channel)?.label}
                  </Button>
                )}

                <Button
                  variant="gold"
                  className="flex-1 text-xs py-2 h-auto bg-teal-100 hover:bg-teal-200 text-teal-950 border border-teal-200 shadow-none font-semibold"
                  loading={loading}
                  disabled={!body.trim() || loading}
                  onClick={() => handleSendMessage(true)}
                >
                  <Video className="h-3.5 w-3.5" />
                  Schedule Meeting &amp; Invite
                </Button>
              </div>

              {/* Live Simulator Widget */}
              <details className="border border-amber-100 bg-amber-50/30 rounded-2xl p-2.5 mt-2 group">
                <summary className="flex items-center justify-between text-xs font-bold text-amber-800 cursor-pointer select-none">
                  <span className="flex items-center gap-2">
                    <Play className="h-3.5 w-3.5 fill-amber-700 text-amber-700" />
                    <span>Interactive Reply Simulator (Testing)</span>
                  </span>
                  <span className="text-[10px] text-amber-600 group-open:hidden">Click to Show</span>
                  <span className="text-[10px] text-amber-600 hidden group-open:inline">Click to Hide</span>
                </summary>
                
                <div className="grid gap-3 sm:grid-cols-12 items-end mt-2.5">
                  <div className="sm:col-span-3">
                    <select
                      value={simChannel}
                      onChange={(e) => setSimChannel(e.target.value as Channel)}
                      className="w-full text-xs rounded-xl border border-amber-250 bg-white px-3 py-2 text-slate-800 font-medium"
                    >
                      <option value="whatsapp">Client WhatsApp</option>
                      <option value="email">Client Email</option>
                      <option value="telegram">Client Telegram</option>
                      <option value="sms">Client SMS</option>
                    </select>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <input
                      value={simBody}
                      onChange={(e) => setSimBody(e.target.value)}
                      placeholder={`Type client's reply message...`}
                      className="w-full text-xs rounded-xl border border-amber-250 bg-white px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={handleSimulateReply}
                      disabled={simLoading || !simBody.trim()}
                      className="w-full bg-amber-600 hover:bg-amber-750 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {simLoading ? "Simulating..." : "Trigger Reply"}
                    </button>
                  </div>
                </div>
              </details>

            </div>
          </>
        ) : (
          /* Empty State / Global Logs Display */
          <div className="h-full flex flex-col p-6 overflow-y-auto bg-slate-50/20">
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-brand/10 flex items-center justify-center text-brand border border-brand/20 mb-4 animate-pulse">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Real-time Messaging Workspace</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Select a user from the sidebar to view your bidirectional chat history, apply quick response templates, and send messages dynamically.
              </p>
            </div>

            {/* Global Recent Feed */}
            <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col max-h-[350px] mt-auto">
              <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between bg-slate-50/50">
                <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                  <ArrowDownCircle className="h-4 w-4 text-brand" />
                  Recent Messages Log
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Last 50 messages</span>
              </div>
              <div className="overflow-y-auto divide-y divide-slate-100 p-2">
                {globalLogs.map((log) => (
                  <div key={log.id} className="p-3 text-[11px] hover:bg-slate-50 rounded-xl transition">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">
                        {log.channel} &rarr; {log.recipient?.name ?? log.toEmail ?? log.toPhone ?? "User"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "numeric" })}
                      </span>
                    </div>
                    <p className="text-slate-600 truncate">{log.body}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-150 text-slate-600 border border-slate-200 capitalize">
                        {log.status.replace("_", " ").toLowerCase()}
                      </span>
                      <span className="text-[9px] text-slate-400">Via {log.provider}</span>
                    </div>
                  </div>
                ))}
                {globalLogs.length === 0 && (
                  <p className="p-8 text-xs text-slate-400 text-center">No messages sent or received yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
