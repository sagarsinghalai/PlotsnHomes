"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { COUNTRIES } from "@/lib/locale-defaults";
import type { SellerKind } from "./seller-flow";

const KIND_LABEL: Record<SellerKind, string> = {
  INDIVIDUAL: "Individual Seller",
  DEVELOPER: "Developer / Builder",
  AGENT: "Agent / Broker",
};

const darkInput =
  "w-full rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium border-slate-800";

export function SignupForm({
  kind,
  onBack,
  onExists,
  onLogin,
}: {
  kind: SellerKind;
  onBack: () => void;
  onExists: (identifier: string) => void;
  onLogin: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: Record<string, string> = {};
    const nameTrimmed = name.trim();
    if (!nameTrimmed) e.name = "Full name is required.";
    else if (/\d/.test(nameTrimmed)) e.name = "Name must not contain numbers.";

    const emailTrimmed = email.trim();
    if (!emailTrimmed) e.email = "Email is required.";
    else if (!/.+@.+\..+/.test(emailTrimmed)) e.email = "Enter a valid email address.";

    if (phoneDigits.length !== 10) e.phone = "Phone number must be exactly 10 digits.";
    if (password.length < 8) e.password = "Password must be at least 8 characters.";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/seller/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: `${countryCode}${phoneDigits}`,
          countryCode,
          sellerKind: kind,
        }),
      });
      const data = await res.json();

      if (res.status === 409 && data.exists) {
        // Already registered → hand off to the login popup.
        onExists(email.trim().toLowerCase());
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setServerError(data.error || "Registration failed.");
        setLoading(false);
        return;
      }

      // Account created — sign them in so the listing wizard is authenticated.
      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });
      if (signInRes?.error) {
        setServerError("Account created, but automatic sign-in failed. Please log in.");
        setLoading(false);
        onLogin();
        return;
      }
      // On success, useSession flips to authenticated and the flow advances.
    } catch {
      setServerError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-10 shadow-2xl">
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Change account type
      </button>

      <h2 className="text-xl sm:text-2xl font-extrabold text-white">Create your account</h2>
      <p className="text-sm text-slate-400 mt-1">
        Signing up as <span className="font-bold text-amber-400">{KIND_LABEL[kind]}</span>
      </p>

      {serverError && (
        <div className="mt-5 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">{serverError}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs">
        <div>
          <label className="block text-slate-300 font-bold mb-1.5">Full Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bhavya Pandey"
            className={`${darkInput} ${errors.name ? "!border-rose-500" : ""}`}
          />
          {errors.name && <p className="mt-1 text-[10px] font-semibold text-rose-400">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-slate-300 font-bold mb-1.5">Email Address *</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${darkInput} ${errors.email ? "!border-rose-500" : ""}`}
          />
          {errors.email && <p className="mt-1 text-[10px] font-semibold text-rose-400">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-slate-300 font-bold mb-1.5">Phone / WhatsApp Number *</label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-[110px] shrink-0 rounded-xl border border-slate-800 bg-slate-950 px-2 py-3 text-white outline-none focus:border-amber-400 text-xs"
            >
              {COUNTRIES.map((c) => (
                <option key={`${c.code}-${c.dial}`} value={c.dial}>
                  {c.flag} {c.code} ({c.dial})
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={phoneDigits}
              onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="98201 34567"
              className={`flex-1 rounded-xl border bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400 font-medium ${errors.phone ? "border-rose-500" : "border-slate-800"}`}
            />
          </div>
          {errors.phone && <p className="mt-1 text-[10px] font-semibold text-rose-400">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-slate-300 font-bold mb-1.5">Password *</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={`${darkInput} pr-11 ${errors.password ? "!border-rose-500" : ""}`}
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-white"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-[10px] font-semibold text-rose-400">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand hover:bg-brand-hover py-4 font-extrabold text-sm text-white shadow-xl shadow-brand/20 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Creating account…
            </>
          ) : (
            <>
              Create account &amp; continue <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">
        Already have an account?{" "}
        <button type="button" onClick={onLogin} className="font-bold text-amber-400 hover:underline">
          Log in
        </button>
      </p>
    </div>
  );
}
