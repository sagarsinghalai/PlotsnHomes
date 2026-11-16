"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Upload, RefreshCw, Search, Copy, Trash2, X, FileText, Film, Music, File as FileIcon,
  Image as ImageIcon, Check, Loader2, ExternalLink,
} from "lucide-react";

type MediaAsset = {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  altText: string | null;
  fileName: string | null;
  mimeType: string | null;
  kind: string | null;
  size: number | null;
  createdAt: string;
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "image", label: "Images" },
  { key: "video", label: "Videos" },
  { key: "pdf", label: "Documents" },
  { key: "audio", label: "Audio" },
];

function formatBytes(n?: number | null) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function absoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window !== "undefined") return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
  return url;
}

function KindIcon({ kind, className }: { kind: string | null; className?: string }) {
  if (kind === "pdf") return <FileText className={className} />;
  if (kind === "video") return <Film className={className} />;
  if (kind === "audio") return <Music className={className} />;
  if (kind === "image") return <ImageIcon className={className} />;
  return <FileIcon className={className} />;
}

export function MediaLibraryClient() {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2500); };

  const load = useCallback(async (opts?: { sync?: boolean }) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("kind", filter);
    if (q.trim()) params.set("q", q.trim());
    if (opts?.sync) params.set("sync", "1");
    const d = await fetch(`/api/admin/media?${params}`).then((r) => r.json()).catch(() => ({ media: [] }));
    setMedia(d.media || []);
    setLoading(false);
  }, [filter, q]);

  useEffect(() => { load(); }, [load]);

  async function handleUpload(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) ok++;
      } catch { /* skip */ }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    showToast(`${ok} file${ok === 1 ? "" : "s"} uploaded.`);
    load();
  }

  async function handleSync() {
    setSyncing(true);
    await load({ sync: true });
    setSyncing(false);
    showToast("Synced the uploads folder.");
  }

  async function saveSelected(updates: Partial<MediaAsset>) {
    if (!selected) return;
    const next = { ...selected, ...updates };
    setSelected(next);
    setMedia((prev) => prev.map((m) => (m.id === next.id ? next : m)));
  }

  async function persistSelected() {
    if (!selected) return;
    const res = await fetch("/api/admin/media", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, title: selected.title, description: selected.description, altText: selected.altText }),
    });
    if (res.ok) showToast("Saved.");
    else showToast("Could not save.");
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this media file? This removes it from the library (and the stored file).")) return;
    const res = await fetch(`/api/admin/media?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMedia((prev) => prev.filter((m) => m.id !== id));
      if (selected?.id === id) setSelected(null);
      showToast("Deleted.");
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(() => showToast(`${label} copied.`));
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search media…"
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Sync folder
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-hover disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,video/*,audio/*,application/pdf" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              filter === f.key ? "bg-brand text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-brand/40"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-slate-500">{media.length} item{media.length === 1 ? "" : "s"}</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : media.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <p className="text-sm font-medium text-slate-600">No media yet. Click <b>Upload</b>, or <b>Sync folder</b> to import existing files.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {media.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-slate-100">
                {m.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.altText || m.title || ""} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <KindIcon kind={m.kind} className="h-10 w-10 text-slate-400" />
                )}
                <span className="absolute left-2 top-2 rounded-md bg-slate-900/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white backdrop-blur">
                  {m.kind || "file"}
                </span>
              </div>
              <div className="p-2.5">
                <p className="truncate text-xs font-semibold text-slate-800">{m.title || m.fileName || "Untitled"}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{formatBytes(m.size)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail / edit drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-950/50 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md overflow-y-auto bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-900">Media details</h3>
              <button onClick={() => setSelected(null)} className="p-1 text-slate-400 hover:text-slate-700"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-4 p-4">
              {/* Preview */}
              <div className="flex items-center justify-center overflow-hidden rounded-xl bg-slate-100" style={{ minHeight: 160 }}>
                {selected.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.url} alt={selected.altText || ""} className="max-h-72 w-full object-contain" />
                ) : selected.kind === "video" ? (
                  <video src={selected.url} controls className="max-h-72 w-full" />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
                    <KindIcon kind={selected.kind} className="h-12 w-12" />
                    <a href={absoluteUrl(selected.url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-hover hover:underline">
                      <ExternalLink className="h-3.5 w-3.5" /> Open file
                    </a>
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <div><span className="font-bold text-slate-700">Type:</span> {selected.mimeType || selected.kind || "—"}</div>
                <div><span className="font-bold text-slate-700">Size:</span> {formatBytes(selected.size)}</div>
                <div className="col-span-2"><span className="font-bold text-slate-700">Uploaded:</span> {selected.createdAt?.slice(0, 10)}</div>
                <div className="col-span-2 truncate"><span className="font-bold text-slate-700">File:</span> {selected.fileName || "—"}</div>
              </div>

              {/* Editable fields */}
              <div className="space-y-3">
                <Field label="Title">
                  <input value={selected.title ?? ""} onChange={(e) => saveSelected({ title: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Description">
                  <textarea value={selected.description ?? ""} onChange={(e) => saveSelected({ description: e.target.value })} rows={3} className={inputCls + " resize-y"} />
                </Field>
                <Field label="Alt text (accessibility)">
                  <input value={selected.altText ?? ""} onChange={(e) => saveSelected({ altText: e.target.value })} className={inputCls} />
                </Field>
              </div>

              {/* URLs */}
              <div className="space-y-2">
                <UrlRow label="File URL" value={selected.url} onCopy={() => copy(selected.url, "URL")} />
                <UrlRow label="Sharable link" value={absoluteUrl(selected.url)} onCopy={() => copy(absoluteUrl(selected.url), "Sharable link")} />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
                <button onClick={() => handleDelete(selected.id)} className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
                <button onClick={persistSelected} className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-5 py-2 text-xs font-extrabold text-white hover:bg-brand-hover">
                  <Check className="h-4 w-4" /> Save changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-xl">{toast}</div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function UrlRow({ label, value, onCopy }: { label: string; value: string; onCopy: () => void }) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <input readOnly value={value} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600" />
        <button onClick={onCopy} className="shrink-0 rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-brand-hover" title="Copy">
          <Copy className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
