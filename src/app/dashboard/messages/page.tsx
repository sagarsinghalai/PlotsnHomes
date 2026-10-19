"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  User,
  MessageSquare,
  RefreshCw,
  ArrowLeft,
  Mail,
  Smartphone,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import Link from "next/link";

type MessageLogItem = {
  id: string;
  channel: string;
  sentById: string;
  recipientId: string | null;
  body: string;
  status: string;
  createdAt: string;
  sentBy: { name: string; role: string } | null;
};

export default function ClientMessagesPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<MessageLogItem[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [agentName, setAgentName] = useState("Your Advisor");
  const [agentRole, setAgentRole] = useState("Agent");

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch individual chat history with polling
  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        
        // Dynamically find agent details from incoming messages
        if (data.messages && data.messages.length > 0) {
          const inboundMessage = data.messages.find((m: MessageLogItem) => m.sentBy && m.sentBy.role !== "BUYER" && m.sentBy.role !== "SELLER");
          if (inboundMessage?.sentBy) {
            setAgentName(inboundMessage.sentBy.name);
            setAgentRole(inboundMessage.sentBy.role);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

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

  const handleSendMessage = async () => {
    if (!body.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setErrorMsg(data.error || "Send failed");
        return;
      }

      setBody("");
      fetchMessages();
    } catch (err) {
      setErrorMsg("Failed to connect to messaging server");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <button className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-700">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900">Message Center</h1>
            <p className="text-xs text-slate-500">Chat with your dedicated advisor in real-time</p>
          </div>
        </div>
        <button
          onClick={fetchMessages}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition"
          title="Refresh chat"
        >
          <RefreshCw className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="border border-slate-200 rounded-3xl bg-white shadow-sm overflow-hidden flex flex-col h-[600px]">
        {/* Chat Header */}
        <div className="p-4 border-b bg-slate-50/50 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand/10 flex items-center justify-center font-bold text-brand border border-brand/20">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">{agentName}</h3>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              {agentRole}
            </p>
          </div>
        </div>

        {/* Messages Feed */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <MessageSquare className="h-10 w-10 text-slate-350 mb-2" />
              <p className="text-xs font-semibold">No messages yet</p>
              <p className="text-[11px] text-slate-450 mt-1 max-w-xs">
                Your messages, alerts, and platform communications with PlotsnHomes advisors will appear here. Write a message below to start the conversation.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              // Outbound means it was sent by client
              const isOutbound = msg.recipientId === null || msg.recipientId !== msg.sentById;
              const dateStr = new Date(msg.createdAt).toLocaleString(undefined, {
                hour: "numeric",
                minute: "numeric",
                month: "short",
                day: "numeric",
              });

              // Check if message is inbound vs outbound relative to client
              // (If sentBy doesn't exist or is not matching our client)
              const clientSent = !msg.sentBy || msg.sentBy.role === "BUYER" || msg.sentBy.role === "SELLER";

              return (
                <div
                  key={msg.id}
                  className={`flex ${clientSent ? "justify-end" : "justify-start"} items-end gap-2`}
                >
                  {!clientSent && (
                    <div className="h-6 w-6 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center font-bold text-[9px] text-brand flex-shrink-0">
                      {agentName[0]}
                    </div>
                  )}

                  <div className="max-w-[75%] space-y-1">
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        clientSent
                          ? "bg-slate-900 text-white rounded-br-none"
                          : "bg-white text-slate-850 border border-slate-200 rounded-bl-none shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 text-[10px] text-slate-400 ${clientSent ? "justify-end" : "justify-start"}`}>
                      <span>{dateStr}</span>
                      {clientSent && (
                        <span>
                          {msg.status === "SENT" ? (
                            <Check className="h-3 w-3 text-sky-500" />
                          ) : msg.status === "FAILED" ? (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          ) : null}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Composer */}
        <div className="p-4 border-t bg-white space-y-3">
          <div className="relative">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              rows={2}
              className="w-full text-xs rounded-2xl border border-slate-200 focus:outline-none p-3 pr-10 focus:ring-1 focus:ring-slate-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !body.trim()}
              className="absolute right-3.5 bottom-3 text-brand hover:text-brand-hover disabled:text-slate-300 transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          {errorMsg && <p className="text-[10px] text-red-650 font-semibold">{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
}
