"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { validateUserDobAge } from "@/lib/user-validation";
import {
  validateFullName,
  validateNationality,
  validateIdNumber,
  resolveIdRule,
} from "@/lib/kyc-validation";

// ─── Types ────────────────────────────────────────────────────────────────────
type KycStatus = "PENDING" | "APPROVED" | "REJECTED";

interface DocSlot {
  key: string;
  label: string;
  hint: string;
  icon: string;
  required?: boolean;
}

interface UploadState {
  file?: File;
  preview?: string;
  url?: string;
  uploading?: boolean;
  error?: string;
}

// ─── Document slots ───────────────────────────────────────────────────────────
const DOC_SLOTS: DocSlot[] = [
  { key: "photoUrl",          label: "Live Photo / Selfie",     hint: "Clear face photo, no sunglasses", icon: "🤳", required: true },
  { key: "aadhaarFrontUrl",   label: "Aadhaar Card — Front",    hint: "Must show name & Aadhaar number",  icon: "🪪", required: true },
  { key: "aadhaarBackUrl",    label: "Aadhaar Card — Back",     hint: "Must show address",                icon: "🪪", required: true },
  { key: "panCardUrl",        label: "PAN Card",                hint: "Must show PAN number clearly",     icon: "💳", required: true },
  { key: "drivingLicenseUrl", label: "Driving Licence",         hint: "Optional — front side",            icon: "🚗" },
  { key: "voterIdUrl",        label: "Voter ID / EPIC",         hint: "Optional — front side",            icon: "🗳️" },
  { key: "addressProofUrl",   label: "Address Proof",           hint: "Utility bill / rent agreement",    icon: "🏠" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: KycStatus }) {
  const cfg = {
    PENDING:  { bg: "bg-amber-50 border-amber-200",  text: "text-amber-700",  dot: "bg-amber-400",  label: "Under Review" },
    APPROVED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "Verified ✓" },
    REJECTED: { bg: "bg-red-50 border-red-200",      text: "text-red-700",    dot: "bg-red-500",    label: "Rejected" },
  }[status];
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-2 w-2 rounded-full animate-pulse ${cfg.dot}`} />
      KYC Status: {cfg.label}
    </div>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div className={`flex items-center justify-center h-8 w-8 rounded-full border-2 text-xs font-bold transition-all ${
            i < step ? "bg-emerald-500 border-emerald-500 text-white" :
            i === step ? "bg-slate-900 border-slate-900 text-white scale-110 shadow-lg" :
            "bg-white border-slate-200 text-slate-400"
          }`}>
            {i < step ? "✓" : i + 1}
          </div>
          {i < total - 1 && (
            <div className={`flex-1 h-0.5 rounded-full transition-all ${i < step ? "bg-emerald-500" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function DocUploadCard({
  slot,
  state,
  onChange,
}: {
  slot: DocSlot;
  state: UploadState;
  onChange: (key: string, file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const hasUpload = !!state.url;
  const isUploading = state.uploading;

  return (
    <div
      onClick={() => !isUploading && ref.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-5 transition-all group hover:border-slate-400 hover:bg-slate-50 ${
        hasUpload ? "border-emerald-400 bg-emerald-50/50" :
        state.error ? "border-red-400 bg-red-50/50" :
        "border-slate-200 bg-white"
      }`}
    >
      <input
        ref={ref}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(slot.key, f);
        }}
      />

      <div className="flex items-start gap-4">
        {/* Preview / icon */}
        <div className="shrink-0 h-16 w-16 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
          {state.preview ? (
            <img src={state.preview} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl">{slot.icon}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-slate-800">{slot.label}</p>
            {slot.required && <span className="text-xs text-red-500 font-bold">*</span>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{slot.hint}</p>

          {isUploading && (
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              Uploading…
            </div>
          )}
          {hasUpload && !isUploading && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <span>✓</span> Uploaded successfully
            </div>
          )}
          {state.error && (
            <p className="mt-2 text-xs text-red-500">{state.error}</p>
          )}
          {!hasUpload && !isUploading && !state.error && (
            <p className="mt-2 text-xs text-slate-400 group-hover:text-slate-600 transition-colors">Click to upload</p>
          )}
        </div>

        {/* Status icon */}
        {hasUpload && (
          <div className="shrink-0 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step labels ──────────────────────────────────────────────────────────────
const STEP_LABELS = ["Personal Info", "Identity Documents", "Address & Review"];

// ─── Main Component ───────────────────────────────────────────────────────────
export function KycForm() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [msg, setMsg] = useState("");

  // Step 1 — Personal Info
  const [fullName, setFullName]       = useState("");
  const [dob, setDob]                 = useState("");
  const [nationality, setNationality] = useState("Indian");
  const [idType, setIdType]           = useState("Aadhaar");
  const [idNumber, setIdNumber]       = useState("");

  // Step 3 — Address
  const [address, setAddress] = useState("");
  const [city, setCity]       = useState("");
  const [state_, setState_]   = useState("");
  const [pinCode, setPinCode] = useState("");
  const [country, setCountry] = useState("India");

  // Documents state
  const [docs, setDocs] = useState<Record<string, UploadState>>(
    Object.fromEntries(DOC_SLOTS.map((s) => [s.key, {}]))
  );

  // Load existing KYC
  useEffect(() => {
    fetch("/api/kyc").then((r) => r.json()).then((d) => {
      if (!d) return;
      if (d.status) setKycStatus(d.status);
      if (d.fullName)    setFullName(d.fullName);
      if (d.dateOfBirth) setDob(d.dateOfBirth);
      if (d.nationality) setNationality(d.nationality);
      if (d.idType)      setIdType(d.idType);
      if (d.idNumber)    setIdNumber(d.idNumber);
      if (d.address)     setAddress(d.address);
      if (d.city)        setCity(d.city);
      if (d.state)       setState_(d.state);
      if (d.pinCode)     setPinCode(d.pinCode);
      if (d.country)     setCountry(d.country);
      // Restore uploaded URLs
      DOC_SLOTS.forEach((slot) => {
        if (d[slot.key]) {
          setDocs((prev) => ({
            ...prev,
            [slot.key]: { url: d[slot.key] as string },
          }));
        }
      });
    });
  }, []);

  async function handleDocChange(key: string, file: File) {
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
    setDocs((prev) => ({ ...prev, [key]: { file, preview, uploading: true } }));
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        setDocs((prev) => ({ ...prev, [key]: { file, preview, url: data.url } }));
      } else {
        setDocs((prev) => ({ ...prev, [key]: { file, preview, error: data.error || "Upload failed" } }));
      }
    } catch {
      setDocs((prev) => ({ ...prev, [key]: { file, preview, error: "Upload failed" } }));
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setMsg("");

    if (dob) {
      const dobCheck = validateUserDobAge(dob);
      if (!dobCheck.valid) {
        setMsg(dobCheck.message!);
        setLoading(false);
        return;
      }
    }

    const payload: Record<string, string | undefined> = {
      fullName, dateOfBirth: dob, nationality, idType, idNumber,
      address, city, state: state_, pinCode, country,
    };
    DOC_SLOTS.forEach((s) => { payload[s.key] = docs[s.key]?.url; });

    const res = await fetch("/api/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setLoading(false);
    if (res.ok) {
      setKycStatus("PENDING");
      setSubmitted(true);
      setMsg("KYC submitted successfully! Our team will review within 24–48 hours.");
    } else {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error || "Submission failed. Please try again.");
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="rounded-3xl border bg-white shadow-xl p-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-4xl">✅</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">KYC Submitted!</h2>
          <p className="text-slate-500 mb-6">{msg}</p>
          <StatusBadge status="PENDING" />
          <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
            {[
              { icon: "🔒", label: "Secure Encryption", desc: "All data is encrypted" },
              { icon: "⏱️", label: "24–48 hrs Review", desc: "Fast verification" },
              { icon: "📧", label: "Email Notification", desc: "We'll notify you" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="font-semibold text-slate-800 text-xs">{item.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Status banner */}
      {kycStatus && (
        <div className="mb-6">
          <StatusBadge status={kycStatus} />
        </div>
      )}

      <div className="rounded-3xl border bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-6">
          <h2 className="text-xl font-bold text-slate-900">KYC Verification</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Step {step + 1} of {STEP_LABELS.length} — {STEP_LABELS[step]}
          </p>
        </div>

        <div className="p-8">
          <ProgressBar step={step} total={STEP_LABELS.length} />

          {/* ── Step 0: Personal Info ─────────────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Legal Name <span className="text-red-500">*</span></label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value.replace(/[0-9]/g, ""))}
                    placeholder="As per official documents"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nationality</label>
                  <input
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value.replace(/[0-9]/g, ""))}
                    placeholder="e.g. Indian"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Primary ID Type <span className="text-red-500">*</span></label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all bg-white"
                  >
                    <option>Aadhaar</option>
                    <option>PAN Card</option>
                    <option>Passport</option>
                    <option>Driving Licence</option>
                    <option>Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">ID Number <span className="text-red-500">*</span></label>
                  <input
                    value={idNumber}
                    onChange={(e) => {
                      const raw = e.target.value;
                      // Aadhaar is digits only; all other IDs are uppercased alphanumerics.
                      setIdNumber(idType === "Aadhaar" ? raw.replace(/\D/g, "").slice(0, 12) : raw.toUpperCase());
                    }}
                    placeholder={resolveIdRule(idType).rule?.placeholder ?? "Enter ID number"}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    {idType === "Aadhaar"
                      ? "Format: 12 digits"
                      : `Format: ${resolveIdRule(idType).rule?.example ?? "—"}`}
                  </p>
                </div>
              </div>

              {/* Info note */}
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-700 flex gap-2">
                <span>ℹ️</span>
                <span>All information is encrypted and processed per RBI KYC guidelines.</span>
              </div>

              {msg && (
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700 flex gap-2">
                  <span>⚠️</span>
                  <span>{msg}</span>
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: Identity Documents ────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 mb-4">
                Upload clear, readable images (JPG/PNG/PDF, max 5 MB each). Documents marked <span className="text-red-500 font-bold">*</span> are mandatory.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DOC_SLOTS.map((slot) => (
                  <DocUploadCard
                    key={slot.key}
                    slot={slot}
                    state={docs[slot.key]}
                    onChange={handleDocChange}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Address & Review ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800">Current Address</h3>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Street Address</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Flat / House No., Street, Locality"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">City</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">State</label>
                    <input
                      value={state_}
                      onChange={(e) => setState_(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">PIN Code</label>
                    <input
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      maxLength={6}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Country</label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Review summary */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-3">
                <h3 className="font-semibold text-slate-800 text-sm">📋 Application Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ["Name", fullName],
                    ["Date of Birth", dob],
                    ["ID Type", idType],
                    ["ID Number", idNumber],
                    ["Nationality", nationality],
                    ["City", city],
                    ["State", state_],
                    ["PIN Code", pinCode],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-col">
                      <span className="text-xs text-slate-400">{label}</span>
                      <span className="font-medium text-slate-700">{value || "—"}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-500">Documents uploaded:</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {DOC_SLOTS.filter((s) => docs[s.key]?.url).map((s) => (
                      <span key={s.key} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        ✓ {s.label}
                      </span>
                    ))}
                    {DOC_SLOTS.filter((s) => !docs[s.key]?.url && s.required).map((s) => (
                      <span key={s.key} className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        ✗ {s.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {msg && (
                <div className={`rounded-xl px-4 py-3 text-sm ${msg.includes("success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {msg}
                </div>
              )}
            </div>
          )}

          {/* ── Navigation ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Back
              </button>
            ) : <div />}

            {step < STEP_LABELS.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => {
                  if (step === 0) {
                    const nameCheck = validateFullName(fullName);
                    if (!nameCheck.valid) { setMsg(nameCheck.message!); return; }
                    setFullName(nameCheck.normalized!);

                    const natCheck = validateNationality(nationality);
                    if (!natCheck.valid) { setMsg(natCheck.message!); return; }

                    if (dob) {
                      const dobCheck = validateUserDobAge(dob);
                      if (!dobCheck.valid) {
                        setMsg(dobCheck.message!);
                        return;
                      }
                    }

                    const idCheck = validateIdNumber(idType, idNumber);
                    if (!idCheck.valid) { setMsg(idCheck.message!); return; }
                    setIdNumber(idCheck.normalized!);
                  }
                  setMsg("");
                  setStep((s) => s + 1);
                }}
              >
                Continue →
              </Button>
            ) : (
              <Button
                variant="gold"
                loading={loading}
                onClick={handleSubmit}
              >
                Submit KYC Application
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
