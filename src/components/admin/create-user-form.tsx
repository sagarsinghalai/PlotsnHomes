"use client";

import { Role } from "@prisma/client";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/roles";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

import { validateUserDobAge } from "@/lib/user-validation";
import { COUNTRY_DIAL_CODES, dialCodeLabel } from "@/lib/country-codes";

export function CreateUserForm() {
  const router = useRouter();
  const { hasAddPermission, userRole } = useAdminPermissions();
  const canAdd = hasAddPermission("/admin/users");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    countryCode: "+91",
    phone: "",
    pan: "",
    aadhar: "",
    dob: "",
    role: "BUYER" as Role,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    if (form.dob) {
      const dobCheck = validateUserDobAge(form.dob);
      if (!dobCheck.valid) {
        setError(dobCheck.message!);
        setBusy(false);
        return;
      }
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (phoneDigits && phoneDigits.length !== 10) {
      setError("Phone number must be exactly 10 digits (country code is selected separately).");
      setBusy(false);
      return;
    }

    if (form.pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(form.pan.trim())) {
      setError("PAN Card Number must be 10 characters (e.g. ABCDE1234F).");
      setBusy(false);
      return;
    }

    if (form.aadhar.trim() && !/^\d{12}$/.test(form.aadhar.trim().replace(/\s+/g, ""))) {
      setError("Aadhaar Card Number must be exactly 12 digits.");
      setBusy(false);
      return;
    }

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        phone: phoneDigits || undefined,
        countryCode: phoneDigits ? form.countryCode : undefined,
        pan: form.pan.trim() || undefined,
        aadhar: form.aadhar.trim() || undefined,
        dob: form.dob || undefined,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to create user");
      return;
    }
    setOpen(false);
    router.push(`/admin/users/${data.user.id}`);
    router.refresh();
  }

  if (!canAdd) return null;

  if (!open) {
    return (
      <Button type="button" variant="gold" onClick={() => setOpen(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Add user
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add new user</h2>
          <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        {error && <p className="rounded-xl bg-red-50 dark:bg-red-950/50 p-3 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Full name</Label>
            <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <Label>Date of Birth (DOB - Must be 18+ years)</Label>
            <Input 
              type="date" 
              value={form.dob} 
              onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))} 
            />
          </div>
          <div>
            <Label>Phone (optional)</Label>
            <div className="flex gap-2">
              <select
                value={form.countryCode}
                onChange={(e) => setForm((f) => ({ ...f, countryCode: e.target.value }))}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-brand shrink-0 max-w-[150px]"
              >
                {COUNTRY_DIAL_CODES.map((c) => (
                  <option key={`${c.code}-${c.name}`} value={c.code}>{dialCodeLabel(c)}</option>
                ))}
              </select>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="10-digit number"
                maxLength={10}
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                className="flex-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>PAN Card (optional)</Label>
              <Input
                placeholder="ABCDE1234F"
                maxLength={10}
                value={form.pan}
                onChange={(e) => setForm((f) => ({ ...f, pan: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <Label>Aadhaar No (optional)</Label>
              <Input
                placeholder="12-digit Aadhaar"
                maxLength={12}
                value={form.aadhar}
                onChange={(e) => setForm((f) => ({ ...f, aadhar: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label>Temporary password</Label>
            <Input type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>
          <div>
            <Label>Account type</Label>
            <SearchableSelect
              options={(Object.keys(ROLE_LABELS) as Role[])
                .filter((r) => r !== "SUPERADMIN" || userRole === "SUPERADMIN")
                .map((r) => ({
                  value: r,
                  label: ROLE_LABELS[r],
                }))}
              value={form.role}
              onChange={(val) => setForm((f) => ({ ...f, role: val as Role }))}
              placeholder="Select account role..."
              searchPlaceholder="Search role..."
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={busy} variant="gold">
              Create &amp; edit profile
            </Button>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
