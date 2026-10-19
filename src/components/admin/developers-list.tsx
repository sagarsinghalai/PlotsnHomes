"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit3, Trash2, X, Loader2, Check, ExternalLink, ShieldCheck, MapPin, Briefcase, MessageSquare, ClipboardList, Calendar, AlertTriangle, ChevronRight, Clock, Flag, CheckCircle2, Circle, ArrowRight, FolderKanban } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseStoredPhone } from "@/lib/phone-utils";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";
import { CountrySelect } from "@/components/ui/country-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { GlobalStateSelect, GlobalCitySelect, GlobalZipSelect, validatePostalCode } from "@/components/ui/location-select";
import { State } from "country-state-city";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { useHorizontalScroll } from "@/hooks/use-horizontal-scroll";
import { TableScrollButtons } from "@/components/ui/table-scroll-buttons";

type Developer = {
  id: string;
  name: string;
  projectCount: number;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string;
  experienceYears: number | null;
  identityType: string | null;
  identityNumber: string | null;
  website: string | null;
  description: string | null;
  createdAt: Date | string;
};

type DevTask = {
  id: string;
  developerId: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  deadline: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const PRIORITY_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  LOW: { label: "Low", color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200" },
  MEDIUM: { label: "Medium", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  HIGH: { label: "High", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  URGENT: { label: "Urgent", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: typeof Circle }> = {
  TODO: { label: "To Do", color: "text-slate-500", bg: "bg-slate-100", icon: Circle },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-600", bg: "bg-blue-100", icon: Clock },
  DONE: { label: "Done", color: "text-emerald-600", bg: "bg-emerald-100", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "text-red-500", bg: "bg-red-100", icon: X },
};

const STATUS_FLOW: Record<string, string> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "TODO",
  CANCELLED: "TODO",
};

export function DevelopersList({ initialDevelopers }: { initialDevelopers: Developer[] }) {
  const router = useRouter();
  const { permissions, userGroup, hasAddPermission, hasEditPermission, hasDeletePermission } = useAdminPermissions();
  const canAdd = hasAddPermission("/admin/developers");
  const canEdit = hasEditPermission("/admin/developers");
  const canDelete = hasDeletePermission("/admin/developers");

  const devPerms = (permissions?.[userGroup]?.developers as any) || {};
  const canSendMessage = devPerms.sendMessage ?? true;
  const canManageProjects = devPerms.manageProjects ?? true;
  const canManageTasks = devPerms.manageTasks ?? true;
  const [developers, setDevelopers] = useState<Developer[]>(initialDevelopers);
  
  // Modal / Form state
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "identity" | "location">("general");
  const [selectedDeveloper, setSelectedDeveloper] = useState<Developer | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [projectCount, setProjectCount] = useState(0);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("IN");
  const [experienceYears, setExperienceYears] = useState<number | "">("");
  const [identityType, setIdentityType] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ─── Task Panel state ─────────────────────────
  const [taskDev, setTaskDev] = useState<Developer | null>(null);
  const [tasks, setTasks] = useState<DevTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [newDeadline, setNewDeadline] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  }

  function openCreateModal() {
    setSelectedDeveloper(null);
    setName("");
    setProjectCount(0);
    setEmail("");
    setPhone("");
    setAddress("");
    setCity("");
    setState("");
    setStateCode("");
    setZip("");
    setCountry("IN");
    setExperienceYears("");
    setIdentityType("RERA Registration");
    setIdentityNumber("");
    setWebsite("");
    setDescription("");
    setError("");
    setActiveTab("general");
    setIsOpen(true);
  }

  function openEditModal(dev: Developer) {
    const getInitialStateCode = (country: string, stateName: string) => {
      if (!stateName) return "";
      const states = State.getStatesOfCountry(country);
      const found = states.find((s) => s.name === stateName);
      return found ? found.isoCode : "";
    };

    setSelectedDeveloper(dev);
    setName(dev.name);
    setProjectCount(dev.projectCount);
    setEmail(dev.email || "");
    setPhone(dev.phone || "");
    setAddress(dev.address || "");
    setCity(dev.city || "");
    setState(dev.state || "");
    setStateCode(getInitialStateCode(dev.country || "IN", dev.state || ""));
    setZip(dev.zip || "");
    setCountry(dev.country || "IN");
    setExperienceYears(dev.experienceYears !== null ? dev.experienceYears : "");
    setIdentityType(dev.identityType || "RERA Registration");
    setIdentityNumber(dev.identityNumber || "");
    setWebsite(dev.website || "");
    setDescription(dev.description || "");
    setError("");
    setActiveTab("general");
    setIsOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Developer name is required");
      return;
    }
    
    setLoading(true);
    setError("");

    // Frontend validations
    const alphaOnly = /^[a-zA-Z\s]+$/;
    
    if (name && !alphaOnly.test(name)) {
      setError("Name must contain only alphabets.");
      setLoading(false);
      return;
    }

    const nameWords = name.trim().split(/\s+/).filter((w: string) => w.length > 0);
    if (nameWords.length > 30) {
      setError(`Developer Name cannot exceed 30 words (currently ${nameWords.length}).`);
      setLoading(false);
      return;
    }

    if (email.trim()) {
      if (!email.trim().includes("@")) {
        setError("Email address must contain '@'.");
        setLoading(false);
        return;
      }
      if (!/.+@.+\..+/.test(email.trim())) {
        setError("Please enter a valid email address (e.g. contact@developer.com).");
        setLoading(false);
        return;
      }
    }

    if (phone.trim()) {
      const parsed = parseStoredPhone(phone);
      if (parsed.national.length !== 10) {
        setError("Phone number must contain exactly 10 digits.");
        setLoading(false);
        return;
      }
    }
    
    if (address.trim() && /^\d+$/.test(address.trim())) {
      setError("Street address cannot contain only numbers.");
      setLoading(false);
      return;
    }

    const zipError = validatePostalCode(zip, country);
    if (zipError) {
      setError(zipError);
      setLoading(false);
      return;
    }

    if (identityType && identityNumber.trim()) {
      const idNum = identityNumber.trim();
      if (identityType === "PAN") {
        const panRegex = /^[A-Z]{5}\d{4}[A-Z]{1}$/i;
        if (!panRegex.test(idNum)) {
          setError("PAN Card must be in the format XXXXX1234X.");
          setLoading(false);
          return;
        }
      } else if (identityType === "GSTIN") {
        const gstinRegex = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/i;
        if (!gstinRegex.test(idNum)) {
          setError("Invalid GSTIN format.");
          setLoading(false);
          return;
        }
      } else if (identityType === "Corporate Identity Number (CIN)") {
        if (idNum.length !== 21) {
          setError("CIN must be exactly 21 characters.");
          setLoading(false);
          return;
        }
      }
    }
    
    if (country.trim() && !alphaOnly.test(country)) {
      setError("Country must contain only alphabets.");
      setLoading(false);
      return;
    }

    const payload = {
      name: name.trim(),
      projectCount,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      zip: zip.trim() || null,
      country,
      experienceYears: experienceYears === "" ? null : Number(experienceYears),
      identityType: identityType.trim() || null,
      identityNumber: identityNumber.trim() || null,
      website: website.trim() || null,
      description: description.trim() || null,
    };

    try {
      const url = selectedDeveloper 
        ? `/api/admin/developers/${selectedDeveloper.id}`
        : "/api/admin/developers";
        
      const res = await fetch(url, {
        method: selectedDeveloper ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        window.location.href = "/login?error=SessionExpired";
        return;
      }
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to save developer details");

      if (selectedDeveloper) {
        setDevelopers((prev) =>
          prev
            .map((d) => (d.id === selectedDeveloper.id ? data.developer : d))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
        showSuccess("Developer details updated successfully!");
      } else {
        setDevelopers((prev) =>
          [...prev, data.developer].sort((a, b) => a.name.localeCompare(b.name))
        );
        showSuccess("New developer registered successfully!");
      }
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to permanently delete developer "${name}"?\nAll associated details will be removed.`)) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/developers/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete developer");

      setDevelopers((prev) => prev.filter((d) => d.id !== id));
      showSuccess("Developer deleted successfully!");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ─── Task Functions ─────────────────────────

  const fetchTasks = useCallback(async (devId: string) => {
    setTasksLoading(true);
    setTaskError("");
    try {
      const res = await fetch(`/api/admin/developers/${devId}/tasks`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load tasks");
      setTasks(data.tasks ?? []);
    } catch (err: any) {
      setTaskError(err.message);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  function openTaskPanel(dev: Developer) {
    setTaskDev(dev);
    setShowNewTask(false);
    setNewTitle("");
    setNewDesc("");
    setNewPriority("MEDIUM");
    setNewDeadline("");
    setTaskError("");
    fetchTasks(dev.id);
  }

  async function createTask() {
    if (!taskDev || !newTitle.trim()) return;
    setTaskSaving(true);
    setTaskError("");
    try {
      const res = await fetch(`/api/admin/developers/${taskDev.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim() || null,
          priority: newPriority,
          deadline: newDeadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create task");
      setTasks((prev) => [data.task, ...prev]);
      setShowNewTask(false);
      setNewTitle("");
      setNewDesc("");
      setNewPriority("MEDIUM");
      setNewDeadline("");
    } catch (err: any) {
      setTaskError(err.message);
    } finally {
      setTaskSaving(false);
    }
  }

  async function cycleStatus(task: DevTask) {
    if (!taskDev) return;
    const next = STATUS_FLOW[task.status] ?? "TODO";
    try {
      const res = await fetch(`/api/admin/developers/${taskDev.id}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
    } catch {
      // silently fail
    }
  }

  async function deleteTask(taskId: string) {
    if (!taskDev || !confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/admin/developers/${taskDev.id}/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch {
      // silently fail
    }
  }

  function isOverdue(task: DevTask) {
    return task.deadline && task.status !== "DONE" && task.status !== "CANCELLED" && new Date(task.deadline) < new Date();
  }

  function formatDeadline(d: string) {
    const date = new Date(d);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    if (days < 0) return `${label} (${Math.abs(days)}d overdue)`;
    if (days === 0) return `${label} (today)`;
    if (days === 1) return `${label} (tomorrow)`;
    if (days <= 7) return `${label} (${days}d left)`;
    return label;
  }

  const { ref: tableScrollRef, canScrollLeft, canScrollRight, scroll } = useHorizontalScroll([developers]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Developers"
        description="Manage project developers, verification info, and corporate addresses."
        breadcrumb={[
          { label: "Admin", href: "/admin" },
          { label: "Developers" },
        ]}
        actions={
          canAdd ? (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold px-4 py-2.5 text-sm transition shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Developer
            </button>
          ) : null
        }
      />

      {success && (
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 border border-emerald-100 flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="h-4.5 w-4.5 text-emerald-600" />
          <span className="font-medium">{success}</span>
        </div>
      )}

      {error && !isOpen && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-100 flex items-center justify-between animate-in fade-in duration-200">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <TableScrollButtons canScrollLeft={canScrollLeft} canScrollRight={canScrollRight} onScroll={scroll} />
      </div>

      <div ref={tableScrollRef} className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 font-medium border-b">
            <tr>
              <th className="px-6 py-4">Developer & Contact</th>
              <th className="px-6 py-4">Identity & Location</th>
              <th className="px-6 py-4">Professional Exp</th>
              <th className="px-6 py-4">Added On</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {developers.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block text-base">{d.name}</span>
                    <div className="text-xs text-slate-500 space-y-0.5">
                      {d.email && <span className="block">{d.email}</span>}
                      {d.phone && <span className="block">{d.phone}</span>}
                      {d.website && (
                        <a 
                          href={d.website.startsWith("http") ? d.website : `https://${d.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 text-brand-hover hover:underline"
                        >
                          {d.website}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1.5">
                    {d.identityNumber ? (
                      <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 border border-amber-100 px-2 py-0.5 text-xs text-brand-hover font-medium">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{d.identityType}: {d.identityNumber}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic block">No identity proof listed</span>
                    )}
                    {(d.city || d.state || d.country) && (
                      <div className="text-xs text-slate-500 flex items-start gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>
                          {d.address && `${d.address}, `}
                          {[d.city, d.state, d.country].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-slate-700 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                      <span>Experience: <strong className="font-semibold text-slate-950">{d.experienceYears !== null ? `${d.experienceYears} Years` : "—"}</strong></span>
                    </div>
                    <div className="text-xs">
                      Projects: <strong className="font-semibold text-slate-950">{d.projectCount}</strong>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs" suppressHydrationWarning>
                  {new Date(d.createdAt).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                  })}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {canSendMessage && (
                      <button
                        onClick={() => router.push(`/admin/messages?userId=${d.id}`)}
                        disabled={loading}
                        title="Send Message"
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <MessageSquare className="h-4.5 w-4.5" />
                      </button>
                    )}
                    {canManageProjects && (
                      <button
                        onClick={() => router.push(`/admin/projects?developerId=${d.id}`)}
                        disabled={loading}
                        title="Manage Projects"
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                      >
                        <FolderKanban className="h-4.5 w-4.5" />
                      </button>
                    )}
                    {canManageTasks && (
                      <button
                        onClick={() => openTaskPanel(d)}
                        disabled={loading}
                        title="Manage Tasks"
                        className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition font-medium"
                      >
                        <ClipboardList className="h-4.5 w-4.5" />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => openEditModal(d)}
                        disabled={loading}
                        title="Edit Profile"
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <Edit3 className="h-4.5 w-4.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(d.id, d.name)}
                        disabled={loading}
                        title="Delete Developer"
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {developers.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-500">
                  No developers found. Click &quot;Add Developer&quot; to register one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ════════════ Task Panel (slide-over) ════════════ */}
      {taskDev && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
            {/* Task Panel Header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-violet-600" />
                    Tasks — {taskDev.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {tasks.filter((t) => t.status === "DONE").length}/{tasks.length} completed
                  </p>
                </div>
                <button
                  onClick={() => setTaskDev(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Task Error */}
            {taskError && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
                {taskError}
              </div>
            )}

            {/* Add Task Toggle */}
            <div className="px-6 py-3 border-b border-slate-100">
              {!showNewTask ? (
                <button
                  onClick={() => setShowNewTask(true)}
                  className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold px-4 py-2.5 text-sm transition shadow-sm w-full justify-center"
                >
                  <Plus className="h-4 w-4" />
                  New Task
                </button>
              ) : (
                <div className="space-y-3 p-4 bg-violet-50/50 rounded-xl border border-violet-100">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Task title *"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 transition bg-white"
                    autoFocus
                  />
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-violet-400 transition resize-none bg-white"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Priority</label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 bg-white"
                      >
                        <option value="LOW">🟢 Low</option>
                        <option value="MEDIUM">🔵 Medium</option>
                        <option value="HIGH">🟠 High</option>
                        <option value="URGENT">🔴 Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Deadline</label>
                      <input
                        type="date"
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowNewTask(false)}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createTask}
                      disabled={taskSaving || !newTitle.trim()}
                      className="flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-sm font-semibold transition disabled:opacity-50"
                    >
                      {taskSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Create Task
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {tasksLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-medium">No tasks assigned yet</p>
                  <p className="text-xs text-slate-400 mt-1">Click &quot;New Task&quot; to assign work</p>
                </div>
              ) : (
                tasks.map((task) => {
                  const st = STATUS_META[task.status] ?? STATUS_META.TODO;
                  const pr = PRIORITY_META[task.priority] ?? PRIORITY_META.MEDIUM;
                  const overdue = isOverdue(task);
                  const StatusIcon = st.icon;
                  return (
                    <div
                      key={task.id}
                      className={`rounded-xl border p-4 transition hover:shadow-sm ${
                        overdue ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-white"
                      } ${task.status === "DONE" ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Status toggle button */}
                        <button
                          onClick={() => cycleStatus(task)}
                          title={`Click to change → ${STATUS_META[STATUS_FLOW[task.status]]?.label ?? "To Do"}`}
                          className={`mt-0.5 shrink-0 p-0.5 rounded-full transition hover:scale-110 ${st.color}`}
                        >
                          <StatusIcon className="h-5 w-5" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${task.status === "DONE" ? "line-through text-slate-400" : "text-slate-900"}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {/* Priority badge */}
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${pr.color} ${pr.bg} border ${pr.border}`}>
                              <Flag className="h-2.5 w-2.5" />
                              {pr.label}
                            </span>
                            {/* Status badge */}
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${st.color} ${st.bg}`}>
                              {st.label}
                            </span>
                            {/* Deadline */}
                            {task.deadline && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${overdue ? "text-red-600" : "text-slate-500"}`}>
                                {overdue && <AlertTriangle className="h-2.5 w-2.5" />}
                                <Calendar className="h-2.5 w-2.5" />
                                {formatDeadline(task.deadline)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="shrink-0 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Delete task"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════ Editor Modal ════════════ */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col h-auto max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-100">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedDeveloper ? `Edit ${selectedDeveloper.name}` : "Register Developer"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update professional credentials, location details, and experience metrics.
                </p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="mx-6 mt-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Modal Tabs */}
            <div className="px-6 border-b border-slate-100 flex gap-4 text-sm">
              {[
                { id: "general", label: "Profile & Company" },
                { id: "identity", label: "Contact & Identity" },
                { id: "location", label: "Office Location" }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`py-3.5 font-semibold border-b-2 transition -mb-px ${
                    activeTab === t.id
                      ? "border-brand text-brand-hover"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {activeTab === "general" && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block text-sm">
                      <span className="text-slate-700 font-semibold">Developer Name *</span>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Amanora Builders"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-700 font-semibold">Company Website</span>
                      <input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="e.g. www.amanorabuilders.com"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition"
                      />
                    </label>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block text-sm">
                      <span className="text-slate-700 font-semibold">Years of Experience</span>
                      <input
                        type="number"
                        min="0"
                        value={experienceYears}
                        onChange={(e) => {
                          const v = e.target.value;
                          setExperienceYears(v === "" ? "" : Number(v));
                        }}
                        placeholder="e.g. 15"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-700 font-semibold">Projects Seeded / Listed</span>
                      <input
                        type="number"
                        min="0"
                        value={projectCount}
                        onChange={(e) => setProjectCount(parseInt(e.target.value) || 0)}
                        placeholder="e.g. 5"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition"
                      />
                    </label>
                  </div>

                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Company Profile / Description</span>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Write a brief introduction about the builder group, specialties, reputation, etc."
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition resize-none"
                    />
                  </label>
                </div>
              )}

              {activeTab === "identity" && (
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <label className="block text-sm">
                      <span className="text-slate-700 font-semibold">Email Address</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="contact@developer.com"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition"
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-700 font-semibold">Phone Number</span>
                      <div className="mt-1.5">
                        <PhoneInput value={phone} onChange={setPhone} defaultCountry={country} />
                      </div>
                    </label>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 border-t pt-4 mt-2">
                    <label className="block text-sm">
                      <span className="text-slate-700 font-semibold">Corporate Identity Type</span>
                      <select
                        value={identityType}
                        onChange={(e) => setIdentityType(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand bg-white transition"
                      >
                        <option value="RERA Registration">RERA Registration</option>
                        <option value="GSTIN">GSTIN (Taxation ID)</option>
                        <option value="PAN">PAN (Corporate Account)</option>
                        <option value="Corporate Identity Number (CIN)">CIN (Corporate ID)</option>
                        <option value="Vat Number">VAT Registration</option>
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="text-slate-700 font-semibold">Identity Proof Number</span>
                      <input
                        type="text"
                        value={identityNumber}
                        onChange={(e) => setIdentityNumber(e.target.value)}
                        placeholder="e.g. RAJ/PRJ/2026/9981"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition"
                      />
                    </label>
                  </div>
                </div>
              )}

              {activeTab === "location" && (
                <div className="space-y-4">
                  <label className="block text-sm">
                    <span className="text-slate-700 font-semibold">Registered Office Address</span>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 5th Floor, Tower B, Amanora Park Town"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-brand transition"
                    />
                  </label>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-slate-700 font-semibold text-sm">Country</span>
                      <div className="mt-1.5">
                        <CountrySelect value={country} onChange={(code) => { setCountry(code); setState(""); setStateCode(""); setCity(""); }} />
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-700 font-semibold text-sm">State / Region</span>
                      <div className="mt-1">
                        <GlobalStateSelect
                          countryCode={country}
                          value={stateCode}
                          onChange={(code, name) => { setStateCode(code); setState(name); setCity(""); }}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-700 font-semibold text-sm">City</span>
                      <div className="mt-1">
                        <GlobalCitySelect
                          countryCode={country}
                          stateCode={stateCode}
                          value={city}
                          onChange={setCity}
                        />
                      </div>
                    </div>
                  </div>

                  <label className="block text-sm max-w-xs">
                    <span className="text-slate-700 font-semibold">{country === "IN" ? "PIN Code" : "ZIP / Postal Code"}</span>
                    <div className="mt-1.5">
                      <GlobalZipSelect
                        countryCode={country}
                        city={city}
                        value={zip}
                        onChange={setZip}
                        placeholder={country === "IN" ? "6-digit PIN" : "Postal Code"}
                      />
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition disabled:opacity-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading || !name.trim()}
                className="flex items-center gap-2 rounded-xl bg-brand hover:bg-brand-hover text-white px-5 py-2 text-sm font-semibold transition disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {selectedDeveloper ? "Save Changes" : "Register Developer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
