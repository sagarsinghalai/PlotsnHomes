"use client";

import { useState, type RefObject } from "react";
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, Smile, Link2 } from "lucide-react";

const EMOJIS = ["😀","😊","😍","👍","🙏","🎉","🔥","✅","⭐","📍","🏠","💰","📞","📅","✨","❤️","👋","😎","🤝","📢","🛏️","🚿","📐","🔑","🏡","💬"];

/**
 * Formatting toolbar for the plain-text template body. Inserts WhatsApp-native
 * markup (*bold*, _italic_, ~strike~, ```mono```), bullets/numbering, emojis and
 * links. These render natively on WhatsApp; the email channel converts them to
 * HTML on send. (WhatsApp has no underline or text alignment, so those are
 * intentionally omitted.)
 */
export function TemplateFormatToolbar({ textareaRef, value, onChange }: {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
}) {
  const [emojiOpen, setEmojiOpen] = useState(false);

  function apply(transform: (full: string, start: number, end: number) => { text: string; selStart: number; selEnd: number }) {
    const ta = textareaRef.current;
    const start = ta?.selectionStart ?? value.length;
    const end = ta?.selectionEnd ?? value.length;
    const { text, selStart, selEnd } = transform(value, start, end);
    onChange(text);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) { el.focus(); el.setSelectionRange(selStart, selEnd); }
    });
  }

  const wrap = (mark: string, markEnd = mark) =>
    apply((full, start, end) => {
      const inner = full.slice(start, end) || "text";
      const text = full.slice(0, start) + mark + inner + markEnd + full.slice(end);
      const s = start + mark.length;
      return { text, selStart: s, selEnd: s + inner.length };
    });

  const prefixLines = (makePrefix: (i: number) => string) =>
    apply((full, start, end) => {
      const lineStart = full.lastIndexOf("\n", start - 1) + 1;
      const nextNl = full.indexOf("\n", end);
      const lineEnd = nextNl === -1 ? full.length : nextNl;
      const block = full.slice(lineStart, lineEnd) || "";
      const newBlock = block.split("\n").map((ln, i) => makePrefix(i) + ln).join("\n");
      const text = full.slice(0, lineStart) + newBlock + full.slice(lineEnd);
      return { text, selStart: lineStart, selEnd: lineStart + newBlock.length };
    });

  const insertAtCursor = (str: string) =>
    apply((full, start, end) => {
      const text = full.slice(0, start) + str + full.slice(end);
      const s = start + str.length;
      return { text, selStart: s, selEnd: s };
    });

  function insertLink() {
    const url = window.prompt("Enter the URL (WhatsApp will make it clickable):", "https://");
    if (!url || !url.trim()) return;
    const ta = textareaRef.current;
    const hasSelection = ta && ta.selectionStart !== ta.selectionEnd;
    // WhatsApp auto-links bare URLs; keep selected label as "label: url" when text is selected.
    insertAtCursor(hasSelection ? `: ${url.trim()}` : url.trim());
  }

  const btn = "p-1.5 rounded-md text-slate-600 hover:bg-slate-200 transition";
  const sep = <span className="mx-1 h-4 w-px bg-slate-300" />;

  return (
    <div className="relative flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-slate-200 bg-slate-100 px-2 py-1 mt-1">
      <button type="button" title="Bold" className={btn} onClick={() => wrap("*")}><Bold className="h-4 w-4" /></button>
      <button type="button" title="Italic" className={btn} onClick={() => wrap("_")}><Italic className="h-4 w-4" /></button>
      <button type="button" title="Strikethrough" className={btn} onClick={() => wrap("~")}><Strikethrough className="h-4 w-4" /></button>
      <button type="button" title="Monospace" className={btn} onClick={() => wrap("```")}><Code className="h-4 w-4" /></button>
      {sep}
      <button type="button" title="Bulleted list" className={btn} onClick={() => prefixLines(() => "• ")}><List className="h-4 w-4" /></button>
      <button type="button" title="Numbered list" className={btn} onClick={() => prefixLines((i) => `${i + 1}. `)}><ListOrdered className="h-4 w-4" /></button>
      <button type="button" title="Insert link" className={btn} onClick={insertLink}><Link2 className="h-4 w-4" /></button>
      {sep}
      <button type="button" title="Emoji" className={btn} onClick={() => setEmojiOpen((o) => !o)}><Smile className="h-4 w-4" /></button>
      {emojiOpen && (
        <div className="absolute left-2 top-full z-30 mt-1 grid grid-cols-10 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {EMOJIS.map((e) => (
            <button key={e} type="button" className="rounded text-lg hover:bg-slate-100" onClick={() => { insertAtCursor(e); setEmojiOpen(false); }}>{e}</button>
          ))}
        </div>
      )}
      <span className="ml-auto text-[10px] text-slate-400">WhatsApp formatting · renders on WhatsApp &amp; email</span>
    </div>
  );
}
