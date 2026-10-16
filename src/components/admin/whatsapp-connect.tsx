"use client";

import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Smartphone,
  Upload,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AudienceBuilder } from "@/components/admin/audience-builder";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { DEFAULT_COUNTRY_CODE } from "@/lib/locale-defaults";

type WebStatus = {
  status:
    | "idle"
    | "initializing"
    | "qr"
    | "authenticated"
    | "ready"
    | "disconnected"
    | "auth_failure"
    | "error";
  qrDataUrl: string | null;
  linkedNumber: string | null;
  linkedName: string | null;
  connectedAt: string | null;
  lastError: string | null;
};

type CloudInfo = {
  connected: boolean;
  verifiedName: string;
  displayNumber: string;
  qualityRating: string;
  connectedAt: string;
};

type CentralStatus = {
  activeMethod: "cloud" | "web" | "";
  cloud: CloudInfo;
  web: WebStatus;
  ready: boolean;
};

type Template = { id: string; name: string; body: string };

type Props = {
  initialPhoneNumberId: string;
  tokenSet: boolean;
  templates?: Template[];
};

const WEB_ACTIVE = new Set(["initializing", "qr", "authenticated"]);

/** Split pasted text (commas / newlines / semicolons) into candidate numbers. */
function parsePhoneText(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Keep only entries that look like real phone numbers, deduped by digits. */
function validPhones(entries: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of entries) {
    const digits = e.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15) continue;
    if (seen.has(digits)) continue;
    seen.add(digits);
    out.push(e);
  }
  return out;
}

export function WhatsAppConnect({ initialPhoneNumberId, tokenSet, templates = [] }: Props) {
  const [status, setStatus] = useState<CentralStatus | null>(null);
  const [tab, setTab] = useState<"cloud" | "web">("cloud");

  // Cloud form
  const [token, setToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState(initialPhoneNumberId);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [cloudMsg, setCloudMsg] = useState("");

  // Web session
  const [webBusy, setWebBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Notifications
  const [message, setMessage] = useState("Hi {name}, this is a message from our team.");
  const [templateId, setTemplateId] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [audience, setAudience] = useState<string>("leads");
  const [savedAudiences, setSavedAudiences] = useState<{ id: string; name: string }[]>([]);
  const [notifyBusy, setNotifyBusy] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");

  const loadSavedAudiences = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/audiences", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSavedAudiences(data.audiences ?? []);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void loadSavedAudiences();
  }, [loadSavedAudiences]);

  // Custom recipient list (paste + CSV/XLSX upload)
  const [listText, setListText] = useState("");
  const [fileMsg, setFileMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parsedList = useMemo(() => validPhones(parsePhoneText(listText)), [listText]);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (tpl) setMessage(tpl.body);
  }

  async function handleFile(file: File) {
    setFileMsg("Reading…");
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false });
      const cells = rows.flat().map((c) => String(c ?? "").trim());
      const found = validPhones(cells);
      if (found.length === 0) {
        setFileMsg("No phone numbers found in that file.");
        return;
      }
      // Merge with anything already pasted, dedupe.
      const merged = validPhones([...parsePhoneText(listText), ...found]);
      setListText(merged.join("\n"));
      setFileMsg(`Imported ${found.length} number(s) from ${file.name}.`);
    } catch (e) {
      setFileMsg(e instanceof Error ? `Could not read file: ${e.message}` : "Could not read file.");
    }
  }

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/whatsapp/status", { cache: "no-store" });
      if (res.ok) setStatus(await res.json());
    } catch {
      /* ignore transient errors */
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  const web = status?.web;
  const webIsActive = web ? WEB_ACTIVE.has(web.status) : false;

  // Poll the web session while a QR/handshake is in progress.
  useEffect(() => {
    if (webIsActive) {
      if (!pollRef.current) {
        pollRef.current = setInterval(() => void refreshStatus(), 2500);
      }
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current && !webIsActive) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [webIsActive, refreshStatus]);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  async function connectCloud() {
    setCloudBusy(true);
    setCloudMsg("");
    try {
      const res = await fetch("/api/admin/whatsapp/cloud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token || undefined, phoneNumberId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCloudMsg(
          `Connected ✓ ${data.info.verifiedName || "number"} (${data.info.displayNumber || phoneNumberId})`,
        );
        setToken("");
        await refreshStatus();
      } else {
        setCloudMsg(data.error ?? "Verification failed.");
      }
    } catch (e) {
      setCloudMsg(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setCloudBusy(false);
    }
  }

  async function webAction(action: "connect" | "disconnect") {
    setWebBusy(true);
    try {
      const res = await fetch("/api/admin/whatsapp/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.status) setStatus((s) => (s ? { ...s, web: data.status } : s));
      await refreshStatus();
    } catch {
      /* ignore */
    } finally {
      setWebBusy(false);
    }
  }

  async function sendNotification(kind: "test" | "broadcast" | "list") {
    setNotifyBusy(true);
    setNotifyMsg("");
    try {
      const payload =
        kind === "test"
          ? { message, phone: testPhone }
          : kind === "list"
            ? { message, phones: parsedList }
            : audience.startsWith("saved:")
              ? { message, audienceId: audience.replace(/^saved:/, "") }
              : { message, audience };
      const res = await fetch("/api/admin/whatsapp/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (kind === "test") {
        setNotifyMsg(
          data.ok
            ? `Sent via ${data.result?.method}.`
            : data.result?.webUrl
              ? `Not connected — manual link: ${data.result.webUrl}`
              : (data.result?.error ?? data.error ?? "Send failed."),
        );
      } else {
        const s = data.summary;
        setNotifyMsg(
          s
            ? `Broadcast to ${s.audience}: ${s.sent} sent, ${s.failed} failed (of ${s.total}).${
                s.errors?.length ? " e.g. " + s.errors[0] : ""
              }`
            : (data.error ?? "Broadcast failed."),
        );
      }
    } catch (e) {
      setNotifyMsg(e instanceof Error ? e.message : "Send failed.");
    } finally {
      setNotifyBusy(false);
    }
  }

  const cloudConnected = status?.cloud.connected;
  const webReady = web?.status === "ready";
  const anyReady = status?.ready;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold text-slate-900">Central WhatsApp number</h2>
        </div>
        <button
          type="button"
          onClick={() => void refreshStatus()}
          className="text-slate-400 hover:text-slate-700"
          title="Refresh status"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Overall status banner */}
      <div
        className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
          anyReady
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        {anyReady ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {anyReady ? (
          <span>
            Connected — notifications will send from{" "}
            <strong>
              {status?.activeMethod === "web"
                ? web?.linkedNumber || "WhatsApp Web"
                : status?.cloud.displayNumber || "Cloud API"}
            </strong>
            .
          </span>
        ) : (
          <span>No central number connected yet. Connect Cloud API or WhatsApp Web below.</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("cloud")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tab === "cloud" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          Cloud API {cloudConnected ? "✓" : ""}
        </button>
        <button
          type="button"
          onClick={() => setTab("web")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            tab === "web" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
          }`}
        >
          WhatsApp Web (QR) {webReady ? "✓" : ""}
        </button>
      </div>

      {/* Cloud API tab */}
      {tab === "cloud" && (
        <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-xs text-slate-500">
            Official Meta WhatsApp Cloud API. Paste your access token and phone number ID, then
            verify against Meta. Recommended for production.
          </p>
          {status?.cloud.connected && (
            <div className="rounded-lg bg-white border border-emerald-200 p-3 text-xs text-emerald-800">
              <p className="font-semibold">
                {status.cloud.verifiedName || "Verified"} · {status.cloud.displayNumber}
              </p>
              <p>Quality rating: {status.cloud.qualityRating}</p>
            </div>
          )}
          <Label>Access token{tokenSet ? " (saved — leave blank to keep)" : ""}</Label>
          <Input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={tokenSet ? "•••••••• (unchanged)" : "EAAxxxx..."}
          />
          <Label>Phone number ID (Meta)</Label>
          <Input
            value={phoneNumberId}
            onChange={(e) => setPhoneNumberId(e.target.value)}
            placeholder="1234567890"
          />
          <Button type="button" variant="gold" loading={cloudBusy} onClick={() => void connectCloud()}>
            Connect &amp; verify
          </Button>
          {cloudMsg && <p className="text-sm text-slate-600">{cloudMsg}</p>}
        </div>
      )}

      {/* WhatsApp Web tab */}
      {tab === "web" && (
        <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
          <p className="text-xs text-slate-500">
            Link your existing company WhatsApp number as a device — scan the QR with the phone
            (WhatsApp → Linked devices → Link a device). No Meta approval needed.
          </p>

          {web?.status === "ready" ? (
            <div className="rounded-lg bg-white border border-emerald-200 p-3 text-sm text-emerald-800 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span>
                Linked as <strong>{web.linkedNumber}</strong>
                {web.linkedName ? ` (${web.linkedName})` : ""}.
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {web?.qrDataUrl ? (
                <>
                  <div className="rounded-lg border border-slate-200 bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <Image
                      src={web.qrDataUrl}
                      alt="WhatsApp Web QR code"
                      width={240}
                      height={240}
                      unoptimized
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Open WhatsApp on the company phone → Linked devices → Link a device → scan this.
                  </p>
                </>
              ) : webIsActive ? (
                <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {web?.status === "authenticated"
                    ? "Authenticated — finishing up…"
                    : "Starting session / generating QR…"}
                </div>
              ) : null}
            </div>
          )}

          {web?.lastError && <p className="text-xs text-red-600">{web.lastError}</p>}

          <div className="flex gap-2">
            {web?.status === "ready" ? (
              <Button
                type="button"
                variant="secondary"
                loading={webBusy}
                onClick={() => void webAction("disconnect")}
              >
                Disconnect
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="gold"
                  loading={webBusy || webIsActive}
                  onClick={() => void webAction("connect")}
                >
                  {web?.qrDataUrl ? "Regenerate QR" : "Connect / show QR"}
                </Button>
                {webIsActive && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => void webAction("disconnect")}
                  >
                    Cancel
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Send notifications */}
      <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
        <p className="text-sm font-medium text-emerald-900">Send a notification</p>

        {templates.length > 0 && (
          <>
            <Label>Template</Label>
            <select
              value={templateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-sm"
            >
              <option value="">— Write a custom message —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </>
        )}

        <Label>Message (use {"{name}"} or {"{{name}}"} to personalize)</Label>
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (templateId) setTemplateId("");
          }}
          rows={3}
          className="w-full rounded-lg border border-slate-200 p-2 text-sm"
          placeholder="Hi {name}, ..."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Test to one number</Label>
            <PhoneInput
              value={testPhone}
              onChange={setTestPhone}
              defaultCountry={DEFAULT_COUNTRY_CODE}
            />
            <Button
              type="button"
              variant="secondary"
              loading={notifyBusy}
              onClick={() => void sendNotification("test")}
            >
              Send test
            </Button>
          </div>

          <div className="space-y-1">
            <Label>Broadcast to audience</Label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2 text-sm"
            >
              <option value="leads">All leads</option>
              <option value="customers">Customers (buyers &amp; sellers)</option>
              <option value="agents">Agents &amp; staff</option>
              {savedAudiences.length > 0 && (
                <optgroup label="Saved audiences">
                  {savedAudiences.map((a) => (
                    <option key={a.id} value={`saved:${a.id}`}>
                      {a.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <Button
              type="button"
              variant="gold"
              loading={notifyBusy}
              onClick={() => void sendNotification("broadcast")}
            >
              Broadcast now
            </Button>
          </div>
        </div>

        {/* Advanced segmentation: build, save & broadcast to filtered audiences */}
        <AudienceBuilder
          message={message}
          onAudienceChange={loadSavedAudiences}
          selectedAudienceKey={audience}
          onSelectAudienceKey={setAudience}
        />

        {/* Custom recipient list: paste numbers or upload CSV / XLSX */}
        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between">
            <Label>Custom list — paste numbers or upload a file</Label>
            {parsedList.length > 0 && (
              <span className="text-xs font-medium text-emerald-700">
                {parsedList.length} valid number{parsedList.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <textarea
            value={listText}
            onChange={(e) => setListText(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 p-2 text-sm font-mono"
            placeholder={"+91 98765 43210, +91 91234 56789\nor one number per line"}
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Upload CSV / XLSX
            </Button>
            <Button
              type="button"
              variant="gold"
              loading={notifyBusy}
              disabled={parsedList.length === 0}
              onClick={() => void sendNotification("list")}
            >
              Send to list ({parsedList.length})
            </Button>
            {listText && (
              <button
                type="button"
                onClick={() => {
                  setListText("");
                  setFileMsg("");
                }}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Accepts comma- or line-separated numbers. CSV/XLSX: numbers are auto-detected in any
            column. Include the country code (e.g. +91).
          </p>
          {fileMsg && <p className="text-xs text-slate-600">{fileMsg}</p>}
        </div>

        {notifyMsg && <p className="text-sm text-slate-700 break-words">{notifyMsg}</p>}
      </div>
    </section>
  );
}
