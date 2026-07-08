"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { MEDIA_LIMITS, mediaLimitLabel } from "@/lib/media-limits";
import { PROPERTY_CATEGORIES } from "@/lib/property-categories";

async function uploadFile(
  file: File,
  kind: "image" | "video" | "pdf",
  currentCount: number
): Promise<{ url: string; name?: string }> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("kind", kind);
  fd.append("currentCount", String(currentCount));
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data;
}

export function ListPropertyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listingType, setListingType] = useState<"SALE" | "RENT">("SALE");
  const [rentMonthly, setRentMonthly] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [pdfs, setPdfs] = useState<{ name: string; url: string }[]>([]);
  const [hasServantRoom, setHasServantRoom] = useState(false);
  const [hasPujaRoom, setHasPujaRoom] = useState(false);
  const [hasStudyRoom, setHasStudyRoom] = useState(false);
  const [balconies, setBalconies] = useState("0");
  const [liftType, setLiftType] = useState("");
  const [flatsPerFloor, setFlatsPerFloor] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("Available");
  async function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    try {
      for (const file of Array.from(files)) {
        if (images.length >= MEDIA_LIMITS.images) break;
        const data = await uploadFile(file, "image", images.length);
        setImages((prev) => [...prev, data.url]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    e.target.value = "";
  }

  async function handleVideos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    try {
      for (const file of Array.from(files)) {
        if (videos.length >= MEDIA_LIMITS.videos) break;
        const data = await uploadFile(file, "video", videos.length);
        setVideos((prev) => [...prev, data.url]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    e.target.value = "";
  }

  async function handlePdf(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    try {
      for (const file of Array.from(files)) {
        if (pdfs.length >= MEDIA_LIMITS.pdfs) break;
        const data = await uploadFile(file, "pdf", pdfs.length);
        setPdfs((prev) => [...prev, { name: file.name, url: data.url }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    e.target.value = "";
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    const res = await fetch("/api/properties/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: fd.get("title"),
        description: fd.get("description"),
        price: parseFloat(String(fd.get("price"))),
        rentMonthly:
          listingType === "RENT" && rentMonthly ? parseFloat(rentMonthly) : null,
        city: fd.get("city"),
        state: fd.get("state"),
        address: fd.get("address"),
        zip: fd.get("zip"),
        category: fd.get("category"),
        listingType,
        bedrooms: parseInt(String(fd.get("bedrooms")), 10) || 0,
        bathrooms: parseFloat(String(fd.get("bathrooms"))) || 0,
        sqft: fd.get("sqft") ? parseInt(String(fd.get("sqft")), 10) : null,
        videoUrl: fd.get("videoUrl") || null,
        virtualTourUrl: fd.get("virtualTourUrl") || null,
        images,
        videos,
        pdfs,
        hasServantRoom,
        hasPujaRoom,
        hasStudyRoom,
        balconies: parseInt(balconies, 10) || 0,
        liftType: liftType || null,
        flatsPerFloor: flatsPerFloor ? parseInt(flatsPerFloor, 10) : null,
        availabilityStatus,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Submit failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6 rounded-2xl border bg-white p-8">
      <h2 className="text-xl font-bold">Submit a property listing</h2>
      <p className="text-sm text-slate-500">Admin will review and publish your listing.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Label>Title</Label><Input name="title" required /></div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea name="description" required rows={4} /></div>
        <div><Label>Price (₹)</Label><Input name="price" type="number" required /></div>
        <div>
          <Label>Listing type</Label>
          <select
            value={listingType}
            onChange={(e) => {
              const v = e.target.value as "SALE" | "RENT";
              setListingType(v);
              if (v !== "RENT") setRentMonthly("");
            }}
            className="w-full rounded-xl border px-4 py-2.5 text-sm"
          >
            <option value="SALE">Sale</option>
            <option value="RENT">Rent</option>
          </select>
        </div>
        {listingType === "RENT" && (
          <div className="sm:col-span-2">
            <Label>Monthly rental value (₹)</Label>
            <Input
              type="number"
              min={1}
              required
              value={rentMonthly}
              onChange={(e) => setRentMonthly(e.target.value)}
            />
          </div>
        )}
        <div>
          <Label>Category</Label>
          <select name="category" className="w-full rounded-xl border px-4 py-2.5 text-sm">
            {PROPERTY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div><Label>City</Label><Input name="city" required /></div>
        <div><Label>State</Label><Input name="state" required maxLength={2} /></div>
        <div><Label>Address</Label><Input name="address" required /></div>
        <div><Label>ZIP</Label><Input name="zip" required /></div>
        <div><Label>Bedrooms</Label><Input name="bedrooms" type="number" min={0} /></div>
        <div><Label>Bathrooms</Label><Input name="bathrooms" type="number" step="0.5" min={0} /></div>
        <div><Label>Sq ft</Label><Input name="sqft" type="number" /></div>
        <div><Label>Video URL (YouTube embed)</Label><Input name="videoUrl" placeholder="https://..." /></div>
        <div><Label>Virtual tour URL</Label><Input name="virtualTourUrl" /></div>
        
        {/* NEW FEATURES */}
        <div>
          <Label>Balconies</Label>
          <Input type="number" value={balconies} onChange={(e) => setBalconies(e.target.value)} min={0} />
        </div>
        <div>
          <Label>Flats per floor</Label>
          <Input type="number" value={flatsPerFloor} onChange={(e) => setFlatsPerFloor(e.target.value)} min={1} />
        </div>
        <div>
          <Label>Lift Type</Label>
          <select value={liftType} onChange={(e) => setLiftType(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm">
            <option value="">None</option>
            <option value="Common Lift">Common Lift</option>
            <option value="Personal Lift">Personal Lift</option>
            <option value="No Lift">No Lift</option>
          </select>
        </div>
        <div>
          <Label>Availability</Label>
          <select value={availabilityStatus} onChange={(e) => setAvailabilityStatus(e.target.value)} className="w-full rounded-xl border px-4 py-2.5 text-sm">
            <option value="Available">Available</option>
            <option value="Sold">Sold</option>
            <option value="Rented">Rented</option>
          </select>
        </div>
        <div className="sm:col-span-2 flex flex-wrap gap-6 mt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasServantRoom} onChange={(e) => setHasServantRoom(e.target.checked)} className="h-4 w-4" />
            Servant room-box
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasPujaRoom} onChange={(e) => setHasPujaRoom(e.target.checked)} className="h-4 w-4" />
            Puja ghar
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={hasStudyRoom} onChange={(e) => setHasStudyRoom(e.target.checked)} className="h-4 w-4" />
            Study room
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-4">
        <p className="text-xs text-slate-500">
          {mediaLimitLabel("images")} · {mediaLimitLabel("videos")} · {mediaLimitLabel("pdfs")}
        </p>
        <div>
          <Label>Photos ({images.length}/{MEDIA_LIMITS.images})</Label>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={images.length >= MEDIA_LIMITS.images}
            onChange={handleImages}
            className="mt-1 text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((url, i) => (
              <span key={url} className="text-xs bg-slate-100 px-2 py-1 rounded">Image {i + 1}</span>
            ))}
          </div>
        </div>
        <div>
          <Label>Videos ({videos.length}/{MEDIA_LIMITS.videos})</Label>
          <input
            type="file"
            accept="video/*"
            multiple
            disabled={videos.length >= MEDIA_LIMITS.videos}
            onChange={handleVideos}
            className="mt-1 text-sm"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {videos.map((url, i) => (
              <span key={url} className="text-xs bg-slate-100 px-2 py-1 rounded">Video {i + 1}</span>
            ))}
          </div>
        </div>
        <div>
          <Label>PDF documents ({pdfs.length}/{MEDIA_LIMITS.pdfs})</Label>
          <input
            type="file"
            accept=".pdf,application/pdf"
            multiple
            disabled={pdfs.length >= MEDIA_LIMITS.pdfs}
            onChange={handlePdf}
            className="mt-1 text-sm"
          />
          {pdfs.map((p) => (
            <p key={p.url} className="text-xs text-slate-600 mt-1">{p.name}</p>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" variant="gold" loading={loading}>Submit for review</Button>
    </form>
  );
}
