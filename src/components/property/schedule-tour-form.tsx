"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

export function ScheduleTourForm({
  propertyId,
  propertyTitle,
}: {
  propertyId: string;
  propertyTitle: string;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/showings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId,
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        tourDate: fd.get("tourDate"),
        tourTime: fd.get("tourTime"),
        tourType: fd.get("tourType"),
        message: `I would like to schedule a tour for [ ${propertyTitle} ]. ${fd.get("message") ?? ""}`,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <p className="rounded-xl bg-emerald-50 p-4 text-emerald-800">
        Tour request submitted! The agent will contact you to confirm.
      </p>
    );
  }

  const times = [
    "10:00 am", "10:30 am", "11:00 am", "11:30 am", "12:00 pm", "12:30 pm",
    "01:00 pm", "01:30 pm", "02:00 pm", "02:30 pm", "03:00 pm", "03:30 pm",
  ];

  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Name</Label><Input name="name" required /></div>
        <div><Label>Email</Label><Input name="email" type="email" required /></div>
      </div>
      <div><Label>Phone</Label><Input name="phone" type="tel" /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Date</Label><Input name="tourDate" type="date" required /></div>
        <div>
          <Label>Time</Label>
          <select name="tourTime" required className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
            {times.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="tourType" value="IN_PERSON" defaultChecked /> In Person
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="tourType" value="VIDEO" /> Video Chat
        </label>
      </div>
      <div><Label>Message</Label><Textarea name="message" rows={3} /></div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" variant="gold" loading={loading}>Request tour</Button>
    </form>
  );
}
