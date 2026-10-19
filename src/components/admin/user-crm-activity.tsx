"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  StickyNote, Mail, Phone, CheckSquare, CalendarDays, Edit3, Trash2, Search,
  Settings, ExternalLink, Save, Loader2, Clock, Check, History,
  Bold, Italic, Underline, Link2, Image as ImageIcon, Paperclip, Highlighter,
  Type, MessageSquarePlus, MessageCircle, Send, CornerDownRight, ChevronDown,
  FileText, X, Download, LayoutTemplate, Braces, Maximize2,
} from "lucide-react";

type ActType = "NOTE" | "EMAIL" | "CALL" | "TASK" | "MEETING";

type Comment = {
  id: string;
  body: string;
  authorName: string | null;
  authorUserId: string | null;
  createdAt: string;
};

// A piece of attached media kept in the activity's attachments list.
type Media = { id: string; name: string; kind: "image" | "file"; mime: string; url: string; size: number };

type TemplateItem = { id: string; name: string; channel: string; subject?: string; body: string };
type VariableItem = { label: string; key: string };

type Activity = {
  id: string;
  type: ActType;
  subject: string | null;
  body: string | null;
  outcome: string | null;
  dueAt: string | null;
  meetingAt: string | null;
  meetingLink: string | null;
  attachments: string | null;
  completed: boolean;
  authorName: string | null;
  authorUserId: string | null;
  editedByName: string | null;
  editedByUserId: string | null;
  editedAt: string | null;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
};

function parseMedia(raw: string | null | undefined): Media[] {
  if (!raw) return [];
  try { const a = JSON.parse(raw); return Array.isArray(a) ? a : []; } catch { return []; }
}
function fmtBytes(n: number): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
function genId(): string {
  try { return crypto.randomUUID(); } catch { return `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
}

const TYPE_META: Record<ActType, { label: string; plural: string; icon: typeof StickyNote; color: string; bg: string }> = {
  NOTE:    { label: "Note",    plural: "Notes",    icon: StickyNote,  color: "text-amber-600",   bg: "bg-amber-50 border-amber-200" },
  EMAIL:   { label: "Email",   plural: "Emails",   icon: Mail,        color: "text-blue-600",    bg: "bg-blue-50 border-blue-200" },
  CALL:    { label: "Call",    plural: "Calls",    icon: Phone,       color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  TASK:    { label: "Task",    plural: "Tasks",    icon: CheckSquare, color: "text-violet-600",  bg: "bg-violet-50 border-violet-200" },
  MEETING: { label: "Meeting", plural: "Meetings", icon: CalendarDays,color: "text-rose-600",    bg: "bg-rose-50 border-rose-200" },
};
const COMPOSER_ORDER: ActType[] = ["NOTE", "EMAIL", "CALL", "TASK", "MEETING"];

// Reusable snippets an agent can drop into a note/email quickly.
const SNIPPETS: { label: string; text: string }[] = [
  { label: "Thank you", text: "Thank you for your time today. It was great discussing your property requirements." },
  { label: "Follow up", text: "Following up on our conversation — please let me know if you have any questions." },
  { label: "Shared details", text: "I've shared the property details and pricing. Looking forward to your feedback." },
  { label: "Site visit", text: "Scheduling a site visit — please confirm your availability for this week." },
  { label: "Docs verified", text: "Documents received and verified. Proceeding to the next step." },
  { label: "Not interested", text: "Lead indicated they are not interested at this time. Will re-engage later." },
];

const TEXT_COLORS = ["#0f172a", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#2563eb", "#7c3aed", "#db2777"];
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#e9d5ff", "#fed7aa", "#fecaca"];

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB embedded image cap
const MAX_ATTACH_BYTES = 3 * 1024 * 1024; // 3 MB embedded attachment cap

function fmtDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}
function monthKey(iso: string): string {
  try { return new Date(iso).toLocaleString("en-IN", { month: "long", year: "numeric" }); } catch { return "Earlier"; }
}
// Treat a stored body as rich HTML if it has tags OR HTML entities (e.g. &nbsp;),
// so entity-only bodies decode instead of showing the literal "&nbsp;".
function looksLikeHtml(s: string): boolean { return /<[a-z][\s\S]*>/i.test(s) || /&(nbsp|amp|lt|gt|quot|#\d+);/i.test(s); }
function htmlToText(html: string): string {
  if (typeof document === "undefined") return html.replace(/<[^>]+>/g, " ");
  const d = document.createElement("div"); d.innerHTML = html; return (d.textContent || "").trim();
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] || c));
}
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

type Draft = { subject: string; body: string; outcome: string; dueAt: string; meetingAt: string; meetingLink: string };
const emptyDraft = (): Draft => ({ subject: "", body: "", outcome: "", dueAt: "", meetingAt: "", meetingLink: "" });

/* ───────────────────────── Media preview modal ───────────────────────── */
function MediaPreview({ item, onClose }: { item: Media; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="relative max-w-3xl max-h-[85vh] w-full bg-white rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50">
          <p className="text-sm font-bold text-slate-800 truncate">{item.name} <span className="font-medium text-slate-400">· {fmtBytes(item.size)}</span></p>
          <div className="flex items-center gap-2">
            <a href={item.url} download={item.name} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"><Download className="h-4 w-4" /> Download</a>
            <button type="button" onClick={onClose} className="p-1 rounded-md hover:bg-slate-200 text-slate-500"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="p-3 overflow-auto max-h-[75vh] bg-slate-100 flex items-center justify-center">
          {item.kind === "image" ? (
            <img src={item.url} alt={item.name} className="max-w-full max-h-[70vh] object-contain rounded" />
          ) : item.mime === "application/pdf" ? (
            <iframe src={item.url} title={item.name} className="w-full h-[70vh] bg-white rounded" />
          ) : (
            <div className="text-center py-10">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-2" />
              <a href={item.url} download={item.name} className="text-sm font-bold text-blue-600 hover:underline">Download {item.name}</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Saved attachments list (read view, expand on click) ──────── */
function SavedAttachments({ raw }: { raw: string | null }) {
  const items = parseMedia(raw);
  const [preview, setPreview] = useState<Media | null>(null);
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;
  return (
    <div className="pt-1">
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700">
        <Paperclip className="h-3.5 w-3.5" /> {items.length} attachment{items.length > 1 ? "s" : ""}
        <ChevronDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-1.5 space-y-1.5">
          {items.map((m) => (
            <button key={m.id} type="button" onClick={() => setPreview(m)} className="w-full flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-left hover:border-slate-300">
              {m.kind === "image" ? (
                <img src={m.url} alt={m.name} className="h-9 w-9 rounded object-cover border border-slate-200 shrink-0" />
              ) : (
                <span className="h-9 w-9 rounded bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0"><FileText className="h-4 w-4 text-slate-500" /></span>
              )}
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-bold text-slate-700 truncate">{m.name}</span>
                <span className="block text-[10px] text-slate-400">{fmtBytes(m.size)}</span>
              </span>
              <Maximize2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </button>
          ))}
        </div>
      )}
      {preview && <MediaPreview item={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

/* ─────────────────────────── Rich-text editor ─────────────────────────── */
function RichTextEditor({
  value, onChange, placeholder, media, onMediaChange, variables,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder: string;
  media: Media[];
  onMediaChange: (m: Media[]) => void;
  variables?: VariableItem[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const attachInput = useRef<HTMLInputElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [showColor, setShowColor] = useState(false);
  const [showHi, setShowHi] = useState(false);
  const [showSnip, setShowSnip] = useState(false);
  const [showVars, setShowVars] = useState(false);
  const [empty, setEmpty] = useState(!htmlToText(value || ""));
  const [pendingImg, setPendingImg] = useState<Media | null>(null);
  const [preview, setPreview] = useState<Media | null>(null);

  // Seed the editable once on mount (uncontrolled afterwards to keep the caret stable).
  useEffect(() => {
    if (ref.current && value) ref.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function emit() {
    const html = ref.current?.innerHTML ?? "";
    setEmpty(!htmlToText(html));
    onChange(html);
  }
  function saveSel() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
  }
  function restoreSel() {
    ref.current?.focus();
    const sel = window.getSelection();
    if (savedRange.current && sel) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  }
  function exec(cmd: string, val?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    emit();
  }
  function insertHtml(html: string) {
    restoreSel();
    document.execCommand("insertHTML", false, html);
    emit();
  }
  function addLink() {
    saveSel();
    const url = window.prompt("Link URL (https://…)");
    if (!url) return;
    const safe = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
    restoreSel();
    const sel = window.getSelection();
    if (sel && sel.toString()) document.execCommand("createLink", false, safe);
    else document.execCommand("insertHTML", false, `<a href="${safe}" target="_blank" rel="noreferrer">${safe}</a>`);
    emit();
  }
  function insertImageInBody(m: Media) {
    insertHtml(`<img src="${m.url}" alt="${escapeHtml(m.name)}" style="max-width:100%;border-radius:8px;margin:4px 0;" />`);
  }
  function addToAttachments(m: Media) {
    onMediaChange([...media, m]);
  }
  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("Please choose an image file."); return; }
    if (file.size > MAX_IMAGE_BYTES) { alert("Image must be 2 MB or smaller."); return; }
    const url = await readFileAsDataUrl(file);
    // Ask how to place the image: in the body, as an attachment, or both.
    setPendingImg({ id: genId(), name: file.name, kind: "image", mime: file.type, url, size: file.size });
  }
  async function onPickAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACH_BYTES) { alert("Attachment must be 3 MB or smaller."); return; }
    const url = await readFileAsDataUrl(file);
    addToAttachments({ id: genId(), name: file.name, kind: file.type.startsWith("image/") ? "image" : "file", mime: file.type, url, size: file.size });
  }
  function removeMedia(id: string) { onMediaChange(media.filter((m) => m.id !== id)); }

  const btn = "h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-600 hover:bg-slate-100";
  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-visible">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap px-1.5 py-1 border-b border-slate-200 bg-slate-50/70">
        <button type="button" title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} className={btn}><Bold className="h-4 w-4" /></button>
        <button type="button" title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} className={btn}><Italic className="h-4 w-4" /></button>
        <button type="button" title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} className={btn}><Underline className="h-4 w-4" /></button>
        <span className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Text colour */}
        <div className="relative">
          <button type="button" title="Text colour" onMouseDown={(e) => { e.preventDefault(); saveSel(); }} onClick={() => { setShowColor((s) => !s); setShowHi(false); setShowSnip(false); setShowVars(false); }} className={btn}><Type className="h-4 w-4" /></button>
          {showColor && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColor(false)} />
              <div className="absolute left-0 mt-1 z-20 flex gap-1 p-2 rounded-lg border border-slate-200 bg-white shadow-xl">
                {TEXT_COLORS.map((c) => (
                  <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { restoreSel(); document.execCommand("foreColor", false, c); emit(); setShowColor(false); }} className="h-5 w-5 rounded-full border border-slate-300" style={{ background: c }} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Highlight */}
        <div className="relative">
          <button type="button" title="Highlight" onMouseDown={(e) => { e.preventDefault(); saveSel(); }} onClick={() => { setShowHi((s) => !s); setShowColor(false); setShowSnip(false); setShowVars(false); }} className={btn}><Highlighter className="h-4 w-4" /></button>
          {showHi && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowHi(false)} />
              <div className="absolute left-0 mt-1 z-20 flex gap-1 p-2 rounded-lg border border-slate-200 bg-white shadow-xl">
                {HIGHLIGHTS.map((c) => (
                  <button key={c} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { restoreSel(); if (!document.execCommand("hiliteColor", false, c)) document.execCommand("backColor", false, c); emit(); setShowHi(false); }} className="h-5 w-5 rounded border border-slate-300" style={{ background: c }} />
                ))}
              </div>
            </>
          )}
        </div>
        <span className="w-px h-5 bg-slate-200 mx-0.5" />

        <button type="button" title="Add link" onMouseDown={(e) => e.preventDefault()} onClick={addLink} className={btn}><Link2 className="h-4 w-4" /></button>

        {/* Image + placement choice */}
        <div className="relative">
          <button type="button" title="Insert image" onMouseDown={(e) => { e.preventDefault(); saveSel(); }} onClick={() => imgInput.current?.click()} className={btn}><ImageIcon className="h-4 w-4" /></button>
          {pendingImg && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPendingImg(null)} />
              <div className="absolute left-0 mt-1 z-20 w-52 p-1 rounded-lg border border-slate-200 bg-white shadow-xl">
                <p className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide">Add image as…</p>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { insertImageInBody(pendingImg); setPendingImg(null); }} className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50 text-xs font-bold text-slate-700">Insert in email body</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { addToAttachments(pendingImg); setPendingImg(null); }} className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50 text-xs font-bold text-slate-700">Add as attachment</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { insertImageInBody(pendingImg); addToAttachments(pendingImg); setPendingImg(null); }} className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50 text-xs font-bold text-slate-700">Both</button>
              </div>
            </>
          )}
        </div>
        <button type="button" title="Attach file" onMouseDown={(e) => { e.preventDefault(); saveSel(); }} onClick={() => attachInput.current?.click()} className={btn}><Paperclip className="h-4 w-4" /></button>

        {/* Variables */}
        {variables && variables.length > 0 && (
          <div className="relative">
            <button type="button" title="Insert variable" onMouseDown={(e) => { e.preventDefault(); saveSel(); }} onClick={() => { setShowVars((s) => !s); setShowColor(false); setShowHi(false); setShowSnip(false); }} className={`${btn} w-auto px-1.5 gap-0.5`}><Braces className="h-4 w-4" /><ChevronDown className="h-3 w-3" /></button>
            {showVars && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowVars(false)} />
                <div className="absolute left-0 mt-1 z-20 w-64 max-h-64 overflow-y-auto p-1 rounded-lg border border-slate-200 bg-white shadow-xl">
                  {variables.map((v) => (
                    <button key={v.key} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { insertHtml(escapeHtml(v.key)); setShowVars(false); }} className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50">
                      <span className="block text-xs font-bold text-slate-700">{v.label}</span>
                      <span className="block text-[11px] text-slate-400 font-mono truncate">{v.key}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Snippets */}
        <div className="relative">
          <button type="button" title="Insert snippet" onMouseDown={(e) => { e.preventDefault(); saveSel(); }} onClick={() => { setShowSnip((s) => !s); setShowColor(false); setShowHi(false); setShowVars(false); }} className={`${btn} w-auto px-1.5 gap-0.5`}><MessageSquarePlus className="h-4 w-4" /><ChevronDown className="h-3 w-3" /></button>
          {showSnip && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSnip(false)} />
              <div className="absolute left-0 mt-1 z-20 w-60 p-1 rounded-lg border border-slate-200 bg-white shadow-xl">
                {SNIPPETS.map((s) => (
                  <button key={s.label} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { insertHtml(s.text); setShowSnip(false); }} className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50">
                    <span className="block text-xs font-bold text-slate-700">{s.label}</span>
                    <span className="block text-[11px] text-slate-400 truncate">{s.text}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <input ref={imgInput} type="file" accept="image/*" hidden onChange={onPickImage} />
        <input ref={attachInput} type="file" hidden onChange={onPickAttach} />
      </div>

      {/* Editable area */}
      <div className="relative">
        {empty && <span className="pointer-events-none absolute left-3 top-2.5 text-sm text-slate-400">{placeholder}</span>}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={saveSel}
          className="crm-rte min-h-[90px] max-h-[320px] overflow-y-auto px-3 py-2.5 text-sm text-slate-800 outline-none leading-relaxed"
        />
      </div>

      {/* Attachments list (collapsed rows that expand on click) */}
      {media.length > 0 && (
        <div className="border-t border-slate-200 px-2.5 py-2 space-y-1.5 bg-slate-50/50">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Attachments ({media.length})</p>
          {media.map((m) => (
            <div key={m.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
              <button type="button" onClick={() => setPreview(m)} className="shrink-0" title="Expand">
                {m.kind === "image" ? (
                  <img src={m.url} alt={m.name} className="h-8 w-8 rounded object-cover border border-slate-200" />
                ) : (
                  <span className="h-8 w-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center"><FileText className="h-4 w-4 text-slate-500" /></span>
                )}
              </button>
              <button type="button" onClick={() => setPreview(m)} className="flex-1 min-w-0 text-left">
                <span className="block text-xs font-bold text-slate-700 truncate">{m.name}</span>
                <span className="block text-[10px] text-slate-400">{fmtBytes(m.size)}</span>
              </button>
              <button type="button" onClick={() => setPreview(m)} className="p-1 rounded-md hover:bg-slate-100 text-slate-500" title="Expand"><Maximize2 className="h-3.5 w-3.5" /></button>
              {m.kind === "image" && (
                <button type="button" onClick={() => insertImageInBody(m)} className="p-1 rounded-md hover:bg-slate-100 text-slate-500" title="Insert in body"><ImageIcon className="h-3.5 w-3.5" /></button>
              )}
              <button type="button" onClick={() => removeMedia(m.id)} className="p-1 rounded-md hover:bg-rose-50 text-rose-500" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {preview && <MediaPreview item={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
/* ───────────────────────────────────────────────────────────────────────── */

export function UserCrmActivity({ contactId, contactName, contactEmail }: { contactId: string; contactName: string; contactEmail?: string }) {
  const { data: session } = useSession();
  const fromName = session?.user?.name || "Me";
  const fromEmail = session?.user?.email || "";
  const [activities, setActivities] = useState<Activity[]>([]);
  // HubSpot-style email recipient fields (EMAIL composer only).
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("");
  const [emailBcc, setEmailBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [schedulingLink, setSchedulingLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ALL" | ActType>("ALL");
  const [search, setSearch] = useState("");
  const [composer, setComposer] = useState<ActType | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(emptyDraft());
  const [showSettings, setShowSettings] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  // Media attachments for the new-activity composer and the inline editor.
  const [draftMedia, setDraftMedia] = useState<Media[]>([]);
  const [editMedia, setEditMedia] = useState<Media[]>([]);
  // Email templates + variables (loaded once).
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [variables, setVariables] = useState<VariableItem[]>([]);
  const [showTpl, setShowTpl] = useState(false);
  const [editorNonce, setEditorNonce] = useState(0); // bump to re-seed the composer editor (e.g. after applying a template)
  // Meeting-invite send channels + configured sender accounts.
  const [meetingSend, setMeetingSend] = useState({ email: true, whatsapp: false, sms: false });
  const [sendEmailNow, setSendEmailNow] = useState(true); // EMAIL composer: actually deliver, not just log
  const [senders, setSenders] = useState<{ id: string; label: string; fromEmail: string }[]>([]);
  const [activeSenderId, setActiveSenderId] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState(""); // the address the system actually sends from

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${contactId}/activities`);
      const data = await res.json();
      if (res.ok) { setActivities(data.activities ?? []); setSchedulingLink(data.schedulingLink ?? ""); setLinkInput(data.schedulingLink ?? ""); }
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [contactId]);

  // Load email templates + merge variables once.
  useEffect(() => {
    (async () => {
      try {
        const [tplRes, varRes] = await Promise.all([
          fetch("/api/admin/templates"), fetch("/api/admin/variables"),
        ]);
        if (tplRes.ok) {
          const d = await tplRes.json();
          setTemplates((d.templates ?? []).filter((t: TemplateItem) => t.channel === "email"));
        }
        if (varRes.ok) {
          const d = await varRes.json();
          const sys: VariableItem[] = (d.systemVariables ?? []).map((v: any) => ({ label: v.label, key: v.key }));
          const glob: VariableItem[] = (d.globalCustomVariables ?? []).map((v: any) => ({ label: v.name, key: v.key }));
          setVariables([...sys, ...glob]);
        }
        const sndRes = await fetch("/api/admin/email-senders");
        if (sndRes.ok) {
          const d = await sndRes.json();
          setSenders((d.senders ?? []).map((s: any) => ({ id: s.id, label: s.label, fromEmail: s.fromEmail })));
          setActiveSenderId(d.activeId ?? "");
          setEffectiveFrom(d.effectiveFrom ?? "");
        }
      } catch { /* non-fatal */ }
    })();
  }, []);

  // Replace known contact variables in a template string.
  function fillVars(s: string): string {
    return (s || "")
      .replace(/\{\{name\}\}/g, contactName || "")
      .replace(/\{\{email\}\}/g, contactEmail || "");
  }
  function applyTemplate(t: TemplateItem) {
    let body = fillVars(t.body || "");
    // Plain-text templates keep their line breaks when shown in the rich editor.
    if (body && !looksLikeHtml(body)) body = escapeHtml(body).replace(/\n/g, "<br>");
    setDraft((d) => ({ ...d, subject: fillVars(t.subject || ""), body }));
    setEditorNonce((n) => n + 1);
    setShowTpl(false);
  }
  async function saveAsTemplate() {
    const name = window.prompt("Template name");
    if (!name || !name.trim()) return;
    const tpl: TemplateItem = { id: `tpl-${Date.now()}`, name: name.trim(), channel: "email", subject: draft.subject || "", body: draft.body || "" };
    const res = await fetch("/api/admin/templates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: tpl }),
    });
    if (res.ok) { setTemplates((list) => [tpl, ...list]); alert("Saved as template."); }
    else alert("Could not save template.");
  }

  const usesRichText = (t: ActType) => t === "NOTE" || t === "EMAIL";

  function openComposer(type: ActType) {
    setComposer(type);
    const d = emptyDraft();
    if (type === "MEETING" && schedulingLink) d.meetingLink = schedulingLink;
    setDraft(d);
    setDraftMedia([]);
    setEditorNonce((n) => n + 1);
    if (type === "EMAIL") {
      setEmailTo(contactEmail ? `${contactName} <${contactEmail}>` : contactName);
      setEmailCc(""); setEmailBcc(""); setShowCc(false); setShowBcc(false);
    }
  }

  async function createActivity() {
    if (!composer) return;
    const bodyText = usesRichText(composer) ? htmlToText(draft.body) : draft.body.trim();
    const hasContent = bodyText || draft.subject.trim() || draft.outcome.trim() || draft.meetingAt || draft.dueAt || draftMedia.length > 0;
    if (!hasContent) return;
    // For emails, record the recipients (To / From / Cc / Bcc) as a header in the body.
    let bodyToSave = draft.body;
    let meetingLinkToSave = draft.meetingLink;
    if (composer === "EMAIL") {
      const rows: string[] = [];
      if (emailTo.trim()) rows.push(`<b>To:</b> ${escapeHtml(emailTo.trim())}`);
      rows.push(`<b>From:</b> ${escapeHtml(effectiveFrom || (fromEmail ? `${fromName} <${fromEmail}>` : fromName))}`);
      if (emailCc.trim()) rows.push(`<b>Cc:</b> ${escapeHtml(emailCc.trim())}`);
      if (emailBcc.trim()) rows.push(`<b>Bcc:</b> ${escapeHtml(emailBcc.trim())}`);
      const header = `<div style="font-size:12px;color:#475569;border-bottom:1px solid #e2e8f0;padding-bottom:6px;margin-bottom:8px;line-height:1.6">${rows.join("<br/>")}</div>`;
      bodyToSave = header + (draft.body || "");
    }
    setSaving(true);
    try {
      // For meetings, send the invite (email / WhatsApp / SMS) through the meetings API.
      if (composer === "MEETING") {
        const channels = (["email", "whatsapp", "sms"] as const).filter((c) => meetingSend[c]);
        if (channels.length > 0) {
          const parts: string[] = [];
          const bt = htmlToText(draft.body);
          if (bt) parts.push(bt);
          if (draft.meetingAt) parts.push(`Proposed time: ${fmtDateTime(draft.meetingAt)}`);
          try {
            const mres = await fetch("/api/admin/meetings", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: contactId,
                title: draft.subject || "Meeting",
                message: parts.join("\n\n"),
                customUrl: draft.meetingLink || undefined,
                sendVia: channels,
              }),
            });
            const md = await mres.json();
            if (!mres.ok) {
              alert(md.error || "Could not send the meeting invite.");
            } else {
              if (!meetingLinkToSave && md.scheduleUrl) meetingLinkToSave = md.scheduleUrl;
              bodyToSave = (draft.body || "") +
                `<div style="font-size:12px;color:#047857;margin-top:6px">📧 Invite sent via ${channels.join(", ")}${md.scheduleUrl ? ` · <a href="${md.scheduleUrl}" target="_blank" rel="noreferrer">scheduling link</a>` : ""}</div>`;
            }
          } catch { alert("Could not send the meeting invite."); }
        }
      }

      // For emails, actually deliver the message (not just log it) when requested.
      if (composer === "EMAIL" && sendEmailNow && emailTo.trim()) {
        try {
          const sres = await fetch("/api/admin/crm/send-email", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: emailTo, cc: emailCc, bcc: emailBcc, subject: draft.subject, html: draft.body, attachments: draftMedia }),
          });
          const sd = await sres.json();
          if (!sres.ok) {
            alert(sd.error || "Could not send the email. It will be logged only.");
            bodyToSave += `<div style="font-size:12px;color:#b45309;margin-top:6px">⚠️ Send failed — logged only.</div>`;
          } else if (sd.delivered && sd.provider !== "dev") {
            bodyToSave += `<div style="font-size:12px;color:#047857;margin-top:6px">✅ Email sent to recipient.</div>`;
          } else if (!sd.delivered && sd.error) {
            alert(`Email could not be sent: ${sd.error}`);
            bodyToSave += `<div style="font-size:12px;color:#b45309;margin-top:6px">⚠️ Send failed (${escapeHtml(sd.error)}) — logged only.</div>`;
          } else {
            bodyToSave += `<div style="font-size:12px;color:#b45309;margin-top:6px">⚠️ Simulated — not actually delivered. Set up Gmail SMTP or verify your Resend domain (Integrations).</div>`;
          }
        } catch { alert("Could not send the email. It will be logged only."); }
      }

      const res = await fetch(`/api/admin/users/${contactId}/activities`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: composer,
          subject: draft.subject || null,
          body: bodyToSave || null,
          outcome: draft.outcome || null,
          dueAt: draft.dueAt || null,
          meetingAt: draft.meetingAt || null,
          meetingLink: meetingLinkToSave || null,
          attachments: draftMedia.length ? JSON.stringify(draftMedia) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) { setActivities((a) => [data.activity, ...a]); setComposer(null); setDraft(emptyDraft()); setDraftMedia([]); }
    } finally { setSaving(false); }
  }

  function startEdit(a: Activity) {
    setMenuFor(null);
    setEditingId(a.id);
    setEditDraft({
      subject: a.subject ?? "", body: a.body ?? "", outcome: a.outcome ?? "",
      dueAt: a.dueAt ? a.dueAt.slice(0, 16) : "", meetingAt: a.meetingAt ? a.meetingAt.slice(0, 16) : "",
      meetingLink: a.meetingLink ?? "",
    });
    setEditMedia(parseMedia(a.attachments));
  }

  async function saveEdit(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${contactId}/activities`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: id, subject: editDraft.subject, body: editDraft.body, outcome: editDraft.outcome,
          dueAt: editDraft.dueAt || null, meetingAt: editDraft.meetingAt || null, meetingLink: editDraft.meetingLink || null,
          attachments: editMedia.length ? JSON.stringify(editMedia) : null,
        }),
      });
      const data = await res.json();
      if (res.ok) { setActivities((list) => list.map((x) => (x.id === id ? data.activity : x))); setEditingId(null); }
    } finally { setSaving(false); }
  }

  async function toggleTask(a: Activity) {
    const res = await fetch(`/api/admin/users/${contactId}/activities`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId: a.id, completed: !a.completed }),
    });
    const data = await res.json();
    if (res.ok) setActivities((list) => list.map((x) => (x.id === a.id ? data.activity : x)));
  }

  async function deleteActivity(id: string) {
    setMenuFor(null);
    if (!window.confirm("Delete this activity? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/users/${contactId}/activities?activityId=${id}`, { method: "DELETE" });
    if (res.ok) setActivities((list) => list.filter((x) => x.id !== id));
  }

  function toggleComments(id: string) {
    setOpenComments((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function addComment(activityId: string) {
    const body = (commentDrafts[activityId] || "").trim();
    if (!body) return;
    const res = await fetch(`/api/admin/users/${contactId}/activities`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: body, commentActivityId: activityId }),
    });
    const data = await res.json();
    if (res.ok) {
      setActivities((list) => list.map((x) => (x.id === activityId ? { ...x, comments: [...(x.comments || []), data.comment] } : x)));
      setCommentDrafts((d) => ({ ...d, [activityId]: "" }));
    }
  }

  async function deleteComment(activityId: string, commentId: string) {
    const res = await fetch(`/api/admin/users/${contactId}/activities?commentId=${commentId}`, { method: "DELETE" });
    if (res.ok) setActivities((list) => list.map((x) => (x.id === activityId ? { ...x, comments: (x.comments || []).filter((c) => c.id !== commentId) } : x)));
  }

  async function saveSchedulingLink() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${contactId}/activities`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setSchedulingLink: linkInput.trim() }),
      });
      if (res.ok) { setSchedulingLink(linkInput.trim()); setShowSettings(false); }
    } finally { setSaving(false); }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: activities.length };
    for (const t of COMPOSER_ORDER) c[t] = activities.filter((a) => a.type === t).length;
    return c;
  }, [activities]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activities
      .filter((a) => tab === "ALL" || a.type === tab)
      .filter((a) => !q || `${a.subject ?? ""} ${htmlToText(a.body ?? "")} ${a.outcome ?? ""} ${a.authorName ?? ""}`.toLowerCase().includes(q));
  }, [activities, tab, search]);

  const grouped = useMemo(() => {
    const groups: { month: string; items: Activity[] }[] = [];
    for (const a of filtered) {
      const m = monthKey(a.createdAt);
      const g = groups.find((x) => x.month === m);
      if (g) g.items.push(a); else groups.push({ month: m, items: [a] });
    }
    return groups;
  }, [filtered]);

  const inputCls = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden">
      {/* Styling for rich-text content rendered from stored HTML */}
      <style>{`
        .crm-rte a, .crm-note a { color:#2563eb; text-decoration:underline; }
        .crm-rte img, .crm-note img { max-width:100%; border-radius:8px; }
        .crm-note ul { list-style:disc; padding-left:1.25rem; }
        .crm-note ol { list-style:decimal; padding-left:1.25rem; }
        .crm-attach { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; margin:2px 0; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc; font-size:12px; color:#334155 !important; text-decoration:none !important; }
      `}</style>

      {/* Composer bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-slate-200 flex-wrap">
        {COMPOSER_ORDER.map((t) => {
          const M = TYPE_META[t]; const Icon = M.icon; const active = composer === t;
          return (
            <button key={t} type="button" onClick={() => (active ? setComposer(null) : openComposer(t))}
              className={`inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition ${active ? `${M.bg} ${M.color}` : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
              <Icon className={`h-4 w-4 ${active ? M.color : "text-slate-500"}`} />
              {M.label}
            </button>
          );
        })}
        <button type="button" onClick={() => setShowSettings((s) => !s)} title="Calendar scheduling link"
          className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50">
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* Scheduling-link settings */}
      {showSettings && (
        <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 space-y-2">
          <label className="text-xs font-bold text-slate-700">Meeting scheduling link (Calendly / Cal.com / any)</label>
          <div className="flex gap-2">
            <input value={linkInput} onChange={(e) => setLinkInput(e.target.value)} placeholder="https://calendly.com/you/30min" className={inputCls} />
            <button type="button" onClick={saveSchedulingLink} disabled={saving} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
          </div>
          <p className="text-[11px] text-slate-500">New meetings are pre-filled with this link so you can book directly.</p>
        </div>
      )}

      {/* Composer panel */}
      {composer && (
        <div className="px-4 py-3 bg-white border-b border-slate-200 space-y-2.5">
          {/* Email template bar: apply a saved template or save the current email as one */}
          {composer === "EMAIL" && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <button type="button" onClick={() => setShowTpl((s) => !s)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50">
                  <LayoutTemplate className="h-4 w-4" /> Templates <ChevronDown className="h-3 w-3" />
                </button>
                {showTpl && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTpl(false)} />
                    <div className="absolute left-0 mt-1 z-20 w-72 max-h-64 overflow-y-auto p-1 rounded-lg border border-slate-200 bg-white shadow-xl">
                      {templates.length === 0 ? (
                        <p className="px-2.5 py-2 text-xs text-slate-400">No email templates yet. Write one and click “Save as template”.</p>
                      ) : templates.map((t) => (
                        <button key={t.id} type="button" onClick={() => applyTemplate(t)} className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-50">
                          <span className="block text-xs font-bold text-slate-700 truncate">{t.name}</span>
                          {t.subject && <span className="block text-[11px] text-slate-400 truncate">{t.subject}</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button type="button" onClick={saveAsTemplate}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50">
                <Save className="h-4 w-4" /> Save as template
              </button>
              <span className="text-[11px] text-slate-400">Variables fill from the contact; use the {"{{ }}"} button to insert more.</span>
            </div>
          )}
          {/* HubSpot-style email recipients */}
          {composer === "EMAIL" && (
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 text-sm">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="w-12 shrink-0 text-xs font-bold text-slate-500">To</span>
                <input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="Recipient name &lt;email@domain.com&gt;"
                  className="flex-1 outline-none text-slate-900 bg-transparent" />
                <div className="flex items-center gap-2 shrink-0">
                  {!showCc && <button type="button" onClick={() => setShowCc(true)} className="text-xs font-bold text-blue-600 hover:underline">Cc</button>}
                  {!showBcc && <button type="button" onClick={() => setShowBcc(true)} className="text-xs font-bold text-blue-600 hover:underline">Bcc</button>}
                </div>
              </div>
              {showCc && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="w-12 shrink-0 text-xs font-bold text-slate-500">Cc</span>
                  <input value={emailCc} onChange={(e) => setEmailCc(e.target.value)} placeholder="cc@domain.com" className="flex-1 outline-none text-slate-900 bg-transparent" />
                </div>
              )}
              {showBcc && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="w-12 shrink-0 text-xs font-bold text-slate-500">Bcc</span>
                  <input value={emailBcc} onChange={(e) => setEmailBcc(e.target.value)} placeholder="bcc@domain.com" className="flex-1 outline-none text-slate-900 bg-transparent" />
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50/60">
                <span className="w-12 shrink-0 text-xs font-bold text-slate-500">From</span>
                <span className="flex-1 text-slate-600 truncate">{effectiveFrom || (fromEmail ? `${fromName} <${fromEmail}>` : fromName)}</span>
                <a href="/admin/integrations" className="shrink-0 text-xs font-bold text-blue-600 hover:underline">change</a>
              </div>
            </div>
          )}
          {(composer === "EMAIL" || composer === "CALL" || composer === "TASK" || composer === "MEETING") && (
            <input value={draft.subject} onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
              placeholder={composer === "TASK" ? "Task title" : composer === "MEETING" ? "Meeting title" : composer === "EMAIL" ? "Email subject" : "Call subject"} className={inputCls} />
          )}
          {composer === "CALL" && (
            <select value={draft.outcome} onChange={(e) => setDraft((d) => ({ ...d, outcome: e.target.value }))} className={inputCls}>
              <option value="">Call outcome…</option>
              <option>Connected</option><option>Left voicemail</option><option>No answer</option><option>Busy</option><option>Wrong number</option>
            </select>
          )}
          {composer === "TASK" && (
            <div><label className="text-[11px] font-bold text-slate-500">Due date</label>
              <input type="datetime-local" value={draft.dueAt} onChange={(e) => setDraft((d) => ({ ...d, dueAt: e.target.value }))} className={inputCls} /></div>
          )}
          {composer === "MEETING" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><label className="text-[11px] font-bold text-slate-500">Date & time</label>
                  <input type="datetime-local" value={draft.meetingAt} onChange={(e) => setDraft((d) => ({ ...d, meetingAt: e.target.value }))} className={inputCls} /></div>
                <div><label className="text-[11px] font-bold text-slate-500">Scheduling / meeting link</label>
                  <input value={draft.meetingLink} onChange={(e) => setDraft((d) => ({ ...d, meetingLink: e.target.value }))} placeholder="Calendly / Cal.com link" className={inputCls} /></div>
              </div>
              {/* Send the invite to the contact */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Send invite to {contactName}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {(["email", "whatsapp", "sms"] as const).map((ch) => (
                    <label key={ch} className="inline-flex items-center gap-1.5 font-semibold text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={meetingSend[ch]} onChange={(e) => setMeetingSend((m) => ({ ...m, [ch]: e.target.checked }))} className="rounded border-slate-300" />
                      {ch === "email" ? "Email" : ch === "whatsapp" ? "WhatsApp" : "SMS"}
                    </label>
                  ))}
                </div>
                {meetingSend.email && (
                  <p className="text-[11px] text-slate-500">
                    Emailed from: <span className="font-semibold text-slate-700">{effectiveFrom || "default account"}</span>
                    <a href="/admin/integrations" className="ml-1 text-blue-600 hover:underline">change</a>
                  </p>
                )}
                {!meetingSend.email && !meetingSend.whatsapp && !meetingSend.sms && (
                  <p className="text-[11px] text-amber-600">No channel selected — the meeting will only be logged, not sent.</p>
                )}
              </div>
            </>
          )}
          {usesRichText(composer) ? (
            <RichTextEditor key={`new-${composer}-${editorNonce}`} value={draft.body} onChange={(html) => setDraft((d) => ({ ...d, body: html }))}
              media={draftMedia} onMediaChange={setDraftMedia}
              variables={composer === "EMAIL" ? variables : undefined}
              placeholder={composer === "NOTE" ? "Add a note…" : "Log the email content…"} />
          ) : (
            <textarea value={draft.body} onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))} rows={3}
              placeholder={composer === "CALL" ? "Call notes…" : composer === "TASK" ? "Task details…" : "Agenda / notes…"}
              className={`${inputCls} resize-none`} />
          )}
          {/* Email delivery toggle */}
          {composer === "EMAIL" && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5 space-y-1">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input type="checkbox" checked={sendEmailNow} onChange={(e) => setSendEmailNow(e.target.checked)} className="rounded border-slate-300" />
                Send this email to the recipient now
              </label>
              {sendEmailNow ? (
                <p className="text-[11px] text-slate-500">
                  Sent from: <span className="font-semibold text-slate-700">{effectiveFrom || "default account"}</span>
                  <a href="/admin/integrations" className="ml-1 text-blue-600 hover:underline">change</a>
                </p>
              ) : (
                <p className="text-[11px] text-amber-600">Off — the email will only be logged to the timeline, not delivered.</p>
              )}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button type="button" onClick={createActivity} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {composer === "MEETING" && (meetingSend.email || meetingSend.whatsapp || meetingSend.sms)
                ? "Save & send invite"
                : composer === "EMAIL" && sendEmailNow
                ? "Send email"
                : `Save ${TYPE_META[composer].label.toLowerCase()}`}
            </button>
            <button type="button" onClick={() => setComposer(null)} className="px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
          </div>
        </div>
      )}

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white border-b border-slate-200 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          {(["ALL", ...COMPOSER_ORDER] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${tab === t ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}>
              {t === "ALL" ? "All activities" : TYPE_META[t].plural} <span className="opacity-60">({counts[t] ?? 0})</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activities" className="w-44 rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs outline-none focus:border-slate-400" />
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4 space-y-5 max-h-[520px] overflow-y-auto">
        {loading ? (
          <p className="text-center text-sm text-slate-400 py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></p>
        ) : grouped.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10">No activities yet. Use the buttons above to log a note, email, call, task or meeting.</p>
        ) : grouped.map((g) => (
          <div key={g.month}>
            <p className="text-sm font-bold text-slate-700 mb-2">{g.month}</p>
            <div className="space-y-3">
              {g.items.map((a) => {
                const M = TYPE_META[a.type]; const Icon = M.icon; const editing = editingId === a.id;
                const commentCount = a.comments?.length ?? 0;
                const commentsOpen = openComments.has(a.id);
                return (
                  <div key={a.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/60">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center justify-center h-6 w-6 rounded-lg border ${M.bg}`}><Icon className={`h-3.5 w-3.5 ${M.color}`} /></span>
                        <p className="text-sm font-bold text-slate-800 truncate">
                          {M.label} <span className="font-medium text-slate-500">by {a.authorName ?? "Admin"}{a.authorUserId ? ` · ${a.authorUserId}` : ""}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono font-bold text-slate-500 hidden sm:inline">{fmtDateTime(a.createdAt)}</span>
                        <div className="relative">
                          <button type="button" onClick={() => setMenuFor(menuFor === a.id ? null : a.id)} className="px-2 py-1 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50">Actions ▾</button>
                          {menuFor === a.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuFor(null)} />
                              <div className="absolute right-0 mt-1 w-32 rounded-lg border border-slate-200 bg-white shadow-xl z-20 overflow-hidden">
                                <button type="button" onClick={() => startEdit(a)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Edit3 className="h-3.5 w-3.5" /> Edit</button>
                                <button type="button" onClick={() => deleteActivity(a.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border-t border-slate-100"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-3 py-2.5">
                      {editing ? (
                        <div className="space-y-2">
                          {a.type !== "NOTE" && <input value={editDraft.subject} onChange={(e) => setEditDraft((d) => ({ ...d, subject: e.target.value }))} placeholder="Subject / title" className={inputCls} />}
                          {a.type === "TASK" && <input type="datetime-local" value={editDraft.dueAt} onChange={(e) => setEditDraft((d) => ({ ...d, dueAt: e.target.value }))} className={inputCls} />}
                          {a.type === "MEETING" && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input type="datetime-local" value={editDraft.meetingAt} onChange={(e) => setEditDraft((d) => ({ ...d, meetingAt: e.target.value }))} className={inputCls} />
                              <input value={editDraft.meetingLink} onChange={(e) => setEditDraft((d) => ({ ...d, meetingLink: e.target.value }))} placeholder="Meeting link" className={inputCls} />
                            </div>
                          )}
                          {usesRichText(a.type) ? (
                            <RichTextEditor key={`edit-${a.id}`} value={editDraft.body} onChange={(html) => setEditDraft((d) => ({ ...d, body: html }))}
                              media={editMedia} onMediaChange={setEditMedia}
                              variables={a.type === "EMAIL" ? variables : undefined}
                              placeholder="Edit the note…" />
                          ) : (
                            <textarea value={editDraft.body} onChange={(e) => setEditDraft((d) => ({ ...d, body: e.target.value }))} rows={3} className={`${inputCls} resize-none`} />
                          )}
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => saveEdit(a.id)} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-50">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save</button>
                            <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {a.type === "TASK" && (
                            <button type="button" onClick={() => toggleTask(a)} className={`inline-flex items-center gap-1.5 text-xs font-bold ${a.completed ? "text-emerald-600" : "text-slate-500"}`}>
                              <span className={`h-4 w-4 rounded border flex items-center justify-center ${a.completed ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>{a.completed && <Check className="h-3 w-3 text-white" />}</span>
                              {a.completed ? "Completed" : "Mark complete"}
                            </button>
                          )}
                          {a.subject && <p className={`text-sm font-bold text-slate-900 ${a.type === "TASK" && a.completed ? "line-through text-slate-400" : ""}`}>{a.subject}</p>}
                          {a.outcome && <span className="inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{a.outcome}</span>}
                          {a.dueAt && <p className="text-xs text-slate-500 flex items-center gap-1"><Clock className="h-3 w-3" /> Due {fmtDateTime(a.dueAt)}</p>}
                          {a.meetingAt && <p className="text-xs text-slate-500 flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {fmtDateTime(a.meetingAt)}</p>}
                          {a.meetingLink && <a href={a.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"><ExternalLink className="h-3 w-3" /> Open booking link</a>}
                          {a.body && (looksLikeHtml(a.body)
                            ? <div className="crm-note text-sm text-slate-700 break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: a.body }} />
                            : <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">{a.body}</p>)}

                          {/* Attachments (expandable list) */}
                          <SavedAttachments raw={a.attachments} />

                          {/* Edit-audit trail */}
                          {a.editedAt && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-0.5">
                              <History className="h-3 w-3" /> Edited by {a.editedByName ?? "Admin"}{a.editedByUserId ? ` · ${a.editedByUserId}` : ""} on {fmtDateTime(a.editedAt)}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400 sm:hidden">{fmtDateTime(a.createdAt)}</p>
                        </div>
                      )}
                    </div>

                    {/* Comments footer */}
                    {!editing && (
                      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/40">
                        <button type="button" onClick={() => toggleComments(a.id)} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700">
                          <MessageCircle className="h-3.5 w-3.5" /> {commentCount > 0 ? `${commentCount} comment${commentCount > 1 ? "s" : ""}` : "Comment"}
                        </button>
                        {commentsOpen && (
                          <div className="mt-2 space-y-2">
                            {(a.comments || []).map((c) => (
                              <div key={c.id} className="flex items-start gap-2">
                                <CornerDownRight className="h-3.5 w-3.5 text-slate-300 mt-1 shrink-0" />
                                <div className="flex-1 min-w-0 rounded-lg bg-white border border-slate-200 px-2.5 py-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-bold text-slate-600 truncate">{c.authorName ?? "Admin"}{c.authorUserId ? ` · ${c.authorUserId}` : ""}</span>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[10px] text-slate-400">{fmtDateTime(c.createdAt)}</span>
                                      <button type="button" onClick={() => deleteComment(a.id, c.id)} className="text-slate-300 hover:text-rose-500" title="Delete comment"><Trash2 className="h-3 w-3" /></button>
                                    </div>
                                  </div>
                                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">{c.body}</p>
                                </div>
                              </div>
                            ))}
                            <div className="flex items-center gap-2 pl-5">
                              <input
                                value={commentDrafts[a.id] || ""}
                                onChange={(e) => setCommentDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addComment(a.id); } }}
                                placeholder="Write a comment…"
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-slate-400"
                              />
                              <button type="button" onClick={() => addComment(a.id)} disabled={!(commentDrafts[a.id] || "").trim()} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-40">
                                <Send className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
