"use client";

import { Role, KycStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/ui/country-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { Input, Label, Textarea } from "@/components/ui/input";
import { DEFAULT_COUNTRY_CODE } from "@/lib/locale-defaults";
import { ROLE_LABELS } from "@/lib/roles";
import { activityLabel } from "@/lib/user-activity";

// ─── Types ────────────────────────────────────────────────────────────────────
type LoanApp = {
  id: string;
  loanAmount: number;
  loanType: string | null;
  termYears: number;
  annualIncome: number | null;
  employmentStatus: string | null;
  downPayment: number | null;
  creditScore: number | null;
  existingEmi: number | null;
  coApplicantName: string | null;
  coApplicantIncome: number | null;
  propertyType: string | null;
  propertyArea: string | null;
  propertyCity: string | null;
  incomeProofUrl: string | null;
  bankStatementUrl: string | null;
  propertyDocUrl: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
  property: { title: string; symbol: string } | null;
};

type UserData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  role: Role;
  active: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  kycProfile: {
    id: string;
    fullName: string;
    dateOfBirth: string | null;
    nationality: string | null;
    idType: string | null;
    idNumber: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pinCode: string | null;
    country: string | null;
    photoUrl: string | null;
    aadhaarFrontUrl: string | null;
    aadhaarBackUrl: string | null;
    panCardUrl: string | null;
    drivingLicenseUrl: string | null;
    voterIdUrl: string | null;
    idDocumentUrl: string | null;
    addressProofUrl: string | null;
    status: KycStatus;
    adminNotes: string | null;
  } | null;
  loanApplications: LoanApp[];
  _count: { properties: number; transactions: number; inquiries: number };
};

interface DocUploadState {
  url: string;
  uploading?: boolean;
  error?: string;
}

interface DocSlot {
  key: keyof typeof DOC_KEYS;
  label: string;
  hint: string;
  icon: string;
  required?: boolean;
}

const DOC_KEYS = {
  photoUrl: true,
  aadhaarFrontUrl: true,
  aadhaarBackUrl: true,
  panCardUrl: true,
  drivingLicenseUrl: true,
  voterIdUrl: true,
  idDocumentUrl: true,
  addressProofUrl: true,
};

const DOC_SLOTS: DocSlot[] = [
  { key: "photoUrl",          label: "Live Photo / Selfie",   hint: "Clear face photo, no sunglasses", icon: "🤳", required: true },
  { key: "aadhaarFrontUrl",   label: "Aadhaar Card — Front",  hint: "Name & Aadhaar number visible",   icon: "🪪", required: true },
  { key: "aadhaarBackUrl",    label: "Aadhaar Card — Back",   hint: "Address side",                    icon: "🪪", required: true },
  { key: "panCardUrl",        label: "PAN Card",              hint: "PAN number clearly visible",      icon: "💳", required: true },
  { key: "drivingLicenseUrl", label: "Driving Licence",       hint: "Optional — front side",           icon: "🚗" },
  { key: "voterIdUrl",        label: "Voter ID / EPIC",       hint: "Optional — front side",           icon: "🗳️" },
  { key: "idDocumentUrl",     label: "Other ID Document",     hint: "Passport or any Govt ID",         icon: "📄" },
  { key: "addressProofUrl",   label: "Address Proof",         hint: "Utility bill / rent agreement",   icon: "🏠" },
];

// ─── Status badge ─────────────────────────────────────────────────────────────
function KycStatusBadge({ status }: { status: KycStatus }) {
  const cfg = {
    PENDING:  { bg: "bg-amber-50 border-amber-200",   text: "text-amber-700",   dot: "bg-amber-400",   label: "Pending" },
    APPROVED: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "Approved ✓" },
    REJECTED: { bg: "bg-red-50 border-red-200",       text: "text-red-700",     dot: "bg-red-500",     label: "Rejected" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Doc Upload Card (Admin view) ─────────────────────────────────────────────
function AdminDocCard({
  slot,
  state,
  onChange,
}: {
  slot: DocSlot;
  state: DocUploadState;
  onChange: (key: string, url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [localUploading, setLocalUploading] = useState(false);
  const [localError, setLocalError] = useState("");

  const hasDoc = !!state.url;
  const isImage = state.url && !state.url.endsWith(".pdf");

  async function handleFile(file: File) {
    setLocalUploading(true);
    setLocalError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        onChange(slot.key, data.url);
      } else {
        setLocalError(data.error || "Upload failed");
      }
    } catch {
      setLocalError("Upload failed");
    } finally {
      setLocalUploading(false);
    }
  }

  return (
    <div className={`rounded-2xl border-2 border-dashed transition-all ${hasDoc ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Thumbnail / icon */}
          <div
            className="shrink-0 h-14 w-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer"
            onClick={() => ref.current?.click()}
          >
            {hasDoc && isImage ? (
              <img src={state.url} alt={slot.label} className="h-full w-full object-cover" />
            ) : hasDoc ? (
              <span className="text-2xl">📄</span>
            ) : (
              <span className="text-2xl">{slot.icon}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-sm font-semibold text-slate-800">{slot.label}</p>
              {slot.required && <span className="text-xs text-red-500 font-bold">*</span>}
            </div>
            <p className="text-xs text-slate-500">{slot.hint}</p>

            {localUploading && (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                Uploading…
              </p>
            )}
            {localError && <p className="text-xs text-red-500 mt-1">{localError}</p>}
            {hasDoc && !localUploading && (
              <p className="text-xs text-emerald-600 font-semibold mt-1">✓ Document on file</p>
            )}
            {!hasDoc && !localUploading && (
              <p className="text-xs text-slate-400 mt-1">No document uploaded</p>
            )}
          </div>

          {/* Status dot */}
          {hasDoc && (
            <div className="shrink-0 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          <input
            ref={ref}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-700 transition-colors"
          >
            {hasDoc ? "Replace" : "Upload"}
          </button>
          {hasDoc && (
            <>
              <a
                href={state.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                View
              </a>
              <button
                type="button"
                onClick={() => onChange(slot.key, "")}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors ml-auto"
              >
                Remove
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function LoanDocUploader({
  label,
  url,
  onChange,
}: {
  label: string;
  url: string | null;
  onChange: (url: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        onChange(data.url);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        {url && (
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">✓ Uploaded</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-1">
        <input
          ref={ref}
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="text-[11px] px-2.5 py-1 rounded bg-slate-900 text-white font-medium hover:bg-slate-700 transition disabled:opacity-50"
        >
          {uploading ? "Uploading..." : url ? "Replace" : "Upload"}
        </button>
        {url && (
          <>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] px-2.5 py-1 rounded bg-slate-200 text-slate-700 font-medium hover:bg-slate-300 transition"
            >
              View
            </a>
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[11px] px-2.5 py-1 rounded bg-red-50 text-red-600 font-medium hover:bg-red-100 transition ml-auto"
            >
              Remove
            </button>
          </>
        )}
      </div>
      {error && <span className="text-[10px] text-red-500 mt-1">{error}</span>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function UserDetailEditor({ user }: { user: UserData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const [profile, setProfile] = useState({
    name:    user.name,
    email:   user.email,
    phone:   user.phone ?? "",
    address: user.address ?? "",
    city:    user.city ?? "",
    state:   user.state ?? "",
    zip:     user.zip ?? "",
    country: user.country ?? DEFAULT_COUNTRY_CODE,
    role:    user.role,
    active:  user.active,
  });

  const [kyc, setKyc] = useState({
    fullName:         user.kycProfile?.fullName         ?? user.name,
    dateOfBirth:      user.kycProfile?.dateOfBirth      ?? "",
    nationality:      user.kycProfile?.nationality      ?? "",
    idType:           user.kycProfile?.idType           ?? "",
    idNumber:         user.kycProfile?.idNumber         ?? "",
    address:          user.kycProfile?.address          ?? user.address ?? "",
    city:             user.kycProfile?.city             ?? user.city ?? "",
    state:            user.kycProfile?.state            ?? user.state ?? "",
    pinCode:          user.kycProfile?.pinCode          ?? "",
    country:          user.kycProfile?.country          ?? user.country ?? DEFAULT_COUNTRY_CODE,
    status:           user.kycProfile?.status           ?? "PENDING",
    adminNotes:       user.kycProfile?.adminNotes       ?? "",
  });

  // Document URL state
  const [docs, setDocs] = useState<Record<string, DocUploadState>>(
    Object.fromEntries(
      DOC_SLOTS.map((s) => [
        s.key,
        { url: (user.kycProfile?.[s.key as keyof typeof user.kycProfile] as string | null) ?? "" },
      ])
    )
  );

  const [loans, setLoans] = useState<LoanApp[]>(user.loanApplications);

  const updateLoan = (idx: number, key: keyof LoanApp, value: any) => {
    setLoans((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [key]: value } : l))
    );
  };

  const handleAddLoan = () => {
    const newLoan: LoanApp = {
      id: `temp-${Date.now()}`,
      loanAmount: 0,
      loanType: "Home Loan",
      termYears: 20,
      annualIncome: null,
      employmentStatus: null,
      downPayment: null,
      creditScore: null,
      existingEmi: null,
      coApplicantName: null,
      coApplicantIncome: null,
      propertyType: null,
      propertyArea: null,
      propertyCity: null,
      incomeProofUrl: null,
      bankStatementUrl: null,
      propertyDocUrl: null,
      status: "PENDING",
      adminNotes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      property: null,
    };
    setLoans((prev) => [...prev, newLoan]);
  };

  const handleDeleteLoan = async (idx: number, id: string) => {
    if (id.startsWith("temp-")) {
      setLoans((prev) => prev.filter((_, i) => i !== idx));
    } else {
      if (!confirm("Are you sure you want to delete this loan application permanently?")) return;
      setBusy(true);
      try {
        const res = await fetch(`/api/admin/loans/${id}`, { method: "DELETE" });
        if (res.ok) {
          setLoans((prev) => prev.filter((_, i) => i !== idx));
          setMsg("Loan application deleted successfully.");
        } else {
          const data = await res.json();
          setError(data.error ?? "Failed to delete loan application.");
        }
      } catch {
        setError("Failed to delete loan application.");
      } finally {
        setBusy(false);
      }
    }
  };

  function setDoc(key: string, url: string) {
    setDocs((prev) => ({ ...prev, [key]: { url } }));
  }

  const last = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
  const act  = activityLabel(last);

  async function save() {
    setBusy(true);
    setError("");
    setMsg("");

    if (profile.phone.trim()) {
      const digits = profile.phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) {
        setError("Phone number must contain between 10 and 15 digits.");
        setBusy(false);
        return;
      }
    }

    const docPayload = Object.fromEntries(
      Object.entries(docs).map(([k, v]) => [k, v.url || null])
    );
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        phone:   profile.phone   || null,
        address: profile.address || null,
        city:    profile.city    || null,
        state:   profile.state   || null,
        zip:     profile.zip     || null,
        country: profile.country || null,
        kyc: { ...kyc, ...docPayload },
        loans: loans.map(l => ({
          id: l.id,
          loanAmount: l.loanAmount,
          loanType: l.loanType,
          termYears: l.termYears,
          annualIncome: l.annualIncome,
          employmentStatus: l.employmentStatus,
          downPayment: l.downPayment,
          creditScore: l.creditScore,
          existingEmi: l.existingEmi,
          coApplicantName: l.coApplicantName,
          coApplicantIncome: l.coApplicantIncome,
          propertyType: l.propertyType,
          propertyArea: l.propertyArea,
          propertyCity: l.propertyCity,
          incomeProofUrl: l.incomeProofUrl,
          bankStatementUrl: l.bankStatementUrl,
          propertyDocUrl: l.propertyDocUrl,
          status: l.status,
          adminNotes: l.adminNotes,
        })),
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Save failed"); return; }
    setMsg("All changes saved successfully.");
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete user "${user.name}" permanently?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.push("/admin/users");
    else setError((await res.json()).error ?? "Delete failed");
  }

  const uploadedCount = DOC_SLOTS.filter((s) => !!docs[s.key]?.url).length;

  return (
    <div className="space-y-8">
      {error && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</p>}
      {msg   && <p className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">{msg}</p>}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Status",       value: user.active ? act.label : "Disabled" },
          { label: "Listings",     value: String(user._count.properties) },
          { label: "Transactions", value: String(user._count.transactions) },
          { label: "Member since", value: new Date(user.createdAt).toLocaleDateString() },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="font-semibold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Account & Contact ───────────────────────────────────────────── */}
      <section className="rounded-2xl border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-3">Account &amp; contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <Label>Phone (WhatsApp / SMS)</Label>
            <PhoneInput value={profile.phone} onChange={(phone) => setProfile((p) => ({ ...p, phone }))} defaultCountry={profile.country} />
          </div>
          <div>
            <Label>Role</Label>
            <select
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
              value={profile.role}
              onChange={(e) => setProfile((p) => ({ ...p, role: e.target.value as Role }))}
            >
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={profile.active} onChange={(e) => setProfile((p) => ({ ...p, active: e.target.checked }))} />
          Account active (can sign in)
        </label>
      </section>

      {/* ── Address ─────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-3">Address</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Street address</Label>
            <Input value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} />
          </div>
          <div>
            <Label>City</Label>
            <Input value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} />
          </div>
          <div>
            <Label>State / region</Label>
            <Input value={profile.state} onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))} />
          </div>
          <div>
            <Label>ZIP / postal</Label>
            <Input value={profile.zip} onChange={(e) => setProfile((p) => ({ ...p, zip: e.target.value }))} />
          </div>
          <div>
            <Label>Country</Label>
            <CountrySelect value={profile.country} onChange={(code) => setProfile((p) => ({ ...p, country: code }))} />
          </div>
        </div>
      </section>

      {/* ── KYC Identity ────────────────────────────────────────────────── */}
      <section className="rounded-2xl border bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">KYC &amp; Identity</h2>
            <p className="text-slate-300 text-xs mt-0.5">Government ID verification — editable by admin</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-300">{uploadedCount}/{DOC_SLOTS.length} documents</span>
            <KycStatusBadge status={kyc.status as KycStatus} />
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
              Personal Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Legal name (KYC)</Label>
                <Input value={kyc.fullName} onChange={(e) => setKyc((k) => ({ ...k, fullName: e.target.value }))} />
              </div>
              <div>
                <Label>Date of birth</Label>
                <Input value={kyc.dateOfBirth} onChange={(e) => setKyc((k) => ({ ...k, dateOfBirth: e.target.value }))} placeholder="YYYY-MM-DD" />
              </div>
              <div>
                <Label>Nationality</Label>
                <Input value={kyc.nationality} onChange={(e) => setKyc((k) => ({ ...k, nationality: e.target.value }))} />
              </div>
              <div>
                <Label>ID type</Label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white"
                  value={kyc.idType}
                  onChange={(e) => setKyc((k) => ({ ...k, idType: e.target.value }))}
                >
                  <option value="">Select ID type</option>
                  <option>Aadhaar</option>
                  <option>PAN Card</option>
                  <option>Passport</option>
                  <option>Driving Licence</option>
                  <option>Voter ID</option>
                </select>
              </div>
              <div>
                <Label>ID number</Label>
                <Input value={kyc.idNumber} onChange={(e) => setKyc((k) => ({ ...k, idNumber: e.target.value }))} placeholder="Enter ID number" />
              </div>
              <div>
                <Label>KYC status</Label>
                <select
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white"
                  value={kyc.status}
                  onChange={(e) => setKyc((k) => ({ ...k, status: e.target.value as KycStatus }))}
                >
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* KYC Address */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
              KYC Address
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Street address</Label>
                <Input value={kyc.address} onChange={(e) => setKyc((k) => ({ ...k, address: e.target.value }))} placeholder="Flat / House No., Street, Locality" />
              </div>
              <div>
                <Label>City</Label>
                <Input value={kyc.city} onChange={(e) => setKyc((k) => ({ ...k, city: e.target.value }))} />
              </div>
              <div>
                <Label>State</Label>
                <Input value={kyc.state} onChange={(e) => setKyc((k) => ({ ...k, state: e.target.value }))} />
              </div>
              <div>
                <Label>PIN Code</Label>
                <Input value={kyc.pinCode} onChange={(e) => setKyc((k) => ({ ...k, pinCode: e.target.value }))} maxLength={6} placeholder="6-digit PIN" />
              </div>
              <div>
                <Label>Country</Label>
                <Input value={kyc.country} onChange={(e) => setKyc((k) => ({ ...k, country: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">3</span>
              Identity Documents
            </h3>
            <p className="text-xs text-slate-500 mb-4 ml-8">
              Upload or replace user documents. Accepted: JPG, PNG, PDF (max 5 MB).
              Documents marked <span className="text-red-500 font-bold">*</span> are required for KYC approval.
            </p>

            {/* Progress bar */}
            <div className="ml-8 mb-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>{uploadedCount} of {DOC_SLOTS.length} documents uploaded</span>
                <span className={uploadedCount >= 4 ? "text-emerald-600 font-semibold" : "text-amber-600"}>
                  {uploadedCount >= 4 ? "Ready for approval" : "Pending documents"}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(uploadedCount / DOC_SLOTS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DOC_SLOTS.map((slot) => (
                <AdminDocCard
                  key={slot.key}
                  slot={slot}
                  state={docs[slot.key]}
                  onChange={setDoc}
                />
              ))}
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">4</span>
              Admin Notes
            </h3>
            <Textarea
              value={kyc.adminNotes}
              onChange={(e) => setKyc((k) => ({ ...k, adminNotes: e.target.value }))}
              className="min-h-[80px]"
              placeholder="Internal notes about this KYC verification..."
            />
          </div>

          {/* Quick Approve/Reject buttons */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500 mr-auto">Quick actions:</p>
            <button
              type="button"
              onClick={() => setKyc((k) => ({ ...k, status: "APPROVED" }))}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${kyc.status === "APPROVED" ? "bg-emerald-500 text-white border-emerald-500" : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"}`}
            >
              ✓ Approve KYC
            </button>
            <button
              type="button"
              onClick={() => setKyc((k) => ({ ...k, status: "REJECTED" }))}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${kyc.status === "REJECTED" ? "bg-red-500 text-white border-red-500" : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"}`}
            >
              ✗ Reject KYC
            </button>
            <button
              type="button"
              onClick={() => setKyc((k) => ({ ...k, status: "PENDING" }))}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all border ${kyc.status === "PENDING" ? "bg-amber-500 text-white border-amber-500" : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"}`}
            >
              ⏳ Set Pending
            </button>
          </div>
        </div>
      </section>

      {/* ── Loan Applications ────────────────────────────────────────────── */}
      <section className="rounded-2xl border bg-white overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Loan Applications</h2>
            <p className="text-blue-200 text-xs mt-0.5">All loan requests submitted by this user</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
              {loans.length} application{loans.length !== 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={handleAddLoan}
              className="bg-white text-blue-900 hover:bg-blue-50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              + Add Application
            </button>
          </div>
        </div>

        <div className="p-6">
          {loans.length === 0 ? (
            /* ── No loans state ── */
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl">🏦</div>
              <p className="text-slate-700 font-semibold">No loan applications</p>
              <p className="text-slate-400 text-sm">This user has not applied for any loans yet.</p>
              <button
                type="button"
                onClick={handleAddLoan}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                + Add Loan Application
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {loans.map((loan, idx) => {
                const statusCfg: Record<string, { bg: string; text: string; dot: string; label: string }> = {
                  PENDING:      { bg: "bg-amber-50 border-amber-200",   text: "text-amber-700",   dot: "bg-amber-400",   label: "⏳ Pending" },
                  UNDER_REVIEW: { bg: "bg-blue-50 border-blue-200",     text: "text-blue-700",    dot: "bg-blue-500",    label: "🔍 Under Review" },
                  APPROVED:     { bg: "bg-emerald-50 border-emerald-200",text: "text-emerald-700", dot: "bg-emerald-500", label: "✓ Approved" },
                  REJECTED:     { bg: "bg-red-50 border-red-200",       text: "text-red-700",     dot: "bg-red-500",     label: "✗ Rejected" },
                  FUNDED:       { bg: "bg-purple-50 border-purple-200", text: "text-purple-700",  dot: "bg-purple-500",  label: "💰 Funded" },
                };
                const s = statusCfg[loan.status] ?? statusCfg.PENDING;

                /* EMI estimate: P*r*(1+r)^n / ((1+r)^n - 1) */
                const principal = loan.loanAmount - (loan.downPayment ?? 0);
                const r = 0.085 / 12;
                const n = loan.termYears * 12;
                const emi = principal > 0 && n > 0
                  ? Math.round(principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1))
                  : null;

                const fmt = (v: number) =>
                  v >= 10000000 ? `₹${(v / 10000000).toFixed(2)} Cr`
                  : v >= 100000 ? `₹${(v / 100000).toFixed(1)} L`
                  : `₹${v.toLocaleString("en-IN")}`;

                return (
                  <div key={loan.id} className="rounded-2xl border border-slate-200 overflow-hidden">
                    {/* Loan card header */}
                    <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400">#{idx + 1}</span>
                        <span className="font-semibold text-slate-800 text-sm">{loan.loanType ?? "Home Loan"}</span>
                        {loan.property && (
                          <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {loan.property.symbol}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          Applied {new Date(loan.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${s.bg} ${s.text}`}>
                          <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${s.dot}`} />
                          {s.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteLoan(idx, loan.id)}
                          className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-55 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-red-200 transition-all ml-1"
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-6">
                      {/* Est. EMI & status summary */}
                      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-sm">
                          <span className="text-slate-500">Principal Amount: </span>
                          <span className="font-semibold text-slate-800">{fmt(principal)}</span>
                          {emi && (
                            <>
                              <span className="text-slate-300 mx-2">|</span>
                              <span className="text-slate-500">Est. Monthly EMI (at 8.5%): </span>
                              <span className="font-bold text-slate-900">{fmt(emi)}</span>
                            </>
                          )}
                        </div>
                        {loan.property && (
                          <div className="text-sm">
                            <span className="text-slate-500">Linked Property: </span>
                            <span className="font-semibold text-blue-600">{loan.property.title}</span>
                          </div>
                        )}
                      </div>

                      {/* Section 1: Loan & Financial Info */}
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">1. Loan &amp; Financial Information</h3>
                        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                          <div>
                            <Label>Loan Type</Label>
                            <Input value={loan.loanType ?? ""} onChange={(e) => updateLoan(idx, "loanType", e.target.value)} />
                          </div>
                          <div>
                            <Label>Loan Amount (₹)</Label>
                            <Input type="number" value={loan.loanAmount} onChange={(e) => updateLoan(idx, "loanAmount", parseFloat(e.target.value) || 0)} />
                          </div>
                          <div>
                            <Label>Down Payment (₹)</Label>
                            <Input type="number" value={loan.downPayment ?? 0} onChange={(e) => updateLoan(idx, "downPayment", parseFloat(e.target.value) || 0)} />
                          </div>
                          <div>
                            <Label>Tenure (Years)</Label>
                            <Input type="number" value={loan.termYears} onChange={(e) => updateLoan(idx, "termYears", parseInt(e.target.value) || 0)} />
                          </div>
                          <div>
                            <Label>Employment Status</Label>
                            <Input value={loan.employmentStatus ?? ""} onChange={(e) => updateLoan(idx, "employmentStatus", e.target.value)} />
                          </div>
                          <div>
                            <Label>Annual Income (₹)</Label>
                            <Input type="number" value={loan.annualIncome ?? 0} onChange={(e) => updateLoan(idx, "annualIncome", parseFloat(e.target.value) || 0)} />
                          </div>
                          <div>
                            <Label>Existing EMI (₹)</Label>
                            <Input type="number" value={loan.existingEmi ?? 0} onChange={(e) => updateLoan(idx, "existingEmi", parseFloat(e.target.value) || 0)} />
                          </div>
                          <div>
                            <Label>Credit Score</Label>
                            <Input type="number" value={loan.creditScore ?? 0} onChange={(e) => updateLoan(idx, "creditScore", parseInt(e.target.value) || 0)} />
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Property & Co-Applicant */}
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Property Specs */}
                        <div>
                          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">2. Requested Property Details</h3>
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
                            <div>
                              <Label>Property Type</Label>
                              <Input value={loan.propertyType ?? ""} onChange={(e) => updateLoan(idx, "propertyType", e.target.value)} />
                            </div>
                            <div>
                              <Label>City</Label>
                              <Input value={loan.propertyCity ?? ""} onChange={(e) => updateLoan(idx, "propertyCity", e.target.value)} />
                            </div>
                            <div>
                              <Label>Area</Label>
                              <Input value={loan.propertyArea ?? ""} onChange={(e) => updateLoan(idx, "propertyArea", e.target.value)} />
                            </div>
                          </div>
                        </div>

                        {/* Co-Applicant Specs */}
                        <div>
                          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">3. Co-Applicant Details</h3>
                          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                            <div>
                              <Label>Co-Applicant Name</Label>
                              <Input value={loan.coApplicantName ?? ""} onChange={(e) => updateLoan(idx, "coApplicantName", e.target.value)} />
                            </div>
                            <div>
                              <Label>Co-Applicant Income (₹)</Label>
                              <Input type="number" value={loan.coApplicantIncome ?? 0} onChange={(e) => updateLoan(idx, "coApplicantIncome", parseFloat(e.target.value) || 0)} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section 3: Documents & Notes */}
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">4. Verification Documents</h3>
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                          <LoanDocUploader
                            label="Income Proof"
                            url={loan.incomeProofUrl}
                            onChange={(url) => updateLoan(idx, "incomeProofUrl", url)}
                          />
                          <LoanDocUploader
                            label="Bank Statement"
                            url={loan.bankStatementUrl}
                            onChange={(url) => updateLoan(idx, "bankStatementUrl", url)}
                          />
                          <LoanDocUploader
                            label="Property Document"
                            url={loan.propertyDocUrl}
                            onChange={(url) => updateLoan(idx, "propertyDocUrl", url)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Admin Notes</Label>
                        <Textarea
                          value={loan.adminNotes ?? ""}
                          onChange={(e) => updateLoan(idx, "adminNotes", e.target.value)}
                          className="min-h-[80px]"
                          placeholder="Internal notes about this loan application..."
                        />
                      </div>

                      {/* Section 4: Quick Actions */}
                      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100">
                        <span className="text-xs text-slate-500 mr-auto">Quick status update:</span>
                        {[
                          { status: "PENDING", label: "⏳ Pending", bgActive: "bg-amber-500 text-white border-amber-500", bgInactive: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" },
                          { status: "UNDER_REVIEW", label: "🔍 Review", bgActive: "bg-blue-500 text-white border-blue-500", bgInactive: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
                          { status: "APPROVED", label: "✓ Approve", bgActive: "bg-emerald-500 text-white border-emerald-500", bgInactive: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" },
                          { status: "REJECTED", label: "✗ Reject", bgActive: "bg-red-500 text-white border-red-500", bgInactive: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" },
                          { status: "FUNDED", label: "💰 Fund", bgActive: "bg-purple-500 text-white border-purple-500", bgInactive: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
                        ].map((btn) => (
                          <button
                            key={btn.status}
                            type="button"
                            onClick={() => updateLoan(idx, "status", btn.status)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                              loan.status === btn.status ? btn.bgActive : btn.bgInactive
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Action buttons ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Button disabled={busy} loading={busy} onClick={save}>
          Save all changes
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => router.push("/admin/users")}>
          Back to list
        </Button>
        <Button variant="danger" disabled={busy} onClick={remove} className="ml-auto">
          Delete user
        </Button>
      </div>
    </div>
  );
}
