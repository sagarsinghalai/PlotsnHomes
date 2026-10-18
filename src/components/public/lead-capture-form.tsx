"use client";

import { useState } from "react";
import { User, Phone, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { COUNTRY_DIAL_CODES, dialCodeLabel } from "@/lib/country-codes";

export function LeadCaptureForm({
  propertyId,
  source,
  title = "Request a callback",
  subtitle = "Share your details and our property expert will reach out shortly.",
  compact = false,
  className = "",
}: {
  propertyId?: string;
  source?: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
}) {
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const trimName = name.trim();
    if (trimName.length < 2) {
      setStatus("error");
      setMessage("Please enter your full name.");
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 6) {
      setStatus("error");
      setMessage("Please enter a valid phone number.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimName,
          phone: `${countryCode} ${cleanPhone}`,
          email: email.trim() || "",
          propertyId: propertyId || undefined,
          source: source || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("ok");
        setMessage(data.message ?? "Thanks! We'll be in touch shortly.");
        setName("");
        setPhone("");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Could not submit. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Cannot reach the server. Please try again.");
    }
  }

  if (status === "ok") {
    return (
      <div
        className={`rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center ${className}`}
      >
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
        <h3 className="mt-3 text-lg font-bold text-slate-900">Request received!</h3>
        <p className="mt-1 text-sm text-slate-600">{message}</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-4 text-xs font-bold text-emerald-700 underline hover:text-emerald-800"
        >
          Submit another request
        </button>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-gold focus:ring-2 focus:ring-gold/20 transition";

  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      {!compact && (
        <>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-1 mb-4 text-sm text-slate-500">{subtitle}</p>
        </>
      )}

      <div className="space-y-3">
        {/* Name */}
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            required
            placeholder="Full name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Phone (required) */}
        <div className="flex gap-2">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            aria-label="Country code"
            className="rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-gold shrink-0 max-w-[100px]"
          >
            {COUNTRY_DIAL_CODES.map((c) => (
              <option key={`${c.code}-${c.name}`} value={c.code}>
                {dialCodeLabel(c)}
              </option>
            ))}
          </select>
          <div className="relative flex-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="tel"
              required
              inputMode="numeric"
              placeholder="Phone number *"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))}
              className={inputClass}
            />
          </div>
        </div>

        {/* Email (optional) */}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-gold-dark disabled:opacity-60"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </>
          ) : (
            "Get a callback"
          )}
        </button>

        {status === "error" && message && (
          <p className="text-xs font-semibold text-rose-600">{message}</p>
        )}
        <p className="text-center text-[11px] text-slate-400">
          By submitting, you agree to be contacted about this enquiry.
        </p>
      </div>
    </form>
  );
}
