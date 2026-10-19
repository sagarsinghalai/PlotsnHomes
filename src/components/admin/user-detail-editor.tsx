"use client";

import { Role, KycStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useRef, useState, useMemo, useEffect } from "react";
import { CheckCircle2, Clock, Save, Key, Eye, EyeOff, Lock, ShieldAlert, SlidersHorizontal, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountrySelect } from "@/components/ui/country-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { useTableColumns, useCustomCellData } from "@/hooks/use-table-columns";
import { EditableCell } from "@/components/ui/editable-cell";
import {
  parseStoredPhone,
} from "@/lib/phone-utils";
import { GlobalStateSelect, GlobalCitySelect, GlobalZipSelect, validatePostalCode } from "@/components/ui/location-select";
import { State } from "country-state-city";
import { Input, Label, Textarea } from "@/components/ui/input";
import { DEFAULT_COUNTRY_CODE } from "@/lib/locale-defaults";
import { ROLE_LABELS } from "@/lib/roles";
import { activityLabel } from "@/lib/user-activity";
import { AgentCommissionTracker } from "@/components/admin/agent-commission-tracker";
import { UserCrmActivity } from "@/components/admin/user-crm-activity";
import {
  AgentAssignedLeadsSection,
  AgentInterestedPropertiesSection,
  type AgentLead,
} from "@/components/admin/agent-leads-properties-sections";
import {
  UserPropertyPortfolioSection,
  UserTransactionHistorySection,
  type PortfolioItem,
  type UserTransactionItem,
} from "@/components/admin/user-portfolio-transactions";
import { formatCurrency } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { validateUserDobAge } from "@/lib/user-validation";

// ─── Types ────────────────────────────────────────────────────────────────────
export type HierarchyOrgUnit = {
  id: string;
  name: string;
  code: string;
  organizationId?: string | null;
  franchiseId?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
};

export type OrgUnitsData = {
  organizations: HierarchyOrgUnit[];
  franchises: HierarchyOrgUnit[];
  branches: HierarchyOrgUnit[];
  departments: HierarchyOrgUnit[];
  teams: HierarchyOrgUnit[];
};

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
  userId?: string | null;
  name: string;
  email: string;
  phone: string | null;
  dob?: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  role: Role;
  managerId?: string | null;
  tenantId?: string | null;
  franchiseId?: string | null;
  branchId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
  manager?: { id: string; name: string; role: Role; email: string } | null;
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
  leadsOwned?: AgentLead[];
  boughtProperties?: PortfolioItem[];
  soldProperties?: PortfolioItem[];
  userTransactions?: UserTransactionItem[];
  commissionSummary?: {
    totalSoldProperties: number;
    totalCommissionEarned: number;
    commissionPaid: number;
    commissionPending: number;
  };
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
  kind: "image" | "pdf";
}

// Allowed format + max size per document kind.
const DOC_RULES = {
  image: { accept: "image/jpeg,image/png,.jpg,.jpeg,.png", types: ["image/jpeg", "image/png"], maxMB: 5, label: "JPG or PNG · max 5 MB" },
  pdf: { accept: "application/pdf,.pdf", types: ["application/pdf"], maxMB: 5, label: "PDF only · max 5 MB" },
} as const;

/** Validate a selected file against its slot's format + size rules. Returns an error message, or "" if valid. */
function validateDocFile(file: File, kind: "image" | "pdf"): string {
  const rule = DOC_RULES[kind];
  const nameOk = kind === "image"
    ? /\.(jpe?g|png)$/i.test(file.name)
    : /\.pdf$/i.test(file.name);
  const typeOk = (rule.types as readonly string[]).includes(file.type) || (!file.type && nameOk);
  if (!typeOk || !nameOk) {
    return kind === "image"
      ? "Only JPG or PNG images are allowed for this document."
      : "Only PDF files are allowed for this document.";
  }
  if (file.size > rule.maxMB * 1024 * 1024) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is ${rule.maxMB} MB.`;
  }
  return "";
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
  { key: "photoUrl",          label: "Live Photo / Selfie",   hint: "Clear face photo, no sunglasses", icon: "🤳", required: true, kind: "image" },
  { key: "aadhaarFrontUrl",   label: "Aadhaar Card — Front",  hint: "Name & Aadhaar number visible",   icon: "🪪", required: true, kind: "image" },
  { key: "aadhaarBackUrl",    label: "Aadhaar Card — Back",   hint: "Address side",                    icon: "🪪", required: true, kind: "image" },
  { key: "panCardUrl",        label: "PAN Card",              hint: "PAN number clearly visible",      icon: "💳", required: true, kind: "image" },
  { key: "drivingLicenseUrl", label: "Driving Licence",       hint: "Optional — front side",           icon: "🚗", kind: "image" },
  { key: "voterIdUrl",        label: "Voter ID / EPIC",       hint: "Optional — front side",           icon: "🗳️", kind: "image" },
  { key: "idDocumentUrl",     label: "Other ID Document",     hint: "Passport or any Govt ID",         icon: "📄", kind: "pdf" },
  { key: "addressProofUrl",   label: "Address Proof",         hint: "Utility bill / rent agreement",   icon: "🏠", kind: "pdf" },
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
    const validationError = validateDocFile(file, slot.kind);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalUploading(true);
    setLocalError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (res.status === 401) {
        window.location.href = "/login?error=SessionExpired";
        return;
      }
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
            <p className={`inline-flex items-center gap-1 mt-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${
              slot.kind === "image" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700"
            }`}>
              {slot.kind === "image" ? "🖼️" : "📄"} {DOC_RULES[slot.kind].label}
            </p>

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
            accept={DOC_RULES[slot.kind].accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
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
      if (res.status === 401) {
        window.location.href = "/login?error=SessionExpired";
        return;
      }
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

// Parse a timestamped loan-notes history string into entries.
// Supports "[time] [author · userId] text" and legacy "[time] text".
function parseLoanNotes(raw: string | null | undefined): { time: string | null; author: string | null; text: string }[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const m = chunk.match(/^\[(.*?)\]\s*\[(.*?)\]\s*([\s\S]*)$/);
      if (m) return { time: m[1], author: m[2], text: m[3] };
      const m2 = chunk.match(/^\[(.*?)\]\s*([\s\S]*)$/);
      if (m2) return { time: m2[1], author: null, text: m2[2] };
      return { time: null, author: null, text: chunk };
    })
    .reverse(); // newest first
}

function LoanAdminNotes({
  contactId,
  loanId,
  notes,
  onChange,
}: {
  contactId: string;
  loanId: string;
  notes: string | null;
  onChange: (val: string) => void;
}) {
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const history = parseLoanNotes(notes);

  async function handleSaveNote() {
    const text = newNote.trim();
    if (!text) return;
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/users/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addLoanNote: { loanId, text } }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Could not save note."); return; }
      if (typeof data.appendedLoanNotes === "string") onChange(data.appendedLoanNotes);
      setNewNote("");
    } catch {
      setErr("Could not save note.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-900">
          Admin Notes
        </label>
        {err && <span className="text-xs font-bold text-red-600">{err}</span>}
      </div>

      {/* Existing notes history — newest first, with author, user ID & timestamp */}
      {history.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No notes saved yet for this application.</p>
      ) : (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {history.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-4 p-3 rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 leading-relaxed whitespace-pre-wrap break-words">
                  {item.text}
                </p>
                {item.author && (
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">— {item.author}</p>
                )}
              </div>
              {item.time && (
                <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 border border-slate-300 px-2.5 py-1 rounded-lg shrink-0">
                  {item.time}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Note Entry Box */}
      <div className="space-y-2">
        <textarea
          rows={3}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Type internal notes about this loan application..."
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-slate-400 transition resize-none shadow-sm"
        />
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-500 font-medium">
            Each note is saved with your name, user ID and a timestamp.
          </p>
          <button
            type="button"
            onClick={handleSaveNote}
            disabled={saving || !newNote.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2 text-xs font-bold transition shadow-sm"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

// ─── Main Component ───────────────────────────────────────────────────────────
export function UserDetailEditor({
  user,
  allManagers = [],
  orgUnits,
}: {
  user: UserData;
  allManagers?: { id: string; name: string; role: Role; email: string }[];
  orgUnits?: OrgUnitsData;
}) {
  const router = useRouter();
  const { hasEditPermission, hasDeletePermission, userRole } = useAdminPermissions();
  const canEdit = hasEditPermission("/admin/users");
  const canDelete = hasDeletePermission("/admin/users");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  // Field-level validation: which field is currently in error (for highlight + scroll),
  // and whether to show the "saved successfully" popup.
  const [errorField, setErrorField] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const fieldRing = (key: string) =>
    errorField === key ? " ring-2 ring-red-400 ring-offset-2 rounded-lg bg-red-50/40 transition-all" : "";
  const [newKycNote, setNewKycNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const { columns } = useTableColumns("users_directory_v6", []);
  const { getCellValue, updateCell } = useCustomCellData("users_directory_v6");
  const customCols = columns.filter((c) => c.isCustom);

  const [dynamicDropdowns, setDynamicDropdowns] = useState<Record<string, { label: string; value: string }[]>>({});

  useEffect(() => {
    fetch("/api/settings/dropdowns")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sec = data.find((s: any) => s.sectionKey === "users_accounts");
          if (sec && sec.fields) {
            const map: Record<string, { label: string; value: string }[]> = {};
            sec.fields.forEach((f: any) => {
              map[f.key] = f.options.filter((o: any) => o.enabled).map((o: any) => ({ label: o.label, value: o.value }));
            });
            setDynamicDropdowns(map);
          }
        }
      })
      .catch(() => {});
  }, []);

  const getInitialStateCode = (country: string, stateName: string) => {
    if (!stateName) return "";
    const states = State.getStatesOfCountry(country);
    const found = states.find((s) => s.name === stateName);
    return found ? found.isoCode : "";
  };

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);
  const maxDateString = maxDate.toISOString().split("T")[0];

  const initialDob = user.dob ? user.dob.split("T")[0] : (user.kycProfile?.dateOfBirth ?? "");

  const [profile, setProfile] = useState({
    name:         user.name,
    email:        user.email,
    phone:        user.phone ?? "",
    dob:          initialDob,
    address:      user.address ?? "",
    city:         user.city ?? "",
    state:        user.state ?? "",
    stateCode:    getInitialStateCode(user.country ?? DEFAULT_COUNTRY_CODE, user.state ?? ""),
    zip:          user.zip ?? "",
    country:      user.country ?? DEFAULT_COUNTRY_CODE,
    role:         user.role,
    managerId:    user.managerId ?? "",
    tenantId:     user.tenantId ?? "",
    franchiseId:  user.franchiseId ?? "",
    branchId:     user.branchId ?? "",
    departmentId: user.departmentId ?? "",
    teamId:       user.teamId ?? "",
    active:       user.active,
  });

  const orgs = orgUnits?.organizations || [];
  const franchises = orgUnits?.franchises || [];
  const branches = orgUnits?.branches || [];
  const depts = orgUnits?.departments || [];
  const teams = orgUnits?.teams || [];

  const availableFranchises = useMemo(() => {
    if (!profile.tenantId) return franchises;
    return franchises.filter((f) => f.organizationId === profile.tenantId);
  }, [franchises, profile.tenantId]);

  const availableBranches = useMemo(() => {
    let list = branches;
    if (profile.franchiseId) {
      list = list.filter((b) => b.franchiseId === profile.franchiseId);
    } else if (profile.tenantId) {
      list = list.filter((b) => {
        if (b.organizationId) return b.organizationId === profile.tenantId;
        const f = franchises.find((item) => item.id === b.franchiseId);
        return f?.organizationId === profile.tenantId;
      });
    }
    return list;
  }, [branches, franchises, profile.franchiseId, profile.tenantId]);

  const availableDepts = useMemo(() => {
    let list = depts;
    if (profile.branchId) {
      list = list.filter((d) => d.branchId === profile.branchId);
    } else if (profile.franchiseId) {
      list = list.filter((d) => {
        const b = branches.find((item) => item.id === d.branchId);
        return b?.franchiseId === profile.franchiseId;
      });
    } else if (profile.tenantId) {
      list = list.filter((d) => {
        const b = branches.find((item) => item.id === d.branchId);
        if (b?.organizationId) return b.organizationId === profile.tenantId;
        const f = franchises.find((item) => item.id === b?.franchiseId);
        return f?.organizationId === profile.tenantId;
      });
    }
    return list;
  }, [depts, branches, franchises, profile.branchId, profile.franchiseId, profile.tenantId]);

  const availableTeams = useMemo(() => {
    let list = teams;
    if (profile.departmentId) {
      list = list.filter((t) => t.departmentId === profile.departmentId);
    } else if (profile.branchId) {
      list = list.filter((t) => {
        const d = depts.find((item) => item.id === t.departmentId);
        return d?.branchId === profile.branchId;
      });
    } else if (profile.franchiseId) {
      list = list.filter((t) => {
        const d = depts.find((item) => item.id === t.departmentId);
        const b = branches.find((item) => item.id === d?.branchId);
        return b?.franchiseId === profile.franchiseId;
      });
    } else if (profile.tenantId) {
      list = list.filter((t) => {
        const d = depts.find((item) => item.id === t.departmentId);
        const b = branches.find((item) => item.id === d?.branchId);
        if (b?.organizationId) return b.organizationId === profile.tenantId;
        const f = franchises.find((item) => item.id === b?.franchiseId);
        return f?.organizationId === profile.tenantId;
      });
    }
    return list;
  }, [teams, depts, branches, franchises, profile.departmentId, profile.branchId, profile.franchiseId, profile.tenantId]);

  function handleTenantChange(orgId: string) {
    setProfile((p) => ({
      ...p,
      tenantId: orgId,
      franchiseId: "",
      branchId: "",
      departmentId: "",
      teamId: "",
    }));
  }

  function handleFranchiseChange(franId: string) {
    let parentOrgId = profile.tenantId;
    if (franId) {
      const match = franchises.find((f) => f.id === franId);
      if (match?.organizationId) parentOrgId = match.organizationId;
    }
    setProfile((p) => ({
      ...p,
      franchiseId: franId,
      tenantId: parentOrgId,
      branchId: "",
      departmentId: "",
      teamId: "",
    }));
  }

  function handleBranchChange(branchId: string) {
    let parentFranId = profile.franchiseId;
    let parentOrgId = profile.tenantId;
    if (branchId) {
      const matchB = branches.find((b) => b.id === branchId);
      if (matchB) {
        if (matchB.franchiseId) parentFranId = matchB.franchiseId;
        const matchF = franchises.find((f) => f.id === matchB.franchiseId);
        if (matchF?.organizationId) parentOrgId = matchF.organizationId;
        else if (matchB.organizationId) parentOrgId = matchB.organizationId;
      }
    }
    setProfile((p) => ({
      ...p,
      branchId,
      franchiseId: parentFranId,
      tenantId: parentOrgId,
      departmentId: "",
      teamId: "",
    }));
  }

  function handleDeptChange(deptId: string) {
    let parentBranchId = profile.branchId;
    let parentFranId = profile.franchiseId;
    let parentOrgId = profile.tenantId;
    if (deptId) {
      const matchD = depts.find((d) => d.id === deptId);
      if (matchD && matchD.branchId) {
        parentBranchId = matchD.branchId;
        const matchB = branches.find((b) => b.id === matchD.branchId);
        if (matchB) {
          if (matchB.franchiseId) parentFranId = matchB.franchiseId;
          const matchF = franchises.find((f) => f.id === matchB.franchiseId);
          if (matchF?.organizationId) parentOrgId = matchF.organizationId;
        }
      }
    }
    setProfile((p) => ({
      ...p,
      departmentId: deptId,
      branchId: parentBranchId,
      franchiseId: parentFranId,
      tenantId: parentOrgId,
      teamId: "",
    }));
  }

  function handleTeamChange(teamId: string) {
    let parentDeptId = profile.departmentId;
    let parentBranchId = profile.branchId;
    let parentFranId = profile.franchiseId;
    let parentOrgId = profile.tenantId;
    if (teamId) {
      const matchT = teams.find((t) => t.id === teamId);
      if (matchT && matchT.departmentId) {
        parentDeptId = matchT.departmentId;
        const matchD = depts.find((d) => d.id === matchT.departmentId);
        if (matchD && matchD.branchId) {
          parentBranchId = matchD.branchId;
          const matchB = branches.find((b) => b.id === matchD.branchId);
          if (matchB) {
            if (matchB.franchiseId) parentFranId = matchB.franchiseId;
            const matchF = franchises.find((f) => f.id === matchB.franchiseId);
            if (matchF?.organizationId) parentOrgId = matchF.organizationId;
          }
        }
      }
    }
    setProfile((p) => ({
      ...p,
      teamId,
      departmentId: parentDeptId,
      branchId: parentBranchId,
      franchiseId: parentFranId,
      tenantId: parentOrgId,
    }));
  }

  const [kyc, setKyc] = useState({
    fullName:         user.kycProfile?.fullName         ?? user.name,
    dateOfBirth:      initialDob,
    nationality:      user.kycProfile?.nationality      ?? "",
    idType:           user.kycProfile?.idType           ?? "",
    idNumber:         user.kycProfile?.idNumber         ?? "",
    address:          user.kycProfile?.address          ?? user.address ?? "",
    city:             user.kycProfile?.city             ?? user.city ?? "",
    state:            user.kycProfile?.state            ?? user.state ?? "",
    stateCode:        getInitialStateCode(
      user.kycProfile?.country ?? user.country ?? DEFAULT_COUNTRY_CODE,
      user.kycProfile?.state ?? user.state ?? ""
    ),
    pinCode:          user.kycProfile?.pinCode          ?? "",
    country:          user.kycProfile?.country          ?? user.country ?? DEFAULT_COUNTRY_CODE,
    status:           user.kycProfile?.status           ?? "PENDING",
    adminNotes:       user.kycProfile?.adminNotes       ?? "",
  });

  const updateDob = (newDob: string) => {
    setProfile((p) => ({ ...p, dob: newDob }));
    setKyc((k) => ({ ...k, dateOfBirth: newDob }));
  };

  // Admin Change Password State & Handler
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordUpdateMsg, setPasswordUpdateMsg] = useState("");
  const [passwordUpdateError, setPasswordUpdateError] = useState("");

  async function handleAdminChangeUserPassword() {
    if (!newAdminPassword || newAdminPassword.trim().length < 6) {
      setPasswordUpdateError("Password must be at least 6 characters long.");
      return;
    }
    setUpdatingPassword(true);
    setPasswordUpdateMsg("");
    setPasswordUpdateError("");

    try {
      const res = await fetch(`/api/admin/users/${user.id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newAdminPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update user password.");
      }
      setPasswordUpdateMsg(`✓ Password successfully updated for ${user.name || user.email}!`);
      setNewAdminPassword("");
    } catch (err: any) {
      setPasswordUpdateError(err.message || "Failed to update user password.");
    } finally {
      setUpdatingPassword(false);
    }
  }

  const [adminNoteSavedAt, setAdminNoteSavedAt] = useState<string | null>(null);

  async function handleSaveAdminNotes() {
    const text = newKycNote.trim();
    if (!text) return;
    setSavingNote(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addKycNote: text }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Could not save note."); return; }
      if (typeof data.appendedNotes === "string") {
        setKyc((k) => ({ ...k, adminNotes: data.appendedNotes }));
      }
      setNewKycNote("");
      setAdminNoteSavedAt(new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }));
    } catch {
      setError("Could not save note.");
    } finally {
      setSavingNote(false);
    }
  }

  // Parse the KYC admin-notes history into individual entries.
  function parseKycNotes(raw: string | null | undefined): { time: string | null; author: string | null; text: string }[] {
    if (!raw || !raw.trim()) return [];
    return raw
      .split(/\n\n+/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
      .map((chunk) => {
        const m = chunk.match(/^\[(.*?)\]\s*\[(.*?)\]\s*([\s\S]*)$/);
        if (m) return { time: m[1], author: m[2], text: m[3] };
        const m2 = chunk.match(/^\[(.*?)\]\s*([\s\S]*)$/);
        if (m2) return { time: m2[1], author: null, text: m2[2] };
        return { time: null, author: null, text: chunk };
      })
      .reverse(); // newest first
  }

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
    setErrorField(null);

    const showError = (msg: string, field?: string) => {
      setError(msg);
      setErrorField(field ?? null);
      setBusy(false);
      // Scroll to and focus the offending field (fall back to the top banner).
      setTimeout(() => {
        const el = field ? document.getElementById(`fld-${field}`) : null;
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          const focusable = el.querySelector("input, select, textarea") as HTMLElement | null;
          try { focusable?.focus({ preventScroll: true }); } catch { focusable?.focus(); }
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 60);
    };

    if (profile.phone.trim()) {
      const parsed = parseStoredPhone(profile.phone);
      if (parsed.national.length !== 10) {
        return showError("Phone number must contain exactly 10 digits.", "phone");
      }
    }

    // Strict KYC Validations
    const alphaOnly = /^[a-zA-Z\s]+$/;
    const numericOnly = /^\d+$/;
    const pinRegex = /^\d{6}$/;
    const addressRegex = /^[a-zA-Z0-9\s,.-]+$/;

    let kycValid = true;

    if (profile.address && numericOnly.test(profile.address.trim())) {
      kycValid = false;
      return showError("Address cannot contain only numbers.", "profile-address");
    }
    if (kyc.address && numericOnly.test(kyc.address.trim())) {
      kycValid = false;
      return showError("KYC Address cannot contain only numbers.", "kyc-address");
    }

    if (profile.name && !alphaOnly.test(profile.name)) {
      kycValid = false;
      return showError("Full name must contain only alphabets.", "name");
    }
    if (kyc.fullName && !alphaOnly.test(kyc.fullName)) {
      kycValid = false;
      return showError("KYC Legal Name must contain only alphabets.", "kyc-fullname");
    }
    if (kyc.nationality && !alphaOnly.test(kyc.nationality)) {
      kycValid = false;
      return showError("Nationality must contain only alphabets.", "kyc-nationality");
    }
    if (kyc.idNumber) {
      if (kyc.idType === "Aadhaar" && (!numericOnly.test(kyc.idNumber) || kyc.idNumber.length !== 12)) {
        kycValid = false;
        return showError("Aadhaar must be a 12-digit number.", "kyc-idnumber");
      } else if (kyc.idType === "PAN Card") {
        const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/i;
        if (!panRegex.test(kyc.idNumber)) {
          kycValid = false;
          return showError("PAN Card must be in the format XXXXX1234X.", "kyc-idnumber");
        }
      }
    }
    const targetDob = profile.dob || kyc.dateOfBirth || initialDob;
    if (targetDob) {
      const dobCheck = validateUserDobAge(targetDob, user.createdAt);
      if (!dobCheck.valid) {
        kycValid = false;
        return showError(dobCheck.message!, profile.dob ? "dob" : "kyc-dob");
      }
    }

    if (kyc.address && !addressRegex.test(kyc.address)) {
      kycValid = false;
      return showError("Street address contains invalid characters.", "kyc-address");
    }
    if (kyc.city && !alphaOnly.test(kyc.city)) {
      kycValid = false;
      return showError("City must contain only alphabets.", "kyc-city");
    }
    if (kyc.state && !alphaOnly.test(kyc.state)) {
      kycValid = false;
      return showError("State must contain only alphabets.", "kyc-state");
    }
    const pinError = validatePostalCode(profile.zip, profile.country);
    if (pinError) { return showError(pinError, "zip"); }

    const kycPinError = validatePostalCode(kyc.pinCode, kyc.country);
    if (kycPinError) { return showError(kycPinError, "kyc-pin"); }



    if (kyc.country && !alphaOnly.test(kyc.country)) {
      kycValid = false;
      return showError("Country must contain only alphabets.", "kyc-country");
    }

    if (!kycValid) {
      setBusy(false);
      return;
    }

    if (kyc.status === "APPROVED" && (!kyc.fullName || !kyc.dateOfBirth || !kyc.nationality || !kyc.idType || !kyc.idNumber || !kyc.address || !kyc.city || !kyc.state || !kyc.pinCode || !kyc.country)) {
      return showError("Cannot approve KYC: All personal and address fields must be filled correctly.", "kyc-fullname");
    }


    const docPayload = Object.fromEntries(
      Object.entries(docs).map(([k, v]) => [k, v.url || null])
    );
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profile,
        dob:     kyc.dateOfBirth || null,
        phone:   profile.phone   || null,
        pan:     (kyc.idType === "PAN" || kyc.idType === "PAN Card") ? kyc.idNumber : undefined,
        aadhar:  (kyc.idType === "Aadhaar" || kyc.idType === "Aadhar") ? kyc.idNumber : undefined,
        address: profile.address || null,
        city:    profile.city    || null,
        state:   profile.state   || null,
        zip:     profile.zip     || null,
        country: profile.country || null,
        managerId: profile.managerId || null,
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
    if (!res.ok) {
      // Best-effort map a server error to the relevant field for scroll/highlight.
      const em = (data.error ?? "").toLowerCase();
      const isKyc = /kyc|legal/.test(em);
      const field =
        /email/.test(em) ? "email"
        : /(18\+|age|date of birth|\bdob\b)/.test(em) ? (isKyc ? "kyc-dob" : "dob")
        : /phone/.test(em) ? "phone"
        : /nationality/.test(em) ? "kyc-nationality"
        : /aadhaar|aadhar|\bpan\b|id number/.test(em) ? "kyc-idnumber"
        : /pin|postal|\bzip\b/.test(em) ? (isKyc ? "kyc-pin" : "zip")
        : /city/.test(em) ? (isKyc ? "kyc-city" : undefined)
        : /state/.test(em) ? (isKyc ? "kyc-state" : undefined)
        : /country/.test(em) ? "kyc-country"
        : /address/.test(em) ? (isKyc ? "kyc-address" : "profile-address")
        : /legal name/.test(em) ? "kyc-fullname"
        : /name/.test(em) ? "name"
        : undefined;
      return showError(data.error ?? "Save failed", field);
    }
    setError("");
    setErrorField(null);
    setMsg("All changes saved successfully.");
    setSuccessOpen(true);
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
      {/* Success popup — confirms all changes were saved without errors */}
      {successOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSuccessOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Changes saved</h3>
            <p className="mt-1 text-sm text-slate-500">All changes have been saved successfully, with no errors.</p>
            <button type="button" onClick={() => setSuccessOpen(false)} className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700">
              Done
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <span className="font-bold">⚠</span> {error}
        </p>
      )}
      {msg && !successOpen && <p className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">{msg}</p>}

      {/* Profile Summary KPI Cards (User Account Profile) */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {/* 1. Unique User ID */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs col-span-2 sm:col-span-3 lg:col-span-2 flex flex-col justify-center">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-tight">Unique User ID</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <p className="font-mono text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
              {user.userId || "USR-XXXXX"}
            </p>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${user.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
              {user.active ? act.label : "Disabled"}
            </span>
          </div>
        </div>

        {/* 2. Total Properties Sold */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs col-span-1">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-tight">Properties Sold</p>
          <p className="text-xl font-black text-slate-900 mt-1">
            {user.commissionSummary?.totalSoldProperties ?? (user.soldProperties?.length || 0)}
          </p>
        </div>

        {/* 3. Total Commission Earned */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs col-span-1">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-tight">Comm. Earned</p>
          <p className="text-xl font-black text-emerald-600 mt-1 break-words">
            {formatCurrency(user.commissionSummary?.totalCommissionEarned ?? 0)}
          </p>
        </div>

        {/* 4. Commission Paid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs col-span-1">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-tight">Comm. Paid</p>
          <p className="text-xl font-black text-blue-600 mt-1 break-words">
            {formatCurrency(user.commissionSummary?.commissionPaid ?? 0)}
          </p>
        </div>

        {/* 5. Commission Pending */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs col-span-1">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-tight">Comm. Pending</p>
          <p className="text-xl font-black text-amber-600 mt-1 break-words">
            {formatCurrency(user.commissionSummary?.commissionPending ?? 0)}
          </p>
        </div>
      </div>

      {/* ── CRM Activity (HubSpot-style timeline) ────────────────────────── */}
      <section className="rounded-2xl border bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">CRM Activity</h2>
          <p className="text-slate-300 text-xs mt-0.5">Log notes, emails, calls, tasks & meetings for this contact</p>
        </div>
        <div className="p-5">
          <UserCrmActivity contactId={user.id} contactName={user.name} contactEmail={user.email} />
        </div>
      </section>

      {/* ── Account & Contact ───────────────────────────────────────────── */}
      <section className="rounded-2xl border bg-white p-5 space-y-3 max-w-4xl">
        <h2 className="text-base font-bold text-slate-900 border-b pb-2.5">Account &amp; contact</h2>
        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div id="fld-name" className={fieldRing("name")}>
            <Label className="text-[11px] font-bold text-slate-600 mb-1">Full name</Label>
            <Input className="!h-9 !py-1.5 !px-3 text-xs font-medium" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div id="fld-email" className={fieldRing("email")}>
            <Label className="text-[11px] font-bold text-slate-600 mb-1">Email</Label>
            <Input className="!h-9 !py-1.5 !px-3 text-xs font-medium" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div id="fld-dob" className={fieldRing("dob")}>
            <Label className="text-[11px] font-bold text-slate-600 mb-1">Date of birth (Must be 18+ years)</Label>
            <Input className="!h-9 !py-1.5 !px-3 text-xs font-medium" type="date" value={profile.dob} onChange={(e) => updateDob(e.target.value)} placeholder="YYYY-MM-DD" />
          </div>
          <div id="fld-phone" className={`sm:col-span-2${fieldRing("phone")}`}>
            <Label className="text-[11px] font-bold text-slate-600 mb-1">Phone (WhatsApp / SMS)</Label>
            <PhoneInput value={profile.phone} onChange={(phone) => setProfile((p) => ({ ...p, phone }))} defaultCountry={profile.country} />
          </div>
          <div>
            <Label className="text-[11px] font-bold text-slate-600 mb-1">Role</Label>
            <SearchableSelect
              options={(Object.keys(ROLE_LABELS) as Role[])
                .filter((r) => r !== "SUPERADMIN" || userRole === "SUPERADMIN")
                .map((r) => ({
                  value: r,
                  label: ROLE_LABELS[r],
                }))}
              value={profile.role}
              onChange={(val: string) => setProfile((p) => ({ ...p, role: val as Role }))}
              placeholder="Select user role..."
              searchPlaceholder="Search role..."
            />
          </div>
          <div>
            <Label className="text-[11px] font-bold text-slate-600 mb-1">Reports To (Manager / Supervisor)</Label>
            <SearchableSelect
              options={[
                { value: "", label: "No Manager (Top-level / Independent)" },
                ...allManagers.map((m) => ({
                  value: m.id,
                  label: `${m.name} (${ROLE_LABELS[m.role]})`,
                  sublabel: m.email,
                })),
              ]}
              value={profile.managerId ?? ""}
              onChange={(val: string) => setProfile((p) => ({ ...p, managerId: val }))}
              placeholder="Select reporting manager..."
              searchPlaceholder="Search manager name or email..."
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 pt-1">
          <input type="checkbox" checked={profile.active} onChange={(e) => setProfile((p) => ({ ...p, active: e.target.checked }))} className="rounded text-amber-600 focus:ring-amber-500" />
          Account active (can sign in)
        </label>

        {/* ── Organization & Scope Fields (Active for Agent / Sales Dept) ── */}
        {(() => {
          const isAgentRole = profile.role === "AGENT" || profile.role === "EXECUTIVE" || profile.role === "EMPLOYEE";
          const selectedDeptObj = depts.find((d) => d.id === profile.departmentId);
          const isSalesDept = Boolean(
            selectedDeptObj && selectedDeptObj.name.toLowerCase().includes("sales")
          );
          const hasAssignedHierarchy = Boolean(
            profile.tenantId || profile.franchiseId || profile.branchId || profile.departmentId || profile.teamId
          );
          const showHierarchyFields = isAgentRole || isSalesDept || hasAssignedHierarchy;

          if (!showHierarchyFields) return null;

          return (
            <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-amber-600" />
                  Organization &amp; Team Scope
                </label>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Active ({profile.role === "AGENT" ? "Agent Role" : isSalesDept ? "Sales Department" : "Assigned Scope"})
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                {/* 1. White Label */}
                <div>
                  <Label className="text-[11px] font-bold text-slate-600 mb-1">White Label</Label>
                  <SearchableSelect
                    options={[
                      { value: "", label: "No White Label Assigned" },
                      ...orgs.map((o: HierarchyOrgUnit) => ({ value: o.id, label: `${o.name} (${o.code})` })),
                    ]}
                    value={profile.tenantId}
                    onChange={handleTenantChange}
                    placeholder="Select White Label..."
                    searchPlaceholder="Search White Label..."
                  />
                </div>

                {/* 2. Franchise */}
                <div>
                  <Label className="text-[11px] font-bold text-slate-600 mb-1">Franchise</Label>
                  <SearchableSelect
                    options={[
                      { value: "", label: "No Franchise Assigned" },
                      ...availableFranchises.map((f: HierarchyOrgUnit) => ({ value: f.id, label: `${f.name} (${f.code})` })),
                    ]}
                    value={profile.franchiseId}
                    onChange={handleFranchiseChange}
                    placeholder="Select Franchise..."
                    searchPlaceholder="Search Franchise..."
                  />
                </div>

                {/* 3. Branch */}
                <div>
                  <Label className="text-[11px] font-bold text-slate-600 mb-1">Branch</Label>
                  <SearchableSelect
                    options={[
                      { value: "", label: "No Branch Assigned" },
                      ...availableBranches.map((b: HierarchyOrgUnit) => ({ value: b.id, label: `${b.name} (${b.code})` })),
                    ]}
                    value={profile.branchId}
                    onChange={handleBranchChange}
                    placeholder="Select City Branch..."
                    searchPlaceholder="Search Branch..."
                  />
                </div>

                {/* 4. Department */}
                <div>
                  <Label className="text-[11px] font-bold text-slate-600 mb-1">Department</Label>
                  <SearchableSelect
                    options={[
                      { value: "", label: "No Department Assigned" },
                      ...availableDepts.map((d: HierarchyOrgUnit) => ({ value: d.id, label: `${d.name} (${d.code})` })),
                    ]}
                    value={profile.departmentId}
                    onChange={handleDeptChange}
                    placeholder="Select Department..."
                    searchPlaceholder="Search Department..."
                  />
                </div>

                {/* 5. Team */}
                <div className="sm:col-span-2">
                  <Label className="text-[11px] font-bold text-slate-600 mb-1">Team</Label>
                  <SearchableSelect
                    options={[
                      { value: "", label: "No Team Assigned" },
                      ...availableTeams.map((t: HierarchyOrgUnit) => ({ value: t.id, label: `${t.name} (${t.code})` })),
                    ]}
                    value={profile.teamId}
                    onChange={handleTeamChange}
                    placeholder="Select Team..."
                    searchPlaceholder="Search Team..."
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Custom Account Fields Block (Synced with Users Table Custom Columns) ── */}
        {customCols.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" /> Custom Account Fields ({customCols.length})
            </label>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              {customCols.map((col) => {
                const cellVal = getCellValue(user.id, col.id);
                return (
                  <div key={col.id} className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                      <span>{col.label}</span>
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-mono">
                        {(col.fieldType || "text").toUpperCase()}
                      </span>
                    </Label>
                    <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                      <EditableCell
                        value={cellVal}
                        fieldType={col.fieldType}
                        options={col.options}
                        placeholder={`+ Set ${col.label}...`}
                        onChange={(newVal) => updateCell(user.id, col.id, newVal)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Compact Admin Password Change Box ──────────────────────────────────── */}
        <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-amber-600" /> Admin Change User Password
            </label>

            <button
              type="button"
              onClick={() => setNewAdminPassword(Math.random().toString(36).slice(-8) + "A1!")}
              className="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline"
            >
              ⚡ Auto-Generate Password
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter new password for this user..."
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                className="!h-9 !py-1.5 !px-3 text-xs font-medium"
              />
            </div>
            <button
              type="button"
              disabled={updatingPassword || !newAdminPassword.trim()}
              onClick={handleAdminChangeUserPassword}
              className="!h-9 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-xs transition shrink-0 disabled:opacity-50"
            >
              {updatingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>

          {passwordUpdateMsg && (
            <p className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 p-2 rounded-xl">
              {passwordUpdateMsg}
            </p>
          )}
          {passwordUpdateError && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-xl">
              {passwordUpdateError}
            </p>
          )}
        </div>
      </section>

      {/* ── Address ─────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold border-b pb-3">Address</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div id="fld-profile-address" className={`sm:col-span-2${fieldRing("profile-address")}`}>
            <Label>Street address</Label>
            <Input value={profile.address} onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))} />
          </div>
          <div>
            <Label>Country</Label>
            <CountrySelect value={profile.country} onChange={(code) => setProfile((p) => ({ ...p, country: code, state: "", stateCode: "", city: "" }))} />
          </div>
          <div>
            <Label>State / region</Label>
            <GlobalStateSelect
              countryCode={profile.country}
              value={profile.stateCode}
              onChange={(code, name) => setProfile((p) => ({ ...p, stateCode: code, state: name, city: "" }))}
            />
          </div>
          <div>
            <Label>City</Label>
            <GlobalCitySelect
              countryCode={profile.country}
              stateCode={profile.stateCode}
              value={profile.city}
              onChange={(city) => setProfile((p) => ({ ...p, city }))}
            />
          </div>
          <div id="fld-zip" className={fieldRing("zip")}>
            <Label>ZIP / Postal Code</Label>
            <GlobalZipSelect
              countryCode={profile.country}
              city={profile.city}
              value={profile.zip}
              onChange={(zip) => setProfile((p) => ({ ...p, zip }))}
              placeholder={
                profile.country === "IN"
                  ? "6-digit PIN Code"
                  : profile.country === "US"
                  ? "ZIP Code"
                  : "Postal Code"
              }
            />
          </div>
        </div>
      </section>

      {/* ── KYC Identity ────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">KYC &amp; Identity</h2>
            <p className="text-slate-500 text-xs mt-0.5 font-medium">Government ID verification — editable by admin</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">{uploadedCount}/{DOC_SLOTS.length} documents</span>
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
              <div id="fld-kyc-fullname" className={fieldRing("kyc-fullname")}>
                <Label>Legal name (KYC)</Label>
                <Input value={kyc.fullName} onChange={(e) => setKyc((k) => ({ ...k, fullName: e.target.value }))} />
              </div>
              <div id="fld-kyc-dob" className={fieldRing("kyc-dob")}>
                <Label>Date of birth (Must be 18+ years)</Label>
                <Input type="date" value={kyc.dateOfBirth} onChange={(e) => updateDob(e.target.value)} placeholder="YYYY-MM-DD" />
              </div>
              <div id="fld-kyc-nationality" className={fieldRing("kyc-nationality")}>
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
                  {(dynamicDropdowns.kyc_id_types || [
                    { label: "Aadhaar", value: "Aadhaar" },
                    { label: "PAN Card", value: "PAN Card" },
                    { label: "Passport", value: "Passport" },
                    { label: "Driving Licence", value: "Driving Licence" },
                    { label: "Voter ID", value: "Voter ID" },
                  ]).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div id="fld-kyc-idnumber" className={fieldRing("kyc-idnumber")}>
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
                  {(dynamicDropdowns.kyc_statuses || [
                    { label: "Pending", value: "PENDING" },
                    { label: "Approved", value: "APPROVED" },
                    { label: "Rejected", value: "REJECTED" },
                  ]).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
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
              <div id="fld-kyc-address" className={`sm:col-span-2${fieldRing("kyc-address")}`}>
                <Label>Street address</Label>
                <Input value={kyc.address} onChange={(e) => setKyc((k) => ({ ...k, address: e.target.value }))} placeholder="Flat / House No., Street, Locality" />
              </div>
              <div id="fld-kyc-country" className={fieldRing("kyc-country")}>
                <Label>Country</Label>
                <CountrySelect value={kyc.country} onChange={(code) => setKyc((k) => ({ ...k, country: code, state: "", stateCode: "", city: "" }))} />
              </div>
              <div id="fld-kyc-state" className={fieldRing("kyc-state")}>
                <Label>State</Label>
                <GlobalStateSelect
                  countryCode={kyc.country}
                  value={kyc.stateCode}
                  onChange={(code, name) => setKyc((k) => ({ ...k, stateCode: code, state: name, city: "" }))}
                />
              </div>
              <div id="fld-kyc-city" className={fieldRing("kyc-city")}>
                <Label>City</Label>
                <GlobalCitySelect
                  countryCode={kyc.country}
                  stateCode={kyc.stateCode}
                  value={kyc.city}
                  onChange={(city) => setKyc((k) => ({ ...k, city }))}
                />
              </div>
              <div id="fld-kyc-pin" className={fieldRing("kyc-pin")}>
                <Label>{kyc.country === "IN" ? "PIN Code" : "Postal Code"}</Label>
                <GlobalZipSelect
                  countryCode={kyc.country}
                  city={kyc.city}
                  value={kyc.pinCode}
                  onChange={(pinCode) => setKyc((k) => ({ ...k, pinCode }))}
                  placeholder={kyc.country === "IN" ? "6-digit PIN Code" : "Postal / ZIP Code"}
                />
              </div>
            </div>
          </div>

          {/* Document Uploads */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2">
              <span className="h-6 w-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">3</span>
              Identity Documents
            </h3>
            <div className="text-xs text-slate-500 mb-4 ml-8 space-y-1.5">
              <p>
                Documents marked <span className="text-red-500 font-bold">*</span> are required for KYC approval.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 font-semibold">
                  🖼️ Photo, Aadhaar (front/back), PAN, Driving Licence, Voter ID → <b>JPG / PNG only, max 5 MB</b>
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 px-2 py-1 font-semibold">
                  📄 Other ID Document &amp; Address Proof → <b>PDF only, max 5 MB</b>
                </span>
              </div>
            </div>

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

          {/* KYC Admin Notes removed — admin notes now live in the CRM Activity
              section at the top of this page (notes, emails, calls, tasks, meetings
              with author, user ID, timestamp, edit-audit and comments). */}

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

      {/* ── Agent Assigned Leads & Interested Properties ───────────────── */}
      {(profile.role === "AGENT" || (user.leadsOwned && user.leadsOwned.length > 0)) && (
        <>
          <AgentAssignedLeadsSection leads={user.leadsOwned || []} />
          <AgentInterestedPropertiesSection leads={user.leadsOwned || []} />
        </>
      )}

      {/* ── User Property Portfolio (Bought & Sold) ────────────────────── */}
      <UserPropertyPortfolioSection
        boughtProperties={user.boughtProperties || []}
        soldProperties={user.soldProperties || []}
      />

      {/* ── User Transaction History ────────────────────────────────────── */}
      <UserTransactionHistorySection
        transactions={user.userTransactions || []}
        userId={user.id}
        userEmail={user.email}
        userName={user.name}
      />

      {/* ── Agent Commission Tracker (Agents Only) ────────────────────── */}
      {profile.role === "AGENT" && (
        <AgentCommissionTracker agentId={user.id} isAdmin={true} />
      )}

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
                            <select
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white"
                              value={loan.loanType ?? ""}
                              onChange={(e) => updateLoan(idx, "loanType", e.target.value)}
                            >
                              <option value="">Select type</option>
                              {(dynamicDropdowns.loan_types || [
                                { label: "Residential Home Loans", value: "Residential Home Loans" },
                                { label: "Commercial Mortgages", value: "Commercial Mortgages" },
                                { label: "Construction Loans", value: "Construction Loans" },
                                { label: "Land/Plot Loans", value: "Land/Plot Loans" },
                                { label: "Loans Against Property", value: "Loans Against Property" },
                                { label: "Bridge Loans", value: "Bridge Loans" },
                              ]).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
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
                            <select
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white"
                              value={loan.employmentStatus ?? ""}
                              onChange={(e) => updateLoan(idx, "employmentStatus", e.target.value)}
                            >
                              <option value="">Select status</option>
                              {(dynamicDropdowns.employment_statuses || [
                                { label: "Salaried", value: "Salaried" },
                                { label: "Self-Employed", value: "Self-Employed" },
                                { label: "Business Owner", value: "Business Owner" },
                                { label: "Retired", value: "Retired" },
                                { label: "Other", value: "Other" },
                              ]).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
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
                              <select
                                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm bg-white"
                                value={loan.propertyType ?? ""}
                                onChange={(e) => updateLoan(idx, "propertyType", e.target.value)}
                              >
                                <option value="">Select type</option>
                                {(dynamicDropdowns.loan_property_types || [
                                  { label: "Apartment", value: "Apartment" },
                                  { label: "Villa", value: "Villa" },
                                  { label: "Penthouse", value: "Penthouse" },
                                  { label: "Townhouse", value: "Townhouse" },
                                  { label: "Land/Plot", value: "Land/Plot" },
                                  { label: "Commercial", value: "Commercial" },
                                  { label: "Duplex", value: "Duplex" },
                                  { label: "Full Floor", value: "Full Floor" },
                                ]).map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
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

                      <LoanAdminNotes
                        contactId={user.id}
                        loanId={loan.id}
                        notes={loan.adminNotes}
                        onChange={(val) => updateLoan(idx, "adminNotes", val)}
                      />

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
        {canEdit && (
          <Button disabled={busy} loading={busy} onClick={save}>
            Save all changes
          </Button>
        )}
        <Button variant="secondary" disabled={busy} onClick={() => router.push("/admin/users")}>
          Back to list
        </Button>
        {canDelete && (
          <Button variant="danger" disabled={busy} onClick={remove} className="ml-auto">
            Delete user
          </Button>
        )}
      </div>
    </div>
  );
}
