"use client";

import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/ui/country-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { Input, Label } from "@/components/ui/input";
import { DEFAULT_COUNTRY_CODE } from "@/lib/locale-defaults";
import { roleLabel } from "@/lib/roles";
import { useToast } from "@/components/ui/toast";

type ProfileUser = {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  image: string | null;
  role: Role;
};

export function ProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone ?? "",
    address: user.address ?? "",
    city: user.city ?? "",
    state: user.state ?? "",
    zip: user.zip ?? "",
    country: user.country ?? DEFAULT_COUNTRY_CODE,
    image: user.image ?? "",
  });

  const [uploading, setUploading] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "image");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
      set("image", data.url);
      toast.success("Photo uploaded. Click Save profile to keep it.");
    } catch (err: any) {
      setError(err.message || "Photo upload failed");
      toast.error(err.message || "Photo upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMsg("");

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        zip: form.zip || null,
        country: form.country || null,
        image: form.image || null,
      }),
    });

    const data = await res.json();
    setBusy(false);

    if (!res.ok) {
      setError(data.error ?? "Could not save profile");
      toast.error(data.error ?? "Could not save profile.");
      return;
    }

    setMsg("Profile updated successfully.");
    toast.success("Profile updated successfully.");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="max-w-2xl space-y-8">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      {msg && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{msg}</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-lg font-semibold text-slate-900">Account Profile</h2>
          {user.userId && (
            <div className="flex items-center gap-1.5 bg-brand/10 border border-brand/30 px-3 py-1 rounded-xl">
              <span className="text-xs text-slate-500 font-bold uppercase">User ID:</span>
              <span className="font-mono text-xs font-black text-brand-hover">{user.userId}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-slate-500">
          Email and role are managed by your administrator. Account type:{" "}
          <span className="font-medium text-slate-800">{roleLabel(user.role)}</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={user.email} disabled className="bg-slate-50" />
          </div>
          <div className="sm:col-span-2">
            <Label>Phone (WhatsApp / SMS)</Label>
            <PhoneInput
              value={form.phone}
              onChange={(phone) => set("phone", phone)}
              defaultCountry={form.country}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Profile photo</Label>
            <div className="mt-1 flex items-center gap-4">
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="Profile" className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100" />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-xl font-semibold text-slate-400">
                  {(form.name || user.email).slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {uploading ? "Uploading…" : "Upload photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} disabled={uploading} />
                </label>
                {form.image && (
                  <button type="button" onClick={() => set("image", "")} className="rounded-lg px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Address</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Street address</Label>
            <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
          <div>
            <Label>State / region</Label>
            <Input value={form.state} onChange={(e) => set("state", e.target.value)} />
          </div>
          <div>
            <Label>ZIP / postal</Label>
            <Input value={form.zip} onChange={(e) => set("zip", e.target.value)} />
          </div>
          <div>
            <Label>Country</Label>
            <CountrySelect value={form.country} onChange={(code) => set("country", code)} />
          </div>
        </div>
      </section>

      <Button type="submit" variant="gold" loading={busy}>
        Save profile
      </Button>
    </form>
  );
}
