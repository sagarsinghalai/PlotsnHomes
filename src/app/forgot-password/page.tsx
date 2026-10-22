"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, ArrowLeft, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{
    message?: string;
    devResetUrl?: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setSuccessData(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process forgot password request");
      }

      setSuccessData(data);
    } catch (err: any) {
      setError(err.message || "Failed to request password reset");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-slate-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>

        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Forgot Password?</h1>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            Enter your registered email address and we'll send you a password reset link.
          </p>
        </div>

        {successData ? (
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-sm">Check your email</h3>
                <p className="text-xs text-emerald-700">{successData.message || "If an account exists, a reset link has been sent."}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              We've emailed a secure reset link. It expires in 1 hour and can be used once. If it doesn't arrive, check your spam folder or request another.
            </p>

            {successData.devResetUrl && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Dev mode — email delivery is logged, not sent</p>
                <Button
                  type="button"
                  variant="gold"
                  className="w-full"
                  onClick={() => { window.location.href = successData!.devResetUrl!; }}
                >
                  <Sparkles className="h-4 w-4" /> Open reset link (dev only)
                </Button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <Label>Registered Email Address *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                {error}
              </p>
            )}

            <Button type="submit" variant="gold" className="w-full" loading={loading}>
              Send Password Reset Instructions
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Secured with 256-bit password encryption</span>
        </div>
      </div>
    </div>
  );
}
