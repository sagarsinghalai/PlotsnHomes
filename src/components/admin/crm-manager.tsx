"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronDown,
  Download,
  Filter,
  LayoutGrid,
  List,
  MoreVertical,
  Plus,
  Search,
  ArrowUpDown,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  PhoneCall,
  MessageSquare,
  Tag,
  FileText,
  CheckSquare,
  Calendar,
  UserCheck,
  Pencil,
  Trash2,
  BarChart3,
  Clock,
  CircleDollarSign,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Upload,
  Check,
  FileSpreadsheet,
  Building,
  Users,
  Sparkles,
  ChevronUp,
  GripVertical,
  Lock as LockIcon,
  ExternalLink,
  Info,
} from "lucide-react";
import { CrmSubNav } from "@/components/admin/crm/crm-sub-nav";
import { Pipeline, PipelineStage, DEFAULT_PIPELINES } from "@/lib/pipeline-store";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} - ${hours}:${minutes}`;
  } catch {
    return dateStr || "";
  }
}

interface SystemField {
  key: string;
  label: string;
  object: "Contact" | "Opportunity";
  aliases: string[];
}

const SYSTEM_FIELDS: SystemField[] = [
  { key: "contactName", label: "Primary contact name", object: "Contact", aliases: ["primary contact name", "contact name", "contact", "name", "full name", "client name"] },
  { key: "email", label: "Primary email", object: "Contact", aliases: ["primary email", "email address", "email", "mail", "contact email"] },
  { key: "countryCode", label: "Country code", object: "Contact", aliases: ["country code", "code", "phone code"] },
  { key: "phone", label: "Primary phone", object: "Contact", aliases: ["primary phone", "phone number", "phone", "mobile", "contact number"] },
  { key: "additionalContacts", label: "Additional contacts", object: "Contact", aliases: ["additional contacts", "additional contact", "secondary contact", "other contact"] },
  { key: "oppName", label: "Opportunity name", object: "Opportunity", aliases: ["opportunity name", "deal name", "opportunity", "title"] },
  { key: "pipeline", label: "Pipeline", object: "Opportunity", aliases: ["pipeline name", "pipeline"] },
  { key: "stage", label: "Stage", object: "Opportunity", aliases: ["stage name", "sales stage", "stage"] },
  { key: "status", label: "Status", object: "Opportunity", aliases: ["status", "deal status"] },
  { key: "value", label: "Value", object: "Opportunity", aliases: ["value", "amount", "budget", "deal value", "price"] },
  { key: "owner", label: "Owner", object: "Opportunity", aliases: ["owner", "assigned to", "agent", "user", "owner name"] },
  { key: "followers", label: "Followers", object: "Opportunity", aliases: ["followers", "follower"] },
  { key: "businessName", label: "Business name", object: "Opportunity", aliases: ["business name", "company", "organization"] },
  { key: "source", label: "Source", object: "Opportunity", aliases: ["source", "lead source"] },
  { key: "nextFollowUpAt", label: "Expected Close Date", object: "Opportunity", aliases: ["expected close date", "close date", "expected date", "followup date"] },
  { key: "tags", label: "Tags", object: "Opportunity", aliases: ["tags", "tag", "labels"] },
];

export type CrmLead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  stage: string;
  status?: string | null;
  score: number;
  budgetMin: number | null;
  budgetMax: number | null;
  businessName?: string | null;
  pipelineId?: string | null;
  tags?: string[];
  additionalContacts?: string[];
  notesCount?: number;
  callsCount?: number;
  messagesCount?: number;
  tasksCount?: number;
  meetingsCount?: number;
  notes: string | null;
  nextFollowUpAt: string | null;
  property: { title: string; symbol: string } | null;
  owner: { id: string; name: string; userId?: string | null } | null;
  tasks: { id: string; title: string; completed: boolean; dueAt: string | null }[];
  activities: { id: string; type: string; message: string; createdAt: string }[];
};

type BulkActionLog = {
  id: string;
  actionLabel: string;
  operation: string;
  status: "Complete" | "In Progress" | "Failed";
  user: { name: string; initials: string };
  createdAt: string;
  completedAt: string;
};

const INITIAL_BULK_LOGS: BulkActionLog[] = [
  {
    id: "bulk-1",
    actionLabel: "Delete - 7_Aug_2026_11_26_14",
    operation: "Delete",
    status: "Complete",
    user: { name: "Sagar Singhal", initials: "SS" },
    createdAt: "Aug 7, 2026 11:26 PM",
    completedAt: "Aug 7, 2026 11:26 PM",
  },
  {
    id: "bulk-2",
    actionLabel: "Delete - 7_Aug_2026_10_42_08",
    operation: "Delete",
    status: "Complete",
    user: { name: "Sagar Singhal", initials: "SS" },
    createdAt: "Aug 7, 2026 10:42 PM",
    completedAt: "Aug 7, 2026 10:42 PM",
  },
  {
    id: "bulk-3",
    actionLabel: "Delete - 7_Aug_2026_5_29_41",
    operation: "Delete",
    status: "Complete",
    user: { name: "Sagar Singhal", initials: "SS" },
    createdAt: "Aug 7, 2026 05:29 PM",
    completedAt: "Aug 7, 2026 05:29 PM",
  },
];

const INITIAL_DEMO_LEADS: CrmLead[] = [
  {
    id: "lead-rohan-78",
    name: "Sagar Singhal",
    email: "sagar.singhal@example.com",
    phone: "+91 98100 00000",
    source: "Website",
    stage: "stg-101", // New Lead / Initial Contact
    score: 80,
    budgetMin: 0,
    budgetMax: 0,
    businessName: "Business Partner",
    pipelineId: "pipe-marketing-101",
    notes: null,
    nextFollowUpAt: null,
    property: null,
    owner: { id: "u-1", name: "Sagar Singhal" },
    tasks: [],
    activities: [],
  },
];

export function CrmManager({
  leads,
  agents,
  sources,
  properties,
  agentMode = false,
}: {
  leads: CrmLead[];
  agents: { id: string; name: string; email?: string; userId?: string | null }[];
  sources: string[];
  properties: { id: string; title: string; symbol: string }[];
  stageLabels?: Record<string, string>;
  agentMode?: boolean;
}) {
  const router = useRouter();
  const { hasAddPermission, hasSubPermission } = useAdminPermissions();
  const canAdd = hasAddPermission("/admin/crm");
  const canCreateOpportunities = canAdd && (!hasSubPermission || hasSubPermission("pipeline", "create_opportunities"));
  const canAddStatus = !hasSubPermission || hasSubPermission("pipeline", "add_status");
  const canForecastSummary = !hasSubPermission || hasSubPermission("pipeline", "forecast_summary");
  const canForecastTimeline = !hasSubPermission || hasSubPermission("pipeline", "forecast_timeline");
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") || "opportunities";

  const [pipelines, setPipelines] = useState<Pipeline[]>(DEFAULT_PIPELINES);
  const [activePipelineId, setActivePipelineId] = useState<string>("pipe-marketing-101");
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);

  // Forecast Tab States
  const [forecastViewMode, setForecastViewMode] = useState<"summary" | "timeline">("summary");
  const [forecastGroupBy, setForecastGroupBy] = useState<"Status" | "Owner" | "Expected Close Date" | "Pipeline">("Status");
  const [timelinePeriod, setTimelinePeriod] = useState<"Week" | "Month" | "Quarter" | "Year">("Week");
  const [timelineOffset, setTimelineOffset] = useState<number>(0);
  const [activeTimelineTooltip, setActiveTimelineTooltip] = useState<string | null>(null);
  const [showListViewDropdown, setShowListViewDropdown] = useState<boolean>(false);
  const [showCustomDateModal, setShowCustomDateModal] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Customize Card Modal States (With Drag & Drop reordering support)
  const [showCustomizeCardModal, setShowCustomizeCardModal] = useState<boolean>(false);
  const [cardLayoutMode, setCardLayoutMode] = useState<"Default" | "Compact" | "Unlabeled">("Default");
  const [customizeCardTab, setCustomizeCardTab] = useState<"fields" | "quickActions">("fields");
  const [customizeCardSearch, setCustomizeCardSearch] = useState<string>("");

  const [cardFieldsList, setCardFieldsList] = useState<{
    key: string;
    label: string;
    enabled: boolean;
    locked?: boolean;
    badge?: string;
    isLink?: boolean;
  }[]>([
    { key: "name", label: "Opportunity name", enabled: true, locked: true },
    { key: "smartTags", label: "Smart tags", enabled: true, badge: "New", isLink: true },
    { key: "owner", label: "Opportunity owner", enabled: true },
    { key: "businessName", label: "Business name", enabled: true },
    { key: "source", label: "Source", enabled: true },
    { key: "value", label: "Value", enabled: true },
    { key: "lostReason", label: "Lost reason", enabled: true },
  ]);

  const [quickActionsList, setQuickActionsList] = useState<{
    key: string;
    label: string;
    enabled: boolean;
  }[]>([
    { key: "call", label: "Call", enabled: true },
    { key: "tags", label: "Tags", enabled: true },
    { key: "conversations", label: "Unread conversations", enabled: true },
    { key: "notes", label: "Notes", enabled: true },
    { key: "tasks", label: "Tasks", enabled: true },
    { key: "appointment", label: "Next confirmed appointment", enabled: true },
  ]);

  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);
  const [dragOverFieldIndex, setDragOverFieldIndex] = useState<number | null>(null);

  const [draggedActionIndex, setDraggedActionIndex] = useState<number | null>(null);
  const [dragOverActionIndex, setDragOverActionIndex] = useState<number | null>(null);

  function handleDropField(targetIndex: number) {
    if (draggedFieldIndex === null || draggedFieldIndex === targetIndex) {
      setDraggedFieldIndex(null);
      setDragOverFieldIndex(null);
      return;
    }
    setCardFieldsList((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedFieldIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
    setDraggedFieldIndex(null);
    setDragOverFieldIndex(null);
  }

  function handleDropAction(targetIndex: number) {
    if (draggedActionIndex === null || draggedActionIndex === targetIndex) {
      setDraggedActionIndex(null);
      setDragOverActionIndex(null);
      return;
    }
    setQuickActionsList((prev) => {
      const updated = [...prev];
      const [movedItem] = updated.splice(draggedActionIndex, 1);
      updated.splice(targetIndex, 0, movedItem);
      return updated;
    });
    setDraggedActionIndex(null);
    setDragOverActionIndex(null);
  }

  const filteredCardFields = useMemo(() => {
    if (!customizeCardSearch.trim()) return cardFieldsList;
    return cardFieldsList.filter((f) =>
      f.label.toLowerCase().includes(customizeCardSearch.toLowerCase())
    );
  }, [cardFieldsList, customizeCardSearch]);

  // Import Wizard State (Step 1..4)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStep, setImportStep] = useState<number>(1);
  const [selectedImportObjects, setSelectedImportObjects] = useState<string[]>(["Opportunities"]);
  const [importFileName, setImportFileName] = useState("");
  const [importFileSize, setImportFileSize] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importStrategy, setImportStrategy] = useState("Create new and update existing opportunities");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvSampleRows, setCsvSampleRows] = useState<Record<string, string>[]>([]);
  const [csvFullRows, setCsvFullRows] = useState<Record<string, string>[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [openRequirements, setOpenRequirements] = useState<boolean>(true);
  const [dontImportUnmapped, setDontImportUnmapped] = useState<boolean>(false);

  // Bulk Actions Filter States
  const [bulkStartDate, setBulkStartDate] = useState("2026-08-02");
  const [bulkEndDate, setBulkEndDate] = useState("2026-09-08");
  const [bulkStatusFilter, setBulkStatusFilter] = useState("All statuses");
  const [bulkActionFilter, setBulkActionFilter] = useState("All actions");
  const [bulkUserFilter, setBulkUserFilter] = useState("All users");
  const [bulkLogs, setBulkLogs] = useState<BulkActionLog[]>(INITIAL_BULK_LOGS);

  // Leads State
  const [localLeads, setLocalLeads] = useState<CrmLead[]>(INITIAL_DEMO_LEADS);

  // Selection State for Checkboxes
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Modal States
  const [showCreate, setShowCreate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState("");
  const [fieldSearch, setFieldSearch] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [statuses, setStatuses] = useState<string[]>(["Open", "Won", "Lost", "Abandoned"]);
  const [showAddStatusModal, setShowAddStatusModal] = useState(false);
  const [newStatusInput, setNewStatusInput] = useState("");
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("crm_custom_statuses");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setStatuses(parsed);
        }
      }
    } catch {
      // Ignore errors
    }
  }, []);

  function handleAddStatus() {
    const trimmed = newStatusInput.trim();
    if (!trimmed) {
      setStatusError("Please enter a status name.");
      return;
    }
    if (statuses.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setStatusError("This status already exists.");
      return;
    }
    const updated = [...statuses, trimmed];
    setStatuses(updated);
    try {
      localStorage.setItem("crm_custom_statuses", JSON.stringify(updated));
    } catch {
      // Ignore errors
    }
    setNewStatusInput("");
    setStatusError("");
    setShowAddStatusModal(false);
  }

  const [countryCode, setCountryCode] = useState("+91");
  const COUNTRY_CODES = [
    { code: "+91", country: "India", flag: "🇮🇳" },
    { code: "+1", country: "US/Canada", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+971", country: "UAE", flag: "🇦🇪" },
    { code: "+65", country: "Singapore", flag: "🇸🇬" },
    { code: "+61", country: "Australia", flag: "🇦🇺" },
    { code: "+49", country: "Germany", flag: "🇩🇪" },
    { code: "+33", country: "France", flag: "🇫🇷" },
    { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
    { code: "+974", country: "Qatar", flag: "🇶🇦" },
    { code: "+977", country: "Nepal", flag: "🇳🇵" },
    { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  ];

  const [createError, setCreateError] = useState("");
  const AVAILABLE_CONTACT_OPTIONS = [
    "Priya Patel (Co-Investor)",
    "Rajesh Sharma (Primary Buyer)",
    "Vikram Sethi (Legal Advisor)",
    "Ananya Roy (Broker Partner)",
    "Amit Shah (Financial Consultant)",
    "Sagar Singhal (Account Executive)",
    "Sunil Kumar (Site Supervisor)",
    "Neha Verma (Property Manager)",
    "Rohan Gupta (Design Lead)",
    "Kavita Reddy (Client Rep)",
  ];

  const [createForm, setCreateForm] = useState({
    contactName: "",
    email: "",
    phone: "",
    oppName: "",
    pipelineId: activePipelineId,
    stageId: "",
    status: "Open",
    value: "0",
    ownerId: "",
    followers: "",
    businessName: "",
    source: sources[0] ?? "Website",
    expectedCloseDate: "",
    tags: "",
    additionalContacts: [] as string[],
  });

  // Card Action Modals state
  const [activeCardActionLead, setActiveCardActionLead] = useState<CrmLead | null>(null);
  const [actionModalType, setActionModalType] = useState<"call" | "message" | "unifiedEdit" | null>(null);
  const [activeEditTab, setActiveEditTab] = useState<"details" | "appointment" | "tasks" | "notes">("details");
  const [hideEmptyFields, setHideEmptyFields] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [searchTaskText, setSearchTaskText] = useState("");
  const [searchNoteText, setSearchNoteText] = useState("");
  const [leadNotesList, setLeadNotesList] = useState<{ id: string; text: string; date: string; author: string }[]>([]);
  const [leadTasksList, setLeadTasksList] = useState<{ id: string; title: string; dueAt: string | null; completed: boolean }[]>([]);
  const [leadAppointmentsList, setLeadAppointmentsList] = useState<{ id: string; title: string; date: string; time: string; type: string }[]>([]);

  // Sub-form states
  const [createContactInput, setCreateContactInput] = useState("");
  const [editContactInput, setEditContactInput] = useState("");
  const [callStatus, setCallStatus] = useState("Completed");
  const [callNotes, setCallNotes] = useState("");
  const [messageChannel, setMessageChannel] = useState<"WhatsApp" | "SMS" | "Email">("WhatsApp");
  const [messageText, setMessageText] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [leadTags, setLeadTags] = useState<string[]>(["business partner"]);
  const [noteInput, setNoteInput] = useState("");
  const [taskTitleInput, setTaskTitleInput] = useState("");
  const [taskDueDateInput, setTaskDueDateInput] = useState("");
  const [meetingTitleInput, setMeetingTitleInput] = useState("");
  const [meetingDateInput, setMeetingDateInput] = useState("");
  const [meetingTimeInput, setMeetingTimeInput] = useState("11:00");
  const [meetingTypeInput, setMeetingTypeInput] = useState("Site Visit");
  const [editLeadForm, setEditLeadForm] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    value: "0",
    pipelineId: "",
    stageId: "",
    status: "Open",
    ownerId: "",
    source: "Website",
    expectedCloseDate: "",
    additionalContacts: [] as string[],
  });

  function openUnifiedModal(opp: CrmLead, tab: "details" | "appointment" | "tasks" | "notes" = "details") {
    setActiveCardActionLead(opp);
    setActiveEditTab(tab);
    setEditContactInput("");
    setEditLeadForm({
      name: opp.name,
      email: opp.email,
      phone: opp.phone || "",
      businessName: opp.businessName || "Business Partner",
      value: (opp.budgetMax || opp.budgetMin || 0).toString(),
      pipelineId: opp.pipelineId || activePipelineId,
      stageId: opp.stage,
      status: "Open",
      ownerId: opp.owner?.id || "",
      source: opp.source || "Website",
      expectedCloseDate: opp.nextFollowUpAt ? opp.nextFollowUpAt.split("T")[0] : "",
      additionalContacts: opp.additionalContacts || [],
    });
    const tagsList = opp.tags ?? (opp.businessName && opp.businessName !== "Business Partner" ? opp.businessName.split(",").map((t) => t.trim()).filter(Boolean) : []);
    setLeadTags(tagsList);
    
    // Notes list: load from opp.notes and opp.activities NOTE items
    const noteItems: { id: string; text: string; date: string; author: string }[] = [];
    if (opp.notes) {
      noteItems.push({
        id: `note-default-${opp.id}`,
        text: opp.notes,
        date: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        author: opp.owner?.name || "Sagar Singhal",
      });
    }
    (opp.activities || [])
      .filter((a) => a.type === "NOTE")
      .forEach((a) => {
        if (!noteItems.some((n) => n.text === a.message)) {
          noteItems.push({
            id: a.id,
            text: a.message,
            date: new Date(a.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
            author: opp.owner?.name || "Sagar Singhal",
          });
        }
      });
    setLeadNotesList(noteItems);

    setLeadTasksList(
      (opp.tasks || []).map((t) => ({ id: t.id, title: t.title, dueAt: t.dueAt, completed: t.completed }))
    );
    setLeadAppointmentsList(
      (opp.activities || [])
        .filter((a) => a.type === "MEETING")
        .map((a) => ({ id: a.id, title: a.message, date: opp.nextFollowUpAt ? opp.nextFollowUpAt.split("T")[0] : "2026-08-10", time: "11:00", type: "Site Visit" }))
    );
    setShowAppointmentForm(false);
    setShowTaskForm(false);
    setShowNoteForm(false);
    setActionModalType("unifiedEdit");
  }

  function openCallModal(opp: CrmLead) {
    setActiveCardActionLead(opp);
    setCallNotes("");
    setCallStatus("Completed");
    setActionModalType("call");
  }

  function openMessageModal(opp: CrmLead) {
    setActiveCardActionLead(opp);
    setMessageText("");
    setMessageChannel("WhatsApp");
    setActionModalType("message");
  }

  function openTagsModal(opp: CrmLead) {
    openUnifiedModal(opp, "details");
  }

  function openNotesModal(opp: CrmLead) {
    openUnifiedModal(opp, "notes");
  }

  function openTasksModal(opp: CrmLead) {
    openUnifiedModal(opp, "tasks");
  }

  function openScheduleModal(opp: CrmLead) {
    openUnifiedModal(opp, "appointment");
  }

  function openEditModal(opp: CrmLead) {
    openUnifiedModal(opp, "details");
  }

  async function deleteOpportunity(id: string) {
    setLocalLeads((prev) => prev.filter((l) => l.id !== id));
    try {
      await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    } catch {
      // ignore
    }
    setActionModalType(null);
  }

  async function submitCallLog() {
    if (!activeCardActionLead) return;
    setLocalLeads((prev) =>
      prev.map((l) =>
        l.id === activeCardActionLead.id
          ? { ...l, callsCount: (l.callsCount || 0) + 1 }
          : l
      )
    );
    try {
      await fetch(`/api/admin/leads/${activeCardActionLead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "call",
          message: `Call status: ${callStatus}. Notes: ${callNotes || "No notes"}`,
        }),
      });
    } catch {
      // ignore
    }
    setActionModalType(null);
  }

  async function submitSendMessage() {
    if (!activeCardActionLead) return;
    const phone = activeCardActionLead.phone || "+919810000000";
    setLocalLeads((prev) =>
      prev.map((l) =>
        l.id === activeCardActionLead.id
          ? { ...l, messagesCount: (l.messagesCount || 0) + 1 }
          : l
      )
    );
    if (messageChannel === "WhatsApp") {
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`, "_blank");
    }
    try {
      await fetch(`/api/admin/leads/${activeCardActionLead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: messageChannel === "SMS" ? "note" : "email",
          message: `[${messageChannel}] ${messageText}`,
        }),
      });
    } catch {
      // ignore
    }
    setActionModalType(null);
  }

  async function submitSaveUnifiedModal() {
    if (!activeCardActionLead) return;
    const valNum = parseFloat(editLeadForm.value) || 0;
    const tagStr = leadTags.join(", ");

    const currentNotesActivities = leadNotesList.map((n) => ({
      id: n.id,
      type: "NOTE",
      message: n.text,
      createdAt: new Date().toISOString(),
    }));

    setLocalLeads((prev) =>
      prev.map((l) => {
        if (l.id === activeCardActionLead.id) {
          const nonNoteActivities = (l.activities || []).filter((a) => a.type !== "NOTE");
          return {
            ...l,
            name: editLeadForm.name,
            email: editLeadForm.email,
            phone: editLeadForm.phone,
            businessName: editLeadForm.businessName || tagStr || "Business Partner",
            budgetMax: valNum,
            budgetMin: valNum,
            pipelineId: editLeadForm.pipelineId,
            stage: editLeadForm.stageId,
            source: editLeadForm.source,
            tags: leadTags,
            additionalContacts: editLeadForm.additionalContacts,
            notes: leadNotesList.length > 0 ? leadNotesList[0].text : l.notes,
            notesCount: leadNotesList.length,
            tasksCount: Math.max(l.tasksCount || 0, leadTasksList.length),
            meetingsCount: Math.max(l.meetingsCount || 0, leadAppointmentsList.length),
            activities: [...currentNotesActivities, ...nonNoteActivities],
          };
        }
        return l;
      })
    );

    try {
      await fetch(`/api/admin/leads/${activeCardActionLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editLeadForm.name,
          email: editLeadForm.email,
          phone: editLeadForm.phone,
          source: editLeadForm.source,
          stage: editLeadForm.stageId,
          budgetMax: valNum,
          budgetMin: valNum,
          requirements: JSON.stringify({
            pipelineId: editLeadForm.pipelineId,
            businessName: editLeadForm.businessName || tagStr,
            tags: leadTags,
            additionalContacts: editLeadForm.additionalContacts,
          }),
        }),
      });
    } catch {
      // ignore
    }
    setActionModalType(null);
  }

  async function submitScheduleMeetingInModal() {
    if (!activeCardActionLead) return;
    const newAppt = {
      id: `appt-${Date.now()}`,
      title: meetingTitleInput,
      date: meetingDateInput,
      time: meetingTimeInput,
      type: meetingTypeInput,
    };
    setLeadAppointmentsList((prev) => [...prev, newAppt]);
    setLocalLeads((prev) =>
      prev.map((l) =>
        l.id === activeCardActionLead.id
          ? { ...l, meetingsCount: (l.meetingsCount || 0) + 1, nextFollowUpAt: meetingDateInput }
          : l
      )
    );
    try {
      await fetch(`/api/admin/leads/${activeCardActionLead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "meeting",
          message: `${meetingTypeInput}: ${meetingTitleInput} on ${meetingDateInput} at ${meetingTimeInput}`,
        }),
      });
    } catch {
      // ignore
    }
    setShowAppointmentForm(false);
  }

  async function submitAddTaskInModal() {
    if (!activeCardActionLead || !taskTitleInput.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      title: taskTitleInput.trim(),
      dueAt: taskDueDateInput || null,
      completed: false,
    };
    setLeadTasksList((prev) => [...prev, newTask]);
    setLocalLeads((prev) =>
      prev.map((l) =>
        l.id === activeCardActionLead.id
          ? { ...l, tasksCount: (l.tasksCount || 0) + 1, tasks: [...(l.tasks || []), newTask] }
          : l
      )
    );
    try {
      await fetch(`/api/admin/leads/${activeCardActionLead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "task",
          title: taskTitleInput.trim(),
          dueAt: taskDueDateInput || null,
        }),
      });
    } catch {
      // ignore
    }
    setTaskTitleInput("");
    setShowTaskForm(false);
  }

  async function submitAddNoteInModal() {
    if (!activeCardActionLead || !noteInput.trim()) return;
    const noteText = noteInput.trim();
    const newNoteObj = {
      id: `note-${Date.now()}`,
      text: noteText,
      date: new Date().toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      author: activeCardActionLead.owner?.name || "Sagar Singhal",
    };
    const newAct = {
      id: newNoteObj.id,
      type: "NOTE",
      message: noteText,
      createdAt: new Date().toISOString(),
    };

    setLeadNotesList((prev) => [newNoteObj, ...prev]);

    setLocalLeads((prev) =>
      prev.map((l) =>
        l.id === activeCardActionLead.id
          ? {
              ...l,
              notes: noteText,
              notesCount: (l.notesCount || 0) + 1,
              activities: [newAct, ...(l.activities || [])],
            }
          : l
      )
    );

    setActiveCardActionLead((prev) =>
      prev
        ? {
            ...prev,
            notes: noteText,
            notesCount: (prev.notesCount || 0) + 1,
            activities: [newAct, ...(prev.activities || [])],
          }
        : null
    );

    try {
      await fetch(`/api/admin/leads/${activeCardActionLead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "note",
          message: noteText,
        }),
      });
    } catch {
      // ignore
    }
    setNoteInput("");
    setShowNoteForm(false);
  }

  async function submitSaveTags() {
    if (!activeCardActionLead) return;
    const tagStr = leadTags.join(", ");
    setLocalLeads((prev) =>
      prev.map((l) =>
        l.id === activeCardActionLead.id
          ? { ...l, tags: leadTags, businessName: tagStr || l.businessName }
          : l
      )
    );
    try {
      await fetch(`/api/admin/leads/${activeCardActionLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: JSON.stringify({
            pipelineId: activeCardActionLead.pipelineId,
            businessName: tagStr,
            tags: leadTags,
          }),
        }),
      });
    } catch {
      // ignore
    }
    setActionModalType(null);
  }

  async function submitAddNote() {
    if (!activeCardActionLead || !noteInput.trim()) return;
    setLocalLeads((prev) =>
      prev.map((l) =>
        l.id === activeCardActionLead.id
          ? { ...l, notesCount: (l.notesCount || 0) + 1 }
          : l
      )
    );
    try {
      await fetch(`/api/admin/leads/${activeCardActionLead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "note",
          message: noteInput.trim(),
        }),
      });
    } catch {
      // ignore
    }
    setActionModalType(null);
  }

  async function submitAddTask() {
    if (!activeCardActionLead || !taskTitleInput.trim()) return;
    setLocalLeads((prev) =>
      prev.map((l) =>
        l.id === activeCardActionLead.id
          ? { ...l, tasksCount: (l.tasksCount || 0) + 1 }
          : l
      )
    );
    try {
      await fetch(`/api/admin/leads/${activeCardActionLead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "task",
          title: taskTitleInput.trim(),
          dueAt: taskDueDateInput || null,
        }),
      });
    } catch {
      // ignore
    }
    setActionModalType(null);
  }

  async function submitScheduleMeeting() {
    if (!activeCardActionLead) return;
    setLocalLeads((prev) =>
      prev.map((l) =>
        l.id === activeCardActionLead.id
          ? { ...l, meetingsCount: (l.meetingsCount || 0) + 1 }
          : l
      )
    );
    try {
      await fetch(`/api/admin/leads/${activeCardActionLead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "meeting",
          message: `${meetingTypeInput}: ${meetingTitleInput} scheduled on ${meetingDateInput} at ${meetingTimeInput}`,
        }),
      });
      await fetch(`/api/admin/leads/${activeCardActionLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nextFollowUpAt: meetingDateInput ? new Date(meetingDateInput).toISOString() : null,
        }),
      });
    } catch {
      // ignore
    }
    setActionModalType(null);
  }

  async function submitEditLead() {
    if (!activeCardActionLead) return;
    const parsedVal = parseFloat(editLeadForm.value.replace(/[^0-9.]/g, "")) || 0;
    setLocalLeads((prev) =>
      prev.map((l) =>
        l.id === activeCardActionLead.id
          ? {
              ...l,
              name: editLeadForm.name || l.name,
              email: editLeadForm.email || l.email,
              phone: editLeadForm.phone || l.phone,
              businessName: editLeadForm.businessName || l.businessName,
              budgetMin: parsedVal,
              budgetMax: parsedVal,
              stage: editLeadForm.stageId || l.stage,
              pipelineId: editLeadForm.pipelineId || l.pipelineId,
            }
          : l
      )
    );
    try {
      await fetch(`/api/admin/leads/${activeCardActionLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editLeadForm.name,
          email: editLeadForm.email,
          phone: editLeadForm.phone,
          budgetMin: parsedVal,
          budgetMax: parsedVal,
          stage: editLeadForm.stageId,
        }),
      });
    } catch {
      // ignore
    }
    setActionModalType(null);
  }

  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");

  // Load pipelines & database leads on mount
  useEffect(() => {
    fetch("/api/admin/pipelines")
      .then((res) => res.json())
      .then((data) => {
        if (data.pipelines && Array.isArray(data.pipelines) && data.pipelines.length > 0) {
          setPipelines(data.pipelines);
          if (!activePipelineId) {
            setActivePipelineId(data.pipelines[0].id);
          }
        }
      })
      .catch(console.error);

    fetch("/api/admin/leads")
      .then((res) => res.json())
      .then((data) => {
        if (data.leads && Array.isArray(data.leads) && data.leads.length > 0) {
          const mapped: CrmLead[] = data.leads.map((l: any) => {
            let pipelineId = "pipe-marketing-101";
            let businessName = "Business Partner";
            let additionalContacts: string[] = [];
            if (l.requirements) {
              try {
                const parsed = JSON.parse(l.requirements);
                if (parsed.pipelineId) pipelineId = parsed.pipelineId;
                if (parsed.businessName) businessName = parsed.businessName;
                if (Array.isArray(parsed.additionalContacts)) additionalContacts = parsed.additionalContacts;
              } catch {
                if (typeof l.requirements === "string" && l.requirements.startsWith("pipe-")) {
                  pipelineId = l.requirements;
                }
              }
            }
            return {
              id: l.id,
              name: l.name,
              email: l.email,
              phone: l.phone,
              source: l.source || "Website",
              stage: l.stage || "stg-101",
              score: l.score || 80,
              budgetMin: l.budgetMin || 0,
              budgetMax: l.budgetMax || 0,
              businessName,
              pipelineId,
              additionalContacts,
              notes: l.notes,
              nextFollowUpAt: l.nextFollowUpAt ? new Date(l.nextFollowUpAt).toISOString() : null,
              property: l.property,
              owner: l.owner,
              tasks: [],
              activities: [],
            };
          });
          // Merge with initial demo leads if missing
          setLocalLeads(mapped);
        }
      })
      .catch(console.error);
  }, []);

  const activePipeline = useMemo(() => {
    return pipelines.find((p) => p.id === activePipelineId) || pipelines[0] || DEFAULT_PIPELINES[0];
  }, [pipelines, activePipelineId]);

  const stages: PipelineStage[] = activePipeline.stages || [];

  useEffect(() => {
    if (stages.length > 0) {
      setCreateForm((prev) => ({ ...prev, stageId: stages[0].id, pipelineId: activePipeline.id }));
    }
  }, [stages, activePipeline]);

  const filteredLeads = useMemo(() => {
    return localLeads.filter((l) => {
      // Filter by active pipeline
      const leadPipelineId = l.pipelineId || "pipe-marketing-101";
      if (activePipelineId && activePipelineId !== "all" && leadPipelineId !== activePipelineId) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !l.name.toLowerCase().includes(q) &&
          !l.email.toLowerCase().includes(q) &&
          !(l.phone ?? "").includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [localLeads, activePipelineId, search]);

  const groupedByStage = useMemo(() => {
    const map: Record<string, CrmLead[]> = {};
    stages.forEach((stg, idx) => {
      map[stg.id] = filteredLeads.filter((l) => {
        if (l.stage === stg.id) return true;
        if (l.stage.toLowerCase() === stg.name.toLowerCase()) return true;
        if (l.stage === stg.key) return true;
        if (idx === 0 && (l.stage === "stg-101" || l.stage === "NEW")) return true;
        return false;
      });
    });
    return map;
  }, [stages, filteredLeads]);

  const totalOpportunitiesCount = useMemo(() => {
    return Object.values(groupedByStage).reduce((acc, curr) => acc + curr.length, 0);
  }, [groupedByStage]);

  function calculateStageStats(stg: PipelineStage) {
    const stageLeads = groupedByStage[stg.id] || [];
    const count = stageLeads.length;
    const unweighted = stageLeads.reduce((s, l) => s + (l.budgetMax || l.budgetMin || 0), 0);
    const prob = stg.probability || 9;
    const weighted = (unweighted * prob) / 100;
    const wonLeads = stageLeads.filter((l) => l.stage === "WON" || l.stage === "Closed Won" || l.stage === "stg-109");
    const wonValue = wonLeads.reduce((s, l) => s + (l.budgetMax || l.budgetMin || 0), 0);

    return { count, unweighted, weighted, prob, wonValue };
  }

  function formatCurrency(val: number) {
    return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  function toggleSelectLead(id: string) {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function downloadSampleCSV() {
    const activePipelineName = activePipeline?.name || "Marketing Pipeline";
    const headers = SYSTEM_FIELDS.map((sf) => sf.label);

    const row1 = [
      "Bhavya Pandey",
      "bhavya@example.com",
      "+91",
      "9876543210",
      "Anna Becker (agent9@plotsnhomes.com)",
      "Luxury Villa Opportunity",
      activePipelineName,
      "New Lead",
      "Open",
      "12000000",
      "Sagar Singhal (admin@plotsnhomes.com) - ID: USR-101",
      "Admin Staff",
      "Pandey Enterprises",
      "Website",
      "2026-08-15 - 14:30",
      "High-Priority, Residential",
    ];

    const row2 = [
      "Rajesh Kumar",
      "rajesh.kumar@gmail.com",
      "+91",
      "9812345678",
      "Chris Johnson (agent10@plotsnhomes.com)",
      "Commercial Plot Sale",
      activePipelineName,
      "Contacted",
      "Open",
      "8500000",
      "Admin User (admin@brickvest.com) - ID: USR-102",
      "David Kim",
      "Kumar Corp",
      "Referral",
      "2026-08-30 - 11:00",
      "Commercial, Hot",
    ];

    const csvLines = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
      row1.map((v) => `"${v.replace(/"/g, '""')}"`).join(","),
      row2.map((v) => `"${v.replace(/"/g, '""')}"`).join(","),
    ].join("\n");

    const blob = new Blob([csvLines], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `opportunity_sample_import_${activePipelineName.toLowerCase().replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function parseCSVString(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return;

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseRow(lines[0]);
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseRow(lines[i]);
      if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = vals[idx] || "";
      });
      rows.push(rowObj);
    }

    setCsvHeaders(headers);
    setCsvSampleRows(rows.slice(0, 3));
    setCsvFullRows(rows);

    const autoMapping: Record<string, string> = {};
    headers.forEach((h) => {
      const cleanH = h.toLowerCase().replace(/[^a-z0-9]/g, "");
      const match = SYSTEM_FIELDS.find((sf) => {
        const cleanL = sf.label.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleanH === cleanL) return true;
        return sf.aliases.some((alias) => cleanH === alias.toLowerCase().replace(/[^a-z0-9]/g, ""));
      });
      autoMapping[h] = match ? match.key : "__unmapped__";
    });
    setColumnMappings(autoMapping);
  }

  function processUploadedFile(file: File) {
    setUploadedFile(file);
    setImportFileName(file.name);
    const kb = (file.size / 1024).toFixed(1);
    setImportFileSize(`${kb} KB`);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = evt.target?.result;
      if (typeof res === "string") {
        parseCSVString(res);
      }
    };
    reader.readAsText(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  }

  function handleDropFile(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  }

  function startImportExecution() {
    if (csvFullRows.length > 0) {
      const newLeadsToAdd: CrmLead[] = csvFullRows.map((row, idx) => {
        const getVal = (sysKey: string) => {
          const mappedHeader = Object.keys(columnMappings).find((h) => columnMappings[h] === sysKey);
          return mappedHeader ? row[mappedHeader] || "" : "";
        };

        const cName = getVal("contactName") || getVal("oppName") || `Imported Lead ${idx + 1}`;
        const oName = getVal("oppName") || cName || `Imported Opportunity ${idx + 1}`;
        const valNum = parseFloat(getVal("value").replace(/[^0-9.]/g, "")) || 5000000;
        const sName = getVal("stage") || "NEW";
        const stName = getVal("status") || "Open";

        return {
          id: `imported-${Date.now()}-${idx}`,
          name: cName,
          email: getVal("email") || `lead${idx + 1}@imported.com`,
          phone: getVal("phone") || "+919800000000",
          businessName: getVal("businessName") || oName,
          source: getVal("source") || "CSV Import",
          notes: null,
          property: null,
          pipelineId: activePipeline?.id || "pl-1",
          stage: sName,
          score: 65,
          budgetMin: valNum,
          budgetMax: valNum,
          owner: {
            id: "u-1",
            name: getVal("owner") || "Sagar Singhal",
          },
          nextFollowUpAt: getVal("nextFollowUpAt") || new Date().toISOString(),
          lifecycleStage: "Opportunity",
          leadStatus: stName,
          createdAt: new Date().toISOString(),
          activities: [],
          tasks: [],
        };
      });

      setLocalLeads((prev) => [...newLeadsToAdd, ...prev]);

      const now = new Date();
      const formattedDate = `${now.getDate()}_Aug_${now.getFullYear()}_${now.getHours()}_${now.getMinutes()}`;
      const newLog: BulkActionLog = {
        id: `bulk-import-${Date.now()}`,
        actionLabel: `Import Opportunities - ${importFileName || "opportunities.csv"} (${newLeadsToAdd.length} records)`,
        operation: "Import",
        status: "Complete",
        user: { name: "Sagar Singhal", initials: "SS" },
        createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setBulkLogs((prev) => [newLog, ...prev]);
    }

    setImportStep(1);
    setImportFileName("");
    setImportFileSize("");
    setUploadedFile(null);
    setCsvHeaders([]);
    setCsvSampleRows([]);
    setCsvFullRows([]);
    setColumnMappings({});
    router.push("/admin/crm?tab=opportunities");
  }

  function executeDelete() {
    if (deleteConfirmText !== "DELETE") return;
    setLocalLeads((prev) => prev.filter((l) => !selectedLeadIds.includes(l.id)));
    
    const now = new Date();
    const formattedDate = `${now.getDate()}_Aug_${now.getFullYear()}_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;
    const newLog: BulkActionLog = {
      id: `bulk-${Date.now()}`,
      actionLabel: `Delete - ${formattedDate}`,
      operation: "Delete",
      status: "Complete",
      user: { name: "Sagar Singhal", initials: "SS" },
      createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      completedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setBulkLogs((prev) => [newLog, ...prev]);

    setSelectedLeadIds([]);
    setShowDeleteModal(false);
    setDeleteConfirmText("");
  }

  function applyFieldEdit() {
    if (!editingField) return;
    setLocalLeads((prev) =>
      prev.map((l) => {
        if (!selectedLeadIds.includes(l.id)) return l;
        if (editingField === "Stage") {
          return { ...l, stage: fieldValue || l.stage };
        }
        if (editingField === "Value") {
          const num = parseFloat(fieldValue.replace(/[^0-9.]/g, "")) || 0;
          return { ...l, budgetMin: num, budgetMax: num };
        }
        if (editingField === "Business name") {
          return { ...l, businessName: fieldValue };
        }
        if (editingField === "Source") {
          return { ...l, source: fieldValue };
        }
        return l;
      })
    );

    const now = new Date();
    const formattedDate = `${now.getDate()}_Aug_${now.getFullYear()}_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;
    setBulkLogs((prev) => [
      {
        id: `bulk-${Date.now()}`,
        actionLabel: `Update ${editingField} - ${formattedDate}`,
        operation: "Update",
        status: "Complete",
        user: { name: "Sagar Singhal", initials: "SS" },
        createdAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev,
    ]);

    setEditingField(null);
    setShowEditModal(false);
  }

  function handleDragStart(e: React.DragEvent, leadId: string) {
    e.dataTransfer.setData("text/plain", leadId);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent, targetStageId: string) {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("text/plain");
    if (!leadId) return;

    const targetStage = stages.find((s) => s.id === targetStageId);
    if (!targetStage) return;

    setLocalLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: targetStage.id } : l))
    );

    try {
      await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage.key || targetStage.id }),
      });
    } catch {
      // Ignore network errors
    }
  }

  async function createOpportunity() {
    const contactName = createForm.contactName.trim();
    const oppName = createForm.oppName.trim();
    const name = contactName || oppName;

    if (!name) {
      setCreateError("Please enter a primary contact name or opportunity name.");
      return;
    }

    if (/\d/.test(contactName)) {
      setCreateError("Primary contact name cannot contain numbers.");
      return;
    }
    if (contactName.length > 60) {
      setCreateError("Primary contact name cannot exceed 60 characters.");
      return;
    }

    if (/\d/.test(oppName)) {
      setCreateError("Opportunity name cannot contain numbers.");
      return;
    }
    if (oppName.length > 60) {
      setCreateError("Opportunity name cannot exceed 60 characters.");
      return;
    }

    if (/\d/.test(createForm.businessName)) {
      setCreateError("Business name cannot contain numbers.");
      return;
    }
    if (createForm.businessName.length > 60) {
      setCreateError("Business name cannot exceed 60 characters.");
      return;
    }

    const emailVal = createForm.email.trim();
    if (emailVal && (!emailVal.includes("@") || !emailVal.toLowerCase().includes(".com"))) {
      setCreateError("Invalid email address. Email must contain '@' and '.com'.");
      return;
    }

    const cleanPhone = createForm.phone.replace(/[^0-9]/g, "");
    if (cleanPhone && cleanPhone.length > 10) {
      setCreateError("Phone number cannot exceed 10 digits (excluding country code).");
      return;
    }

    const formattedPhone = cleanPhone ? `${countryCode} ${cleanPhone}` : null;

    setCreateError("");
    try {
      const targetStage = stages.find((s) => s.id === createForm.stageId) || stages[0];
      const parsedVal = parseFloat(createForm.value.replace(/[^0-9.]/g, "")) || 0;
      const targetPipelineId = createForm.pipelineId || activePipelineId;

      const payload = {
        name,
        email: createForm.email.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        phone: formattedPhone,
        source: createForm.source || "Website",
        stage: targetStage?.key || targetStage?.id || "NEW",
        budgetMax: parsedVal,
        budgetMin: parsedVal,
        ownerId: createForm.ownerId || null,
        notes: createForm.businessName ? `Business: ${createForm.businessName}` : null,
        requirements: JSON.stringify({
          pipelineId: targetPipelineId,
          businessName: createForm.businessName || "Business Partner",
          additionalContacts: createForm.additionalContacts,
        }),
      };

      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? "Failed to create opportunity.");
        return;
      }

      const newLead: CrmLead = {
        id: data.lead?.id || `lead-${Date.now()}`,
        name,
        email: payload.email,
        phone: formattedPhone,
        source: createForm.source || "Website",
        stage: targetStage.id,
        score: 80,
        budgetMin: parsedVal,
        budgetMax: parsedVal,
        businessName: createForm.businessName || "Business Partner",
        pipelineId: targetPipelineId,
        additionalContacts: createForm.additionalContacts,
        notes: null,
        nextFollowUpAt: null,
        property: null,
        owner: agents.find((a) => a.id === createForm.ownerId) || { id: "u-1", name: "Sagar Singhal" },
        tasks: [],
        activities: [],
      };

      setLocalLeads((prev) => [newLead, ...prev]);
      setShowCreate(false);
      setCreateForm({
        contactName: "",
        email: "",
        phone: "",
        oppName: "",
        pipelineId: activePipelineId,
        stageId: stages[0]?.id || "",
        status: "Open",
        value: "0",
        ownerId: "",
        followers: "",
        businessName: "",
        source: sources[0] ?? "Website",
        expectedCloseDate: "",
        tags: "",
        additionalContacts: [],
      });
      router.refresh();
    } catch {
      setCreateError("Network error. Please try again.");
    }
  }

  const selectedLead = localLeads.find((l) => selectedLeadIds.includes(l.id)) || localLeads[0];

  const forecastMetrics = useMemo(() => {
    const openLeads = localLeads.filter((l) => l.stage !== "WON" && l.stage !== "LOST" && l.stage !== "stg-109");
    const wonLeads = localLeads.filter((l) => l.stage === "WON" || l.stage === "Closed Won" || l.stage === "stg-109");

    const maxPotential = openLeads.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);
    const expected = Math.round(maxPotential * 0.7143);
    const wonRevenue = wonLeads.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);
    const openCount = openLeads.length;

    const missingCloseDate = openLeads.filter((l) => !l.nextFollowUpAt).length;
    const missingValue = openLeads.filter((l) => !l.budgetMax && !l.budgetMin).length;
    const overdue = 0;

    return { maxPotential, expected, wonRevenue, openCount, missingCloseDate, missingValue, overdue };
  }, [localLeads]);

  const forecastGroupedData = useMemo(() => {
    const filtered = activePipelineId === "all"
      ? localLeads
      : localLeads.filter((l) => (l.pipelineId || "pipe-marketing-101") === activePipelineId);

    if (forecastGroupBy === "Owner") {
      const ownerMap: Record<string, CrmLead[]> = {};
      filtered.forEach((l) => {
        const ownerName = l.owner?.name || "Anuradha Maheshwari";
        if (!ownerMap[ownerName]) ownerMap[ownerName] = [];
        ownerMap[ownerName].push(l);
      });

      return Object.entries(ownerMap).map(([ownerName, leadList]) => {
        const openList = leadList.filter((l) => l.stage !== "WON" && l.stage !== "LOST" && l.stage !== "stg-109");
        const wonList = leadList.filter((l) => l.stage === "WON" || l.stage === "Closed Won" || l.stage === "stg-109");
        const maxPotential = openList.reduce((sum, l) => sum + (l.budgetMax || l.budgetMin || 0), 0);
        const expected = Math.round(maxPotential * 0.7143);
        const wonRevenue = wonList.reduce((sum, l) => sum + (l.budgetMax || l.budgetMin || 0), 0);
        const totalPotential = expected + wonRevenue;
        return {
          label: ownerName,
          count: leadList.length,
          maxPotential,
          expected,
          wonRevenue,
          totalPotential,
        };
      });
    }

    if (forecastGroupBy === "Expected Close Date") {
      const dateCategories = ["This Month", "Next Month", "Later", "No Close Date"];
      return dateCategories.map((cat) => {
        let leadList: CrmLead[] = [];
        if (cat === "No Close Date") {
          leadList = filtered.filter((l) => !l.nextFollowUpAt);
        } else {
          leadList = filtered.filter((l) => !!l.nextFollowUpAt);
        }
        const openList = leadList.filter((l) => l.stage !== "WON" && l.stage !== "LOST" && l.stage !== "stg-109");
        const wonList = leadList.filter((l) => l.stage === "WON" || l.stage === "Closed Won" || l.stage === "stg-109");
        const maxPotential = openList.reduce((sum, l) => sum + (l.budgetMax || l.budgetMin || 0), 0);
        const expected = Math.round(maxPotential * 0.7143);
        const wonRevenue = wonList.reduce((sum, l) => sum + (l.budgetMax || l.budgetMin || 0), 0);
        const totalPotential = expected + wonRevenue;
        return {
          label: cat,
          count: leadList.length,
          maxPotential,
          expected,
          wonRevenue,
          totalPotential,
        };
      });
    }

    if (forecastGroupBy === "Pipeline") {
      return pipelines.map((p) => {
        const leadList = filtered.filter((l) => (l.pipelineId || "pipe-marketing-101") === p.id);
        const openList = leadList.filter((l) => l.stage !== "WON" && l.stage !== "LOST" && l.stage !== "stg-109");
        const wonList = leadList.filter((l) => l.stage === "WON" || l.stage === "Closed Won" || l.stage === "stg-109");
        const maxPotential = openList.reduce((sum, l) => sum + (l.budgetMax || l.budgetMin || 0), 0);
        const expected = Math.round(maxPotential * 0.7143);
        const wonRevenue = wonList.reduce((sum, l) => sum + (l.budgetMax || l.budgetMin || 0), 0);
        const totalPotential = expected + wonRevenue;
        return {
          label: p.name,
          count: leadList.length,
          maxPotential,
          expected,
          wonRevenue,
          totalPotential,
        };
      });
    }

    // Default: Group by Status
    const statusCategories = statuses;
    return statusCategories.map((st) => {
      let leadList: CrmLead[] = [];
      if (st === "Open") {
        leadList = filtered.filter((l) => l.stage !== "WON" && l.stage !== "LOST" && l.stage !== "stg-109" && (l.status === "Open" || !l.status));
      } else if (st === "Won") {
        leadList = filtered.filter((l) => l.stage === "WON" || l.stage === "Closed Won" || l.stage === "stg-109" || l.status === "Won");
      } else if (st === "Lost") {
        leadList = filtered.filter((l) => l.stage === "LOST" || l.status === "Lost");
      } else if (st === "Abandoned") {
        leadList = filtered.filter((l) => l.status === "Abandoned" || l.stage === "Abandoned");
      } else {
        leadList = filtered.filter(
          (l) => (l.status || "").toLowerCase() === st.toLowerCase() || (l.stage || "").toLowerCase() === st.toLowerCase()
        );
      }

      const openList = st === "Open" ? leadList : [];
      const wonList = st === "Won" ? leadList : [];
      const customList = (st !== "Open" && st !== "Won" && st !== "Lost" && st !== "Abandoned") ? leadList : [];

      const maxPotential = (openList.length > 0 ? openList : customList).reduce((sum, l) => sum + (l.budgetMax || l.budgetMin || 0), 0);
      const expected = st === "Open" ? Math.round(maxPotential * 0.7143) : (customList.length > 0 ? Math.round(maxPotential * 0.5) : 0);
      const wonRevenue = wonList.reduce((sum, l) => sum + (l.budgetMax || l.budgetMin || 0), 0);
      const totalPotential = st === "Open" ? expected : (st === "Won" ? wonRevenue : (customList.length > 0 ? maxPotential : 0));

      return {
        label: st,
        count: leadList.length,
        maxPotential,
        expected,
        wonRevenue,
        totalPotential,
      };
    });
  }, [localLeads, activePipelineId, forecastGroupBy, pipelines, statuses]);

  const forecastTimelineData = useMemo(() => {
    const filteredLeads = activePipelineId === "all"
      ? localLeads
      : localLeads.filter((l) => (l.pipelineId || "pipe-marketing-101") === activePipelineId);

    const noCloseDateLeads = filteredLeads.filter((l) => !l.nextFollowUpAt);
    const openNoClose = noCloseDateLeads.filter((l) => l.stage !== "WON" && l.stage !== "LOST" && l.stage !== "stg-109");
    const wonNoClose = noCloseDateLeads.filter((l) => l.stage === "WON" || l.stage === "Closed Won" || l.stage === "stg-109");
    const openNoCloseRev = openNoClose.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);
    const expectedNoClose = Math.round(openNoCloseRev * 0.7143);
    const wonNoCloseRev = wonNoClose.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);

    const now = new Date();
    const columns: Array<{
      id: string;
      label: string;
      startDate?: Date;
      endDate?: Date;
      leads: CrmLead[];
      wonRevenue: number;
      openRevenue: number;
      expectedRevenue: number;
      totalRevenue: number;
      count: number;
    }> = [];

    const countCols = 5;

    if (customStartDate || customEndDate) {
      const start = customStartDate ? new Date(customStartDate) : new Date("2000-01-01");
      const end = customEndDate ? new Date(`${customEndDate}T23:59:59.999Z`) : new Date("2099-12-31");

      const customLeads = filteredLeads.filter((l) => {
        if (!l.nextFollowUpAt) return false;
        const d = new Date(l.nextFollowUpAt);
        return d >= start && d <= end;
      });

      const openLeads = customLeads.filter((l) => l.stage !== "WON" && l.stage !== "LOST" && l.stage !== "stg-109");
      const wonLeads = customLeads.filter((l) => l.stage === "WON" || l.stage === "Closed Won" || l.stage === "stg-109");

      const openRevenue = openLeads.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);
      const expectedRevenue = Math.round(openRevenue * 0.7143);
      const wonRevenue = wonLeads.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);

      const customLabel = `${customStartDate || "Earlier"} to ${customEndDate || "Later"}`;

      columns.push({
        id: `custom-period`,
        label: customLabel,
        startDate: start,
        endDate: end,
        leads: customLeads,
        wonRevenue,
        openRevenue,
        expectedRevenue,
        totalRevenue: expectedRevenue + wonRevenue,
        count: customLeads.length,
      });

      return {
        noCloseDate: {
          leads: noCloseDateLeads,
          count: noCloseDateLeads.length,
          openRevenue: openNoCloseRev,
          expectedRevenue: expectedNoClose,
          wonRevenue: wonNoCloseRev,
          totalRevenue: expectedNoClose + wonNoCloseRev,
        },
        columns,
      };
    }

    if (timelinePeriod === "Week") {
      const currentWeekStart = new Date(now);
      const day = currentWeekStart.getDay();
      currentWeekStart.setDate(currentWeekStart.getDate() - day + timelineOffset * 7);
      currentWeekStart.setHours(0, 0, 0, 0);

      for (let i = 0; i < countCols; i++) {
        const wStart = new Date(currentWeekStart);
        wStart.setDate(wStart.getDate() + i * 7);
        const wEnd = new Date(wStart);
        wEnd.setDate(wEnd.getDate() + 6);
        wEnd.setHours(23, 59, 59, 999);

        const mStartStr = wStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const mEndStr = wEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const label = `${mStartStr} - ${mEndStr}`;

        const leads = filteredLeads.filter((l) => {
          if (!l.nextFollowUpAt) return false;
          const d = new Date(l.nextFollowUpAt);
          return d >= wStart && d <= wEnd;
        });

        const openLeads = leads.filter((l) => l.stage !== "WON" && l.stage !== "LOST" && l.stage !== "stg-109");
        const wonLeads = leads.filter((l) => l.stage === "WON" || l.stage === "Closed Won" || l.stage === "stg-109");

        const openRevenue = openLeads.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);
        const expectedRevenue = Math.round(openRevenue * 0.7143);
        const wonRevenue = wonLeads.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);

        columns.push({
          id: `week-${i}`,
          label,
          startDate: wStart,
          endDate: wEnd,
          leads,
          wonRevenue,
          openRevenue,
          expectedRevenue,
          totalRevenue: expectedRevenue + wonRevenue,
          count: leads.length,
        });
      }
    } else if (timelinePeriod === "Month") {
      const startMonth = new Date(now.getFullYear(), now.getMonth() + timelineOffset, 1);
      for (let i = 0; i < countCols; i++) {
        const mStart = new Date(startMonth.getFullYear(), startMonth.getMonth() + i, 1);
        const mEnd = new Date(startMonth.getFullYear(), startMonth.getMonth() + i + 1, 0, 23, 59, 59);
        const label = mStart.toLocaleDateString("en-US", { month: "long" });

        const leads = filteredLeads.filter((l) => {
          if (!l.nextFollowUpAt) return false;
          const d = new Date(l.nextFollowUpAt);
          return d >= mStart && d <= mEnd;
        });

        const openLeads = leads.filter((l) => l.stage !== "WON" && l.stage !== "LOST" && l.stage !== "stg-109");
        const wonLeads = leads.filter((l) => l.stage === "WON" || l.stage === "Closed Won" || l.stage === "stg-109");

        const openRevenue = openLeads.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);
        const expectedRevenue = Math.round(openRevenue * 0.7143);
        const wonRevenue = wonLeads.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);

        columns.push({
          id: `month-${i}`,
          label,
          startDate: mStart,
          endDate: mEnd,
          leads,
          wonRevenue,
          openRevenue,
          expectedRevenue,
          totalRevenue: expectedRevenue + wonRevenue,
          count: leads.length,
        });
      }
    } else if (timelinePeriod === "Quarter") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startQMonth = (currentQuarter + timelineOffset) * 3;
      const baseYear = now.getFullYear() + Math.floor(startQMonth / 12);
      const normalizedQMonth = ((startQMonth % 12) + 12) % 12;

      for (let i = 0; i < countCols; i++) {
        const qMonth = normalizedQMonth + i * 3;
        const qYear = baseYear + Math.floor(qMonth / 12);
        const actualQMonth = qMonth % 12;
        const qIndex = Math.floor(actualQMonth / 3) + 1;
        const label = `Q${qIndex} ${qYear}`;

        const qStart = new Date(qYear, actualQMonth, 1);
        const qEnd = new Date(qYear, actualQMonth + 3, 0, 23, 59, 59);

        const leads = filteredLeads.filter((l) => {
          if (!l.nextFollowUpAt) return false;
          const d = new Date(l.nextFollowUpAt);
          return d >= qStart && d <= qEnd;
        });

        const openLeads = leads.filter((l) => l.stage !== "WON" && l.stage !== "LOST" && l.stage !== "stg-109");
        const wonLeads = leads.filter((l) => l.stage === "WON" || l.stage === "Closed Won" || l.stage === "stg-109");

        const openRevenue = openLeads.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);
        const expectedRevenue = Math.round(openRevenue * 0.7143);
        const wonRevenue = wonLeads.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);

        columns.push({
          id: `quarter-${i}`,
          label,
          startDate: qStart,
          endDate: qEnd,
          leads,
          wonRevenue,
          openRevenue,
          expectedRevenue,
          totalRevenue: expectedRevenue + wonRevenue,
          count: leads.length,
        });
      }
    } else {
      const startYear = now.getFullYear() + timelineOffset;
      for (let i = 0; i < countCols; i++) {
        const y = startYear + i;
        const label = `${y}`;
        const yStart = new Date(y, 0, 1);
        const yEnd = new Date(y, 11, 31, 23, 59, 59);

        const leads = filteredLeads.filter((l) => {
          if (!l.nextFollowUpAt) return false;
          const d = new Date(l.nextFollowUpAt);
          return d >= yStart && d <= yEnd;
        });

        const openLeads = leads.filter((l) => l.stage !== "WON" && l.stage !== "LOST" && l.stage !== "stg-109");
        const wonLeads = leads.filter((l) => l.stage === "WON" || l.stage === "Closed Won" || l.stage === "stg-109");

        const openRevenue = openLeads.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);
        const expectedRevenue = Math.round(openRevenue * 0.7143);
        const wonRevenue = wonLeads.reduce((acc, l) => acc + (l.budgetMax || l.budgetMin || 0), 0);

        columns.push({
          id: `year-${i}`,
          label,
          startDate: yStart,
          endDate: yEnd,
          leads,
          wonRevenue,
          openRevenue,
          expectedRevenue,
          totalRevenue: expectedRevenue + wonRevenue,
          count: leads.length,
        });
      }
    }



    return {
      noCloseDate: {
        leads: noCloseDateLeads,
        count: noCloseDateLeads.length,
        openRevenue: openNoCloseRev,
        expectedRevenue: expectedNoClose,
        wonRevenue: wonNoCloseRev,
        totalRevenue: expectedNoClose + wonNoCloseRev,
      },
      columns,
    };
  }, [localLeads, activePipelineId, timelinePeriod, timelineOffset, customStartDate, customEndDate]);

  return (
    <div className="space-y-6">
      {/* Opportunities SubNav Tabs */}
      {!agentMode && <CrmSubNav active={activeTab as any} />}

      {/* RENDER BASED ON ACTIVE SUB-TAB */}
      {activeTab === "import" ? (
        /* 4-STEP IMPORT WIZARD VIEW */
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Imports</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Import contacts, opportunities and custom objects
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 max-w-4xl pt-2 pb-4">
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                importStep === 1 ? "bg-[#b58a18] text-slate-950 font-black" : importStep > 1 ? "border-2 border-[#b58a18] text-[#b58a18]" : "bg-slate-200 text-slate-500"
              }`}>
                {importStep > 1 ? <Check className="h-4 w-4" /> : "1"}
              </div>
              <div>
                <div className={`text-xs font-bold ${importStep === 1 ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>Start</div>
                <p className="text-[10px] text-slate-400">Select objects to import</p>
              </div>
            </div>

            <div className={`flex-1 h-0.5 ${importStep >= 2 ? "bg-[#b58a18]" : "bg-slate-200 dark:bg-slate-800"}`} />

            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                importStep === 2 ? "bg-[#b58a18] text-slate-950 font-black" : importStep > 2 ? "border-2 border-[#b58a18] text-[#b58a18]" : "bg-slate-200 text-slate-500"
              }`}>
                {importStep > 2 ? <Check className="h-4 w-4" /> : "2"}
              </div>
              <div>
                <div className={`text-xs font-bold ${importStep === 2 ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>Upload</div>
                <p className="text-[10px] text-slate-400">Upload your file and configure settings</p>
              </div>
            </div>

            <div className={`flex-1 h-0.5 ${importStep >= 3 ? "bg-[#b58a18]" : "bg-slate-200 dark:bg-slate-800"}`} />

            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                importStep === 3 ? "bg-[#b58a18] text-slate-950 font-black" : importStep > 3 ? "border-2 border-[#b58a18] text-[#b58a18]" : "bg-slate-200 text-slate-500"
              }`}>
                {importStep > 3 ? <Check className="h-4 w-4" /> : "3"}
              </div>
              <div>
                <div className={`text-xs font-bold ${importStep === 3 ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>Map</div>
                <p className="text-[10px] text-slate-400">Map columns to fields</p>
              </div>
            </div>

            <div className={`flex-1 h-0.5 ${importStep >= 4 ? "bg-[#b58a18]" : "bg-slate-200 dark:bg-slate-800"}`} />

            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                importStep === 4 ? "bg-[#b58a18] text-slate-950 font-black" : "bg-slate-200 text-slate-500"
              }`}>
                4
              </div>
              <div>
                <div className={`text-xs font-bold ${importStep === 4 ? "text-slate-900 dark:text-white" : "text-slate-500"}`}>Verify</div>
                <p className="text-[10px] text-slate-400">Review and confirm import</p>
              </div>
            </div>
          </div>

          {/* STEP 1: SELECT OBJECTS */}
          {importStep === 1 && (
            <div className="space-y-6 max-w-5xl">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-5">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Select objects to import</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div
                    onClick={() =>
                      setSelectedImportObjects((prev) =>
                        prev.includes("Contacts") ? prev.filter((i) => i !== "Contacts") : [...prev, "Contacts"]
                      )
                    }
                    className={`rounded-2xl border p-4 cursor-pointer transition flex items-start justify-between gap-3 ${
                      selectedImportObjects.includes("Contacts")
                        ? "border-[#b58a18] bg-amber-50/60 dark:bg-amber-950/40 ring-1 ring-[#b58a18]"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-[#b58a18] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">Contacts</div>
                        <p className="text-[11px] text-slate-400 mt-1">Contains contact records and their associated details.</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedImportObjects.includes("Contacts")}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-4 w-4"
                    />
                  </div>

                  <div
                    onClick={() =>
                      setSelectedImportObjects((prev) =>
                        prev.includes("Opportunities") ? prev.filter((i) => i !== "Opportunities") : [...prev, "Opportunities"]
                      )
                    }
                    className={`rounded-2xl border p-4 cursor-pointer transition flex items-start justify-between gap-3 ${
                      selectedImportObjects.includes("Opportunities")
                        ? "border-[#b58a18] bg-amber-50/60 dark:bg-amber-950/40 ring-1 ring-[#b58a18]"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-[#b58a18] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">Opportunities</div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold mt-1">Includes deals, their stages, statuses, and pipeline progress.</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedImportObjects.includes("Opportunities")}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-4 w-4"
                    />
                  </div>

                  <div
                    onClick={() =>
                      setSelectedImportObjects((prev) =>
                        prev.includes("Companies") ? prev.filter((i) => i !== "Companies") : [...prev, "Companies"]
                      )
                    }
                    className={`rounded-2xl border p-4 cursor-pointer transition flex items-start justify-between gap-3 ${
                      selectedImportObjects.includes("Companies")
                        ? "border-[#b58a18] bg-amber-50/60 dark:bg-amber-950/40 ring-1 ring-[#b58a18]"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Building className="h-5 w-5 text-[#b58a18] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">Companies</div>
                        <p className="text-[11px] text-slate-400 mt-1">Contains businesses, their details, and associated contact information.</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedImportObjects.includes("Companies")}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-4 w-4"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-3">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Previous imports</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">View previous imports in bulk actions.</p>
                <Link href="/admin/crm?tab=bulk" className="inline-block text-xs font-bold text-[#b58a18] hover:underline">
                  View bulk actions
                </Link>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button disabled className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-bold text-slate-400 opacity-50 cursor-not-allowed">
                  Back
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={() => router.push("/admin/crm?tab=opportunities")} className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline">
                    Cancel
                  </button>
                  <button onClick={() => setImportStep(2)} className="rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-5 py-2 text-xs shadow-md transition">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: UPLOAD */}
          {importStep === 2 && (
            <div className="space-y-6 max-w-4xl">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-2xs space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Upload your file</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Before uploading, make sure your file is ready to import. <span onClick={downloadSampleCSV} className="text-[#b58a18] font-bold hover:underline cursor-pointer">Download a sample file</span> or <span className="text-[#b58a18] font-bold hover:underline cursor-pointer">learn more</span>.
                  </p>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDropFile}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#b58a18] rounded-2xl p-10 text-center space-y-3 bg-amber-50/30 dark:bg-amber-950/10 transition cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 text-[#b58a18] mx-auto flex items-center justify-center group-hover:scale-110 transition">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Click to upload or drag and drop
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">CSV or Excel (max size 30 MB)</p>
                </div>

                {importFileName && (
                  <div className="flex items-center justify-between rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/40 p-3.5 text-xs">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-[#b58a18]" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{importFileName}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-2">({importFileSize})</span>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                      <Check className="h-4 w-4" /> Ready
                    </span>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Choose how to import opportunities
                  </label>
                  <div className="relative max-w-xl">
                    <select
                      value={importStrategy}
                      onChange={(e) => setImportStrategy(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 pr-9 text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                      <option value="Create new and update existing opportunities">Create new and update existing opportunities</option>
                      <option value="Create new opportunities only">Create new opportunities only</option>
                      <option value="Update existing opportunities only">Update existing opportunities only</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button onClick={() => setImportStep(1)} className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Back
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={() => router.push("/admin/crm?tab=opportunities")} className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline">
                    Cancel
                  </button>
                  <button onClick={() => setImportStep(3)} className="rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-5 py-2 text-xs shadow-md transition">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: MAP */}
          {importStep === 3 && (
            <div className="space-y-6 max-w-5xl">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Mapping requirements</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Make sure all required fields are mapped before continuing. You can review and adjust mappings before completing the import.
                </p>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 max-w-sm">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Fields required to</div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setOpenRequirements(!openRequirements)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <span className="flex items-center gap-1.5">
                        {openRequirements ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        Create new opportunities
                      </span>
                    </button>

                    {openRequirements && (
                      <div className="pl-5 space-y-1.5 text-xs text-amber-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <span>Contact ID</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <span>Opportunity name</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                          <span>Pipeline</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                      <ChevronRight className="h-3.5 w-3.5" />
                      <span>Update existing opportunities only</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-4">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Mapped columns</h3>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold">
                        <th className="p-3.5">Column in file</th>
                        <th className="p-3.5">Sample values</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5">
                          <span className="inline-flex items-center gap-1">
                            Object <HelpCircle className="h-3 w-3 text-slate-400" />
                          </span>
                        </th>
                        <th className="p-3.5">
                          <span className="inline-flex items-center gap-1">
                            Field <HelpCircle className="h-3 w-3 text-slate-400" />
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                      {(csvHeaders.length > 0 ? csvHeaders : SYSTEM_FIELDS.map((sf) => sf.label)).map((headerKey) => {
                        const mappedKey = columnMappings[headerKey] || "__unmapped__";
                        const sysField = SYSTEM_FIELDS.find((sf) => sf.key === mappedKey);
                        const isMapped = mappedKey !== "__unmapped__";

                        const samples = csvSampleRows.length > 0
                          ? csvSampleRows.map((r) => r[headerKey]).filter(Boolean).slice(0, 3)
                          : ["Sample Value 1", "Sample Value 2"];

                        return (
                          <tr key={headerKey}>
                            <td className="p-3.5 font-bold text-slate-900 dark:text-white">{headerKey}</td>
                            <td className="p-3.5 text-slate-600 dark:text-slate-400">
                              {samples.map((s, idx) => (
                                <div key={idx}>{s}</div>
                              ))}
                            </td>
                            <td className="p-3.5">
                              {isMapped ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300">
                                  <Check className="h-3 w-3" /> Mapped
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                                  Not mapped
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 font-bold text-slate-700 dark:text-slate-300">
                              {sysField ? sysField.object : "Unmapped"}
                            </td>
                            <td className="p-3.5">
                              <select
                                value={mappedKey}
                                onChange={(e) => setColumnMappings({ ...columnMappings, [headerKey]: e.target.value })}
                                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold outline-none text-slate-900 dark:text-white focus:border-[#b58a18]"
                              >
                                <option value="__unmapped__">— Do not import / Unmapped —</option>
                                <optgroup label="Contact Details">
                                  {SYSTEM_FIELDS.filter((f) => f.object === "Contact").map((f) => (
                                    <option key={f.key} value={f.key}>{f.label}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Opportunity Details">
                                  {SYSTEM_FIELDS.filter((f) => f.object === "Opportunity").map((f) => (
                                    <option key={f.key} value={f.key}>{f.label}</option>
                                  ))}
                                </optgroup>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button onClick={() => setImportStep(2)} className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Back
                </button>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dontImportUnmapped}
                      onChange={(e) => setDontImportUnmapped(e.target.checked)}
                      className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-4 w-4"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Don&apos;t import data in 8 unmapped columns</span>
                  </label>
                  <button onClick={() => router.push("/admin/crm?tab=opportunities")} className="px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline">
                    Cancel
                  </button>
                  <button onClick={() => setImportStep(4)} className="rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-5 py-2 text-xs shadow-md transition">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: VERIFY */}
          {importStep === 4 && (
            <div className="space-y-6 max-w-5xl">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-6">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Preferences</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Review your data and settings before starting the import.
                  </p>
                </div>

                <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Review import</h4>

                  <div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">File</div>
                    <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
                      <FileSpreadsheet className="h-6 w-6 text-slate-500" />
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">{importFileName}</div>
                        <p className="text-[11px] text-slate-400">{importFileSize} · uploaded</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Mapping</div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold">
                            <th className="p-3.5">Column in file</th>
                            <th className="p-3.5">Sample values</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5">Object</th>
                            <th className="p-3.5">Field</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                          {(csvHeaders.length > 0 ? csvHeaders : SYSTEM_FIELDS.map((sf) => sf.label)).map((headerKey) => {
                            const mappedKey = columnMappings[headerKey] || "__unmapped__";
                            const sysField = SYSTEM_FIELDS.find((sf) => sf.key === mappedKey);
                            const isMapped = mappedKey !== "__unmapped__";
                            if (!isMapped) return null;

                            const samples = csvSampleRows.length > 0
                              ? csvSampleRows.map((r) => r[headerKey]).filter(Boolean).slice(0, 3)
                              : ["Sample Value 1"];

                            return (
                              <tr key={headerKey}>
                                <td className="p-3.5 font-bold">{headerKey}</td>
                                <td className="p-3.5 text-slate-600 dark:text-slate-400">
                                  {samples.join(", ")}
                                </td>
                                <td className="p-3.5">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300">
                                    <Check className="h-3 w-3" /> Mapped
                                  </span>
                                </td>
                                <td className="p-3.5 font-bold">{sysField ? sysField.object : "Unmapped"}</td>
                                <td className="p-3.5 font-bold">{sysField ? sysField.label : "Unmapped"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <button onClick={() => setImportStep(3)} className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  Back
                </button>
                <div className="flex items-center gap-3">
                  <button onClick={() => router.push("/admin/crm?tab=opportunities")} className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:underline">
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setImportStep(1);
                      router.push("/admin/crm?tab=opportunities");
                    }}
                    className="rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-6 py-2.5 text-xs shadow-md transition"
                  >
                    Start import
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "bulk" ? (
        /* BULK ACTIONS AUDIT LOG TAB VIEW */
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Bulk actions</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Track progress and results for bulk actions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Filters</span>

              <div className="relative">
                <input
                  type="date"
                  value={bulkStartDate}
                  onChange={(e) => setBulkStartDate(e.target.value)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="relative">
                <input
                  type="date"
                  value={bulkEndDate}
                  onChange={(e) => setBulkEndDate(e.target.value)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={bulkStatusFilter}
                  onChange={(e) => setBulkStatusFilter(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="All statuses">All statuses</option>
                  <option value="Complete">Complete</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Failed">Failed</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={bulkActionFilter}
                  onChange={(e) => setBulkActionFilter(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="All actions">All actions</option>
                  <option value="Delete">Delete</option>
                  <option value="Update">Update</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={bulkUserFilter}
                  onChange={(e) => setBulkUserFilter(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 py-1.5 text-xs font-medium text-slate-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="All users">All users</option>
                  <option value="Sagar Singhal">Sagar Singhal</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold">
                    <th className="p-3.5">Action label</th>
                    <th className="p-3.5">Operation</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">User</th>
                    <th className="p-3.5">Created (IST)</th>
                    <th className="p-3.5">Completed (IST)</th>
                    <th className="p-3.5 text-center">Statist...</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                  {bulkLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3.5 font-medium text-slate-600 dark:text-slate-300 max-w-[220px] truncate">
                        {log.actionLabel}
                      </td>
                      <td className="p-3.5 font-medium">{log.operation}</td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                          {log.status}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-lime-300 text-lime-950 font-bold text-[10px] flex items-center justify-center">
                            {log.user.initials}
                          </div>
                          <span>{log.user.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400">{log.createdAt}</td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400">{log.completedAt}</td>
                      <td className="p-3.5 text-center">
                        <BarChart3 className="h-4 w-4 text-slate-400 hover:text-[#b58a18] cursor-pointer inline-block" />
                      </td>
                      <td className="p-3.5 text-center">
                        <MoreVertical className="h-4 w-4 text-slate-400 hover:text-slate-700 cursor-pointer inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Page 1</span>
              <div className="flex items-center gap-2">
                <button disabled className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-slate-400 font-bold opacity-50 cursor-not-allowed">
                  Previous
                </button>
                <button disabled className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-slate-400 font-bold opacity-50 cursor-not-allowed">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === "forecast" ? (
        /* FORECAST TAB VIEW */
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <select
                  value={activePipelineId}
                  onChange={(e) => setActivePipelineId(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 pr-9 text-sm font-bold text-slate-900 dark:text-white shadow-2xs outline-none cursor-pointer hover:border-slate-400"
                >
                  <option value="all">All pipelines</option>
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 text-xs font-bold">
                {canForecastSummary && (
                  <button
                    type="button"
                    onClick={() => setForecastViewMode("summary")}
                    className={`flex items-center gap-1.5 pb-2 transition ${
                      forecastViewMode === "summary"
                        ? "text-[#b58a18] dark:text-[#d4af37] border-b-2 border-[#b58a18] font-bold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>Summary</span>
                  </button>
                )}
                {canForecastTimeline && (
                  <button
                    type="button"
                    onClick={() => setForecastViewMode("timeline")}
                    className={`flex items-center gap-1.5 pb-2 transition ${
                      forecastViewMode === "timeline"
                        ? "text-[#b58a18] dark:text-[#d4af37] border-b-2 border-[#b58a18] font-bold"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Forecast timeline</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {forecastViewMode === "timeline" ? (
            /* FORECAST TIMELINE VIEW */
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition">
                    <Filter className="h-3.5 w-3.5 text-slate-500" />
                    <span>Advanced filters</span>
                  </button>

                  <button className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-3.5 py-1.5 text-xs font-bold">
                    <ArrowUpDown className="h-3.5 w-3.5 text-[#b58a18]" />
                    <span>Sort (1)</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Custom Date Calendar Button (BEFORE Today & arrow buttons) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCustomDateModal(!showCustomDateModal)}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition shadow-2xs ${
                        customStartDate || customEndDate
                          ? "border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                      title="Select custom dates"
                    >
                      <Calendar className="h-3.5 w-3.5 text-[#b58a18]" />
                      <span>
                        {customStartDate || customEndDate
                          ? `${customStartDate || "Start"} to ${customEndDate || "End"}`
                          : "Custom dates"}
                      </span>
                      {customStartDate || customEndDate ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomStartDate("");
                            setCustomEndDate("");
                          }}
                          className="ml-1 hover:text-red-500 cursor-pointer font-extrabold text-sm"
                          title="Clear custom dates"
                        >
                          ×
                        </span>
                      ) : null}
                    </button>

                    {/* Custom Date Popover Modal */}
                    {showCustomDateModal && (
                      <div className="absolute right-0 mt-2 z-50 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xl space-y-3.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-[#b58a18]" />
                            Select Custom Dates
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowCustomDateModal(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#b58a18]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              End Date
                            </label>
                            <input
                              type="date"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#b58a18]"
                            />
                          </div>
                        </div>

                        {/* Quick Presets Strip */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets</span>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const today = new Date();
                                const next7 = new Date();
                                next7.setDate(today.getDate() + 7);
                                setCustomStartDate(today.toISOString().split("T")[0]);
                                setCustomEndDate(next7.toISOString().split("T")[0]);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 text-[11px]"
                            >
                              Next 7 Days
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const today = new Date();
                                const next30 = new Date();
                                next30.setDate(today.getDate() + 30);
                                setCustomStartDate(today.toISOString().split("T")[0]);
                                setCustomEndDate(next30.toISOString().split("T")[0]);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 text-[11px]"
                            >
                              Next 30 Days
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomStartDate("");
                              setCustomEndDate("");
                            }}
                            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white"
                          >
                            Reset
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCustomDateModal(false)}
                            className="rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-4 py-1.5 text-xs shadow-sm transition"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Prev / Today / Next Navigation Controls */}
                  <div className="inline-flex rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 shadow-2xs text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTimelineOffset((prev) => prev - 1)}
                      className="px-2.5 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      title="Previous Period"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimelineOffset(0)}
                      className="px-3 py-1.5 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimelineOffset((prev) => prev + 1)}
                      className="px-2.5 py-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      title="Next Period"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Period Switcher (Week / Month / Quarter / Year) */}
                  <div className="relative">
                    <select
                      value={timelinePeriod}
                      onChange={(e) => {
                        setTimelinePeriod(e.target.value as any);
                        setTimelineOffset(0);
                      }}
                      className="appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 pr-8 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer hover:border-slate-400"
                    >
                      <option value="Week">Week</option>
                      <option value="Month">Month</option>
                      <option value="Quarter">Quarter</option>
                      <option value="Year">Year</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Scrollable Timeline Grid */}
              <div className="w-full overflow-x-auto pt-2 pb-16 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex items-start gap-5 min-w-max min-h-[520px]">
                  {/* Column 0: No Close Date Column */}
                  <div className="w-80 flex flex-col gap-4 shrink-0">
                    <div className="rounded-2xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/30 dark:bg-slate-900 p-4 shadow-2xs space-y-2 border-t-4 border-t-amber-500 relative">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          <span>No close date</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveTimelineTooltip(
                              activeTimelineTooltip === "noclose" ? null : "noclose"
                            )
                          }
                          className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500 dark:text-slate-400">
                          {forecastTimelineData.noCloseDate.count} opportunities
                        </span>
                        <div className="text-right">
                          <span className="text-emerald-600 font-bold">
                            {formatCurrency(forecastTimelineData.noCloseDate.wonRevenue)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-slate-400 text-[11px]">
                          +0% of {formatCurrency(forecastTimelineData.noCloseDate.totalRevenue)}
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {formatCurrency(forecastTimelineData.noCloseDate.totalRevenue)}
                        </span>
                      </div>

                      {/* Info Tooltip Popup */}
                      {activeTimelineTooltip === "noclose" && (
                        <div className="absolute top-12 left-0 right-0 z-30 p-3 rounded-xl bg-slate-900 text-white text-xs space-y-1.5 shadow-xl border border-slate-700 animate-in fade-in duration-150">
                          <div className="text-[11px] text-slate-300">
                            Potential value of open opportunities:
                            <div className="font-bold text-white">
                              {formatCurrency(forecastTimelineData.noCloseDate.expectedRevenue)} (0% of {formatCurrency(forecastTimelineData.noCloseDate.totalRevenue)})
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-300">
                            Value of won opportunities:
                            <div className="font-bold text-emerald-400">
                              {formatCurrency(forecastTimelineData.noCloseDate.wonRevenue)}
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-300">
                            Total potential value of open and won opportunities:
                            <div className="font-bold text-white">
                              {formatCurrency(forecastTimelineData.noCloseDate.totalRevenue)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cards under No Close Date */}
                    {forecastTimelineData.noCloseDate.leads.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
                        No opportunities
                      </div>
                    ) : (
                      forecastTimelineData.noCloseDate.leads.map((opp) => {
                        const notesCount = (opp.notes?.length || 0) + (opp.activities?.filter((a) => a.type === "NOTE").length || 0);
                        const tasksCount = opp.activities?.filter((a) => a.type === "TASK").length || 0;
                        const appointmentsCount = opp.activities?.filter((a) => a.type === "APPOINTMENT").length || 0;
                        const tagsCount = opp.tags?.length || 0;

                        return (
                          <div
                            key={opp.id}
                            className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3 hover:border-amber-400 transition"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h5 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                {opp.name}
                              </h5>
                              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 flex items-center justify-center text-[10px] font-black shrink-0">
                                {getInitials(opp.owner?.name || "SS")}
                              </div>
                            </div>

                            <div className="space-y-1 text-xs">
                              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span className="font-medium">Business name:</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                                  {opp.businessName || "Business"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                <span className="font-medium">Value:</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {formatCurrency(opp.budgetMax || opp.budgetMin || 0)}
                                </span>
                              </div>
                              {opp.nextFollowUpAt && (
                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                  <span className="font-medium">Expected:</span>
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {formatDateTime(opp.nextFollowUpAt)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Tag Row with interactive click handlers opening Unified Modal */}
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-400">
                              <button type="button" onClick={() => openUnifiedModal(opp, "details")} className="hover:text-slate-700 p-0.5 cursor-pointer" title="Call">
                                <Phone className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => openUnifiedModal(opp, "details")} className="hover:text-slate-700 p-0.5 cursor-pointer" title="View Conversations">
                                <MessageSquare className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => openUnifiedModal(opp, "details")} className="hover:text-slate-700 p-0.5 relative cursor-pointer" title="Business Partners">
                                <Tag className="h-4 w-4 text-[#b58a18]" />
                                {tagsCount > 0 && (
                                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center">
                                    {tagsCount}
                                  </span>
                                )}
                              </button>
                              <button type="button" onClick={() => openUnifiedModal(opp, "notes")} className="hover:text-slate-700 p-0.5 relative cursor-pointer" title="Notes">
                                <FileText className="h-4 w-4" />
                                {notesCount > 0 && (
                                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center">
                                    {notesCount}
                                  </span>
                                )}
                              </button>
                              <button type="button" onClick={() => openUnifiedModal(opp, "tasks")} className="hover:text-slate-700 p-0.5 relative cursor-pointer" title="Add Task">
                                <CheckSquare className="h-4 w-4" />
                                {tasksCount > 0 && (
                                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center">
                                    {tasksCount}
                                  </span>
                                )}
                              </button>
                              <button type="button" onClick={() => openUnifiedModal(opp, "appointment")} className="hover:text-slate-700 p-0.5 relative cursor-pointer" title="Book Appointment">
                                <Calendar className="h-4 w-4" />
                                {appointmentsCount > 0 && (
                                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center">
                                    {appointmentsCount}
                                  </span>
                                )}
                              </button>
                            </div>

                            {/* Stage Progress Bar */}
                            <div className="flex items-center gap-1 pt-1">
                              <div className="h-1.5 flex-1 rounded-full bg-emerald-500" />
                              <div className="h-1.5 flex-1 rounded-full bg-emerald-500" />
                              <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                              <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                              <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Columns 1..N: Time-bucketed columns */}
                  {forecastTimelineData.columns.map((col) => (
                    <div key={col.id} className="w-80 flex flex-col gap-4 shrink-0">
                      {/* Column Header */}
                      <div className="rounded-2xl border border-emerald-500/30 dark:border-slate-800 bg-emerald-50/20 dark:bg-slate-900 p-4 shadow-2xs space-y-2 border-t-4 border-t-emerald-500 relative">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                            {col.label}
                          </h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-600">
                              {formatCurrency(col.wonRevenue)}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveTimelineTooltip(
                                  activeTimelineTooltip === col.id ? null : col.id
                                )
                              }
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                          <span className="text-slate-500 dark:text-slate-400">
                            {col.count} opportunities
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            +0% of {formatCurrency(col.totalRevenue)}
                          </span>
                        </div>

                        <div className="text-right pt-0.5">
                          <span className="font-black text-slate-900 dark:text-white text-xs">
                            {formatCurrency(col.totalRevenue)}
                          </span>
                        </div>

                        {/* Hover Tooltip Popup */}
                        {activeTimelineTooltip === col.id && (
                          <div className="absolute top-12 left-0 right-0 z-30 p-3 rounded-xl bg-slate-900 text-white text-xs space-y-1.5 shadow-xl border border-slate-700 animate-in fade-in duration-150">
                            <div className="text-[11px] text-slate-300">
                              Potential value of open opportunities:
                              <div className="font-bold text-white">
                                {formatCurrency(col.expectedRevenue)} (0% of {formatCurrency(col.totalRevenue)})
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-300">
                              Value of won opportunities:
                              <div className="font-bold text-emerald-400">
                                {formatCurrency(col.wonRevenue)}
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-300">
                              Total potential value of open and won opportunities:
                              <div className="font-bold text-white">
                                {formatCurrency(col.totalRevenue)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cards under this Timeline Column */}
                      {col.leads.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
                          No opportunities
                        </div>
                      ) : (
                        col.leads.map((opp) => {
                          const notesCount = (opp.notes?.length || 0) + (opp.activities?.filter((a) => a.type === "NOTE").length || 0);
                          const tasksCount = opp.activities?.filter((a) => a.type === "TASK").length || 0;
                          const appointmentsCount = opp.activities?.filter((a) => a.type === "APPOINTMENT").length || 0;
                          const tagsCount = opp.tags?.length || 0;

                          return (
                            <div
                              key={opp.id}
                              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3 hover:border-emerald-400 transition"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h5 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                  {opp.name}
                                </h5>
                                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 flex items-center justify-center text-[10px] font-black shrink-0">
                                  {getInitials(opp.owner?.name || "AM")}
                                </div>
                              </div>

                              <div className="space-y-1 text-xs">
                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                  <span className="font-medium">Business name:</span>
                                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                                    {opp.businessName || "Business"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                  <span className="font-medium">Value:</span>
                                  <span className="font-bold text-slate-900 dark:text-slate-100">
                                    {formatCurrency(opp.budgetMax || opp.budgetMin || 0)}
                                  </span>
                                </div>
                                {opp.nextFollowUpAt && (
                                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                    <span className="font-medium">Expected close date:</span>
                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                      {formatDateTime(opp.nextFollowUpAt)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action Tag Row with interactive click handlers opening Unified Modal */}
                              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-400">
                                <button type="button" onClick={() => openUnifiedModal(opp, "details")} className="hover:text-slate-700 p-0.5 cursor-pointer" title="Call">
                                  <Phone className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => openUnifiedModal(opp, "details")} className="hover:text-slate-700 p-0.5 cursor-pointer" title="View Conversations">
                                  <MessageSquare className="h-4 w-4" />
                                </button>
                                <button type="button" onClick={() => openUnifiedModal(opp, "details")} className="hover:text-slate-700 p-0.5 relative cursor-pointer" title="Business Partners">
                                  <Tag className="h-4 w-4 text-[#b58a18]" />
                                  {tagsCount > 0 && (
                                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center">
                                      {tagsCount}
                                    </span>
                                  )}
                                </button>
                                <button type="button" onClick={() => openUnifiedModal(opp, "notes")} className="hover:text-slate-700 p-0.5 relative cursor-pointer" title="Notes">
                                  <FileText className="h-4 w-4" />
                                  {notesCount > 0 && (
                                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center">
                                      {notesCount}
                                    </span>
                                  )}
                                </button>
                                <button type="button" onClick={() => openUnifiedModal(opp, "tasks")} className="hover:text-slate-700 p-0.5 relative cursor-pointer" title="Add Task">
                                  <CheckSquare className="h-4 w-4" />
                                  {tasksCount > 0 && (
                                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center">
                                      {tasksCount}
                                    </span>
                                  )}
                                </button>
                                <button type="button" onClick={() => openUnifiedModal(opp, "appointment")} className="hover:text-slate-700 p-0.5 relative cursor-pointer" title="Book Appointment">
                                  <Calendar className="h-4 w-4" />
                                  {appointmentsCount > 0 && (
                                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center">
                                      {appointmentsCount}
                                    </span>
                                  )}
                                </button>
                              </div>

                              {/* Stage Progress Bar */}
                              <div className="flex items-center gap-1 pt-1">
                                <div className="h-1.5 flex-1 rounded-full bg-emerald-500" />
                                <div className="h-1.5 flex-1 rounded-full bg-emerald-500" />
                                <div className="h-1.5 flex-1 rounded-full bg-[#b58a18]" />
                                <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                <div className="h-1.5 flex-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* FORECAST SUMMARY VIEW */
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Row 1: Top 4 KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-1.5">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Max potential revenue</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(forecastMetrics.maxPotential)}
                  </div>
                  <p className="text-[11px] text-slate-400">Total value if all open opportunities close</p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-1.5">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Expected revenue</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(forecastMetrics.expected)}
                  </div>
                  <p className="text-[11px] text-slate-400">Based on opportunity or stage probability</p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-1.5">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Won revenue</div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(forecastMetrics.wonRevenue)}
                  </div>
                  <p className="text-[11px] text-slate-400">Total value of won opportunities</p>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-1.5">
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Open opportunities</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {forecastMetrics.openCount}
                  </div>
                  <p className="text-[11px] text-slate-400">Opportunities currently in progress</p>
                </div>
              </div>

              {/* Row 2: At-Risk & Fix Data Split Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* At-risk opportunities card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">At-risk opportunities</h3>
                        <button type="button" className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer">
                          <Settings className="h-3 w-3" /> Adjust risk settings
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Opportunities whose expected close date was pushed this period.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold text-xs">
                      0 Opportunities {formatCurrency(0)}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between border-l-4 border-l-red-500">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">High risk</div>
                        <div className="text-[11px] text-slate-400">Slipped 2+ times or 14+ days</div>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white">0 ({formatCurrency(0)})</div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between border-l-4 border-l-amber-500">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Medium risk</div>
                        <div className="text-[11px] text-slate-400">Slipped 1+ times or 7+ days (excluding high)</div>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white">0 ({formatCurrency(0)})</div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between border-l-4 border-l-emerald-500">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">Low risk</div>
                        <div className="text-[11px] text-slate-400">Slipped 1+ times or 1+ days (excluding high/medium)</div>
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white">0 ({formatCurrency(0)})</div>
                    </div>
                  </div>
                </div>

                {/* Fix your forecast data card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fix your forecast data</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Data quality directly impacts forecast accuracy.
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/70 text-blue-600 flex items-center justify-center font-bold">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Missing close date</div>
                          <div className="text-[11px] text-slate-400">Not included in forecast calculations.</div>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{forecastMetrics.missingCloseDate}</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 flex items-center justify-center font-bold">
                          ₹
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Missing opportunity value</div>
                          <div className="text-[11px] text-slate-400">These opportunities contribute ₹0 to totals.</div>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{forecastMetrics.missingValue}</span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 flex items-center justify-center font-bold">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">Overdue opportunities</div>
                          <div className="text-[11px] text-slate-400">May inflate forecast totals.</div>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{forecastMetrics.overdue}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Group By Selector & Opportunities Bar Chart */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Group by</span>
                  <div className="relative">
                    <select
                      value={forecastGroupBy}
                      onChange={(e) => setForecastGroupBy(e.target.value as any)}
                      className="appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 pr-9 text-xs font-bold text-slate-900 dark:text-white shadow-2xs outline-none cursor-pointer hover:border-slate-400"
                    >
                      <option value="Status">Status</option>
                      <option value="Owner">Owner</option>
                      <option value="Expected Close Date">Expected Close Date</option>
                      <option value="Pipeline">Pipeline</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {/* Chart Card */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Opportunities by {forecastGroupBy.toLowerCase()}
                    </h3>
                    <div className="flex items-center gap-5 text-xs font-semibold">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Won revenue</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                        <span>Expected revenue</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span>Max potential revenue</span>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart Graphic */}
                  <div className="space-y-5 pt-2">
                    {forecastGroupedData.map((item) => {
                      const maxValScale = Math.max(forecastMetrics.maxPotential, 12000000);
                      const maxBarPct = Math.min(100, (item.maxPotential / maxValScale) * 100);
                      const expectedBarPct = Math.min(100, (item.expected / maxValScale) * 100);
                      const wonBarPct = Math.min(100, (item.wonRevenue / maxValScale) * 100);

                      return (
                        <div key={item.label} className="space-y-1.5 group">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800 dark:text-slate-200 w-36 truncate">{item.label}</span>
                            <div className="flex-1 relative h-6 bg-slate-100/80 dark:bg-slate-800/50 rounded-lg overflow-hidden flex items-center px-1">
                              {/* Background Max Potential bar */}
                              {maxBarPct > 0 && (
                                <div
                                  style={{ width: `${maxBarPct}%` }}
                                  className="absolute left-0 top-0 bottom-0 bg-slate-200/90 dark:bg-slate-700/60 rounded-lg transition-all duration-300"
                                />
                              )}
                              {/* Expected Revenue blue bar */}
                              {expectedBarPct > 0 && (
                                <div
                                  style={{ width: `${expectedBarPct}%` }}
                                  className="absolute left-0 top-0 bottom-0 bg-blue-600 rounded-lg transition-all duration-300"
                                />
                              )}
                              {/* Won Revenue green bar */}
                              {wonBarPct > 0 && (
                                <div
                                  style={{ width: `${wonBarPct}%` }}
                                  className="absolute left-0 top-0 bottom-0 bg-emerald-500 rounded-lg transition-all duration-300"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Scale ticks */}
                    <div className="flex justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-medium pl-36">
                      <span>₹0.00</span>
                      <span>₹20,00,000.00</span>
                      <span>₹40,00,000.00</span>
                      <span>₹60,00,000.00</span>
                      <span>₹80,00,000.00</span>
                      <span>₹1,00,00,000.00</span>
                      <span>₹1,20,00,000.00</span>
                    </div>
                  </div>
                </div>

                {/* Summary Table */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 font-bold">
                          <th className="p-4">{forecastGroupBy}</th>
                          <th className="p-4 text-center">Opportunities</th>
                          <th className="p-4 text-right">Max potential revenue ⓘ</th>
                          <th className="p-4 text-right">Expected revenue ⓘ</th>
                          <th className="p-4 text-right">Won revenue</th>
                          <th className="p-4 text-right">Total potential ⓘ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                        {forecastGroupedData.map((row) => (
                          <tr key={row.label} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                            <td className="p-4 font-bold">{row.label}</td>
                            <td className="p-4 text-center">{row.count}</td>
                            <td className="p-4 text-right">{formatCurrency(row.maxPotential)}</td>
                            <td className="p-4 text-right text-blue-600 dark:text-blue-400 font-bold">
                              {row.expected > 0 ? formatCurrency(row.expected) : "—"}
                            </td>
                            <td className="p-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                              {formatCurrency(row.wonRevenue)}
                            </td>
                            <td className="p-4 text-right font-extrabold">{formatCurrency(row.totalPotential)}</td>
                          </tr>
                        ))}

                        {/* Total Row */}
                        <tr className="bg-slate-50 dark:bg-slate-800/60 font-extrabold text-slate-900 dark:text-white border-t-2 border-slate-200 dark:border-slate-700">
                          <td className="p-4">Total</td>
                          <td className="p-4 text-center">{forecastGroupedData.reduce((acc, r) => acc + r.count, 0)}</td>
                          <td className="p-4 text-right">
                            {formatCurrency(forecastGroupedData.reduce((acc, r) => acc + r.maxPotential, 0))}
                          </td>
                          <td className="p-4 text-right text-blue-600 dark:text-blue-400">
                            {formatCurrency(forecastGroupedData.reduce((acc, r) => acc + r.expected, 0))}
                          </td>
                          <td className="p-4 text-right text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(forecastGroupedData.reduce((acc, r) => acc + r.wonRevenue, 0))}
                          </td>
                          <td className="p-4 text-right">
                            {formatCurrency(forecastGroupedData.reduce((acc, r) => acc + r.totalPotential, 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* OPPORTUNITIES BOARD OR LIST VIEW */
        <div className="space-y-5">
          {/* Row 1: Pipeline Selector Dropdown & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={activePipelineId}
                  onChange={(e) => setActivePipelineId(e.target.value)}
                  className="appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 pr-9 text-sm font-bold text-slate-900 dark:text-white shadow-2xs outline-none cursor-pointer hover:border-slate-400"
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" />
              </div>

              <span className="rounded-full bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-300 px-4 py-1.5 text-xs font-extrabold border border-amber-200 dark:border-amber-800">
                {totalOpportunitiesCount} opportunity
              </span>

              {selectedLeadIds.length > 0 && (
                <div className="flex items-center gap-3 border-l border-slate-300 dark:border-slate-700 pl-3 animate-in fade-in">
                  <button
                    type="button"
                    onClick={() => {
                      setFieldSearch("");
                      setEditingField(null);
                      setShowEditModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-[#b58a18] transition"
                  >
                    <Pencil className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmText("");
                      setShowDeleteModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {canAddStatus && (
                <button
                  type="button"
                  onClick={() => setShowAddStatusModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/60 px-3.5 py-2.5 text-xs font-extrabold text-[#b58a18] dark:text-[#d4af37] hover:bg-amber-100 dark:hover:bg-amber-900/60 shadow-2xs transition"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[3]" />
                  <span>Add Status</span>
                </button>
              )}

              <div className="inline-flex rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setView("kanban")}
                  className={`p-2 rounded-lg transition ${
                    view === "kanban" ? "bg-amber-50 dark:bg-amber-950 text-[#b58a18] font-bold" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Board View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className={`p-2 rounded-lg transition ${
                    view === "list" ? "bg-amber-50 dark:bg-amber-950 text-[#b58a18] font-bold" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setImportStep(1);
                  router.push("/admin/crm?tab=import");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-[#b58a18] dark:text-[#d4af37] hover:bg-amber-50/50 dark:hover:bg-slate-800 shadow-2xs transition"
              >
                <Download className="h-4 w-4 text-[#b58a18] dark:text-[#d4af37]" />
                <span>Import</span>
              </button>

              {canCreateOpportunities && (
                <button
                  type="button"
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-5 py-2.5 text-xs shadow-md transition"
                >
                  <Plus className="h-4 w-4 stroke-[3]" />
                  <span>Create Opportunities</span>
                </button>
              )}

              <button type="button" className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-4 text-xs font-bold relative">
              <button
                type="button"
                onClick={() => setShowListViewDropdown(false)}
                className="flex items-center gap-1.5 text-[#b58a18] dark:text-[#d4af37] border-b-2 border-[#b58a18] dark:border-[#d4af37] pb-1 font-extrabold"
              >
                {view === "kanban" ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
                <span>Open opportunities</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowListViewDropdown((prev) => !prev)}
                  className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white pb-1 transition cursor-pointer font-bold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>List</span>
                </button>

                {/* Dropdown Menu matching exact user screenshot */}
                {showListViewDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setView("kanban");
                        setShowListViewDropdown(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition flex items-start gap-3 ${
                        view === "kanban"
                          ? "bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0">
                        <LayoutGrid className="h-4.5 w-4.5 text-slate-700 dark:text-slate-200" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">Board view</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal leading-snug">
                          View opportunities as cards in each stage.
                        </div>
                      </div>
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setView("list");
                        setShowListViewDropdown(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl transition flex items-start gap-3 ${
                        view === "list"
                          ? "bg-amber-50/80 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900"
                          : "hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0">
                        <List className="h-4.5 w-4.5 text-slate-700 dark:text-slate-200" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">List view</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal leading-snug">
                          View opportunities in a table format.
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <span>Advanced filters</span>
              </button>

              <button className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-3.5 py-1.5 text-xs font-bold">
                <ArrowUpDown className="h-3.5 w-3.5 text-[#b58a18]" />
                <span>Sort (1)</span>
              </button>

              <div className="relative">
                <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search opportunities"
                  className="w-52 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowCustomizeCardModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Manage fields</span>
              </button>
            </div>
          </div>

          {/* CHECK IF 0 OPPORTUNITIES EXIST */}
          {totalOpportunitiesCount === 0 ? (
            /* EMPTY STATE VIEW MATCHING USER SCREENSHOTS */
            <div className="space-y-8 animate-in fade-in duration-150">
              {/* Stage Header Summary Cards Strip on Top (Larger Box Size w-80 & Larger Font) */}
              <div className="w-full overflow-x-auto overflow-y-hidden pt-2 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex items-center gap-5 min-w-max">
                  {stages.map((stg) => (
                    <div
                      key={stg.id}
                      className="w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs shrink-0"
                    >
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{stg.name}</h4>
                      <div className="flex items-center justify-between mt-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span>0 opportunities</span>
                        <span className="font-extrabold text-slate-900 dark:text-white">₹0.00</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* No Opportunities Yet Graphic & Actions Box */}
              <div className="py-16 text-center space-y-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs max-w-4xl mx-auto">
                <div className="w-64 h-36 mx-auto relative flex items-center justify-center">
                  <svg className="w-full h-full text-slate-400" viewBox="0 0 320 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="175" y="25" width="95" height="65" rx="3" stroke="#cbd5e1" strokeWidth="2.5" fill="#f8fafc" />
                    <line x1="185" y1="40" x2="225" y2="40" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round" />
                    <line x1="185" y1="50" x2="225" y2="50" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round" />
                    <line x1="185" y1="60" x2="215" y2="60" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round" />
                    <rect x="220" y="32" width="10" height="10" fill="#cbd5e1" rx="1" />
                    <rect x="235" y="32" width="10" height="10" fill="#cbd5e1" rx="1" />
                    <rect x="220" y="48" width="12" height="12" fill="#fde047" rx="1" />
                    <rect x="245" y="45" width="20" height="18" fill="#fcd34d" rx="1" />
                    <rect x="252" y="70" width="14" height="20" stroke="#fcd34d" strokeWidth="1.5" fill="#fffbeb" rx="1" />

                    <rect x="110" y="45" width="38" height="55" rx="12" stroke="#cbd5e1" strokeWidth="2.5" fill="none" />
                    <path d="M129 100 L129 125 M115 125 L143 125" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />

                    <path d="M265 110 L273 110 L271 125 L267 125 Z" stroke="#cbd5e1" strokeWidth="2" fill="#f1f5f9" />
                    <path d="M267 110 C265 100 269 95 269 95 C269 95 273 100 271 110" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M271 110 C272 102 277 98 277 98 C277 98 278 103 273 110" stroke="#cbd5e1" strokeWidth="1.5" />

                    <rect x="120" y="90" width="80" height="5" stroke="#1e293b" strokeWidth="2.5" fill="#ffffff" />
                    <line x1="125" y1="95" x2="125" y2="135" stroke="#1e293b" strokeWidth="2.5" />
                    <line x1="195" y1="95" x2="195" y2="135" stroke="#1e293b" strokeWidth="2.5" />

                    <ellipse cx="160" cy="86" rx="9" ry="7" stroke="#1e293b" strokeWidth="2" fill="#ffffff" />
                    <path d="M152 82 L150 75 L155 80 Z" stroke="#1e293b" strokeWidth="2" fill="#ffffff" />
                    <path d="M168 82 L170 75 L165 80 Z" stroke="#1e293b" strokeWidth="2" fill="#ffffff" />
                    <circle cx="156" cy="85" r="1" fill="#1e293b" />
                    <circle cx="164" cy="85" r="1" fill="#1e293b" />
                    <path d="M159 87 Q160 88 161 87" stroke="#1e293b" strokeWidth="1.5" />
                    <ellipse cx="152" cy="90" rx="3.5" ry="2.5" stroke="#1e293b" strokeWidth="2" fill="#ffffff" />
                    <ellipse cx="168" cy="90" rx="3.5" ry="2.5" stroke="#1e293b" strokeWidth="2" fill="#ffffff" />
                    <path d="M152 92 C150 108 170 108 168 92" stroke="#1e293b" strokeWidth="2" fill="#ffffff" />
                    <path d="M166 104 C175 115 180 98 174 96" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                </div>

                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    No opportunities yet
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    Add a opportunity to start tracking deals in this pipeline, or import existing data.
                  </p>
                </div>

                {/* Empty State Action Buttons */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-5 py-2.5 text-xs shadow-md transition"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>Create Pipeline</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImportStep(1);
                      router.push("/admin/crm?tab=import");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition"
                  >
                    <Download className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    <span>Import</span>
                  </button>
                </div>
              </div>
            </div>
          ) : view === "list" ? (
            /* OPPORTUNITIES TABLE LIST VIEW */
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold">
                      <th className="p-3.5 w-10">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.length > 0 && selectedLeadIds.length === localLeads.length}
                          onChange={() => {
                            if (selectedLeadIds.length === localLeads.length) {
                              setSelectedLeadIds([]);
                            } else {
                              setSelectedLeadIds(localLeads.map((l) => l.id));
                            }
                          }}
                          className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-4 w-4 cursor-pointer"
                        />
                      </th>
                      <th className="p-3.5">
                        <span className="inline-flex items-center gap-1">
                          Opportu... <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </span>
                      </th>
                      <th className="p-3.5">Smart tags</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">
                        <span className="inline-flex items-center gap-1">
                          Stage <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </span>
                      </th>
                      <th className="p-3.5">
                        <span className="inline-flex items-center gap-1">
                          Value <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </span>
                      </th>
                      <th className="p-3.5">
                        <span className="inline-flex items-center gap-1">
                          Status <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </span>
                      </th>
                      <th className="p-3.5">Opportunit...</th>
                      <th className="p-3.5">Tags</th>
                      <th className="p-3.5">
                        <span className="inline-flex items-center gap-1">
                          Create... <ChevronDown className="h-3 w-3 text-[#b58a18]" />
                        </span>
                      </th>
                      <th className="p-3.5">
                        <span className="inline-flex items-center gap-1">
                          Update... <ArrowUpDown className="h-3 w-3 text-slate-400" />
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                    {filteredLeads.map((opp) => {
                      const isSelected = selectedLeadIds.includes(opp.id);
                      return (
                        <tr key={opp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="p-3.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectLead(opp.id)}
                              className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="p-3.5 font-bold">{opp.name}</td>
                          <td className="p-3.5 text-slate-400">—</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-950 font-black text-[10px] flex items-center justify-center">
                                SS
                              </div>
                              <span className="font-medium text-slate-900 dark:text-white">Sagar Singhal</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-slate-700 dark:text-slate-300 font-medium">
                            Initial Contact
                          </td>
                          <td className="p-3.5 font-medium">{formatCurrency(opp.budgetMax || opp.budgetMin || 0)}</td>
                          <td className="p-3.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
                              open
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-400">—</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-[#b58a18] dark:text-[#d4af37] text-[11px] font-bold border border-amber-200 dark:border-amber-800">
                              business partner
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                            Aug 7, 2026<br />11:40 PM
                          </td>
                          <td className="p-3.5 text-slate-500 dark:text-slate-400 text-[11px]">
                            Aug 8, 2026<br />12:26 AM
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Page 1 of 1</span>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select className="appearance-none rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 pr-7 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer">
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                  </div>

                  <button disabled className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-slate-400 font-bold opacity-50 cursor-not-allowed">
                    Previous
                  </button>
                  <button className="w-7 h-7 rounded-lg border border-[#b58a18] text-[#b58a18] font-bold flex items-center justify-center">
                    1
                  </button>
                  <button disabled className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 text-slate-400 font-bold opacity-50 cursor-not-allowed">
                    Next
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* KANBAN BOARD VIEW (Larger Box Size w-80 & Increased Font Sizes) */
            <div className="w-full overflow-x-auto overflow-y-hidden pt-2 pb-24 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex items-start gap-5 min-w-max min-h-[480px]">
                {stages.map((stg) => {
                  const stats = calculateStageStats(stg);
                  const stageLeads = groupedByStage[stg.id] || [];
                  const isHovered = hoveredStageId === stg.id;

                  return (
                    <div
                      key={stg.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, stg.id)}
                      className="w-80 flex flex-col gap-4 shrink-0"
                    >
                      {/* Stage Header Card - Width w-80, Padding p-5, Font text-sm */}
                      <div
                        onMouseEnter={() => setHoveredStageId(stg.id)}
                        onMouseLeave={() => setHoveredStageId(null)}
                        className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[220px]">{stg.name}</h4>
                          <ChevronLeft className="h-4 w-4 text-slate-400 shrink-0" />
                        </div>
                        <div className="flex items-center justify-between mt-2.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                          <span>{stats.count} opportunities</span>
                          <span className="font-black text-slate-900 dark:text-white text-sm">{formatCurrency(stats.unweighted)}</span>
                        </div>

                        {isHovered && (
                          <div
                            className="absolute top-[calc(100%+6px)] left-0 z-50 w-72 rounded-xl p-4 animate-in fade-in duration-150 pointer-events-none shadow-none"
                            style={{ backgroundColor: "#222222", color: "#ffffff" }}
                          >
                            <div
                              className="absolute -top-1.5 left-5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px]"
                              style={{ borderBottomColor: "#222222" }}
                            />

                            <div className="text-xs mb-3" style={{ color: "#ffffff", fontWeight: 700 }}>
                              {stats.count} opportunities
                            </div>

                            <div className="space-y-2 text-[11px]">
                              <div className="flex items-center justify-between">
                                <span style={{ color: "#cbd5e1" }}>Unweighted</span>
                                <span style={{ color: "#ffffff", fontWeight: 700 }}>
                                  {formatCurrency(stats.unweighted)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span style={{ color: "#cbd5e1" }}>Weighted</span>
                                <span style={{ color: "#ffffff", fontWeight: 700 }}>
                                  {formatCurrency(stats.weighted)} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({stats.prob}%)</span>
                                </span>
                              </div>
                            </div>

                            <div className="my-2.5 border-t border-slate-700/80" />

                            <div className="flex items-center justify-between text-[11px]">
                              <span style={{ color: "#cbd5e1" }}>Won</span>
                              <span style={{ color: "#ffffff", fontWeight: 700 }}>
                                {formatCurrency(stats.wonValue)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Lead Cards List */}
                      <div className="space-y-4 min-h-[380px]">
                        {stageLeads.map((opp) => {
                          const isSelected = selectedLeadIds.includes(opp.id);
                          const callsCount = opp.callsCount || (opp.activities || []).filter(a => a.type === 'CALL').length;
                          const messagesCount = opp.messagesCount || (opp.activities || []).filter(a => a.type === 'EMAIL' || a.type === 'SMS').length;
                          const tagsCount = opp.tags ? opp.tags.length : (opp.businessName && opp.businessName !== "Business Partner" ? opp.businessName.split(',').map(t => t.trim()).filter(Boolean).length : 0);
                          const notesCount = opp.notesCount || (opp.activities || []).filter(a => a.type === 'NOTE').length;
                          const tasksCount = opp.tasksCount || (opp.tasks || []).length;
                          const meetingsCount = opp.meetingsCount || (opp.activities || []).filter(a => a.type === 'MEETING').length;

                          return (
                            <div
                              key={opp.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, opp.id)}
                              className={`group rounded-2xl border p-5 shadow-2xs hover:shadow-md transition cursor-grab active:cursor-grabbing space-y-3.5 ${
                                isSelected
                                  ? "bg-amber-50/80 dark:bg-amber-950/40 border-[#b58a18] dark:border-[#b58a18] ring-1 ring-[#b58a18]"
                                  : "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800"
                              }`}
                            >
                              <div
                                onClick={() => openUnifiedModal(opp, "details")}
                                className="flex items-start justify-between gap-2 cursor-pointer"
                              >
                                <h5 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-[#b58a18] transition">
                                  {opp.name}
                                </h5>
                                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                    <UserCheck className="h-4 w-4" />
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleSelectLead(opp.id)}
                                    className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-4 w-4 cursor-pointer"
                                  />
                                </div>
                              </div>

                              <div
                                onClick={() => openUnifiedModal(opp, "details")}
                                className="space-y-2 text-xs pt-1 cursor-pointer"
                              >
                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                  <span className="font-semibold text-slate-600 dark:text-slate-400">Business name:</span>
                                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
                                    {opp.businessName || "Business Partner"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                                  <span className="font-semibold text-slate-600 dark:text-slate-400">Value:</span>
                                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                                    {formatCurrency(opp.budgetMax || opp.budgetMin || 0)}
                                  </span>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-400">
                                {/* 1. Call */}
                                <div className="relative group/btn">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openCallModal(opp); }}
                                    className={`p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition cursor-pointer relative ${
                                      callsCount > 0 ? "text-[#b58a18] dark:text-[#d4af37]" : "hover:text-[#b58a18] text-slate-400"
                                    }`}
                                  >
                                    <Phone className="h-4 w-4" />
                                    {callsCount > 0 && (
                                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
                                        {callsCount}
                                      </span>
                                    )}
                                  </button>
                                  <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 hidden group-hover/btn:flex flex-col items-center pointer-events-none animate-in fade-in duration-100">
                                    <div className="bg-[#222222] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                      Call
                                    </div>
                                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#222222] -mt-px" />
                                  </div>
                                </div>

                                {/* 2. View conversations */}
                                <div className="relative group/btn">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openMessageModal(opp); }}
                                    className={`p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition cursor-pointer relative ${
                                      messagesCount > 0 ? "text-[#b58a18] dark:text-[#d4af37]" : "hover:text-[#b58a18] text-slate-400"
                                    }`}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                    {messagesCount > 0 && (
                                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
                                        {messagesCount}
                                      </span>
                                    )}
                                  </button>
                                  <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 hidden group-hover/btn:flex flex-col items-center pointer-events-none animate-in fade-in duration-100">
                                    <div className="bg-[#222222] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                      View conversations
                                    </div>
                                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#222222] -mt-px" />
                                  </div>
                                </div>

                                {/* 3. Business partners / Tags */}
                                <div className="relative group/btn">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openUnifiedModal(opp, "details"); }}
                                    className={`p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition cursor-pointer relative ${
                                      tagsCount > 0 ? "text-[#b58a18] dark:text-[#d4af37]" : "hover:text-[#b58a18] text-slate-400"
                                    }`}
                                  >
                                    <Tag className="h-4 w-4" />
                                    {tagsCount > 0 && (
                                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
                                        {tagsCount}
                                      </span>
                                    )}
                                  </button>
                                  <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 hidden group-hover/btn:flex flex-col items-center pointer-events-none animate-in fade-in duration-100">
                                    <div className="bg-[#222222] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                      {tagsCount > 0 ? (opp.tags ? opp.tags.join(", ") : opp.businessName?.toLowerCase()) : "business partners"}
                                    </div>
                                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#222222] -mt-px" />
                                  </div>
                                </div>

                                {/* 4. Note Test */}
                                <div className="relative group/btn">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openUnifiedModal(opp, "notes"); }}
                                    className={`p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition cursor-pointer relative ${
                                      notesCount > 0 ? "text-[#b58a18] dark:text-[#d4af37]" : "hover:text-[#b58a18] text-slate-400"
                                    }`}
                                  >
                                    <FileText className="h-4 w-4" />
                                    {notesCount > 0 && (
                                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
                                        {notesCount}
                                      </span>
                                    )}
                                  </button>
                                  <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 hidden group-hover/btn:flex flex-col items-center pointer-events-none animate-in fade-in duration-100">
                                    <div className="bg-[#222222] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                      Note Test
                                    </div>
                                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#222222] -mt-px" />
                                  </div>
                                </div>

                                {/* 5. Add Task */}
                                <div className="relative group/btn">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openUnifiedModal(opp, "tasks"); }}
                                    className={`p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition cursor-pointer relative ${
                                      tasksCount > 0 ? "text-[#b58a18] dark:text-[#d4af37]" : "hover:text-[#b58a18] text-slate-400"
                                    }`}
                                  >
                                    <CheckSquare className="h-4 w-4" />
                                    {tasksCount > 0 && (
                                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
                                        {tasksCount}
                                      </span>
                                    )}
                                  </button>
                                  <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 hidden group-hover/btn:flex flex-col items-center pointer-events-none animate-in fade-in duration-100">
                                    <div className="bg-[#222222] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                      Add Task
                                    </div>
                                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#222222] -mt-px" />
                                  </div>
                                </div>

                                {/* 6. Book Appointment */}
                                <div className="relative group/btn">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); openUnifiedModal(opp, "appointment"); }}
                                    className={`p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-800 transition cursor-pointer relative ${
                                      meetingsCount > 0 ? "text-[#b58a18] dark:text-[#d4af37]" : "hover:text-[#b58a18] text-slate-400"
                                    }`}
                                  >
                                    <Calendar className="h-4 w-4" />
                                    {meetingsCount > 0 && (
                                      <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
                                        {meetingsCount}
                                      </span>
                                    )}
                                  </button>
                                  <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-50 hidden group-hover/btn:flex flex-col items-center pointer-events-none animate-in fade-in duration-100">
                                    <div className="bg-[#222222] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                                      Book Appointment
                                    </div>
                                    <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-[#222222] -mt-px" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-500">
                <Trash2 className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete {selectedLeadIds.length} opportunity?
              </h3>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 font-bold text-xs flex items-center justify-center border border-purple-200 dark:border-purple-800">
                  {selectedLead ? getInitials(selectedLead.name) : "SS"}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Deleted opportunities can be restored within 2 months.
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Type &apos;DELETE&apos; to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== "DELETE"}
                onClick={executeDelete}
                className="rounded-xl bg-red-400 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 text-xs font-bold shadow-xs transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Bulk edit</h3>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingField(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!editingField ? (
              <>
                <div className="relative shrink-0">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={fieldSearch}
                    onChange={(e) => setFieldSearch(e.target.value)}
                    placeholder="Search fields"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Select a field to edit</h4>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white py-1">
                      <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                      <span>Opportunity details</span>
                    </div>

                    <div className="pl-5 space-y-1 text-xs">
                      {[
                        "Pipeline",
                        "Stage",
                        "Status",
                        "Value",
                        "Owner",
                        "Followers",
                        "Source",
                        "Expected close date",
                        "Lost reason",
                        "Business name",
                      ]
                        .filter((f) => !fieldSearch || f.toLowerCase().includes(fieldSearch.toLowerCase()))
                        .map((field) => (
                          <button
                            key={field}
                            type="button"
                            onClick={() => {
                              setEditingField(field);
                              setFieldValue("");
                            }}
                            className="w-full text-left py-1.5 px-2.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-amber-50 hover:text-[#b58a18] dark:hover:bg-slate-800 font-medium transition"
                          >
                            {field}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Editing: <span className="text-[#b58a18]">{editingField}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingField(null)}
                    className="text-xs text-[#b58a18] hover:underline font-bold"
                  >
                    Back to fields
                  </button>
                </div>

                {editingField === "Stage" ? (
                  <select
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#b58a18]"
                  >
                    <option value="">Select Stage</option>
                    {stages.map((stg) => (
                      <option key={stg.id} value={stg.id}>
                        {stg.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={fieldValue}
                    onChange={(e) => setFieldValue(e.target.value)}
                    placeholder={`Enter new ${editingField}`}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#b58a18]"
                  />
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingField(null)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyFieldEdit}
                    className="rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-5 py-2 text-xs shadow-xs transition"
                  >
                    Update
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Status Modal */}
      {showAddStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-[#b58a18]" /> Add New Status Option
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  New statuses will reflect across Pipelines, Opportunities, and Forecasts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddStatusModal(false);
                  setStatusError("");
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {statusError && (
              <p className="p-2.5 rounded-xl bg-red-50 text-red-700 font-bold text-xs border border-red-200">
                {statusError}
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Status Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newStatusInput}
                onChange={(e) => {
                  setNewStatusInput(e.target.value);
                  setStatusError("");
                }}
                placeholder="e.g. On Hold, In Review, Qualified"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#b58a18]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                Current Active Statuses ({statuses.length}):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {statuses.map((st) => (
                  <span
                    key={st}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-[#b58a18] dark:text-[#d4af37] text-xs font-bold border border-amber-200 dark:border-amber-900/60"
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowAddStatusModal(false);
                  setStatusError("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddStatus}
                className="px-5 py-2 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black text-xs shadow-md transition"
              >
                Save Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Opportunity Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col h-[85vh] max-h-[750px]">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Add new opportunity</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Create new opportunity by filling in details and selecting a contact
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
              <div className="w-full md:w-56 bg-slate-50/60 dark:bg-slate-800/40 p-4 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 h-full">
                <div>
                  <button className="w-full text-left px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-[#b58a18] dark:text-[#d4af37] font-bold text-xs">
                    Opportunity details
                  </button>
                </div>
                <div className="pt-4">
                  <button type="button" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#b58a18] dark:text-[#d4af37] hover:underline">
                    <Settings className="h-3.5 w-3.5" />
                    <span>Manage fields</span>
                  </button>
                </div>
              </div>

              <form
                id="create-opportunity-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  createOpportunity();
                }}
                className="flex-1 overflow-y-auto p-6 space-y-6"
              >
                {createError && (
                  <p className="p-3 rounded-xl bg-red-50 text-red-700 font-bold text-xs border border-red-200">
                    {createError}
                  </p>
                )}

                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    Contact details
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Primary contact name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={60}
                        value={createForm.contactName}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 60);
                          setCreateForm({ ...createForm, contactName: val });
                        }}
                        placeholder="Select contact or enter name"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Only alphabets allowed. Max 60 characters.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Primary email
                      </label>
                      <input
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="Enter email (e.g. user@example.com)"
                        className={`w-full rounded-xl border bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18] ${
                          createForm.email.trim() && (!createForm.email.includes("@") || !createForm.email.toLowerCase().includes(".com"))
                            ? "border-red-500 text-red-600 focus:border-red-500"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                      />
                      {createForm.email.trim() && (!createForm.email.includes("@") || !createForm.email.toLowerCase().includes(".com")) ? (
                        <p className="text-[10px] font-bold text-red-500 mt-1">Invalid email address (must contain '@' and '.com')</p>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-1">Must contain '@' and '.com'</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Primary phone
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="w-28 shrink-0 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-[#b58a18] cursor-pointer truncate"
                          title="Select Country Code"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={`${c.country}-${c.code}`} value={c.code}>
                              {c.flag} {c.code} ({c.country})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          maxLength={10}
                          value={createForm.phone}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                            setCreateForm({ ...createForm, phone: digits });
                          }}
                          placeholder="Enter 10-digit phone number"
                          className="flex-1 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Select country code. Max 10 digits allowed.</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Additional contacts (Max: 10)
                        </label>
                        <span className="text-[10px] font-bold text-[#b58a18] dark:text-[#d4af37]">
                          {createForm.additionalContacts.length}/10
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={createContactInput}
                          onChange={(e) => setCreateContactInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = createContactInput.trim();
                              if (!val) return;
                              if (createForm.additionalContacts.length >= 10) {
                                alert("Maximum 10 additional contacts allowed.");
                                return;
                              }
                              if (!createForm.additionalContacts.includes(val)) {
                                setCreateForm({
                                  ...createForm,
                                  additionalContacts: [...createForm.additionalContacts, val],
                                });
                              }
                              setCreateContactInput("");
                            }
                          }}
                          placeholder="Enter contact details (e.g. Name, Phone, Email)"
                          className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = createContactInput.trim();
                            if (!val) return;
                            if (createForm.additionalContacts.length >= 10) {
                              alert("Maximum 10 additional contacts allowed.");
                              return;
                            }
                            if (!createForm.additionalContacts.includes(val)) {
                              setCreateForm({
                                ...createForm,
                                additionalContacts: [...createForm.additionalContacts, val],
                              });
                            }
                            setCreateContactInput("");
                          }}
                          className="px-3.5 py-2 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-bold text-xs shadow-2xs transition shrink-0"
                        >
                          + Add
                        </button>
                      </div>

                      {createForm.additionalContacts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {createForm.additionalContacts.map((contact, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-[#b58a18] dark:text-[#d4af37] text-[11px] font-semibold border border-amber-200 dark:border-amber-900/60"
                            >
                              <span>👤 {contact}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setCreateForm({
                                    ...createForm,
                                    additionalContacts: createForm.additionalContacts.filter((c) => c !== contact),
                                  });
                                }}
                                className="p-0.5 rounded hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 transition"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    Opportunity details
                  </h4>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Opportunity name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={60}
                      value={createForm.oppName}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 60);
                        setCreateForm({ ...createForm, oppName: val });
                      }}
                      placeholder="Enter opportunity name"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Only alphabets allowed. Max 60 characters.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Pipeline
                      </label>
                      <select
                        value={createForm.pipelineId}
                        onChange={(e) => setCreateForm({ ...createForm, pipelineId: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#b58a18]"
                      >
                        {pipelines.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Stage
                      </label>
                      <select
                        value={createForm.stageId}
                        onChange={(e) => setCreateForm({ ...createForm, stageId: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#b58a18]"
                      >
                        {stages.map((stg) => (
                          <option key={stg.id} value={stg.id}>
                            {stg.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Status
                      </label>
                      <select
                        value={createForm.status}
                        onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#b58a18]"
                      >
                        {statuses.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Value
                      </label>
                      <input
                        type="text"
                        value={createForm.value}
                        onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                        placeholder="₹ 0"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Owner
                      </label>
                      <select
                        value={createForm.ownerId}
                        onChange={(e) => setCreateForm({ ...createForm, ownerId: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#b58a18]"
                      >
                        <option value="">Unassigned</option>
                        {agents.map((a, idx) => {
                          const displayEmail = a.email || `${a.name.toLowerCase().replace(/\s+/g, ".")}@realestate.com`;
                          const displayId = a.userId || a.id;
                          return (
                            <option key={`${a.id}-${idx}`} value={a.id}>
                              {a.name} ({displayEmail}) - ID: {displayId}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Followers
                      </label>
                      <input
                        type="text"
                        value={createForm.followers}
                        onChange={(e) => setCreateForm({ ...createForm, followers: e.target.value })}
                        placeholder="Add followers"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Business name
                      </label>
                      <input
                        type="text"
                        maxLength={60}
                        value={createForm.businessName}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 60);
                          setCreateForm({ ...createForm, businessName: val });
                        }}
                        placeholder="Enter business name"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Only alphabets allowed. Max 60 characters.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Source
                      </label>
                      <input
                        type="text"
                        value={createForm.source}
                        onChange={(e) => setCreateForm({ ...createForm, source: e.target.value })}
                        placeholder="Enter source"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Expected Close Date
                      </label>
                      <input
                        type="date"
                        value={createForm.expectedCloseDate}
                        onChange={(e) => setCreateForm({ ...createForm, expectedCloseDate: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#b58a18]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tags
                      </label>
                      <input
                        type="text"
                        value={createForm.tags}
                        onChange={(e) => setCreateForm({ ...createForm, tags: e.target.value })}
                        placeholder="Add tags"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-[#b58a18]"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 shrink-0">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-opportunity-form"
                className="rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-6 py-2.5 text-xs shadow-md transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALL MODAL */}
      {actionModalType === "call" && activeCardActionLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950 text-[#b58a18] flex items-center justify-center font-bold">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Log Call - {activeCardActionLead.name}</h3>
                  <p className="text-xs text-slate-500">{activeCardActionLead.phone || "+91 98100 00000"}</p>
                </div>
              </div>
              <button onClick={() => setActionModalType(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Call Status</label>
                <select
                  value={callStatus}
                  onChange={(e) => setCallStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
                >
                  <option value="Completed">Completed</option>
                  <option value="Left Voicemail">Left Voicemail</option>
                  <option value="Busy">Busy</option>
                  <option value="No Answer">No Answer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Call Notes</label>
                <textarea
                  rows={3}
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Discussed property requirements, site visit interest..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs outline-none focus:border-[#b58a18]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={`tel:${activeCardActionLead.phone || '+919810000000'}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-300 bg-amber-50 text-[#b58a18] text-xs font-bold hover:bg-amber-100 transition"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Call via Phone</span>
              </a>
              <div className="flex items-center gap-2">
                <button onClick={() => setActionModalType(null)} className="px-3 py-2 rounded-xl border text-xs font-bold">
                  Cancel
                </button>
                <button onClick={submitCallLog} className="px-4 py-2 rounded-xl bg-[#b58a18] text-slate-950 font-black text-xs shadow-md">
                  Log Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE MODAL */}
      {actionModalType === "message" && activeCardActionLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950 text-[#b58a18] flex items-center justify-center font-bold">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Send Message - {activeCardActionLead.name}</h3>
                  <p className="text-xs text-slate-500">{activeCardActionLead.email}</p>
                </div>
              </div>
              <button onClick={() => setActionModalType(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-800 text-xs font-bold">
              {(["WhatsApp", "SMS", "Email"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setMessageChannel(ch)}
                  className={`flex-1 py-1.5 rounded-lg text-center transition ${
                    messageChannel === ch ? "bg-[#b58a18] text-slate-950 font-black shadow-2xs" : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Quick Presets</label>
                <select
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
                >
                  <option value="">Select quick preset...</option>
                  <option value={`Hi ${activeCardActionLead.name}, thank you for reaching out regarding real estate opportunities.`}>
                    Initial Inquiry Greeting
                  </option>
                  <option value={`Hi ${activeCardActionLead.name}, would you like to schedule a site visit this weekend?`}>
                    Site Visit Invitation
                  </option>
                  <option value={`Hi ${activeCardActionLead.name}, sharing the brochure and detailed floor plans for your review.`}>
                    Share Pricing & Brochure
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs outline-none focus:border-[#b58a18]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button onClick={() => setActionModalType(null)} className="px-3 py-2 rounded-xl border text-xs font-bold">
                Cancel
              </button>
              <button onClick={submitSendMessage} className="px-5 py-2 rounded-xl bg-[#b58a18] text-slate-950 font-black text-xs shadow-md">
                {messageChannel === "WhatsApp" ? "Open WhatsApp" : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED MULTI-TAB EDIT OPPORTUNITY MODAL */}
      {actionModalType === "unifiedEdit" && activeCardActionLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-5xl h-[85vh] max-h-[750px] rounded-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Edit &quot;{editLeadForm.businessName || editLeadForm.name || "partnership"}&quot;
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add and edit opportunity details, tasks, notes and appointments.
                </p>
              </div>
              <button
                onClick={() => setActionModalType(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main Content Split Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar Menu */}
              <div className="w-64 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 flex flex-col justify-between shrink-0">
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveEditTab("details")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                      activeEditTab === "details"
                        ? "bg-amber-100/80 dark:bg-amber-950/60 text-[#b58a18] dark:text-[#d4af37] font-bold border border-amber-300/70 dark:border-amber-800/60"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Opportunity details
                  </button>
                  <button
                    onClick={() => setActiveEditTab("appointment")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                      activeEditTab === "appointment"
                        ? "bg-amber-100/80 dark:bg-amber-950/60 text-[#b58a18] dark:text-[#d4af37] font-bold border border-amber-300/70 dark:border-amber-800/60"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Book or update appointment
                  </button>
                  <button
                    onClick={() => setActiveEditTab("tasks")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                      activeEditTab === "tasks"
                        ? "bg-amber-100/80 dark:bg-amber-950/60 text-[#b58a18] dark:text-[#d4af37] font-bold border border-amber-300/70 dark:border-amber-800/60"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setActiveEditTab("notes")}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                      activeEditTab === "notes"
                        ? "bg-amber-100/80 dark:bg-amber-950/60 text-[#b58a18] dark:text-[#d4af37] font-bold border border-amber-300/70 dark:border-amber-800/60"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Notes
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button"
                    className="text-xs text-[#b58a18] dark:text-[#d4af37] font-bold flex items-center gap-1.5 hover:underline cursor-pointer"
                  >
                    <Settings className="h-3.5 w-3.5" /> Manage fields
                  </button>
                </div>
              </div>

              {/* Right Main Content */}
              <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
                {/* TAB 1: Opportunity details */}
                {activeEditTab === "details" && (
                  <div className="space-y-6 max-w-3xl">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Contact details <UserCheck className="h-4 w-4 text-slate-400" />
                      </h3>
                      <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hideEmptyFields}
                          onChange={(e) => setHideEmptyFields(e.target.checked)}
                          className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-3.5 w-3.5"
                        />
                        Hide empty fields
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          Primary contact name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={editLeadForm.name}
                          onChange={(e) => setEditLeadForm({ ...editLeadForm, name: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#b58a18]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          Primary email
                        </label>
                        <input
                          type="email"
                          value={editLeadForm.email}
                          onChange={(e) => setEditLeadForm({ ...editLeadForm, email: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#b58a18]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                          Primary phone
                        </label>
                        <input
                          type="text"
                          value={editLeadForm.phone}
                          onChange={(e) => setEditLeadForm({ ...editLeadForm, phone: e.target.value })}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#b58a18]"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold">
                            Additional contacts (Max: 10)
                          </label>
                          <span className="text-[10px] font-bold text-[#b58a18] dark:text-[#d4af37]">
                            {editLeadForm.additionalContacts.length}/10
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editContactInput}
                            onChange={(e) => setEditContactInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                const val = editContactInput.trim();
                                if (!val) return;
                                if (editLeadForm.additionalContacts.length >= 10) {
                                  alert("Maximum 10 additional contacts allowed.");
                                  return;
                                }
                                if (!editLeadForm.additionalContacts.includes(val)) {
                                  setEditLeadForm({
                                    ...editLeadForm,
                                    additionalContacts: [...editLeadForm.additionalContacts, val],
                                  });
                                }
                                setEditContactInput("");
                              }
                            }}
                            placeholder="Enter contact details (e.g. Name, Phone, Email)"
                            className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-[#b58a18]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = editContactInput.trim();
                              if (!val) return;
                              if (editLeadForm.additionalContacts.length >= 10) {
                                alert("Maximum 10 additional contacts allowed.");
                                return;
                              }
                              if (!editLeadForm.additionalContacts.includes(val)) {
                                setEditLeadForm({
                                  ...editLeadForm,
                                  additionalContacts: [...editLeadForm.additionalContacts, val],
                                });
                              }
                              setEditContactInput("");
                            }}
                            className="px-3.5 py-2 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-bold text-xs shadow-2xs transition shrink-0"
                          >
                            + Add
                          </button>
                        </div>

                        {editLeadForm.additionalContacts.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {editLeadForm.additionalContacts.map((contact, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-[#b58a18] dark:text-[#d4af37] text-[11px] font-semibold border border-amber-200 dark:border-amber-900/60"
                              >
                                <span>👤 {contact}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditLeadForm({
                                      ...editLeadForm,
                                      additionalContacts: editLeadForm.additionalContacts.filter((c) => c !== contact),
                                    });
                                  }}
                                  className="p-0.5 rounded hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 transition"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Opportunity details</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="md:col-span-2">
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                            Opportunity name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            maxLength={60}
                            value={editLeadForm.businessName || editLeadForm.name}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^a-zA-Z\s]/g, "").slice(0, 60);
                              setEditLeadForm({ ...editLeadForm, businessName: val });
                            }}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#b58a18]"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Pipeline</label>
                          <select
                            value={editLeadForm.pipelineId}
                            onChange={(e) => setEditLeadForm({ ...editLeadForm, pipelineId: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#b58a18]"
                          >
                            {pipelines.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Stage</label>
                          <select
                            value={editLeadForm.stageId}
                            onChange={(e) => setEditLeadForm({ ...editLeadForm, stageId: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#b58a18]"
                          >
                            {stages.map((s: PipelineStage) => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Status</label>
                          <select
                            value={editLeadForm.status}
                            onChange={(e) => setEditLeadForm({ ...editLeadForm, status: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#b58a18]"
                          >
                            {statuses.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Value</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-[#b58a18] font-bold">₹</span>
                            <input
                              type="number"
                              value={editLeadForm.value}
                              onChange={(e) => setEditLeadForm({ ...editLeadForm, value: e.target.value })}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#b58a18] font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Owner</label>
                          <select
                            value={editLeadForm.ownerId}
                            onChange={(e) => setEditLeadForm({ ...editLeadForm, ownerId: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#b58a18]"
                          >
                            <option value="">Unassigned</option>
                            {agents.map((a, idx) => {
                              const displayEmail = a.email || `${a.name.toLowerCase().replace(/\s+/g, ".")}@realestate.com`;
                              const displayId = a.userId || a.id;
                              return (
                                <option key={`${a.id}-${idx}`} value={a.id}>
                                  {a.name} ({displayEmail}) - ID: {displayId}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Followers</label>
                          <select className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-500 focus:outline-none focus:border-[#b58a18]">
                            <option>Add followers</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Business name</label>
                          <input
                            type="text"
                            value={editLeadForm.businessName}
                            onChange={(e) => setEditLeadForm({ ...editLeadForm, businessName: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#b58a18]"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Source</label>
                          <input
                            type="text"
                            value={editLeadForm.source}
                            onChange={(e) => setEditLeadForm({ ...editLeadForm, source: e.target.value })}
                            placeholder="Enter source"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#b58a18]"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Expected Close Date</label>
                          <input
                            type="date"
                            value={editLeadForm.expectedCloseDate}
                            onChange={(e) => setEditLeadForm({ ...editLeadForm, expectedCloseDate: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-[#b58a18]"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">Tags</label>
                          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 min-h-[42px]">
                            {leadTags.map((t) => (
                              <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-[#b58a18] dark:text-[#d4af37] text-xs font-bold border border-amber-300/60">
                                {t}
                                <button onClick={() => setLeadTags(leadTags.filter(tag => tag !== t))} className="hover:text-red-500 cursor-pointer">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                            <input
                              type="text"
                              placeholder={leadTags.length === 0 ? "Add tags..." : ""}
                              value={newTagInput}
                              onChange={(e) => setNewTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && newTagInput.trim()) {
                                  e.preventDefault();
                                  if (!leadTags.includes(newTagInput.trim())) setLeadTags([...leadTags, newTagInput.trim()]);
                                  setNewTagInput("");
                                }
                              }}
                              className="flex-1 bg-transparent border-none outline-none text-xs text-slate-900 dark:text-white min-w-[80px]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Book or update appointment */}
                {activeEditTab === "appointment" && (
                  <div className="h-full flex flex-col justify-center items-center py-6">
                    {!showAppointmentForm && leadAppointmentsList.length === 0 ? (
                      <div className="text-center space-y-4 py-8 max-w-sm">
                        <div className="w-24 h-24 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center mx-auto text-[#b58a18]">
                          <Calendar className="w-12 h-12" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Appointments!</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            It looks like you don&apos;t have any appointments scheduled. Would you like to set one up?
                          </p>
                        </div>
                        <button
                          onClick={() => setShowAppointmentForm(true)}
                          className="rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black px-5 py-2.5 text-xs shadow-md transition inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="h-4 w-4" /> New appointment
                        </button>
                      </div>
                    ) : (
                      <div className="w-full max-w-lg space-y-4 text-xs">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Schedule Appointment</h3>
                          <button onClick={() => setShowAppointmentForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-4 w-4" /></button>
                        </div>
                        <div>
                          <label className="block text-slate-600 font-semibold mb-1">Appointment Title</label>
                          <input
                            type="text"
                            value={meetingTitleInput}
                            onChange={(e) => setMeetingTitleInput(e.target.value)}
                            className="w-full rounded-xl border p-2.5 text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Date</label>
                            <input
                              type="date"
                              value={meetingDateInput}
                              onChange={(e) => setMeetingDateInput(e.target.value)}
                              className="w-full rounded-xl border p-2.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 font-semibold mb-1">Time</label>
                            <input
                              type="time"
                              value={meetingTimeInput}
                              onChange={(e) => setMeetingTimeInput(e.target.value)}
                              className="w-full rounded-xl border p-2.5 text-xs"
                            />
                          </div>
                        </div>
                        <button
                          onClick={submitScheduleMeetingInModal}
                          className="w-full py-2.5 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black text-xs shadow-md cursor-pointer"
                        >
                          Save Appointment
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Tasks */}
                {activeEditTab === "tasks" && (
                  <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Tasks</h3>
                      <div className="flex items-center gap-2 text-slate-400">
                        <button className="p-1.5 hover:text-slate-600 cursor-pointer"><Filter className="h-4 w-4" /></button>
                        <button className="p-1.5 hover:text-slate-600 cursor-pointer"><ArrowUpDown className="h-4 w-4" /></button>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowTaskForm(!showTaskForm)}
                      className="w-full py-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#b58a18] dark:text-[#d4af37] font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-100/80 transition cursor-pointer border border-amber-200/50"
                    >
                      <Plus className="h-4 w-4" /> Add task
                    </button>

                    <div className="relative">
                      <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by title"
                        value={searchTaskText}
                        onChange={(e) => setSearchTaskText(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800"
                      />
                    </div>

                    {showTaskForm && (
                      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-slate-800 space-y-3 text-xs">
                        <input
                          type="text"
                          placeholder="Enter task title..."
                          value={taskTitleInput}
                          onChange={(e) => setTaskTitleInput(e.target.value)}
                          className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 text-xs"
                        />
                        <div className="flex items-center justify-between">
                          <input
                            type="date"
                            value={taskDueDateInput}
                            onChange={(e) => setTaskDueDateInput(e.target.value)}
                            className="p-2 rounded-xl border text-xs"
                          />
                          <button
                            onClick={submitAddTaskInModal}
                            className="px-4 py-2 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black text-xs shadow-md cursor-pointer"
                          >
                            Save Task
                          </button>
                        </div>
                      </div>
                    )}

                    {leadTasksList.length === 0 ? (
                      <div className="py-12 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-amber-100/80 dark:bg-amber-950/60 text-[#b58a18] flex items-center justify-center mx-auto">
                          <CheckSquare className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">No tasks yet</h4>
                          <p className="text-xs text-slate-400">No tasks found</p>
                        </div>
                        <button
                          onClick={() => setShowTaskForm(true)}
                          className="px-4 py-2 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black text-xs shadow-md cursor-pointer"
                        >
                          + Add task
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {leadTasksList.map((t) => (
                          <div key={t.id} className="p-3.5 rounded-xl border flex items-center justify-between text-xs">
                            <span className="font-semibold">{t.title}</span>
                            <span className="text-slate-400">{t.dueAt || "No due date"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: Notes */}
                {activeEditTab === "notes" && (
                  <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Notes</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-slate-400">
                          <button className="p-1.5 hover:text-slate-600 cursor-pointer"><Filter className="h-4 w-4" /></button>
                          <button className="p-1.5 hover:text-slate-600 cursor-pointer"><ArrowUpDown className="h-4 w-4" /></button>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search notes"
                            value={searchNoteText}
                            onChange={(e) => setSearchNoteText(e.target.value)}
                            className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowNoteForm(!showNoteForm)}
                      className="w-full py-3 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#b58a18] dark:text-[#d4af37] font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-100/80 transition cursor-pointer border border-amber-200/50"
                    >
                      <Plus className="h-4 w-4" /> Add note
                    </button>

                    {showNoteForm && (
                      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-slate-800 space-y-3 text-xs">
                        <textarea
                          rows={3}
                          placeholder="Enter note text..."
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-900 text-xs focus:border-[#b58a18] focus:outline-none"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={submitAddNoteInModal}
                            className="px-4 py-2 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black text-xs shadow-md cursor-pointer"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    )}

                    {leadNotesList.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-400">
                        No notes recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {leadNotesList.map((n) => (
                          <div key={n.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shadow-2xs">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{n.text}</p>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>{n.date} | Created by: {n.author}</span>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-[#b58a18] dark:text-[#d4af37] font-bold text-[10px]">
                                  🔀 2
                                </span>
                                <button className="text-slate-400 hover:text-slate-600 cursor-pointer"><MoreVertical className="h-4 w-4" /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div>
                {/* Strictly NO created by / created on / audit log as requested */}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (activeCardActionLead) deleteOpportunity(activeCardActionLead.id);
                  }}
                  className="p-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
                  title="Delete Opportunity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActionModalType(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={submitSaveUnifiedModal}
                  className="px-6 py-2.5 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMIZE CARD MODAL (MANAGE FIELDS) - MATCHING VIDEO SPECIFICATIONS */}
      {showCustomizeCardModal && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-[520px] max-w-full h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-250">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Customize card</h2>
              <button
                type="button"
                onClick={() => setShowCustomizeCardModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Card Preview Box */}
              <div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5">Card preview</div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 p-5 space-y-3 relative shadow-2xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Opportunity name</h4>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                        Stale
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold text-[10px] flex items-center justify-center">
                        JD
                      </div>
                      <input type="checkbox" className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-4 w-4 cursor-pointer" />
                    </div>
                  </div>

                  {/* Card Field Items based on ordered cardFieldsList and layout mode */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 pt-1">
                    {cardLayoutMode === "Default" && (
                      <>
                        {cardFieldsList.filter(f => f.key !== "name" && f.enabled).map(f => {
                          if (f.key === "businessName") return <div key={f.key} className="flex justify-between"><span className="font-medium">Business name:</span><span className="font-bold text-slate-900 dark:text-white">Tech Innovators Inc.</span></div>;
                          if (f.key === "owner") return <div key={f.key} className="flex justify-between"><span className="font-medium">Owner:</span><span className="font-bold text-slate-900 dark:text-white">Sagar Singhal</span></div>;
                          if (f.key === "source") return <div key={f.key} className="flex justify-between"><span className="font-medium">Source:</span><span className="font-bold text-slate-900 dark:text-white">Referral</span></div>;
                          if (f.key === "value") return <div key={f.key} className="flex justify-between"><span className="font-medium">Value:</span><span className="font-bold text-slate-900 dark:text-white">₹50,000.00</span></div>;
                          if (f.key === "lostReason") return <div key={f.key} className="flex justify-between"><span className="font-medium">Lost reason:</span><span className="font-bold text-slate-900 dark:text-white">Budget Constraints</span></div>;
                          if (f.key === "smartTags") return <div key={f.key} className="flex justify-between"><span className="font-medium">Smart tags:</span><span className="font-bold text-slate-900 dark:text-white">VIP Partner</span></div>;
                          return null;
                        })}
                      </>
                    )}

                    {cardLayoutMode === "Compact" && (
                      <div className="text-xs text-slate-500 space-x-2">
                        {cardFieldsList.filter(f => f.key !== "name" && f.enabled).map(f => {
                          if (f.key === "businessName") return <span key={f.key}>Tech Innovators Inc.</span>;
                          if (f.key === "source") return <span key={f.key}>Referral</span>;
                          if (f.key === "value") return <span key={f.key} className="font-bold text-slate-900 dark:text-white">₹50,000.00</span>;
                          return null;
                        })}
                      </div>
                    )}

                    {cardLayoutMode === "Unlabeled" && (
                      <div className="space-y-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {cardFieldsList.filter(f => f.key !== "name" && f.enabled).map(f => {
                          if (f.key === "businessName") return <div key={f.key}>Tech Innovators Inc.</div>;
                          if (f.key === "source") return <div key={f.key}>Referral</div>;
                          if (f.key === "value") return <div key={f.key} className="font-bold text-slate-900 dark:text-white">₹50,000.00</div>;
                          if (f.key === "lostReason") return <div key={f.key} className="text-slate-500">Budget Constraints</div>;
                          return null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quick Action Icons Preview Row (Dynamically ordered by quickActionsList) */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 text-slate-400 text-xs">
                    {quickActionsList.filter(a => a.enabled).map(act => {
                      if (act.key === "call") return (
                        <button key={act.key} type="button" className="hover:text-slate-700 relative p-1 cursor-pointer" title="Call">
                          <Phone className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </button>
                      );
                      if (act.key === "conversations") return (
                        <button key={act.key} type="button" className="hover:text-slate-700 relative p-1 cursor-pointer" title="View conversations">
                          <MessageSquare className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                          <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center">1</span>
                        </button>
                      );
                      if (act.key === "tags") return (
                        <button key={act.key} type="button" className="hover:text-slate-700 relative p-1 cursor-pointer" title="Tags">
                          <Tag className="h-4 w-4 text-[#b58a18]" />
                          <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#b58a18] text-slate-950 text-[9px] font-black flex items-center justify-center">2</span>
                        </button>
                      );
                      if (act.key === "notes") return (
                        <button key={act.key} type="button" className="hover:text-slate-700 relative p-1 cursor-pointer" title="Notes">
                          <FileText className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </button>
                      );
                      if (act.key === "tasks") return (
                        <button key={act.key} type="button" className="hover:text-slate-700 relative p-1 cursor-pointer" title="Tasks">
                          <CheckSquare className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                        </button>
                      );
                      if (act.key === "appointment") return (
                        <button key={act.key} type="button" className="hover:text-slate-700 relative p-1 cursor-pointer" title="Next confirmed appointment">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 border border-amber-200 dark:border-amber-800">
                            <Calendar className="h-3 w-3" /> Sep 6th, 12:30 am
                          </span>
                        </button>
                      );
                      return null;
                    })}
                  </div>
                </div>
              </div>

              {/* Card Layout Radio Options */}
              <div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2.5">Card layout</div>
                <div className="flex items-center gap-6">
                  {(["Default", "Compact", "Unlabeled"] as const).map((mode) => (
                    <label key={mode} className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                      <input
                        type="radio"
                        name="cardLayoutMode"
                        checked={cardLayoutMode === mode}
                        onChange={() => setCardLayoutMode(mode)}
                        className="text-[#b58a18] focus:ring-[#b58a18] cursor-pointer"
                      />
                      <span>{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tabs: Fields vs Quick Actions */}
              <div className="border-b border-slate-200 dark:border-slate-800 flex items-center gap-6 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCustomizeCardTab("fields")}
                  className={`pb-2 transition ${
                    customizeCardTab === "fields"
                      ? "border-b-2 border-[#b58a18] text-[#b58a18] dark:border-[#d4af37] dark:text-[#d4af37] font-extrabold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  Fields ({cardFieldsList.filter(f => f.enabled).length} out of {cardFieldsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCustomizeCardTab("quickActions")}
                  className={`pb-2 transition ${
                    customizeCardTab === "quickActions"
                      ? "border-b-2 border-[#b58a18] text-[#b58a18] dark:border-[#d4af37] dark:text-[#d4af37] font-extrabold"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  Quick actions
                </button>
              </div>

              {/* Tab 1 Content: Fields list with Drag and Drop */}
              {customizeCardTab === "fields" && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search fields"
                      value={customizeCardSearch}
                      onChange={(e) => setCustomizeCardSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs outline-none focus:border-[#b58a18] bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div className="space-y-2.5">
                    {filteredCardFields.map((f, index) => {
                      const isDragging = draggedFieldIndex === index;
                      const isOver = dragOverFieldIndex === index;

                      return (
                        <div
                          key={f.key}
                          draggable={!f.locked}
                          onDragStart={(e) => {
                            if (f.locked) return;
                            e.dataTransfer.setData("text/plain", index.toString());
                            setDraggedFieldIndex(index);
                          }}
                          onDragOver={(e) => {
                            if (f.locked) return;
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            setDragOverFieldIndex(index);
                          }}
                          onDragLeave={() => {
                            if (dragOverFieldIndex === index) setDragOverFieldIndex(null);
                          }}
                          onDrop={(e) => {
                            if (f.locked) return;
                            e.preventDefault();
                            handleDropField(index);
                          }}
                          className={`flex items-center justify-between p-2.5 rounded-xl transition text-xs select-none ${
                            f.locked
                              ? "bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 text-slate-400"
                              : "hover:bg-amber-50/50 dark:hover:bg-slate-800/60 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-grab active:cursor-grabbing"
                          } ${isDragging ? "opacity-30 scale-[0.98]" : ""} ${
                            isOver ? "border-2 border-[#b58a18] bg-amber-50/80 dark:bg-amber-950/40" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className={`h-4 w-4 shrink-0 ${f.locked ? "text-slate-300" : "text-slate-400 hover:text-slate-700 dark:hover:text-white"}`} />
                            <input
                              type="checkbox"
                              checked={f.enabled}
                              disabled={f.locked}
                              onChange={(e) => {
                                setCardFieldsList((prev) =>
                                  prev.map((item) => (item.key === f.key ? { ...item, enabled: e.target.checked } : item))
                                );
                              }}
                              className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <span className="font-bold text-slate-800 dark:text-slate-200">{f.label}</span>
                            {f.badge && (
                              <span className="px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-[#b58a18] dark:text-[#d4af37] text-[9px] font-bold border border-amber-200 dark:border-amber-800">
                                {f.badge}
                              </span>
                            )}
                          </div>

                          {f.locked ? (
                            <LockIcon className="h-3.5 w-3.5 text-slate-400" />
                          ) : (
                            f.isLink && (
                              <span className="text-[#b58a18] dark:text-[#d4af37] font-bold text-xs hover:underline cursor-pointer flex items-center gap-1">
                                Create <ExternalLink className="h-3 w-3" />
                              </span>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Accordion Sections for Adding Fields */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">Add fields</div>
                    <details className="group border-b border-slate-100 dark:border-slate-800 pb-2">
                      <summary className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer list-none">
                        <span>Other details</span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-open:rotate-180 transition" />
                      </summary>
                      <div className="pl-6 pt-2 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                        {["Created on (IST)", "Updated on (IST)", "Last status change date (IST)", "Days since last stage change (IST)"].map((lbl) => (
                          <label key={lbl} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-3.5 w-3.5" />
                            <span>{lbl}</span>
                          </label>
                        ))}
                      </div>
                    </details>

                    <details className="group border-b border-slate-100 dark:border-slate-800 pb-2">
                      <summary className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer list-none">
                        <span>Primary contact details</span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-open:rotate-180 transition" />
                      </summary>
                      <div className="pl-6 pt-2 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                        {["Contact", "Next task due date (IST)", "Engagement score", "Contact's email", "Contact's phone"].map((lbl) => (
                          <label key={lbl} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-3.5 w-3.5" />
                            <span>{lbl}</span>
                          </label>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
              )}

              {/* Tab 2 Content: Quick actions list with Drag and Drop */}
              {customizeCardTab === "quickActions" && (
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs">
                    <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>Count for each action will be shown in the card wherever applicable.</span>
                  </div>

                  <div className="space-y-2">
                    {quickActionsList.map((act, index) => {
                      const isDragging = draggedActionIndex === index;
                      const isOver = dragOverActionIndex === index;
                      const IconComp =
                        act.key === "call"
                          ? Phone
                          : act.key === "tags"
                          ? Tag
                          : act.key === "conversations"
                          ? MessageSquare
                          : act.key === "notes"
                          ? FileText
                          : act.key === "tasks"
                          ? CheckSquare
                          : Calendar;

                      return (
                        <div
                          key={act.key}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", index.toString());
                            setDraggedActionIndex(index);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                            setDragOverActionIndex(index);
                          }}
                          onDragLeave={() => {
                            if (dragOverActionIndex === index) setDragOverActionIndex(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleDropAction(index);
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl transition text-xs select-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-grab active:cursor-grabbing ${
                            isDragging ? "opacity-30 scale-[0.98]" : ""
                          } ${
                            isOver ? "border-2 border-[#b58a18] bg-amber-50/80 dark:bg-amber-950/40" : "hover:bg-amber-50/50 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-grab shrink-0" />
                            <input
                              type="checkbox"
                              checked={act.enabled}
                              onChange={(e) =>
                                setQuickActionsList((prev) =>
                                  prev.map((item) => (item.key === act.key ? { ...item, enabled: e.target.checked } : item))
                                )
                              }
                              className="rounded border-slate-300 text-[#b58a18] focus:ring-[#b58a18] h-4 w-4 cursor-pointer"
                            />
                            <span className="font-bold text-slate-800 dark:text-slate-200">{act.label}</span>
                          </div>
                          <IconComp className="h-4 w-4 text-slate-500" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setShowCustomizeCardModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowCustomizeCardModal(false)}
                className="px-6 py-2.5 rounded-xl bg-[#b58a18] hover:bg-[#9e7713] text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
