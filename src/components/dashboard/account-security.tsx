"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";

export function AccountSecurity() {
  return (
    <div className="max-w-2xl space-y-8">
      <ChangePassword />
      <DeleteAccount />
    </div>
  );
}

function ChangePassword() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    if (form.newPassword !== form.confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not update password");
      setMsg("Password updated.");
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err: any) {
      setError(err.message || "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><ShieldCheck className="h-5 w-5 text-brand" /> Change password</h2>
      <form onSubmit={submit} className="mt-4 space-y-4">
        {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {msg && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{msg}</p>}
        <div>
          <Label>Current password</Label>
          <Input type="password" autoComplete="current-password" required value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>New password</Label>
            <Input type="password" autoComplete="new-password" required value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
          </div>
          <div>
            <Label>Confirm new password</Label>
            <Input type="password" autoComplete="new-password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
          </div>
        </div>
        <Button type="submit" variant="secondary" loading={busy}>Update password</Button>
      </form>
    </section>
  );
}

function DeleteAccount() {
  const [confirming, setConfirming] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function doDelete() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Could not delete account");
      // Signed-out; the account is deactivated and can't be reinstated by the user.
      await signOut({ callbackUrl: "/login?deleted=1" });
    } catch (err: any) {
      setError(err.message || "Could not delete account");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50/40 p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-rose-700"><AlertTriangle className="h-5 w-5" /> Delete account</h2>
      <p className="mt-2 text-sm text-slate-600">
        This closes your account and signs you out. You won&apos;t be able to sign in or reinstate it yourself —
        only the platform administrator can reactivate it later. Your data is retained for records.
      </p>

      {error && <p className="mt-3 rounded-xl bg-rose-100 px-4 py-3 text-sm text-rose-800">{error}</p>}

      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
        >
          Delete my account
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <Label>Type <span className="font-mono font-bold">DELETE</span> to confirm</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="DELETE" className="max-w-xs" />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={text !== "DELETE" || busy}
              onClick={doDelete}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
              {busy ? "Deleting…" : "Permanently delete"}
            </button>
            <button type="button" onClick={() => { setConfirming(false); setText(""); }} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
