"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { X, Eye, EyeOff, Loader2, Mail, Phone, ShieldCheck } from "lucide-react";

type Tab = "password" | "otp";

export function UserExistsModal({
  open,
  onClose,
  prefillIdentifier,
}: {
  open: boolean;
  onClose: () => void;
  prefillIdentifier: string;
}) {
  const [tab, setTab] = useState<Tab>("password");

  // Password tab
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [forgotLink, setForgotLink] = useState<string | null>(null);

  // OTP tab
  const [identifier, setIdentifier] = useState("");
  const [deliver, setDeliver] = useState<"email" | "phone">("email");
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [sentNote, setSentNote] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(prefillIdentifier.includes("@") ? prefillIdentifier : "");
      setIdentifier(prefillIdentifier);
      setTab("password");
      setError("");
      setForgotMsg(null);
      setForgotLink(null);
      setCodeSent(false);
      setDevCode(null);
      setSentNote(null);
      setCode("");
      setPassword("");
    }
  }, [open, prefillIdentifier]);

  if (!open) return null;

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    onClose(); // session flips → flow advances to the wizard
  }

  async function handleForgot() {
    setError("");
    setForgotMsg(null);
    setForgotLink(null);
    if (!email.trim()) {
      setError("Enter your email first, then tap Forgot password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      setForgotMsg(data.message || "If an account exists, a reset link has been sent.");
      if (data.devResetUrl) setForgotLink(data.devResetUrl);
    } catch {
      setError("Could not send reset email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp() {
    setError("");
    setDevCode(null);
    setSentNote(null);
    if (!identifier.trim()) {
      setError("Enter your email or phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), deliver }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not send code.");
        setLoading(false);
        return;
      }
      setCodeSent(true);
      setSentNote(
        deliver === "email"
          ? "We've emailed you a 6-digit code (valid 10 min)."
          : "We've sent a 6-digit code to your phone (valid 10 min)."
      );
      if (data.devCode) setDevCode(data.devCode);
    } catch {
      setError("Could not send code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("otp", {
      identifier: identifier.trim(),
      code: code.trim(),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid or expired code. Please request a new one.");
      return;
    }
    onClose();
  }

  const lightInput =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-slate-900">
        <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-slate-400 hover:text-slate-700">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand" />
          <h3 className="text-lg font-extrabold">User already exists</h3>
        </div>
        <p className="mt-1 text-sm text-slate-500">This email or phone is already registered. Log in to continue.</p>

        {/* Tabs */}
        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => { setTab("password"); setError(""); }}
            className={`rounded-lg py-2 text-sm font-semibold transition ${tab === "password" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
          >
            Email &amp; password
          </button>
          <button
            onClick={() => { setTab("otp"); setError(""); }}
            className={`rounded-lg py-2 text-sm font-semibold transition ${tab === "otp" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}
          >
            Login with OTP
          </button>
        </div>

        {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-sm text-rose-700">{error}</div>}

        {tab === "password" && (
          <form onSubmit={handlePasswordLogin} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={lightInput} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className={`${lightInput} pr-11`}
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPw((s) => !s)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600" aria-label={showPw ? "Hide password" : "Show password"}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button type="button" onClick={handleForgot} className="text-xs font-semibold text-brand hover:underline">
                Forgot password?
              </button>
            </div>

            {forgotMsg && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                {forgotMsg}
                {forgotLink && (
                  <>
                    {" "}
                    <a href={forgotLink} className="font-bold underline break-all">Open reset link (dev)</a>
                  </>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-hover py-3 text-sm font-bold text-white transition disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
            </button>
          </form>
        )}

        {tab === "otp" && (
          <form onSubmit={handleVerifyOtp} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email or phone</label>
              <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@example.com or 98201 34567" className={lightInput} />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">Send code via</span>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setDeliver("email")} className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition ${deliver === "email" ? "border-brand bg-brand/5 text-brand" : "border-slate-300 text-slate-600"}`}>
                  <Mail className="h-4 w-4" /> Email
                </button>
                <button type="button" onClick={() => setDeliver("phone")} className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-semibold transition ${deliver === "phone" ? "border-brand bg-brand/5 text-brand" : "border-slate-300 text-slate-600"}`}>
                  <Phone className="h-4 w-4" /> Phone (WhatsApp/SMS)
                </button>
              </div>
            </div>

            <button type="button" onClick={handleSendOtp} disabled={loading} className="w-full rounded-xl border border-brand bg-brand/5 py-2.5 text-sm font-bold text-brand transition hover:bg-brand/10 disabled:opacity-50">
              {loading && !codeSent ? "Sending…" : codeSent ? "Resend code" : "Send code"}
            </button>

            {sentNote && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
                {sentNote}
                {devCode && <> Dev code: <span className="font-mono font-bold">{devCode}</span></>}
              </div>
            )}

            {codeSent && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Enter 6-digit code</label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    placeholder="______"
                    className={`${lightInput} tracking-[0.5em] text-center font-mono text-lg`}
                  />
                </div>
                <button type="submit" disabled={loading || code.length < 4} className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-hover py-3 text-sm font-bold text-white transition disabled:opacity-50">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & log in"}
                </button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
