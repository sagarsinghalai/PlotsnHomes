"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function InquiryForm({
  propertyId,
  defaultName = "",
  defaultEmail = "",
}: {
  propertyId: string;
  defaultName?: string;
  defaultEmail?: string;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const fd = new FormData(e.currentTarget);
    const payload = {
      propertyId,
      name: String(fd.get("name") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim(),
      phone: String(fd.get("phone") ?? "").trim(),
      message: String(fd.get("message") ?? "").trim(),
    };

    if (!payload.name || !payload.email || !payload.message) {
      setStatus("error");
      setMessage("Please fill in name, email, and message.");
      return;
    }

    let res: Response;
    try {
      res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      setStatus("error");
      setMessage(
        "Cannot reach server. Run npm run dev and open http://localhost:3001 (only one terminal)."
      );
      return;
    }

    const data = await res.json();
    if (res.ok) {
      setStatus("ok");
      setMessage(data.message ?? "Inquiry sent successfully.");
      (e.target as HTMLFormElement).reset();
    } else {
      setStatus("error");
      setMessage(data.error ?? "Could not send inquiry.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h3 className="text-lg font-semibold text-slate-900">Contact agent</h3>
      <div>
        <Label>Name</Label>
        <Input name="name" required defaultValue={defaultName} />
      </div>
      <div>
        <Label>Email</Label>
        <Input name="email" type="email" required defaultValue={defaultEmail} />
      </div>
      <div>
        <Label>Phone</Label>
        <Input name="phone" type="tel" />
      </div>
      <div>
        <Label>Message</Label>
        <Textarea name="message" required placeholder="I'm interested in scheduling a viewing..." />
      </div>
      <Button type="submit" variant="gold" className="w-full" loading={status === "loading"}>
        Send inquiry
      </Button>
      {message && (
        <p className={`text-sm ${status === "ok" ? "text-emerald-600" : "text-red-600"}`}>{message}</p>
      )}
    </form>
  );
}
