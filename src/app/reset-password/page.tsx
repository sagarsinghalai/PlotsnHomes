"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ShieldCheck, CheckCircle2, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const qEmail = searchParams.get("email");
    const qToken = searchParams.get("token");
    if (qEmail) setEmail(qEmail);
    if (qToken) setToken(qToken);
  }, [searchParams]);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !newPassword) return;

    if (!token) {
      setError("This reset link is missing its security token. Please open the link from your password reset email, or request a new one.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reset=1");
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] bg-slate-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Sign In
        </Link>

        <div className="text-center mb-6">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Set New Password</h1>
          <p className="mt-1.5 text-xs text-slate-500 font-medium">
            Please enter your new password to restore access to your account.
          </p>
        </div>

        {success ? (
          <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm text-center space-y-3 animate-in fade-in">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Password Successfully Reset!</h3>
            <p className="text-xs text-slate-600">
              Your account password has been updated. Redirecting to login page…
            </p>
            <Button variant="gold" className="w-full mt-2" onClick={() => router.push("/login")}>
              Go to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <Label>Account Email *</Label>
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>New Password *</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  required
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? "Hide password" : "Show password"}
                  aria-pressed={showNew}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label>Confirm New Password *</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  aria-pressed={showConfirm}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
                {error}
              </p>
            )}

            <Button type="submit" variant="gold" className="w-full" loading={loading}>
              Reset Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading reset form...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
