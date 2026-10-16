"use client";

import {
  AlertTriangle,
  AtSign,
  Check,
  CheckCircle,
  CloudUpload,
  Copy,
  ExternalLink,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Link,
  List as ListIcon,
  Mail,
  MessageSquare,
  Music,
  Play,
  Plus,
  QrCode,
  Send,
  Shield,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type LeadOption = {
  id: string;
  name: string;
  phone: string | null;
  email: string;
};

type ButtonItem = { label: string; url?: string };

type MessageTemplate = {
  id: string;
  name: string;
  channel: "whatsapp" | "email" | "sms";
  subject?: string;
  body: string;
  templateType?: string;
  mediaUrl?: string;
  mediaName?: string;
  buttons?: ButtonItem[];
  listItems?: ButtonItem[];
};

type CrmSettings = {
  routingMode: string;
  autoAssign: boolean;
  defaultOwnerId: string;
  leadSources: string[];
  messageTemplates: MessageTemplate[];
};

/* ─────────────────────────────────────────────────────────────────────────────
   MediaUploadField — professional dual-mode uploader (drag-drop file + URL)
   adapts per template type: Image / Document / Audio / Video
───────────────────────────────────────────────────────────────────────────── */
type MediaUploadFieldProps = {
  templateType: string;
  mediaUrl: string;
  mediaName?: string;
  onChangeUrl: (url: string, name?: string) => void;
};

const isPreviewUrl = (url?: string) => {
  if (!url) return false;
  return (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.includes("localhost") ||
    url.includes("127.0.0.1")
  );
};

function getMediaMeta(templateType: string): {
  accept: string;
  label: string;
  hint: string;
  extensions: string;
  Icon: React.FC<{ className?: string }>;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  switch (templateType) {
    case "Text + Image":
      return {
        accept: "image/jpeg,image/png,image/webp,image/gif",
        label: "Image",
        hint: "Attach a banner, property photo, or brochure cover.",
        extensions: "JPG, PNG, WEBP, GIF · Max 5 MB",
        Icon: ImageIcon,
        color: "text-violet-600",
        bgColor: "bg-violet-50",
        borderColor: "border-violet-200",
      };
    case "Text + Document":
      return {
        accept: "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        label: "Document",
        hint: "Attach a brochure, floor plan PDF, or legal document.",
        extensions: "PDF, DOC, DOCX · Max 16 MB",
        Icon: FileIcon,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    case "Text + Audio":
      return {
        accept: "audio/mpeg,audio/ogg,audio/wav,audio/aac,audio/mp4",
        label: "Audio",
        hint: "Attach a voice note, property tour audio, or announcement.",
        extensions: "MP3, OGG, WAV, AAC · Max 16 MB",
        Icon: Music,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
      };
    case "Text + Video":
      return {
        accept: "video/mp4,video/3gpp,video/quicktime",
        label: "Video",
        hint: "Attach a property walkthrough or promotional video clip.",
        extensions: "MP4, 3GP, MOV · Max 16 MB",
        Icon: Video,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-200",
      };
    default:
      return {
        accept: "*/*",
        label: "Media",
        hint: "Attach any media file.",
        extensions: "Any file type",
        Icon: CloudUpload,
        color: "text-slate-600",
        bgColor: "bg-slate-50",
        borderColor: "border-slate-200",
      };
  }
}

function MediaUploadField({ templateType, mediaUrl, mediaName, onChangeUrl }: MediaUploadFieldProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  // localDataUrl = base64 used for thumbnail preview only (never sent to WhatsApp)
  const [localDataUrl, setLocalDataUrl] = useState<string | null>(null);
  // hostedUrl = the real CDN/S3 URL the user pastes — this is what gets sent
  const [hostedUrl, setHostedUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync mediaUrl with state
  useEffect(() => {
    if (mediaUrl) {
      setHostedUrl(mediaUrl);
      if (mediaUrl.startsWith("http") || mediaUrl.startsWith("data:") || mediaUrl.startsWith("blob:")) {
        if (templateType === "Text + Image") {
          setPreviewSrc(mediaUrl);
        } else {
          setPreviewSrc(null);
        }
      }
    } else {
      setHostedUrl("");
      setPreviewSrc(null);
      setUploadedFile(null);
      setUploadProgress(null);
    }
  }, [mediaUrl, templateType]);

  const isPreviewOnly = useMemo(() => {
    if (!mediaUrl) return false;
    return isPreviewUrl(mediaUrl);
  }, [mediaUrl]);

  const meta = getMediaMeta(templateType);

  const startUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    setUploadProgress(0);
    setErrorMsg(null);
    setLocalDataUrl(null);

    // Initial local preview (for image files)
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewSrc(null);
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      let kind = "image";
      if (templateType.includes("Document")) kind = "pdf";
      else if (templateType.includes("Video")) kind = "video";
      else if (templateType.includes("Audio")) kind = "audio";
      formData.append("kind", kind);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(Math.min(percent, 99)); // Keep at 99% until server responds
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.ok && res.url) {
              setUploadProgress(100);
              const fullUrl = res.url.startsWith("http") ? res.url : `${window.location.origin}${res.url}`;
              setLocalDataUrl(fullUrl); // store full public URL as the preview link
              setHostedUrl(fullUrl);
              onChangeUrl(fullUrl, file.name);
            } else {
              setErrorMsg(res.error || "Upload failed");
              setUploadProgress(null);
            }
          } catch {
            setErrorMsg("Invalid response format");
            setUploadProgress(null);
          }
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            setErrorMsg(res.error || `Upload failed with status code ${xhr.status}`);
          } catch {
            setErrorMsg(`Server returned status code ${xhr.status}`);
          }
          setUploadProgress(null);
        }
      };

      xhr.onerror = () => {
        setErrorMsg("Network error occurred during upload");
        setUploadProgress(null);
      };

      xhr.send(formData);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to start file upload");
      setUploadProgress(null);
    }
  }, [templateType, onChangeUrl]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) startUpload(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) startUpload(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function clearFile() {
    setUploadedFile(null);
    setUploadProgress(null);
    setPreviewSrc(null);
    setLocalDataUrl(null);
    setHostedUrl("");
    onChangeUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const { Icon, color, bgColor, borderColor, label, hint, extensions, accept } = meta;

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <Label>{label} Attachment</Label>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`px-3 py-1 flex items-center gap-1 transition ${
              mode === "upload"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <CloudUpload className="h-3 w-3" /> Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-3 py-1 flex items-center gap-1 transition ${
              mode === "url"
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Link className="h-3 w-3" /> Paste URL
          </button>
        </div>
      </div>

      {/* ── Upload mode ── */}
      {mode === "upload" && (
        <>
          {!uploadedFile && !mediaUrl ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`relative mt-1 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? `${borderColor} ${bgColor} scale-[1.01]`
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl ${bgColor} flex items-center justify-center`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {isDragOver ? "Release to upload" : `Drag & drop your ${label.toLowerCase()} here`}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">or click to browse files</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${bgColor} ${color} border ${borderColor}`}>
                {extensions}
              </span>
              <p className="text-[10px] text-slate-400 text-center mt-0.5">{hint}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className={`mt-1 rounded-2xl border ${borderColor} ${bgColor} p-3 space-y-3`}>
              {/* ── File info row ── */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0 bg-white flex items-center justify-center">
                  {previewSrc ? (
                    <img src={previewSrc} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <Icon className={`h-5 w-5 ${color}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {uploadedFile?.name || mediaName || (() => {
                      try {
                        const decoded = decodeURIComponent(mediaUrl);
                        return decoded.split("/").pop() || "Attached Media";
                      } catch {
                        return mediaUrl;
                      }
                    })()}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {uploadedFile ? `${(uploadedFile.size / 1024 / 1024).toFixed(2)} MB` : "Hosted on Cloudinary"}
                  </p>
                </div>
                <button type="button" onClick={clearFile} className="text-slate-400 hover:text-rose-600 transition p-1" title="Remove">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Progress bar ── */}
              {uploadProgress !== null && uploadProgress < 100 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Processing…</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${color.replace("text-","bg-")}`} style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* ── Local-only warning OR Cloudinary ready banner ── */}
              {isPreviewOnly ? (
                <>
                  {/* Warning banner for local files */}
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-amber-800">Preview only — not sendable yet</p>
                      <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                        WhatsApp requires a public HTTPS URL to send media.
                        Upload this file to <strong>Cloudinary, AWS S3, Google Drive</strong> or any CDN, then paste the public link below.
                      </p>
                    </div>
                  </div>

                  {/* Hosted URL input for manually linking */}
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Paste Hosted URL to Send</p>
                    <div className="relative flex items-center gap-2">
                      <Link className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="url"
                        className={`w-full rounded-xl border pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:bg-white transition ${
                          hostedUrl && !hostedUrl.startsWith("https://")
                            ? "border-red-300 bg-red-50 focus:ring-red-200"
                            : hostedUrl
                            ? "border-emerald-300 bg-emerald-50 focus:ring-emerald-200"
                            : "border-slate-200 bg-white focus:ring-slate-300"
                        }`}
                        placeholder="https://your-cdn.com/media/image.jpg"
                        value={hostedUrl}
                        onChange={(e) => {
                          setHostedUrl(e.target.value);
                          if (e.target.value.startsWith("https://")) {
                            onChangeUrl(e.target.value);
                          }
                        }}
                      />
                    </div>
                    {hostedUrl && !hostedUrl.startsWith("https://") && (
                      <p className="text-[10px] text-red-500 font-medium">⚠ URL must start with https://</p>
                    )}
                  </div>
                </>
              ) : (
                mediaUrl && (
                  <>
                    {/* Success banner for Cloudinary/Hosted files */}
                    <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-emerald-800">✓ Uploaded & ready to send via WhatsApp</p>
                        <p className="text-[10px] text-emerald-700 mt-0.5 leading-relaxed">
                          This file is hosted publicly and is ready to send.
                        </p>
                      </div>
                    </div>

                    {/* Image preview card — no raw URL */}
                    {templateType === "Text + Image" && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                        <img
                          src={mediaUrl}
                          alt="Uploaded image"
                          className="w-full object-contain max-h-44 bg-slate-100"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                        <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                            <span className="text-[10px] font-semibold text-slate-700">
                              {uploadedFile?.name ?? (() => { try { return decodeURIComponent(new URL(mediaUrl).pathname.split("/").pop() ?? "image"); } catch { return "image"; } })()}
                            </span>
                          </div>
                          <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] text-violet-600 font-semibold hover:underline flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> Open
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Document preview card — no raw URL */}
                    {templateType === "Text + Document" && (() => {
                      const docName = uploadedFile?.name ?? (() => { try { return decodeURIComponent(new URL(mediaUrl).pathname.split("/").pop()?.replace(/-/g, " ") ?? "Document"); } catch { return "Document"; } })();
                      const ext = docName.split(".").pop()?.toUpperCase() ?? "PDF";
                      return (
                        <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-3">
                          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shrink-0 shadow-sm">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-slate-800 truncate">{docName}</p>
                            <p className="text-[9px] text-slate-500 mt-0.5">{ext} Document · Uploaded</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Audio player — no raw URL */}
                    {templateType === "Text + Audio" && (() => {
                      const audioName = uploadedFile?.name ?? (() => { try { return decodeURIComponent(new URL(mediaUrl).pathname.split("/").pop() ?? "audio.mp3"); } catch { return "audio.mp3"; } })();
                      return (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="text-[11px] font-semibold text-slate-800 truncate flex-1">{audioName}</span>
                          </div>
                          <audio controls src={mediaUrl} className="w-full h-8 rounded-lg" preload="metadata" />
                        </div>
                      );
                    })()}

                    {/* Video player — no raw URL */}
                    {templateType === "Text + Video" && (() => {
                      const videoName = uploadedFile?.name ?? (() => { try { return decodeURIComponent(new URL(mediaUrl).pathname.split("/").pop() ?? "video.mp4"); } catch { return "video.mp4"; } })();
                      return (
                        <div className="rounded-xl overflow-hidden border border-rose-200 bg-rose-50 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-rose-600 shrink-0" />
                            <span className="text-[11px] font-semibold text-slate-800 truncate flex-1">{videoName}</span>
                          </div>
                          <video controls src={mediaUrl} className="w-full rounded-xl max-h-36 bg-black" preload="metadata" />
                        </div>
                      );
                    })()}
                  </>
                )
              )}
            </div>
          )}
        </>
      )}

      {/* ── URL mode ── */}
      {mode === "url" && (
        <div className="mt-1 space-y-1.5">
          <div className="relative flex items-center">
            <Link className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="url"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition"
              placeholder={`https://example.com/assets/your-${label.toLowerCase()}.${accept.split(",")[0].split("/")[1]}`}
              value={mediaUrl}
              onChange={(e) => onChangeUrl(e.target.value)}
            />
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1">
            <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${bgColor} ${color} text-[9px] font-bold shrink-0`}>i</span>
            {hint} Must be a publicly accessible HTTPS URL. Accepted: {extensions}.
          </p>
          {/* URL mode: show rich preview, not raw URL text */}
          {mediaUrl && templateType === "Text + Image" && (
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <img src={mediaUrl} alt="Preview" className="w-full object-contain max-h-40 bg-slate-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display="none"; }} />
              <div className="flex justify-end px-3 py-1.5 border-t border-slate-100">
                <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] text-violet-600 font-semibold hover:underline flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" /> Open original
                </a>
              </div>
            </div>
          )}
          {mediaUrl && templateType === "Text + Document" && (() => {
            const n = (() => { try { return decodeURIComponent(new URL(mediaUrl).pathname.split("/").pop()?.replace(/-/g," ") ?? "Document"); } catch { return "Document"; } })();
            return (
              <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3 py-3">
                <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-800 truncate">{n}</p>
                  <p className="text-[9px] text-slate-500">Document · Uploaded</p>
                </div>
              </div>
            );
          })()}
          {mediaUrl && templateType === "Text + Audio" && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-700">Audio file</span>
              </div>
              <audio controls src={mediaUrl} className="w-full h-8 rounded-lg" preload="metadata" />
            </div>
          )}
          {mediaUrl && templateType === "Text + Video" && (
            <video controls src={mediaUrl} className="w-full rounded-xl max-h-36 bg-black mt-1" preload="metadata" />
          )}
        </div>
      )}
    </div>
  );
}

export function WhatsAppHub({
  leads,
  initialSettings,
  properties = [],
}: {
  leads: LeadOption[];
  initialSettings: CrmSettings;
  properties?: {
    id: string;
    title: string;
    slug: string;
    images: string;
    description: string;
    price: number;
  }[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [activeTab, setActiveTab] = useState<"templates" | "campaign" | "qr">("templates");

  // CRM Settings state (holds all templates)
  const [settings, setSettings] = useState<CrmSettings>(initialSettings);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialSettings.messageTemplates.filter((t) => t.channel === "whatsapp")[0]?.id ?? ""
  );

  // Active template builder state
  const selectedTemplate = useMemo(() => {
    return settings.messageTemplates.find((t) => t.id === selectedTemplateId);
  }, [settings.messageTemplates, selectedTemplateId]);

  // Variables list
  const variables = [
    { token: "{{name}}", label: "Full Name", example: "Agastya Jain" },
    { token: "{{phone}}", label: "Phone Number", example: "+91 98765 43210" },
    { token: "{{email}}", label: "Email Address", example: "agastya@example.com" },
    { token: "{{property}}", label: "Property Title", example: "Gold Crest Apartments" },
    { token: "{{budgetMin}}", label: "Minimum Budget", example: "$150,000" },
    { token: "{{budgetMax}}", label: "Maximum Budget", example: "$450,000" },
    { token: "{{owner}}", label: "Agent Name", example: "Sagar Singhal" },
  ];

  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  function copyToClipboard(token: string) {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  // Auto-seed buttons/listItems when loading a template that is missing them
  useEffect(() => {
    if (!selectedTemplate) return;
    const patch: Partial<MessageTemplate> = {};
    if (
      selectedTemplate.templateType === "Text + Buttons" &&
      !(selectedTemplate.buttons?.filter(Boolean).length)
    ) {
      patch.buttons = [{ label: "Contact Support", url: `https://wa.me/` }, { label: "Book Site Visit", url: `${typeof window !== "undefined" ? window.location.origin : ""}/properties` }];
    }
    if (
      selectedTemplate.templateType === "Text + Lists" &&
      !(selectedTemplate.listItems?.filter(Boolean).length)
    ) {
      patch.listItems = [{ label: "View Brochure", url: "" }, { label: "Check Prices", url: "" }, { label: "Schedule Call", url: "" }];
    }
    if (Object.keys(patch).length > 0) {
      updateActiveTemplate(patch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplateId]);

  // Handle template updates
  function updateActiveTemplate(patch: Partial<MessageTemplate>) {
    if (!selectedTemplateId) return;
    setSettings((s) => ({
      ...s,
      messageTemplates: s.messageTemplates.map((t) =>
        t.id === selectedTemplateId ? { ...t, ...patch } : t
      ),
    }));
  }

  // Create new template
  function handleCreateTemplate() {
    const newId = `tpl_${Date.now()}`;
    const newTpl: MessageTemplate = {
      id: newId,
      name: "New WhatsApp Template",
      channel: "whatsapp",
      body: "Hi {{name}}, thanks for connecting. How can we help you explore {{property}}?",
      templateType: "Text Template",
      mediaUrl: "",
      buttons: [{ label: "Contact Support", url: "https://wa.me/" }, { label: "Book Site Visit", url: `${typeof window !== "undefined" ? window.location.origin : ""}/properties` }],
      listItems: [{ label: "View Brochure", url: `${typeof window !== "undefined" ? window.location.origin : ""}/properties` }, { label: "Check Prices", url: `${typeof window !== "undefined" ? window.location.origin : ""}/properties` }, { label: "Schedule Call", url: "https://wa.me/" }],
    };

    setSettings((s) => ({
      ...s,
      messageTemplates: [...s.messageTemplates, newTpl],
    }));
    setSelectedTemplateId(newId);
  }

  // Delete template
  async function handleDeleteTemplate(id: string) {
    const nextTemplates = settings.messageTemplates.filter((t) => t.id !== id);
    const updatedSettings = { ...settings, messageTemplates: nextTemplates };
    setSettings(updatedSettings);
    
    // Auto select another template
    const remainingWa = nextTemplates.filter((t) => t.channel === "whatsapp");
    setSelectedTemplateId(remainingWa[0]?.id ?? "");

    // Save to server
    await fetch("/api/admin/crm/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSettings),
    });
    router.refresh();
  }

  // Save templates
  async function saveAllSettings() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/crm/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setBusy(false);
    if (res.ok) {
      setMsg("✅ Templates saved successfully!");
    } else {
      setMsg("❌ Failed to save templates. Please try again.");
    }
    setTimeout(() => setMsg(""), 4000);
  }

  // Template Type dropdown helpers
  const templateTypes = [
    "Text Template",
    "Text + Image",
    "Text + Document",
    "Text + Audio",
    "Text + Video",
    "Text + Buttons",
    "Text + Lists",
  ];

  // Visual Preview variables rendering helper
  const parsedPreviewBody = useMemo(() => {
    if (!selectedTemplate) return "";
    let body = selectedTemplate.body;
    body = body
      .replace(/\{\{name\}\}/g, "Agastya Jain")
      .replace(/\{\{phone\}\}/g, "+91 98765 43210")
      .replace(/\{\{email\}\}/g, "agastya@example.com")
      .replace(/\{\{property\}\}/g, "Vanderbilt Premium Heights")
      .replace(/\{\{budgetMin\}\}/g, "$120,000")
      .replace(/\{\{budgetMax\}\}/g, "$380,000")
      .replace(/\{\{owner\}\}/g, "Sagar Singhal");
    return body;
  }, [selectedTemplate]);

  // Split body text into segments: plain text parts and URL parts
  const previewSegments = useMemo(() => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const segments: { type: "text" | "url"; value: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(parsedPreviewBody)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: "text", value: parsedPreviewBody.slice(lastIndex, match.index) });
      }
      segments.push({ type: "url", value: match[0] });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < parsedPreviewBody.length) {
      segments.push({ type: "text", value: parsedPreviewBody.slice(lastIndex) });
    }
    return segments;
  }, [parsedPreviewBody]);

  // Extract the first URL from body for link preview card
  const firstPreviewUrl = useMemo(() => {
    const found = previewSegments.find((s) => s.type === "url");
    return found?.value ?? null;
  }, [previewSegments]);

  // Body text without URLs (for cleaner text rendering alongside the card)
  const bodyTextOnly = useMemo(() => {
    return previewSegments
      .filter((s) => s.type === "text")
      .map((s) => s.value)
      .join("")
      .trim();
  }, [previewSegments]);

  // Find matched property for link preview
  const matchedProperty = useMemo(() => {
    if (!firstPreviewUrl || !properties) return null;
    let slug = "";
    try {
      const parsed = new URL(firstPreviewUrl);
      const pathParts = parsed.pathname.split("/");
      const idx = pathParts.indexOf("properties");
      if (idx !== -1 && pathParts[idx + 1]) {
        slug = pathParts[idx + 1];
      }
    } catch {
      const match = firstPreviewUrl.match(/\/properties\/([^/]+)/);
      if (match) slug = match[1];
    }
    if (!slug) return null;
    return properties.find((p) => p.slug === slug);
  }, [firstPreviewUrl, properties]);

  const matchedPropertyImg = useMemo(() => {
    if (!matchedProperty) return null;
    try {
      const parsed = JSON.parse(matchedProperty.images);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null;
    } catch {
      return null;
    }
  }, [matchedProperty]);

  // Bulk Campaign State
  const [campaignRecipientsType, setCampaignRecipientsType] = useState<"leads" | "manual" | "file">("leads");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("all");

  // Tag-input: Phone chips (for WhatsApp / SMS channels)
  const [phoneChips, setPhoneChips] = useState<string[]>([]);
  const [phoneInputVal, setPhoneInputVal] = useState("");
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Tag-input: Email chips (for Email-only channel)
  const [emailChips, setEmailChips] = useState<string[]>([]);
  const [emailInputVal, setEmailInputVal] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFileName, setUploadedFileName] = useState("");
  const [parsedRecipients, setParsedRecipients] = useState<{ name: string; phone: string; email: string }[]>([]);

  const [campaignChannels, setCampaignChannels] = useState<string[]>(["whatsapp"]);
  const [campaignSubject, setCampaignSubject] = useState("Update from BrickVest");
  const [campaignError, setCampaignError] = useState("");

  // QR Simulator state
  const [qrState, setQrState] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [deviceDetails, setDeviceDetails] = useState({ name: "", phone: "" });

  // Campaign progress logger state
  const [campaignLogs, setCampaignLogs] = useState<{ number: string; status: string; log: string; webUrl?: string }[]>([]);
  const [campaignRunning, setCampaignRunning] = useState(false);
  const [campaignCompleted, setCampaignCompleted] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);


  // ─── Helpers: channel context ─────────────────────────────────────────────
  const needsPhone = campaignChannels.some((ch) => ch === "whatsapp" || ch === "sms");
  const needsEmail = campaignChannels.includes("email");
  const isEmailOnly = needsEmail && !needsPhone;

  // ─── Strict phone validation ──────────────────────────────────────────────
  // Must start with + (country code required), followed by 10–15 digits total
  function isValidPhone(num: string): boolean {
    const trimmed = num.trim();
    return /^\+[1-9]\d{9,14}$/.test(trimmed.replace(/[\s\-().]/g, ""));
  }

  function isValidEmail(val: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  // Phone tag-input handlers
  function commitPhoneChip(raw: string) {
    const cleaned = raw.trim();
    if (!cleaned) return;
    if (!phoneChips.includes(cleaned)) setPhoneChips((prev) => [...prev, cleaned]);
    setPhoneInputVal("");
  }
  function handlePhoneInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      commitPhoneChip(phoneInputVal);
    } else if (e.key === "Backspace" && phoneInputVal === "" && phoneChips.length > 0) {
      setPhoneChips((prev) => prev.slice(0, -1));
    }
  }
  function removePhoneChip(idx: number) {
    setPhoneChips((prev) => prev.filter((_, i) => i !== idx));
    setCampaignError("");
  }

  // Email tag-input handlers
  function commitEmailChip(raw: string) {
    const cleaned = raw.trim();
    if (!cleaned) return;
    if (!emailChips.includes(cleaned)) setEmailChips((prev) => [...prev, cleaned]);
    setEmailInputVal("");
  }
  function handleEmailInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      commitEmailChip(emailInputVal);
    } else if (e.key === "Backspace" && emailInputVal === "" && emailChips.length > 0) {
      setEmailChips((prev) => prev.slice(0, -1));
    }
  }
  function removeEmailChip(idx: number) {
    setEmailChips((prev) => prev.filter((_, i) => i !== idx));
    setCampaignError("");
  }

  // Chips with validity
  const phoneChipsWithValidity = useMemo(() =>
    phoneChips.map((raw) => ({ raw, valid: isValidPhone(raw) })),
  [phoneChips]);
  const emailChipsWithValidity = useMemo(() =>
    emailChips.map((raw) => ({ raw, valid: isValidEmail(raw) })),
  [emailChips]);

  const hasInvalidChips = phoneChipsWithValidity.some((c) => !c.valid) || emailChipsWithValidity.some((c) => !c.valid);
  const hasIncompleteInput =
    (needsPhone && !isEmailOnly && phoneInputVal.trim().length > 0) ||
    (needsEmail && emailInputVal.trim().length > 0);

  // CSV parsing
  function handleCsvFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseRecipientsCsv(text);
      setParsedRecipients(parsed);
    };
    reader.readAsText(file);
  }

  function parseRecipientsCsv(text: string) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    const headers = lines[0].split(/[,\t;]/).map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
    const phoneIdx = headers.findIndex((h) => h.includes("phone") || h.includes("number") || h.includes("mobile") || h.includes("tel"));
    const nameIdx = headers.findIndex((h) => h.includes("name") || h.includes("first") || h.includes("contact"));
    const emailIdx = headers.findIndex((h) => h.includes("email") || h.includes("mail"));

    const results: { name: string; phone: string; email: string }[] = [];
    if (phoneIdx === -1) {
      lines.forEach((line) => {
        const clean = line.replace(/[^\d+]/g, "");
        if (clean.length >= 8) {
          results.push({ name: "Contact", phone: clean, email: "" });
        }
      });
      return results;
    }

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(/[,\t;]/).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const phone = phoneIdx !== -1 ? cols[phoneIdx]?.replace(/[^\d+]/g, "") : "";
      const name = nameIdx !== -1 ? cols[nameIdx] || "Contact" : "Contact";
      const email = emailIdx !== -1 ? cols[emailIdx] || "" : "";
      if (phone) {
        results.push({ name, phone, email });
      }
    }
    return results;
  }

  // Get active recipients
  const activeRecipients = useMemo(() => {
    if (campaignRecipientsType === "leads") {
      if (selectedLeadId === "all") {
        return leads
          .filter((l) => {
            if (needsPhone && needsEmail) return l.phone || l.email;
            if (needsPhone) return l.phone;
            if (needsEmail) return l.email;
            return true;
          })
          .map((l) => ({ name: l.name, phone: l.phone || "", email: l.email || "" }));
      } else {
        const single = leads.find((l) => l.id === selectedLeadId);
        return single ? [{ name: single.name, phone: single.phone || "", email: single.email || "" }] : [];
      }
    } else if (campaignRecipientsType === "manual") {
      const validPhones = phoneChipsWithValidity.filter((c) => c.valid).map((c) => c.raw);
      const validEmails = emailChipsWithValidity.filter((c) => c.valid).map((c) => c.raw);

      if (needsPhone && needsEmail) {
        const maxLength = Math.max(validPhones.length, validEmails.length);
        const list = [];
        for (let i = 0; i < maxLength; i++) {
          list.push({
            name: "Manual Contact",
            phone: validPhones[i] || "",
            email: validEmails[i] || "",
          });
        }
        return list;
      } else if (needsPhone) {
        return validPhones.map((p) => ({
          name: "Manual Contact",
          phone: p,
          email: "",
        }));
      } else if (needsEmail) {
        return validEmails.map((e) => ({
          name: "Manual Contact",
          phone: "",
          email: e,
        }));
      } else {
        return [];
      }
    } else {
      return parsedRecipients;
    }
  }, [campaignRecipientsType, selectedLeadId, phoneChipsWithValidity, emailChipsWithValidity, parsedRecipients, leads, needsPhone, needsEmail]);

  // Whether there are invalid numbers/emails in manual mode
  const hasInvalidManualNumbers = campaignRecipientsType === "manual" && hasInvalidChips;

  // Helper to mask number for secure display in logs (e.g. +919876XXXX10)
  function maskPhone(phone: string): string {
    if (!phone || phone.length < 8) return phone;
    const visible = 4;
    return phone.slice(0, visible) + "X".repeat(Math.max(0, phone.length - visible * 2)) + phone.slice(-4);
  }



  // Run Campaign
  async function handleSendCampaign() {
    setCampaignError("");
    setSendSuccess(false);


    // Guard: incomplete input not committed
    if (hasIncompleteInput && campaignRecipientsType === "manual") {
      setCampaignError("You have an incomplete entry in the input. Press Enter or comma to add it first.");
      return;
    }
    if (activeRecipients.length === 0) {
      setCampaignError("No valid recipients found. Add complete phone numbers (with + country code) or email addresses.");
      return;
    }
    if (!selectedTemplate) {
      setCampaignError("Please select a message template first.");
      return;
    }
    if (hasInvalidManualNumbers) {
      setCampaignError("Some entries are invalid (marked red). Remove or correct them before sending.");
      return;
    }
    if (campaignChannels.length === 0) {
      setCampaignError("Please select at least one delivery channel (WhatsApp, SMS, or Email).");
      return;
    }
    if (selectedTemplate.templateType && selectedTemplate.templateType !== "Text Template" &&
        selectedTemplate.templateType !== "Text + Buttons" &&
        selectedTemplate.templateType !== "Text + Lists") {
      if (selectedTemplate.mediaUrl && (selectedTemplate.mediaUrl.startsWith("data:") || selectedTemplate.mediaUrl.startsWith("blob:"))) {
        setCampaignError("Cannot send local file previews. Please upload the file to a host (like S3, Imgur, Cloudinary) and paste a public HTTPS link under Template Config.");
        return;
      }
    }

    setCampaignRunning(true);
    setCampaignCompleted(false);
    setCampaignLogs([]);

    const qrLogs: typeof campaignLogs = [];
    const hasWhatsapp = campaignChannels.includes("whatsapp");

    if (hasWhatsapp) {


      let mediaType: "text" | "image" | "document" | "audio" = "text";
      if (selectedTemplate.templateType === "Text + Image") mediaType = "image";
      else if (selectedTemplate.templateType === "Text + Document") mediaType = "document";
      else if (selectedTemplate.templateType === "Text + Audio") mediaType = "audio";

      for (let idx = 0; idx < activeRecipients.length; idx++) {
        const r = activeRecipients[idx];
        if (!r.phone) {
          qrLogs.push({ number: r.email || "?", status: "FAILED", log: "No phone for WhatsApp" });
          continue;
        }

        let compiledBody = selectedTemplate.body
          .replace(/\{\{name\}\}/g, r.name || "Client")
          .replace(/\{\{phone\}\}/g, r.phone || "")
          .replace(/\{\{email\}\}/g, r.email || "");

        if (selectedTemplate.templateType === "Text + Buttons" && selectedTemplate.buttons && selectedTemplate.buttons.length > 0) {
          compiledBody += "\n\n*Reply Options:*\n" + selectedTemplate.buttons.map((b, i) => {
            const item = typeof b === "string" ? { label: b, url: "" } : b;
            return item.url ? `${i + 1}️⃣ ${item.label}\n   👉 ${item.url}` : `${i + 1}️⃣ ${item.label}`;
          }).join("\n");
        }
        if (selectedTemplate.templateType === "Text + Lists" && selectedTemplate.listItems && selectedTemplate.listItems.length > 0) {
          compiledBody += "\n\n*Menu Options:*\n" + selectedTemplate.listItems.map(item => {
            const li = typeof item === "string" ? { label: item, url: "" } : item;
            return li.url ? `• ${li.label}\n   👉 ${li.url}` : `• ${li.label}`;
          }).join("\n");
        }

        // Always use real WhatsApp Business Cloud API backend route
        try {
          const apiRes = await fetch("/api/whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: r.phone,
              type: mediaType,
              text: compiledBody,
              mediaUrl: selectedTemplate.mediaUrl || undefined,
              filename: selectedTemplate.mediaName || undefined,
            }),
          });
          const apiData = await apiRes.json();
          if (!apiRes.ok) {
            throw new Error(apiData.error || "WhatsApp API send failed");
          }
          qrLogs.push({ number: maskPhone(r.phone), status: "SENT", log: "WhatsApp API Sent" });
        } catch (err: any) {
          qrLogs.push({ number: maskPhone(r.phone), status: "FAILED", log: err.message });
          if (err.message.includes("API configuration")) {
            setCampaignError("Media sending requires WhatsApp Business API configuration.");
            setCampaignRunning(false);
            return;
          } else {
            setCampaignError(err.message);
          }
        }
      }

    }

    // Determine channels to send via API (excluding whatsapp since it is processed directly above)
    const apiChannels = campaignChannels.filter((ch) => ch !== "whatsapp");

    // ── API mode for other channels ──────────────────────────────────────────
    if (apiChannels.length > 0) {
      try {
        const res = await fetch("/api/admin/messages/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channels: apiChannels,
            recipients: activeRecipients,
            body: selectedTemplate.body,
            subject: campaignSubject,
          }),
        });

        const data = await res.json();
        if (res.ok && data.results) {
          const apiLogs = data.results.map((r: any) => ({
            number: r.phone ? maskPhone(r.phone) : (r.email ? r.email.replace(/(.{2}).+(@.+)/, "$1***$2") : "Contact"),
            status: r.status,
            log: r.log,
          }));
          setCampaignLogs([...qrLogs, ...apiLogs]);
          setSendSuccess(true);
          if (campaignRecipientsType === "manual") {
            setPhoneChips([]);
            setPhoneInputVal("");
            setEmailChips([]);
            setEmailInputVal("");
          }
        } else {
          setCampaignError(data.error || "Failed to launch bulk campaign");
          if (qrLogs.length > 0) {
            setCampaignLogs(qrLogs);
          }
        }
      } catch (err) {
        setCampaignError("Network error: could not reach the messaging server.");
        if (qrLogs.length > 0) {
          setCampaignLogs(qrLogs);
        }
      } finally {
        setCampaignRunning(false);
        setCampaignCompleted(true);
      }
    } else {
      // Only WhatsApp channel was processed
      setCampaignLogs(qrLogs);
      // Success only if no failures in qrLogs
      const hasFailed = qrLogs.some((l) => l.status === "FAILED");
      if (!hasFailed) {
        setSendSuccess(true);
        if (campaignRecipientsType === "manual") {
          setPhoneChips([]);
          setPhoneInputVal("");
        }
      }
      setCampaignRunning(false);
      setCampaignCompleted(true);
    }
  }

  // QR Session connection simulator
  function simulateQrConnection() {
    if (qrState === "connected") {
      setQrState("disconnected");
      setDeviceDetails({ name: "", phone: "" });
      return;
    }

    setQrState("connecting");
    setTimeout(() => {
      setQrState("connected");
      setDeviceDetails({
        name: "iPhone 15 Pro Max (Admin Desk)",
        phone: "+91 9900223344",
      });
    }, 2500);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">WhatsApp Hub</h1>
          <p className="text-slate-600 mt-1">
            Build interactive WhatsApp message templates, preview them live, and run marketing campaigns.
          </p>
        </div>
        {msg && <p className="text-sm font-semibold text-emerald-800 bg-emerald-50 rounded-xl px-4 py-2 border border-emerald-100">{msg}</p>}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 px-6 font-semibold text-sm border-b-2 transition ${
            activeTab === "templates" ? "border-gold-dark text-gold-dark" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4 inline mr-2" />
          Template Builder
        </button>
        <button
          onClick={() => setActiveTab("campaign")}
          className={`pb-3 px-6 font-semibold text-sm border-b-2 transition ${
            activeTab === "campaign" ? "border-gold-dark text-gold-dark" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Send className="h-4 w-4 inline mr-2" />
          Bulk Campaign Sender
        </button>
        <button
          onClick={() => setActiveTab("qr")}
          className={`pb-3 px-6 font-semibold text-sm border-b-2 transition ${
            activeTab === "qr" ? "border-gold-dark text-gold-dark" : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <QrCode className="h-4 w-4 inline mr-2" />
          QR Connection Manager
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left pane: Variables & Template selector */}
        <div className="space-y-6 lg:col-span-1">
          {/* Variables Card */}
          <section className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-slate-900 text-sm">System Variables</h3>
              <Sparkles className="h-4 w-4 text-gold-dark" />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Click any variable to copy to clipboard, then paste it in your template body text.
            </p>
            <div className="grid gap-2">
              {variables.map((v) => (
                <button
                  key={v.token}
                  onClick={() => copyToClipboard(v.token)}
                  className="flex items-center justify-between rounded-xl bg-slate-50 hover:bg-slate-100 p-2.5 text-xs text-left transition border group"
                >
                  <div>
                    <span className="font-mono text-gold-dark font-bold">{v.token}</span>
                    <span className="block text-[10px] text-slate-500 mt-0.5">{v.label}</span>
                  </div>
                  {copiedToken === v.token ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 shrink-0 transition" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Templates list card */}
          {activeTab === "templates" && (
            <section className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-semibold text-slate-900 text-sm">Saved Templates</h3>
                <Button variant="secondary" size="sm" onClick={handleCreateTemplate}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {settings.messageTemplates
                  .filter((t) => t.channel === "whatsapp")
                  .map((t) => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        selectedTemplateId === t.id
                          ? "bg-gold/10 border-gold/40 text-gold-dark font-medium"
                          : "bg-white hover:bg-slate-50"
                      }`}
                      onClick={() => setSelectedTemplateId(t.id)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-800">{t.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">{t.templateType || "Text Template"}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(t.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 ml-2"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* Center pane: Form builder or Send Campaign */}
        <div className="lg:col-span-1 space-y-6">
          {activeTab === "templates" && selectedTemplate && (
            <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-lg text-slate-900 border-b pb-2">Template Config</h2>

              <div className="space-y-3">
                <div>
                  <Label>Template Name *</Label>
                  <Input
                    value={selectedTemplate.name}
                    onChange={(e) => updateActiveTemplate({ name: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Template Type *</Label>
                  <select
                    className="w-full rounded-xl border px-3 py-2.5 text-sm mt-1 bg-slate-50"
                    value={selectedTemplate.templateType || "Text Template"}
                    onChange={(e) => {
                      const newType = e.target.value;
                      const patch: Partial<typeof selectedTemplate> = { templateType: newType };
                      // Auto-seed buttons/listItems when switching type
                      if (newType === "Text + Buttons" && !(selectedTemplate.buttons?.length)) {
                        patch.buttons = [{ label: "Contact Support", url: `https://wa.me/` }, { label: "Book Site Visit", url: `${typeof window !== "undefined" ? window.location.origin : ""}/properties` }];
                        if (!selectedTemplate.body.includes("click a button")) {
                          patch.body = selectedTemplate.body.trim() + "\n\nPlease click a button below to choose an option.";
                        }
                      }
                      if (newType === "Text + Lists" && !(selectedTemplate.listItems?.length)) {
                        patch.listItems = [{ label: "View Brochure", url: "" }, { label: "Check Prices", url: "" }, { label: "Schedule Call", url: "" }];
                        if (!selectedTemplate.body.includes("from the menu")) {
                          patch.body = selectedTemplate.body.trim() + "\n\nPlease select an option from the menu below.";
                        }
                      }
                      updateActiveTemplate(patch);
                    }}
                  >
                    {templateTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Media upload UI for non-text template types */}
                {selectedTemplate.templateType && selectedTemplate.templateType !== "Text Template" &&
                  selectedTemplate.templateType !== "Text + Buttons" &&
                  selectedTemplate.templateType !== "Text + Lists" && (
                  <MediaUploadField
                    templateType={selectedTemplate.templateType}
                    mediaUrl={selectedTemplate.mediaUrl || ""}
                    mediaName={selectedTemplate.mediaName}
                    onChangeUrl={(url, name) => {
                      updateActiveTemplate({ mediaUrl: url, mediaName: name || "" });
                    }}
                  />
                )}

                <div>
                  <Label>Message Body Text</Label>
                  <textarea
                    rows={5}
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-slate-50"
                    value={selectedTemplate.body}
                    onChange={(e) => updateActiveTemplate({ body: e.target.value })}
                  />
                </div>

                {/* Interactive Buttons Config */}
                {selectedTemplate.templateType === "Text + Buttons" && (
                  <div className="space-y-3 border-t pt-3">
                    <Label className="text-xs font-semibold">Reply Buttons (Max 3) — each gets a clickable URL</Label>
                    {(selectedTemplate.buttons || []).map((btn, bidx) => {
                      const item = typeof btn === "string" ? { label: btn, url: "" } : btn;
                      // Detect URL action type from current URL
                      const detectType = (url: string) => {
                        if (!url) return "";
                        if (url.includes("wa.me")) return "whatsapp";
                        if (url.includes("/properties/")) return "property";
                        if (url.includes("/contact")) return "contact";
                        if (url.includes("/schedule") || url.includes("/tour") || url.includes("/book")) return "booking";
                        return "custom";
                      };
                      const urlType = detectType(item.url ?? "");
                      return (
                        <div key={bidx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                          <div className="flex gap-2 items-center">
                            <span className="text-xs font-bold text-slate-500 w-5 shrink-0">{bidx + 1}.</span>
                            <Input
                              value={item.label}
                              placeholder={`Button label (e.g. Book Site Visit)`}
                              className="flex-1"
                              onChange={(e) => {
                                const nextBtns = [...(selectedTemplate.buttons || [])].map((b) =>
                                  typeof b === "string" ? { label: b, url: "" } : b
                                );
                                nextBtns[bidx] = { ...item, label: e.target.value };
                                updateActiveTemplate({ buttons: nextBtns });
                              }}
                            />
                            <button
                              onClick={() => {
                                const nextBtns = (selectedTemplate.buttons || []).filter((_, idx) => idx !== bidx);
                                updateActiveTemplate({ buttons: nextBtns });
                              }}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {/* Smart URL Action Picker */}
                          <div className="pl-7 space-y-1.5">
                            <div className="grid grid-cols-3 gap-1">
                              {([
                                { type: "property", icon: "🏠", label: "View Property" },
                                { type: "whatsapp", icon: "💬", label: "WhatsApp Agent" },
                                { type: "contact", icon: "📞", label: "Contact Form" },
                                { type: "booking", icon: "📅", label: "Book Site Visit" },
                                { type: "brochure", icon: "📄", label: "View Brochure" },
                                { type: "custom", icon: "🔗", label: "Custom URL" },
                              ] as const).map(({ type, icon, label }) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    const nextBtns = [...(selectedTemplate.buttons || [])].map((b) =>
                                      typeof b === "string" ? { label: b, url: "" } : b
                                    );
                                    let autoUrl = "";
                                    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
                                    if (type === "property") autoUrl = `${appUrl}/properties`;
                                    else if (type === "whatsapp") autoUrl = `https://wa.me/`;
                                    else if (type === "contact") autoUrl = `${appUrl}/contact`;
                                    else if (type === "booking") autoUrl = `${appUrl}/schedule`;
                                    else if (type === "brochure") autoUrl = item.url || "";
                                    else autoUrl = item.url || "";
                                    nextBtns[bidx] = { ...item, url: autoUrl };
                                    updateActiveTemplate({ buttons: nextBtns });
                                  }}
                                  className={`flex flex-col items-center gap-0.5 rounded-lg border py-1.5 text-[9px] font-semibold transition ${
                                    urlType === type
                                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                  }`}
                                >
                                  <span className="text-sm">{icon}</span>
                                  {label}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-1.5 items-center">
                              <Link className="h-3 w-3 text-slate-400 shrink-0" />
                              <input
                                type="url"
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                                placeholder="Paste or edit URL here..."
                                value={item.url || ""}
                                onChange={(e) => {
                                  const nextBtns = [...(selectedTemplate.buttons || [])].map((b) =>
                                    typeof b === "string" ? { label: b, url: "" } : b
                                  );
                                  nextBtns[bidx] = { ...item, url: e.target.value };
                                  updateActiveTemplate({ buttons: nextBtns });
                                }}
                              />
                            </div>
                            {item.url && (
                              <p className="text-[9px] text-emerald-600 font-medium pl-4">
                                ✓ Button will open: {item.url.length > 50 ? item.url.slice(0, 50) + "..." : item.url}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(selectedTemplate.buttons || []).length < 3 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const nextBtns = [...(selectedTemplate.buttons || []).map(b => typeof b === "string" ? { label: b, url: "" } : b), { label: `Button ${(selectedTemplate.buttons || []).length + 1}`, url: "" }];
                          updateActiveTemplate({ buttons: nextBtns });
                        }}
                      >
                        + Add Button
                      </Button>
                    )}
                  </div>
                )}

                {/* Lists Config */}
                {selectedTemplate.templateType === "Text + Lists" && (
                  <div className="space-y-3 border-t pt-3">
                    <Label className="text-xs font-semibold">List Item Options (Max 5) — each gets a clickable URL</Label>
                    {(selectedTemplate.listItems || []).map((item, lidx) => {
                      const li = typeof item === "string" ? { label: item, url: "" } : item;
                      const detectType = (url: string) => {
                        if (!url) return "";
                        if (url.includes("wa.me")) return "whatsapp";
                        if (url.includes("/properties/")) return "property";
                        if (url.includes("/contact")) return "contact";
                        if (url.includes("/schedule") || url.includes("/tour") || url.includes("/book")) return "booking";
                        return "custom";
                      };
                      const urlType = detectType(li.url ?? "");
                      return (
                        <div key={lidx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                          <div className="flex gap-2 items-center">
                            <span className="text-xs font-bold text-slate-500 w-5 shrink-0">•</span>
                            <Input
                              value={li.label}
                              placeholder={`Item ${lidx + 1} label (e.g. View Brochure)`}
                              className="flex-1"
                              onChange={(e) => {
                                const nextItems = [...(selectedTemplate.listItems || [])].map((it) =>
                                  typeof it === "string" ? { label: it, url: "" } : it
                                );
                                nextItems[lidx] = { ...li, label: e.target.value };
                                updateActiveTemplate({ listItems: nextItems });
                              }}
                            />
                            <button
                              onClick={() => {
                                const nextItems = (selectedTemplate.listItems || []).filter((_, idx) => idx !== lidx);
                                updateActiveTemplate({ listItems: nextItems });
                              }}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          {/* Smart URL Action Picker */}
                          <div className="pl-7 space-y-1.5">
                            <div className="grid grid-cols-3 gap-1">
                              {([
                                { type: "property", icon: "🏠", label: "View Property" },
                                { type: "whatsapp", icon: "💬", label: "WhatsApp Agent" },
                                { type: "contact", icon: "📞", label: "Contact Form" },
                                { type: "booking", icon: "📅", label: "Book Site Visit" },
                                { type: "brochure", icon: "📄", label: "View Brochure" },
                                { type: "custom", icon: "🔗", label: "Custom URL" },
                              ] as const).map(({ type, icon, label }) => (
                                <button
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    const nextItems = [...(selectedTemplate.listItems || [])].map((it) =>
                                      typeof it === "string" ? { label: it, url: "" } : it
                                    );
                                    let autoUrl = "";
                                    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
                                    if (type === "property") autoUrl = `${appUrl}/properties`;
                                    else if (type === "whatsapp") autoUrl = `https://wa.me/`;
                                    else if (type === "contact") autoUrl = `${appUrl}/contact`;
                                    else if (type === "booking") autoUrl = `${appUrl}/schedule`;
                                    else if (type === "brochure") autoUrl = li.url || "";
                                    else autoUrl = li.url || "";
                                    nextItems[lidx] = { ...li, url: autoUrl };
                                    updateActiveTemplate({ listItems: nextItems });
                                  }}
                                  className={`flex flex-col items-center gap-0.5 rounded-lg border py-1.5 text-[9px] font-semibold transition ${
                                    urlType === type
                                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                                  }`}
                                >
                                  <span className="text-sm">{icon}</span>
                                  {label}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-1.5 items-center">
                              <Link className="h-3 w-3 text-slate-400 shrink-0" />
                              <input
                                type="url"
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                                placeholder="Paste or edit URL here..."
                                value={li.url || ""}
                                onChange={(e) => {
                                  const nextItems = [...(selectedTemplate.listItems || [])].map((it) =>
                                    typeof it === "string" ? { label: it, url: "" } : it
                                  );
                                  nextItems[lidx] = { ...li, url: e.target.value };
                                  updateActiveTemplate({ listItems: nextItems });
                                }}
                              />
                            </div>
                            {li.url && (
                              <p className="text-[9px] text-emerald-600 font-medium pl-4">
                                ✓ Opens: {li.url.length > 50 ? li.url.slice(0, 50) + "..." : li.url}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {(selectedTemplate.listItems || []).length < 5 && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const nextItems = [...(selectedTemplate.listItems || []).map(it => typeof it === "string" ? { label: it, url: "" } : it), { label: `Item ${(selectedTemplate.listItems || []).length + 1}`, url: "" }];
                          updateActiveTemplate({ listItems: nextItems });
                        }}
                      >
                        + Add List Item
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {msg && (
                <div className={`rounded-xl px-3 py-2.5 text-sm font-medium border ${
                  msg.startsWith("✅")
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-rose-50 border-rose-200 text-rose-700"
                }`}>
                  {msg}
                </div>
              )}

              <Button disabled={busy} onClick={saveAllSettings} className="w-full mt-2" variant="gold">
                {busy ? "Saving…" : "Save Templates"}
              </Button>
            </section>
          )}

          {activeTab === "campaign" && (
            <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-lg text-slate-900 border-b pb-2">Campaign Details</h2>

              <div className="space-y-3">
                <div>
                  <Label>Selected Template</Label>
                  <select
                    className="w-full rounded-xl border px-3 py-2.5 text-sm mt-1 bg-slate-50"
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                  >
                    {settings.messageTemplates
                      .filter((t) => t.channel === "whatsapp")
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <Label>Campaign Delivery Channels</Label>
                  <div className="flex gap-3 mt-1.5">
                    {["whatsapp", "email", "sms"].map((ch) => {
                      const isActive = campaignChannels.includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => {
                            if (isActive) {
                              setCampaignChannels(campaignChannels.filter((c) => c !== ch));
                            } else {
                              setCampaignChannels([...campaignChannels, ch]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border uppercase transition ${
                            isActive
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-50 text-slate-650 hover:bg-slate-105 border-slate-200"
                          }`}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {campaignChannels.includes("email") && (
                  <div>
                    <Label>Email Campaign Subject</Label>
                    <input
                      type="text"
                      className="w-full rounded-xl border px-3 py-2 text-xs mt-1 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-slate-500 focus:outline-none"
                      value={campaignSubject}
                      onChange={(e) => setCampaignSubject(e.target.value)}
                      placeholder="Special offer from BrickVest"
                    />
                  </div>
                )}

                {/* Sender Channel Mode removed */}

                <div className="border-t pt-2 space-y-3">
                  <Label>Recipients List Source</Label>
                  <div className="flex gap-2">
                    {["leads", "manual", "file"].map((srcType) => (
                      <button
                        key={srcType}
                        onClick={() => setCampaignRecipientsType(srcType as "leads" | "manual" | "file")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition ${
                          campaignRecipientsType === srcType
                            ? "bg-gold text-slate-900 border-gold"
                            : "bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {srcType === "leads" ? "CRM Leads" : srcType === "manual" ? "Numbers Text" : "CSV/Excel Upload"}
                      </button>
                    ))}
                  </div>

                  {campaignRecipientsType === "leads" && (
                    <div>
                      <Label className="text-xs text-slate-500">Pick Lead(s)</Label>
                      <select
                        className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-slate-50"
                        value={selectedLeadId}
                        onChange={(e) => setSelectedLeadId(e.target.value)}
                      >
                        <option value="all">
                          All Contacts ({
                            leads.filter((l) => {
                              if (needsPhone && needsEmail) return l.phone || l.email;
                              if (needsPhone) return l.phone;
                              if (needsEmail) return l.email;
                              return true;
                            }).length
                          })
                        </option>
                        {leads
                          .filter((l) => {
                            if (needsPhone && needsEmail) return l.phone || l.email;
                            if (needsPhone) return l.phone;
                            if (needsEmail) return l.email;
                            return true;
                          })
                          .map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name} — {l.phone && l.email ? `${l.phone} & ${l.email}` : (l.phone || l.email || "No contact info")}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {campaignRecipientsType === "manual" && (
                    <div className="space-y-3">

                      {/* ── Phone chip input (WhatsApp / SMS) ── */}
                      {needsPhone && (
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                              <Smartphone className="h-3.5 w-3.5" /> Phone Numbers (WhatsApp / SMS)
                            </Label>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Type number with country code → press <kbd className="bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-[10px] font-mono">Enter</kbd> or <kbd className="bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-[10px] font-mono">,</kbd> to add. E.g. <span className="font-mono font-bold text-slate-700">+919876543210</span>
                            </p>
                          </div>
                          <div
                            className={`min-h-[72px] w-full rounded-xl border-2 px-3 py-2 bg-white flex flex-wrap gap-1.5 items-start cursor-text transition-all ${
                              phoneChipsWithValidity.some((c) => !c.valid)
                                ? "border-red-300 focus-within:border-red-500 shadow-sm shadow-red-50"
                                : phoneChips.length > 0
                                ? "border-emerald-300 focus-within:border-emerald-500 shadow-sm shadow-emerald-50"
                                : "border-slate-200 focus-within:border-slate-400"
                            }`}
                            onClick={() => phoneInputRef.current?.focus()}
                          >
                            {phoneChipsWithValidity.map((chip, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-full border font-semibold shrink-0 ${
                                  chip.valid
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                <span>{chip.valid ? "✓" : "✗"}</span>
                                <span>{chip.raw}</span>
                                <button type="button" onClick={(e) => { e.stopPropagation(); removePhoneChip(i); }} className="ml-0.5 opacity-60 hover:opacity-100 transition">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                            <input
                              ref={phoneInputRef}
                              type="tel"
                              value={phoneInputVal}
                              onChange={(e) => { setPhoneInputVal(e.target.value); setCampaignError(""); }}
                              onKeyDown={handlePhoneInputKey}
                              onBlur={() => { if (phoneInputVal.trim()) commitPhoneChip(phoneInputVal); }}
                              placeholder={phoneChips.length === 0 ? "+919876543210" : "+1..."}
                              className="flex-1 min-w-[150px] bg-transparent outline-none text-sm placeholder:text-slate-300 text-slate-800 font-mono"
                            />
                          </div>
                          {phoneChipsWithValidity.some((c) => !c.valid) && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-[11px] text-red-700">
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <span>Numbers marked ✗ are invalid. Must start with <span className="font-mono">+</span> and include full country code (e.g. <span className="font-mono">+919876543210</span>).</span>
                            </div>
                          )}
                          {phoneInputVal.trim() && (
                            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 font-medium">
                              ⌨️ Press <kbd className="bg-white border rounded px-1 font-mono">Enter</kbd> to add this number.
                            </p>
                          )}
                        </div>
                      )}

                      {/* ── Email chip input ── */}
                      {needsEmail && (
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5" /> Email Addresses
                            </Label>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Type email → press <kbd className="bg-slate-100 border border-slate-200 rounded px-1 py-0.5 text-[10px] font-mono">Enter</kbd> to add. E.g. <span className="font-mono font-bold text-slate-700">client@example.com</span>
                            </p>
                          </div>
                          <div
                            className={`min-h-[72px] w-full rounded-xl border-2 px-3 py-2 bg-white flex flex-wrap gap-1.5 items-start cursor-text transition-all ${
                              emailChipsWithValidity.some((c) => !c.valid)
                                ? "border-red-300 focus-within:border-red-500"
                                : emailChips.length > 0
                                ? "border-blue-300 focus-within:border-blue-500 shadow-sm shadow-blue-50"
                                : "border-slate-200 focus-within:border-slate-400"
                            }`}
                            onClick={() => emailInputRef.current?.focus()}
                          >
                            {emailChipsWithValidity.map((chip, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border font-semibold shrink-0 ${
                                  chip.valid
                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                <AtSign className="h-2.5 w-2.5" />
                                <span>{chip.raw}</span>
                                <button type="button" onClick={(e) => { e.stopPropagation(); removeEmailChip(i); }} className="ml-0.5 opacity-60 hover:opacity-100 transition">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                            <input
                              ref={emailInputRef}
                              type="email"
                              value={emailInputVal}
                              onChange={(e) => { setEmailInputVal(e.target.value); setCampaignError(""); }}
                              onKeyDown={handleEmailInputKey}
                              onBlur={() => { if (emailInputVal.trim()) commitEmailChip(emailInputVal); }}
                              placeholder={emailChips.length === 0 ? "client@example.com" : "another@..."}
                              className="flex-1 min-w-[160px] bg-transparent outline-none text-sm placeholder:text-slate-300 text-slate-800"
                            />
                          </div>
                          {emailChipsWithValidity.some((c) => !c.valid) && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-[11px] text-red-700">
                              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                              <span>Some emails are invalid. Check format (e.g. client@example.com).</span>
                            </div>
                          )}
                          {emailInputVal.trim() && (
                            <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 font-medium">
                              ⌨️ Press <kbd className="bg-white border rounded px-1 font-mono">Enter</kbd> to add this email.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Secure status */}
                      {(phoneChips.length > 0 || emailChips.length > 0) && !hasInvalidChips && !hasIncompleteInput && (
                        <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 font-medium flex items-center gap-1.5">
                          <Shield className="h-3 w-3" />
                          {needsPhone ? `${phoneChips.length} phone` : ""}{needsPhone && needsEmail ? " + " : ""}{needsEmail ? `${emailChips.length} email` : ""} recipient{phoneChips.length + emailChips.length !== 1 ? "s" : ""} ready. Data cleared after send.
                        </p>
                      )}
                    </div>
                  )}

                  {campaignRecipientsType === "file" && (
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-500">Upload CSV / Excel Recipients</Label>
                      <div className="border border-dashed rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50">
                        <Upload className="h-6 w-6 text-slate-400 mb-2" />
                        <span className="text-xs text-slate-600 font-medium">
                          {uploadedFileName || "Choose CSV/Excel file"}
                        </span>
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleCsvFileSelect}
                          className="opacity-0 absolute w-32 h-10 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 mt-1">Requires headers: name, phone, email</span>
                      </div>
                      {parsedRecipients.length > 0 && (
                        <p className="text-[10px] text-emerald-700 bg-emerald-50 rounded-lg p-2 font-medium">
                          Parsed {parsedRecipients.length} numbers successfully!
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-slate-800">Recipients Preview</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      activeRecipients.length > 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>{activeRecipients.length} ready</span>
                  </div>
                  {activeRecipients.length > 0 ? (
                    <div className="max-h-28 overflow-y-auto mt-1 divide-y divide-slate-100">
                      {activeRecipients.map((r, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 text-slate-600">
                          <span className="font-medium truncate">{r.name}</span>
                          <span className="font-mono text-slate-400 text-[10px] ml-2">
                            {needsPhone && r.phone ? maskPhone(r.phone) : r.email ? r.email.replace(/(.{2}).+(@.+)/, "$1***$2") : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 mt-1">No valid recipients yet.</p>
                  )}
                </div>

                {campaignError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{campaignError}</span>
                  </div>
                )}

                {sendSuccess && !campaignError && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-700 font-semibold">
                      <CheckCircle className="h-4 w-4 shrink-0" />
                      Campaign dispatched! Messages delivered successfully.
                    </div>
                  </div>
                )}

                {/* Send button — strictly disabled until all conditions are met */}
                <Button
                  disabled={
                    campaignRunning ||
                    activeRecipients.length === 0 ||
                    hasInvalidManualNumbers ||
                    hasIncompleteInput ||
                    !selectedTemplate ||
                    campaignChannels.length === 0
                  }
                  onClick={handleSendCampaign}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none mt-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold tracking-wide"
                >
                  {campaignRunning ? (
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      {campaignChannels.includes("whatsapp") && qrState === "connected"
                        ? `Opening WhatsApp for ${activeRecipients.length} contact${activeRecipients.length !== 1 ? "s" : ""}…`
                        : `Sending to ${activeRecipients.length} recipient${activeRecipients.length !== 1 ? "s" : ""}…`
                      }
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {campaignChannels.includes("whatsapp") && qrState === "connected"
                        ? <ExternalLink className="h-4 w-4" />
                        : <Send className="h-4 w-4" />
                      }
                      {campaignChannels.includes("whatsapp") && qrState === "connected"
                        ? `Open WhatsApp for ${activeRecipients.length} contact${activeRecipients.length !== 1 ? "s" : ""}`
                        : `Launch Campaign → ${activeRecipients.length} recipient${activeRecipients.length !== 1 ? "s" : ""}`
                      }
                    </span>
                  )}
                </Button>

                {/* Campaign Delivery Results Log */}
                {campaignCompleted && campaignLogs.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                        Campaign Delivery Report
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {campaignLogs.filter((l) => l.status === "SENT").length}/{campaignLogs.length} delivered
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                      {campaignLogs.map((log, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                          <span className="font-mono text-slate-500 truncate flex items-center gap-1.5">
                            <Shield className="h-3 w-3 text-slate-300 shrink-0" />
                            {log.number}
                          </span>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                              log.status === "SENT"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : log.status === "PARTIAL_FAILED"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                            }`}>
                              {log.status === "SENT" ? "✓ Delivered" : log.status === "PARTIAL_FAILED" ? "⚠ Partial" : "✗ Failed"}
                            </span>
                            <span className="text-slate-400 text-[10px] max-w-[120px] truncate" title={log.log}>{log.log}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-[10px] text-slate-500 flex items-center gap-1.5">
                      <Shield className="h-3 w-3 text-slate-400" />
                      {campaignLogs.filter((l) => l.status === "SENT").length} succeeded ·{" "}
                      {campaignLogs.filter((l) => l.status !== "SENT").length} failed ·
                      Numbers masked for security · Logs saved in Message Hub
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {activeTab === "qr" && (
            <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <h2 className="font-semibold text-lg text-slate-900 border-b pb-2">WhatsApp Web QR Session</h2>

              <div className="space-y-4 text-center">
                <div className="flex justify-center p-3 border rounded-xl bg-slate-50 max-w-[200px] mx-auto">
                  {qrState === "connected" ? (
                    <div className="w-40 h-40 flex flex-col items-center justify-center text-emerald-600 font-semibold text-sm">
                      <CheckCircle className="h-12 w-12 mb-2 animate-bounce" />
                      Session Connected
                    </div>
                  ) : qrState === "connecting" ? (
                    <div className="w-40 h-40 flex flex-col items-center justify-center text-slate-600 font-semibold text-xs animate-pulse">
                      <QrCode className="h-12 w-12 mb-2 text-gold animate-spin" />
                      Syncing session...
                    </div>
                  ) : (
                    <div className="w-40 h-40 bg-slate-200 flex flex-col items-center justify-center text-slate-400 border border-dashed rounded-lg">
                      <QrCode className="h-12 w-12 mb-2 text-slate-400" />
                      QR Code Ready
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  {qrState === "connected" 
                    ? `Linked device: ${deviceDetails.name} (${deviceDetails.phone})`
                    : "Simulate scanning a WhatsApp Web QR Code link below to pair your admin console dashboard."}
                </p>

                <Button
                  variant={qrState === "connected" ? "secondary" : "gold"}
                  onClick={simulateQrConnection}
                  className="w-full"
                >
                  {qrState === "connected" ? "Disconnect WhatsApp Session" : "Simulate QR Scan Match"}
                </Button>
              </div>
            </section>
          )}
        </div>

        {/* Right pane: Visual WhatsApp Preview Phone Mockup */}
        <div className="lg:col-span-1">
          <section className="rounded-3xl border-4 border-slate-900 bg-slate-100 shadow-xl overflow-hidden max-w-[320px] mx-auto min-h-[520px] flex flex-col">
            {/* Phone Top Header */}
            <div className="bg-emerald-800 text-white px-4 py-3 pt-5 flex items-center gap-2.5 shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-600 border flex items-center justify-center text-xs font-bold shrink-0">
                BV
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs truncate">BrickVest Agent Desk</p>
                <p className="text-[9px] text-emerald-200">Online</p>
              </div>
              <Smartphone className="h-4 w-4 shrink-0 text-emerald-200" />
            </div>

            {/* Phone Message Body area */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto bg-amber-50/20 relative">
              {/* WhatsApp background pattern simulator (grid) */}
              <div className="absolute inset-0 bg-repeat opacity-5 pointer-events-none" style={{ backgroundImage: "url('/public/whatsapp-bg.png')" }} />

              {selectedTemplate ? (
                <div className="space-y-2 w-full">
                  <div className="max-w-[85%] bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100 mr-auto relative z-10">

                  {/* ── Visual preview in a single WhatsApp-style bubble ── */}
                  <div className="p-2.5 space-y-2">
                    {/* ── Image inside the bubble ── */}
                    {selectedTemplate.templateType === "Text + Image" && (
                      <div className="relative h-40 bg-slate-100 overflow-hidden flex items-center justify-center rounded-xl mb-2">
                        {selectedTemplate.mediaUrl ? (
                          <img
                            src={selectedTemplate.mediaUrl}
                            alt="Template media"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <ImageIcon className="h-8 w-8" />
                            <span className="text-[9px] font-medium">Upload or paste image URL</span>
                          </div>
                        )}
                        {selectedTemplate.mediaUrl && isPreviewUrl(selectedTemplate.mediaUrl) && (
                          <div className="absolute top-2 left-2 bg-amber-500/95 text-white text-[8px] font-bold px-2 py-0.5 rounded shadow-md border border-amber-400 z-20 flex items-center gap-1">
                            <span>⚠ Local Preview Only</span>
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded-full backdrop-blur-sm">📷 Image</span>
                      </div>
                    )}

                    {/* ── Video inside the bubble ── */}
                    {selectedTemplate.templateType === "Text + Video" && (
                      <div className="h-36 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden rounded-xl mb-2">
                        <div className="absolute inset-0 opacity-20"
                          style={{ backgroundImage: "repeating-linear-gradient(135deg,#334155 0,#334155 1px,transparent 0,transparent 50%)", backgroundSize: "12px 12px" }}
                        />
                        <div className="relative flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                            <Play className="h-5 w-5 text-white ml-0.5" />
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono">
                            {selectedTemplate.mediaUrl
                              ? (() => { try { return new URL(selectedTemplate.mediaUrl).pathname.split("/").pop() || "video.mp4"; } catch { return "video.mp4"; } })()
                              : "No video attached"}
                          </p>
                        </div>
                        {selectedTemplate.mediaUrl && isPreviewUrl(selectedTemplate.mediaUrl) && (
                          <div className="absolute top-2 left-2 bg-amber-500/95 text-white text-[8px] font-bold px-2 py-0.5 rounded shadow-md border border-amber-400 z-20">
                            <span>⚠ Local Preview Only</span>
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded-full">🎬 0:32</span>
                      </div>
                    )}

                    {/* ── Document: file card inside the bubble ── */}
                    {selectedTemplate.templateType === "Text + Document" && (
                      <div className="bg-sky-50 border border-sky-200 rounded-xl p-2.5 flex flex-col gap-2 relative mb-2">
                        {selectedTemplate.mediaUrl && isPreviewUrl(selectedTemplate.mediaUrl) && (
                          <div className="bg-amber-100/90 border border-amber-200 text-amber-800 text-[8px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                            <span>⚠ Local Preview Only (URL required to send)</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center shrink-0 shadow-sm">
                            <FileText className="h-4.5 w-4.5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-semibold text-slate-800 truncate">
                              {selectedTemplate.mediaUrl
                                ? (() => { try { return decodeURIComponent(new URL(selectedTemplate.mediaUrl).pathname.split("/").pop()?.replace(/-/g," ") || "Document.pdf"); } catch { return "Document.pdf"; } })()
                                : "No document attached"}
                            </p>
                            <p className="text-[8px] text-slate-400 mt-0.5">PDF Document</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── Audio player inside the bubble ── */}
                    {selectedTemplate.templateType === "Text + Audio" && (
                      <div className="bg-emerald-50 border border-emerald-250 rounded-xl px-2.5 py-2.5 flex flex-col gap-2 mb-2">
                        {selectedTemplate.mediaUrl && isPreviewUrl(selectedTemplate.mediaUrl) && (
                          <div className="bg-amber-100/90 border border-amber-200 text-amber-800 text-[8px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                            <span>⚠ Local Preview Only (URL required to send)</span>
                          </div>
                        )}
                        {selectedTemplate.mediaUrl ? (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                                <Music className="h-2.5 w-2.5 text-white" />
                              </div>
                              <span className="text-[9px] font-semibold text-slate-700 truncate flex-1">
                                {(() => { try { return decodeURIComponent(new URL(selectedTemplate.mediaUrl).pathname.split("/").pop() ?? "audio.mp3"); } catch { return "audio.mp3"; } })()}
                              </span>
                            </div>
                            <audio controls src={selectedTemplate.mediaUrl} className="w-full h-6 rounded-lg" preload="metadata" />
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center shrink-0">
                              <Music className="h-3 w-3 text-slate-500" />
                            </div>
                            <div className="flex items-end gap-[2px] flex-1 h-6">
                              {[3,6,9,7,12,8,14,10,7,9,6,8,5].map((h, i) => (
                                <div key={i} className="rounded-full w-[1.5px] shrink-0 bg-slate-300"
                                  style={{ height: `${h * 1.5}px` }} />
                              ))}
                            </div>
                            <span className="text-[8px] text-slate-400 font-mono">No audio</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Message text in the SAME bubble ── */}
                    {selectedTemplate.templateType !== "Text + Audio" && (
                      bodyTextOnly ? (
                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{bodyTextOnly}</p>
                      ) : (
                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{parsedPreviewBody}</p>
                      )
                    )}

                    {/* WhatsApp-style rich link preview card for any URL in body */}
                    {firstPreviewUrl && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm mt-1">
                        {matchedPropertyImg ? (
                          <div className="h-24 w-full relative overflow-hidden bg-slate-100">
                            <img
                              src={matchedPropertyImg}
                              alt={matchedProperty?.title || "Property"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-16 bg-gradient-to-br from-teal-500 via-teal-600 to-cyan-700 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize: "8px 8px" }} />
                            <div className="relative w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                              <ExternalLink className="h-3.5 w-3.5 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="flex">
                          <div className="w-1 bg-teal-500 shrink-0" />
                          <div className="px-2 py-1.5 min-w-0">
                            <p className="text-[10px] font-bold text-slate-800 leading-snug truncate">
                              {matchedProperty ? matchedProperty.title : "BrickVest Property"}
                            </p>
                            <p className="text-[9px] text-slate-500 mt-0.5 truncate">
                              {matchedProperty 
                                ? matchedProperty.description
                                : "Premium real estate investment"
                              }
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[8px] text-teal-600 font-semibold truncate">
                                {(() => { try { return new URL(firstPreviewUrl).hostname; } catch { return firstPreviewUrl.slice(0, 28); } })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center justify-end gap-1 pt-0.5">
                      <span className="text-[8px] text-slate-400">1:09 PM</span>
                      <span className="text-[8px] text-sky-500">✓✓</span>
                    </div>
                  </div>

                  {/* Attached Buttons */}
                  {selectedTemplate && selectedTemplate.templateType === "Text + Buttons" && (selectedTemplate.buttons || []).filter(Boolean).length > 0 && (
                    <div className="flex flex-col border-t border-slate-100/80 bg-white">
                      {(selectedTemplate.buttons || []).filter(Boolean).map((btn, bidx) => {
                        const item = typeof btn === "string" ? { label: btn, url: "" } : btn;
                        return (
                          <div
                            key={bidx}
                            className="w-full border-b border-slate-100/80 last:border-0 py-2.5 text-center text-[#00A884] font-medium text-[11px] hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            onClick={() => item.url && window.open(item.url, "_blank")}
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-80"><path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                            {item.label}
                            {item.url && <ExternalLink className="h-2.5 w-2.5 opacity-60" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Attached List Button */}
                  {selectedTemplate && selectedTemplate.templateType === "Text + Lists" && (selectedTemplate.listItems || []).filter(Boolean).length > 0 && (
                    <div className="flex flex-col border-t border-slate-100/80 bg-white">
                      <div className="w-full py-2.5 text-center text-[#00A884] font-medium text-[11px] hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                        <ListIcon className="h-3.5 w-3.5 opacity-80" />
                        Select Option
                      </div>
                    </div>
                  )}
                  </div>
                  {selectedTemplate.templateType === "Text + Audio" && (bodyTextOnly || parsedPreviewBody) && (
                    <div className="max-w-[85%] bg-white rounded-2xl shadow-sm border border-slate-100 mr-auto relative z-10 p-2.5">
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {bodyTextOnly || parsedPreviewBody}
                      </p>
                      <div className="flex items-center justify-end gap-1 pt-0.5">
                        <span className="text-[8px] text-slate-400">1:09 PM</span>
                        <span className="text-[8px] text-sky-500">✓✓</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 py-12">
                  No template selected. Select or add one to preview visual rendering.
                </div>
              )}
            </div>

            {/* Campaign Sender execution logs */}
            {activeTab === "campaign" && (campaignRunning || campaignCompleted) && (
              <div className="bg-slate-900 text-white p-3 text-[10px] max-h-32 overflow-y-auto border-t border-slate-800">
                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[8px] mb-1">Campaign log</p>
                {campaignLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-1 items-start mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${log.status === "SENT" ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className="text-slate-300 font-mono truncate">{log.number}:</span>
                    <span className="text-slate-400 truncate">{log.log}</span>
                  </div>
                ))}
                {campaignRunning && <p className="text-gold animate-pulse mt-1">Sending campaign progress...</p>}
                {campaignCompleted && <p className="text-emerald-400 mt-1">Campaign finished successfully!</p>}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
