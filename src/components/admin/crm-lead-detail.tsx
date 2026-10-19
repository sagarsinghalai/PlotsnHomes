"use client";

import {
  ArrowLeft,
  Calendar,
  Check,
  CheckSquare,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Save,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { applyTemplate, type MessageTemplate } from "@/lib/crm-template-utils";
import { whatsAppWebUrl } from "@/lib/messaging-settings";
import { DEFAULT_PIPELINES, type Pipeline } from "@/lib/pipeline-store";


const STAGES = ["NEW", "CONTACTED", "QUALIFIED", "SITE_VISIT", "NEGOTIATION", "WON", "LOST"] as const;

const LIFECYCLE_STAGES = [
  "Subscriber",
  "Lead",
  "MQL (Marketing Qualified Lead)",
  "SQL (Sales Qualified Lead)",
  "Opportunity",
  "Success/Customer",
  "Failed",
  "Other",
];

const LEAD_STATUSES = [
  "New",
  "Open",
  "Assigned to",
  "In Progress",
  "Open Deal",
  "Qualified",
  "Unqualified",
  "Calling Attempt",
  "Answered",
  "No Response",
  "Site Visit",
  "EOI (Expression of Interest) shared",
  "Buy",
  "Sell",
  "Ask for Refund",
  "Allotted",
  "Not - Allotted",
  "Refund",
];

type LeadDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  stage: string;
  score: number;
  budgetMin: number | null;
  budgetMax: number | null;
  notes: string | null;
  nextFollowUpAt: string | null;
  lifecycleStage: string;
  leadStatus: string;
  requirements: string | null;
  suggestedPropertyIds: string | null;
  property: { id: string; title: string; symbol: string; slug: string; category: string | null; type: string } | null;
  owner: { id: string; name: string } | null;
  tasks: {
    id: string;
    title: string;
    completed: boolean;
    dueAt: string | null;
    createdAt: string;
  }[];
  activities: {
    id: string;
    type: string;
    message: string;
    createdAt: string;
    user: { name: string } | null;
  }[];
};

export function CrmLeadDetail({
  lead,
  agents,
  sources,
  templates,
  properties = [],
  agentMode = false,
  bhkOptions = [],
  pipelines = [],
}: {
  lead: LeadDetail;
  agents: { id: string; name: string; email?: string; userId?: string | null }[];
  sources: string[];
  templates: MessageTemplate[];
  properties?: {
    id: string;
    title: string;
    symbol: string;
    slug: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    city: string;
    area: string | null;
    type: string;
    category: string | null;
    listingType: string;
    images: string;
    bhk: string | null;
  }[];
  agentMode?: boolean;
  bhkOptions?: string[];
  pipelines?: Pipeline[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "requirements" | "properties" | "activity" | "offers" | "intelligence">("properties");
  const [activityFilter, setActivityFilter] = useState<string>("ALL");
  const [activitySearch, setActivitySearch] = useState("");

  const [dynamicSources, setDynamicSources] = useState<string[]>(
    sources && sources.length > 0
      ? sources
      : ["Site Visit", "Website", "Referral", "Cold Call", "Facebook Ads", "Google Search", "WhatsApp Inquiry", "Property Portal"]
  );
  const [lifecycleStages, setLifecycleStages] = useState<string[]>([
    "Lead", "Subscriber", "Prospect", "MQL", "SQL", "Opportunity", "Customer", "Closed Won", "Closed Lost"
  ]);
  const [leadStatuses, setLeadStatuses] = useState<string[]>([
    "NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST", "UNQUALIFIED"
  ]);

  useEffect(() => {
    async function loadLeadSettings() {
      try {
        const res = await fetch("/api/settings/dropdowns");
        if (res.ok) {
          const data = await res.json();
          if (data.sections && Array.isArray(data.sections)) {
            const leadSec = data.sections.find((s: any) => s.sectionKey === "all_leads");
            if (leadSec && Array.isArray(leadSec.fields)) {
              leadSec.fields.forEach((field: any) => {
                const options = (field.options || [])
                  .filter((o: any) => o.enabled !== false)
                  .map((o: any) => o.label);
                if (field.key === "lead_source" && options.length > 0) setDynamicSources(options);
                else if (field.key === "lifecycle_stage" && options.length > 0) setLifecycleStages(options);
                else if (field.key === "lead_status" && options.length > 0) setLeadStatuses(options);
              });
            }
          }
        }
      } catch (e) {
        console.error("Failed to load lead settings dropdowns", e);
      }
    }
    loadLeadSettings();
  }, []);

  // Quick action log state
  const [activeLogType, setActiveLogType] = useState<"note" | "call" | "meeting" | "task" | "email">("note");
  const [logText, setLogText] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  // Requirements state
  const parsedRequirements = useMemo(() => {
    try {
      if (lead.requirements) {
        return JSON.parse(lead.requirements);
      }
    } catch (e) {
      console.error("Failed to parse lead requirements", e);
    }
    return {
      budgetMin: lead.budgetMin ?? null,
      budgetMax: lead.budgetMax ?? null,
      category: lead.property?.category ?? "",
      type: lead.property?.type ?? "",
      bedrooms: null,
      city: "",
      area: "",
    };
  }, [lead.requirements, lead.budgetMin, lead.budgetMax, lead.property]);

  const [reqBudgetMin, setReqBudgetMin] = useState(parsedRequirements.budgetMin?.toString() ?? "");
  const [reqBudgetMax, setReqBudgetMax] = useState(parsedRequirements.budgetMax?.toString() ?? "");
  const [reqCategory, setReqCategory] = useState(parsedRequirements.category ?? "");
  const [reqType, setReqType] = useState(parsedRequirements.type ?? "");
  const [reqBedrooms, setReqBedrooms] = useState(parsedRequirements.bedrooms?.toString() ?? "");
  const [reqCity, setReqCity] = useState(parsedRequirements.city ?? "");
  const [reqArea, setReqArea] = useState(parsedRequirements.area ?? "");
  const [reqBhk, setReqBhk] = useState(parsedRequirements.bhk ?? "");

  async function handleSaveRequirements() {
    setBusy(true);
    const reqObj = {
      budgetMin: reqBudgetMin ? Number(reqBudgetMin) : null,
      budgetMax: reqBudgetMax ? Number(reqBudgetMax) : null,
      category: reqCategory || null,
      type: reqType || null,
      bedrooms: reqBedrooms ? Number(reqBedrooms) : null,
      city: reqCity || null,
      area: reqArea || null,
      bhk: reqBhk || null,
    };
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requirements: JSON.stringify(reqObj),
        budgetMin: reqObj.budgetMin,
        budgetMax: reqObj.budgetMax,
      }),
    });
    setBusy(false);
    router.refresh();
  }

  // Suggested properties state
  const suggestedPropertyIds = useMemo(() => {
    try {
      if (lead.suggestedPropertyIds) {
        return JSON.parse(lead.suggestedPropertyIds) as string[];
      }
    } catch (e) {}
    return [] as string[];
  }, [lead.suggestedPropertyIds]);

  async function handleSuggestProperty(propertyId: string) {
    let updatedIds = [...suggestedPropertyIds];
    if (!updatedIds.includes(propertyId)) {
      updatedIds.push(propertyId);
    }
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        suggestedPropertyIds: JSON.stringify(updatedIds),
      }),
    });
    router.refresh();
  }

  async function handleUnsuggestProperty(propertyId: string) {
    const updatedIds = suggestedPropertyIds.filter((id) => id !== propertyId);
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        suggestedPropertyIds: JSON.stringify(updatedIds),
      }),
    });
    router.refresh();
  }

  async function handleShareProperty(propSlug: string, propTitle: string) {
    if (lead.phone) {
      const message = `Hi ${lead.name}, check out this property: ${propTitle} - ${window.location.origin}/properties/${propSlug}`;
      try {
        const res = await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: lead.phone,
            type: "text",
            text: message,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert("Failed to share property via WhatsApp: " + (data.error || "Unknown error"));
        } else {
          alert("Sent successfully on WhatsApp.");
        }
      } catch (e: any) {
        alert("Error sending WhatsApp message: " + e.message);
      }
    } else {
      const link = `${window.location.origin}/properties/${propSlug}`;
      navigator.clipboard.writeText(link);
      alert(`Link copied to clipboard: ${link}`);
    }
  }

  // Matching properties algorithm
  const matchedPropertiesList = useMemo(() => {
    return properties.map((prop) => {
      let matchedCount = 0;
      let totalCount = 0;
      const matches: Record<string, boolean> = {};

      // 1. Budget match
      const bMin = reqBudgetMin ? Number(reqBudgetMin) : parsedRequirements.budgetMin;
      const bMax = reqBudgetMax ? Number(reqBudgetMax) : parsedRequirements.budgetMax;
      if (bMin !== null || bMax !== null) {
        totalCount++;
        const minOk = bMin === null || prop.price >= bMin;
        const maxOk = bMax === null || prop.price <= bMax;
        if (minOk && maxOk) {
          matchedCount++;
          matches.budget = true;
        } else {
          matches.budget = false;
        }
      }

      // 2. Category match
      const catPref = reqCategory || parsedRequirements.category;
      if (catPref) {
        totalCount++;
        if (prop.category?.toLowerCase() === catPref.toLowerCase()) {
          matchedCount++;
          matches.category = true;
        } else {
          matches.category = false;
        }
      }

      // 3. Type match
      const typePref = reqType || parsedRequirements.type;
      if (typePref) {
        totalCount++;
        if (prop.type?.toLowerCase() === typePref.toLowerCase()) {
          matchedCount++;
          matches.type = true;
        } else {
          matches.type = false;
        }
      }

      // 4. Config (Bedrooms) match
      const bedsPref = reqBedrooms ? Number(reqBedrooms) : parsedRequirements.bedrooms;
      if (bedsPref) {
        totalCount++;
        if (prop.bedrooms === bedsPref) {
          matchedCount++;
          matches.config = true;
        } else {
          matches.config = false;
        }
      }

      // 5. City match
      const cityPref = reqCity || parsedRequirements.city;
      if (cityPref) {
        totalCount++;
        if (prop.city?.toLowerCase() === cityPref.toLowerCase()) {
          matchedCount++;
          matches.city = true;
        } else {
          matches.city = false;
        }
      }

      // 6. Area match
      const areaPref = reqArea || parsedRequirements.area;
      if (areaPref) {
        totalCount++;
        if (prop.area?.toLowerCase() === areaPref.toLowerCase()) {
          matchedCount++;
          matches.area = true;
        } else {
          matches.area = false;
        }
      }

      // 7. BHK match
      const bhkPref = reqBhk || parsedRequirements.bhk;
      if (bhkPref) {
        totalCount++;
        if (prop.bhk && prop.bhk.toLowerCase() === bhkPref.toLowerCase()) {
          matchedCount++;
          matches.bhk = true;
        } else {
          matches.bhk = false;
        }
      }

      const percentage = totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : 100;

      return {
        property: prop,
        percentage,
        matches,
      };
    }).sort((a, b) => b.percentage - a.percentage);
  }, [properties, reqBudgetMin, reqBudgetMax, reqCategory, reqType, reqBedrooms, reqCity, reqArea, reqBhk, parsedRequirements]);

  const activePipelines = useMemo(() => {
    return pipelines && pipelines.length > 0 ? pipelines : DEFAULT_PIPELINES;
  }, [pipelines]);

  const initialPipelineId = useMemo(() => {
    const matched = activePipelines.find((p) =>
      p.stages.some((stg) => stg.key.toUpperCase() === lead.stage.toUpperCase())
    );
    return matched?.id || activePipelines[0]?.id || "";
  }, [activePipelines, lead.stage]);

  const [edit, setEdit] = useState({
    name: lead.name,
    email: lead.email,
    phone: lead.phone ?? "",
    source: lead.source,
    pipelineId: initialPipelineId,
    stage: lead.stage,
    score: lead.score,
    ownerId: lead.owner?.id ?? "",
    notes: lead.notes ?? "",
    nextFollowUpAt: lead.nextFollowUpAt?.slice(0, 16) ?? "",
    budgetMin: lead.budgetMin?.toString() ?? "",
    budgetMax: lead.budgetMax?.toString() ?? "",
    lifecycleStage: lead.lifecycleStage ?? "Lead",
    leadStatus: lead.leadStatus ?? "New",
    propertyId: lead.property?.id ?? "",
  });

  const [calling, setCalling] = useState(false);
  const [callMsg, setCallMsg] = useState("");

  async function handleCallClick() {
    if (!lead.phone) return;
    setCalling(true);
    setCallMsg("");
    try {
      const res = await fetch("/api/telephony/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          leadPhone: lead.phone,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCallMsg("Call placed! Twilio is dialing your phone first...");
        alert("Success: Twilio is dialing your phone first, then it will connect you to the lead.");
      } else {
        alert(data.error || "Failed to start call");
      }
    } catch (err) {
      alert("Failed to initiate telephony connection");
    } finally {
      setCalling(false);
    }
  }

  async function saveLead() {
    setBusy(true);
    await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: edit.name,
        email: edit.email,
        phone: edit.phone || null,
        source: edit.source,
        stage: edit.stage,
        ownerId: edit.ownerId || null,
        notes: edit.notes || null,
        nextFollowUpAt: edit.nextFollowUpAt ? new Date(edit.nextFollowUpAt).toISOString() : null,
        budgetMin: edit.budgetMin ? Number(edit.budgetMin) : null,
        budgetMax: edit.budgetMax ? Number(edit.budgetMax) : null,
        lifecycleStage: edit.lifecycleStage,
        leadStatus: edit.leadStatus,
        propertyId: edit.propertyId || null,
      }),
    });
    setBusy(false);
    router.refresh();
  }

  async function submitQuickLog() {
    if (activeLogType === "task") {
      if (!logText.trim()) return;
      setBusy(true);
      await fetch(`/api/admin/leads/${lead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "task",
          title: logText.trim(),
          dueAt: taskDueDate ? new Date(taskDueDate).toISOString() : undefined,
        }),
      });
      setLogText("");
      setTaskDueDate("");
      setBusy(false);
      router.refresh();
    } else {
      if (!logText.trim()) return;
      setBusy(true);
      await fetch(`/api/admin/leads/${lead.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: activeLogType,
          message: logText.trim(),
        }),
      });
      setLogText("");
      setBusy(false);
      router.refresh();
    }
  }

  async function toggleTask(taskId: string, completed: boolean) {
    await fetch(`/api/admin/leads/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    router.refresh();
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/admin/leads/tasks/${taskId}`, { method: "DELETE" });
    router.refresh();
  }

  const propertyLabel = lead.property ? `${lead.property.symbol} — ${lead.property.title}` : "";

  async function openWhatsApp(template?: MessageTemplate) {
    if (!lead.phone) return;
    const body = template
      ? applyTemplate(template.body, { name: lead.name, property: propertyLabel, email: lead.email })
      : `Hi ${lead.name}, following up from BrickVest.`;
    
    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: lead.phone,
          type: "text",
          text: body,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert("Failed to send WhatsApp message: " + (data.error || "Unknown error"));
      } else {
        alert("Sent successfully on WhatsApp.");
      }
    } catch (e: any) {
      alert("Error sending WhatsApp message: " + e.message);
    }
  }

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return lead.activities.filter((a) => {
      // Channel Filter
      if (activityFilter !== "ALL") {
        if (activityFilter === "NOTES" && a.type !== "NOTE") return false;
        if (activityFilter === "CALLS" && a.type !== "CALL") return false;
        if (activityFilter === "MEETINGS" && a.type !== "MEETING") return false;
        if (activityFilter === "EMAILS" && a.type !== "EMAIL") return false;
      }
      // Search Filter
      if (activitySearch.trim()) {
        const q = activitySearch.toLowerCase();
        return a.message.toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [lead.activities, activityFilter, activitySearch]);

  // Lead Score Breakdown details
  const scoreDetails = useMemo(() => {
    const details: { label: string; score: number }[] = [];
    let base = 10;
    details.push({ label: "Base Score", score: 10 });

    const stage = edit.lifecycleStage.toLowerCase();
    if (stage.includes("subscriber")) {
      details.push({ label: "Lifecycle Stage (Subscriber)", score: 5 });
      base += 5;
    } else if (stage.includes("mql") || stage.includes("marketing qualified")) {
      details.push({ label: "Lifecycle Stage (MQL)", score: 30 });
      base += 30;
    } else if (stage.includes("sql") || stage.includes("sales qualified")) {
      details.push({ label: "Lifecycle Stage (SQL)", score: 45 });
      base += 45;
    } else if (stage.includes("opportunity")) {
      details.push({ label: "Lifecycle Stage (Opportunity)", score: 65 });
      base += 65;
    } else if (stage.includes("success") || stage.includes("customer")) {
      details.push({ label: "Lifecycle Stage (Success/Customer)", score: 90 });
      base += 90;
    } else if (stage.includes("failed")) {
      details.push({ label: "Lifecycle Stage (Failed)", score: 0 });
    } else if (stage === "lead") {
      details.push({ label: "Lifecycle Stage (Lead)", score: 15 });
      base += 15;
    } else if (stage.includes("other")) {
      details.push({ label: "Lifecycle Stage (Other)", score: 10 });
      base += 10;
    }

    const status = edit.leadStatus.toLowerCase();
    if (status === "new") {
      details.push({ label: "Lead Status (New)", score: 5 });
      base += 5;
    } else if (status === "open") {
      details.push({ label: "Lead Status (Open)", score: 10 });
      base += 10;
    } else if (status.includes("assigned")) {
      details.push({ label: "Lead Status (Assigned to)", score: 15 });
      base += 15;
    } else if (status.includes("in progress")) {
      details.push({ label: "Lead Status (In Progress)", score: 20 });
      base += 20;
    } else if (status.includes("open deal")) {
      details.push({ label: "Lead Status (Open Deal)", score: 30 });
      base += 30;
    } else if (status.includes("unqualified")) {
      details.push({ label: "Lead Status (Unqualified)", score: 0 });
    } else if (status.includes("qualified")) {
      details.push({ label: "Lead Status (Qualified)", score: 40 });
      base += 40;
    } else if (status.includes("calling attempt")) {
      details.push({ label: "Lead Status (Calling Attempt)", score: 10 });
      base += 10;
    } else if (status.includes("answered")) {
      details.push({ label: "Lead Status (Answered)", score: 25 });
      base += 25;
    } else if (status.includes("no response")) {
      details.push({ label: "Lead Status (No Response)", score: 5 });
      base += 5;
    } else if (status.includes("site visit")) {
      details.push({ label: "Lead Status (Site Visit)", score: 35 });
      base += 35;
    } else if (status.includes("eoi") || status.includes("expression of interest")) {
      details.push({ label: "Lead Status (EOI Shared)", score: 45 });
      base += 45;
    } else if (status === "buy") {
      details.push({ label: "Lead Status (Buy)", score: 50 });
      base += 50;
    } else if (status === "sell") {
      details.push({ label: "Lead Status (Sell)", score: 50 });
      base += 50;
    } else if (status.includes("ask for refund")) {
      details.push({ label: "Lead Status (Ask for Refund)", score: -10 });
      base -= 10;
    } else if (status === "allotted") {
      details.push({ label: "Lead Status (Allotted)", score: 75 });
      base += 75;
    } else if (status.includes("not - allotted") || status.includes("not allotted")) {
      details.push({ label: "Lead Status (Not Allotted)", score: 10 });
      base += 10;
    } else if (status === "refund") {
      details.push({ label: "Lead Status (Refund)", score: -20 });
      base -= 20;
    }

    if (edit.budgetMin || edit.budgetMax) {
      details.push({ label: "Budget Specified", score: 10 });
      base += 10;
    }
    if (edit.propertyId) {
      details.push({ label: "Linked Property Interest", score: 15 });
      base += 15;
    }

    const completedTasks = lead.tasks.filter((t) => t.completed).length;
    if (completedTasks > 0) {
      const taskScore = Math.min(25, completedTasks * 5);
      details.push({ label: `Completed Tasks (${completedTasks})`, score: taskScore });
      base += taskScore;
    }

    const activityPoints = lead.activities.length * 2; // general score indicator
    if (activityPoints > 0) {
      const actScore = Math.min(25, activityPoints);
      details.push({ label: "Interaction Engagement History", score: actScore });
      base += actScore;
    }

    return { details, total: Math.max(0, Math.min(100, base)) };
  }, [edit.lifecycleStage, edit.leadStatus, edit.budgetMin, edit.budgetMax, edit.propertyId, lead.tasks, lead.activities]);

  const getActivityIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "CALL":
        return <Phone className="h-4 w-4 text-sky-600" />;
      case "MEETING":
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case "EMAIL":
        return <Mail className="h-4 w-4 text-slate-600" />;
      case "TASK":
      case "TASK_CREATED":
        return <CheckSquare className="h-4 w-4 text-emerald-600" />;
      case "NOTE":
      default:
        return <FileText className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href={agentMode ? "/dashboard/crm" : "/admin/crm"}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-hover"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to CRM
      </Link>

      {/* Profile Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold text-slate-900">{lead.name}</h1>
            <div className="flex items-center gap-1.5 rounded-full bg-brand/15 px-3 py-1 text-xs font-semibold text-brand-hover">
              <Sparkles className="h-3.5 w-3.5" />
              Lead Score: {lead.score}
            </div>
          </div>
          <p className="text-slate-600 mt-1">
            {lead.email}
            {lead.phone ? ` · ${lead.phone}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {lead.phone && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="bg-sky-50 hover:bg-sky-100 text-sky-850 border-sky-250 font-semibold"
                onClick={handleCallClick}
                loading={calling}
              >
                <Phone className="h-4 w-4" />
                Call via Twilio
              </Button>
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <Phone className="h-4 w-4 text-slate-500" />
                Direct Call
              </a>
            </div>
          )}
          {lead.phone && (
            <Button variant="secondary" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200" onClick={() => openWhatsApp()}>
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          )}
          <Link href={`/admin/messages?userId=${lead.id}`}>
            <Button variant="secondary">
              <ExternalLink className="h-4 w-4" />
              Send message
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions Strip */}
      <div className="flex gap-2 border-b pb-4">
        <button
          onClick={() => {
            setActiveLogType("note");
            setActiveTab("activity");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            activeLogType === "note" ? "bg-amber-50 text-amber-900 border border-amber-200" : "hover:bg-slate-100 text-slate-600"
          }`}
        >
          <FileText className="h-4 w-4" />
          Log Note
        </button>
        <button
          onClick={() => {
            setActiveLogType("call");
            setActiveTab("activity");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            activeLogType === "call" ? "bg-sky-50 text-sky-900 border border-sky-200" : "hover:bg-slate-100 text-slate-600"
          }`}
        >
          <Phone className="h-4 w-4" />
          Log Call
        </button>
        <button
          onClick={() => {
            setActiveLogType("task");
            setActiveTab("activity");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            activeLogType === "task" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "hover:bg-slate-100 text-slate-600"
          }`}
        >
          <CheckSquare className="h-4 w-4" />
          Create Task
        </button>
        <button
          onClick={() => {
            setActiveLogType("meeting");
            setActiveTab("activity");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            activeLogType === "meeting" ? "bg-purple-50 text-purple-900 border border-purple-200" : "hover:bg-slate-100 text-slate-600"
          }`}
        >
          <Calendar className="h-4 w-4" />
          Log Meeting
        </button>
        <button
          onClick={() => {
            setActiveLogType("email");
            setActiveTab("activity");
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            activeLogType === "email" ? "bg-slate-100 text-slate-900 border border-slate-300" : "hover:bg-slate-100 text-slate-600"
          }`}
        >
          <Mail className="h-4 w-4" />
          Log Email
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: About this contact */}
        <div className="space-y-6">
          <section className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="font-semibold text-lg border-b pb-3 mb-4 text-slate-900">About this contact</h2>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input value={edit.name} onChange={(e) => setEdit((x) => ({ ...x, name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={edit.email} onChange={(e) => setEdit((x) => ({ ...x, email: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Phone number</Label>
                <PhoneInput
                  value={edit.phone}
                  onChange={(e164) => setEdit((x) => ({ ...x, phone: e164 }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Contact Owner / Agent</Label>
                <select
                  className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-slate-50"
                  value={edit.ownerId}
                  onChange={(e) => setEdit((x) => ({ ...x, ownerId: e.target.value }))}
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
                <Label>Lifecycle Stage</Label>
                <select
                  className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-slate-50 font-medium text-slate-800"
                  value={edit.lifecycleStage}
                  onChange={(e) => setEdit((x) => ({ ...x, lifecycleStage: e.target.value }))}
                >
                  {lifecycleStages.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Lead Status</Label>
                <select
                  className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-slate-50 font-medium text-slate-800"
                  value={edit.leadStatus}
                  onChange={(e) => setEdit((x) => ({ ...x, leadStatus: e.target.value }))}
                >
                  {leadStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Interested Property</Label>
                <select
                  className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-slate-50"
                  value={edit.propertyId}
                  onChange={(e) => setEdit((x) => ({ ...x, propertyId: e.target.value }))}
                >
                  <option value="">— Select Property —</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.symbol} — {p.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Pipeline</Label>
                <select
                  className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-slate-50 font-medium text-slate-800"
                  value={edit.pipelineId}
                  onChange={(e) => {
                    const pipeId = e.target.value;
                    const pipe = activePipelines.find((p) => p.id === pipeId);
                    const firstStageKey = pipe?.stages[0]?.key || "NEW";
                    setEdit((x) => ({ ...x, pipelineId: pipeId, stage: firstStageKey }));
                  }}
                >
                  {activePipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Pipeline Stage</Label>
                <select
                  className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-slate-50 font-medium text-slate-800"
                  value={edit.stage}
                  onChange={(e) => setEdit((x) => ({ ...x, stage: e.target.value }))}
                >
                  {(() => {
                    const currentPipe = activePipelines.find((p) => p.id === edit.pipelineId);
                    if (currentPipe && currentPipe.stages.length > 0) {
                      return currentPipe.stages.map((stg) => (
                        <option key={stg.id || stg.key} value={stg.key}>
                          {stg.name} ({stg.key})
                        </option>
                      ));
                    }
                    return STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ));
                  })()}
                </select>
              </div>
              <div>
                <Label>Lead Source</Label>
                <select
                  className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-slate-50"
                  value={edit.source}
                  onChange={(e) => setEdit((x) => ({ ...x, source: e.target.value }))}
                >
                  {dynamicSources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Next Follow-Up</Label>
                <Input
                  type="datetime-local"
                  value={edit.nextFollowUpAt}
                  onChange={(e) => setEdit((x) => ({ ...x, nextFollowUpAt: e.target.value }))}
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label>Notes / Requirements</Label>
                <textarea
                  rows={3}
                  placeholder="e.g. Looking for land parcel or 3BHK under ₹80 Lakhs..."
                  value={edit.notes}
                  onChange={(e) => setEdit((x) => ({ ...x, notes: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm mt-1 focus:bg-white text-slate-900 outline-none focus:border-brand"
                />
              </div>
              <Button disabled={busy} onClick={saveLead} className="w-full mt-2" variant="gold">
                Save changes
              </Button>
            </div>
          </section>

          {templates.length > 0 && lead.phone && (
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-3">WhatsApp Templates</h2>
              <div className="space-y-2">
                {templates
                  .filter((t) => t.channel === "whatsapp")
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => openWhatsApp(t)}
                      className="w-full text-left rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 hover:border-brand/30 transition flex items-center justify-between"
                    >
                      <span>{t.name}</span>
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </button>
                  ))}
              </div>
            </section>
          )}
        </div>

        {/* Center/Right column: Tabs & timelines */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-wrap border-b">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-3 px-6 font-semibold text-sm border-b-2 transition ${
                activeTab === "overview" ? "border-brand-hover text-brand-hover" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("requirements")}
              className={`pb-3 px-6 font-semibold text-sm border-b-2 transition ${
                activeTab === "requirements" ? "border-brand-hover text-brand-hover" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Requirements
            </button>
            <button
              onClick={() => setActiveTab("properties")}
              className={`pb-3 px-6 font-semibold text-sm border-b-2 transition ${
                activeTab === "properties" ? "border-brand-hover text-brand-hover" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`pb-3 px-6 font-semibold text-sm border-b-2 transition ${
                activeTab === "activity" ? "border-brand-hover text-brand-hover" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Activity
            </button>
            <button
              onClick={() => setActiveTab("offers")}
              className={`pb-3 px-6 font-semibold text-sm border-b-2 transition ${
                activeTab === "offers" ? "border-brand-hover text-brand-hover" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Offers
            </button>
            <button
              onClick={() => setActiveTab("intelligence")}
              className={`pb-3 px-6 font-semibold text-sm border-b-2 transition ${
                activeTab === "intelligence" ? "border-brand-hover text-brand-hover" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Lead Intelligence
            </button>
          </div>

          {activeTab === "activity" && (
            <div className="space-y-6">
              {/* Quick Log Editor Box */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-brand" />
                    Quick Log: {activeLogType.toUpperCase()}
                  </p>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>

                {activeLogType === "task" ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter task description (e.g. Follow up on property options)"
                      value={logText}
                      onChange={(e) => setLogText(e.target.value)}
                    />
                    <div className="flex gap-3 items-center">
                      <Label className="text-xs">Due Date:</Label>
                      <Input
                        type="datetime-local"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="max-w-[200px]"
                      />
                    </div>
                  </div>
                ) : (
                  <Input
                    placeholder={`Type details to log ${activeLogType === "note" ? "a note" : activeLogType === "call" ? "a call record" : activeLogType === "email" ? "an email summary" : "a meeting summary"}...`}
                    value={logText}
                    onChange={(e) => setLogText(e.target.value)}
                  />
                )}
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-500 italic">
                    {activeLogType === "task" ? "Task will be saved with due timestamp" : "Note log will be saved with current timestamp"}
                  </p>
                  <Button
                    size="sm"
                    variant="gold"
                    disabled={busy || !logText.trim()}
                    onClick={submitQuickLog}
                    className="gap-1.5 shadow-sm text-xs font-extrabold"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {activeLogType === "task" ? "Save Task" : "Save Note"}
                  </Button>
                </div>
              </div>

              {/* Timeline filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border">
                <div className="flex flex-wrap gap-1.5">
                  {["ALL", "NOTES", "CALLS", "MEETINGS", "EMAILS"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setActivityFilter(f)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        activityFilter === f ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="relative max-w-[200px] w-full">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search logs..."
                    value={activitySearch}
                    onChange={(e) => setActivitySearch(e.target.value)}
                    className="pl-8 py-1 h-8 text-xs"
                  />
                </div>
              </div>

              {/* Activities timeline list */}
              <section className="rounded-2xl border bg-white p-6 space-y-4 shadow-sm">
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {filteredActivities.map((a) => (
                    <div key={a.id} className="flex gap-3 items-start border-l-2 border-slate-100 pl-4 relative pb-2">
                      <div className="absolute -left-[9px] top-1 bg-white border rounded-full p-1 shadow-sm">
                        {getActivityIcon(a.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                            {a.type === "NOTE" ? "NOTE" : a.type === "CALL" ? "CALL" : a.type === "MEETING" ? "MEETING" : a.type === "EMAIL" ? "EMAIL" : a.type === "STAGE" ? "STAGE" : a.type === "TASK_CREATED" ? "TASK" : a.type} {a.user ? `BY ${a.user.name}` : ""}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(a.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{a.message}</p>
                      </div>
                    </div>
                  ))}
                  {filteredActivities.length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-6">No matching logs found.</p>
                  )}
                </div>
              </section>

              {/* Tasks list */}
              <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
                <h3 className="font-semibold text-slate-900">Pending &amp; Completed Tasks</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {lead.tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 rounded-xl bg-slate-50 border p-3.5">
                      <button
                        type="button"
                        onClick={() => toggleTask(t.id, t.completed)}
                        className={`h-5 w-5 rounded border flex items-center justify-center transition ${
                          t.completed ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-300"
                        }`}
                      >
                        {t.completed && <Check className="h-3.5 w-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${t.completed ? "line-through text-slate-400" : "font-medium text-slate-800"}`}>
                          {t.title}
                        </p>
                        {t.dueAt && (
                          <p className="text-[10px] text-slate-400 mt-0.5">Due: {new Date(t.dueAt).toLocaleString()}</p>
                        )}
                      </div>
                      <button type="button" onClick={() => deleteTask(t.id)} className="text-slate-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {lead.tasks.length === 0 && (
                    <p className="text-slate-400 text-xs text-center py-4">No tasks linked to this lead.</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {activeTab === "requirements" && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-6">
              <h3 className="font-semibold text-slate-900 text-base">Client Property Requirements</h3>
              <p className="text-xs text-slate-500 -mt-3">Specify client's criteria to dynamically filter and rank matched properties.</p>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Preferred Budget (Min - INR)</Label>
                  <Input
                    type="number"
                    placeholder="Min budget e.g. 4000000"
                    value={reqBudgetMin}
                    onChange={(e) => setReqBudgetMin(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Preferred Budget (Max - INR)</Label>
                  <Input
                    type="number"
                    placeholder="Max budget e.g. 9000000"
                    value={reqBudgetMax}
                    onChange={(e) => setReqBudgetMax(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Preferred Category</Label>
                  <Input
                    placeholder="e.g. Apartment, Flat, Villa"
                    value={reqCategory}
                    onChange={(e) => setReqCategory(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Preferred Type</Label>
                  <select
                    className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-slate-50"
                    value={reqType}
                    onChange={(e) => setReqType(e.target.value)}
                  >
                    <option value="">— Select Type —</option>
                    <option value="RESIDENTIAL">RESIDENTIAL</option>
                    <option value="COMMERCIAL">COMMERCIAL</option>
                    <option value="LAND">LAND</option>
                    <option value="RENTAL">RENTAL</option>
                  </select>
                </div>
                <div>
                  <Label>Preferred Configuration (Bedrooms)</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2, 3"
                    value={reqBedrooms}
                    onChange={(e) => setReqBedrooms(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {bhkOptions.length > 0 && (
                  <div>
                    <Label>Preferred BHK / Configuration</Label>
                    <select
                      className="w-full rounded-xl border px-3 py-2 text-sm mt-1 bg-slate-50"
                      value={reqBhk}
                      onChange={(e) => setReqBhk(e.target.value)}
                    >
                      <option value="">— Any BHK —</option>
                      {bhkOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <Label>Preferred City</Label>
                  <Input
                    placeholder="e.g. Pune, Mumbai"
                    value={reqCity}
                    onChange={(e) => setReqCity(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Preferred Area</Label>
                  <Input
                    placeholder="e.g. Deccan, Wanowrie"
                    value={reqArea}
                    onChange={(e) => setReqArea(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="flex justify-end pt-3">
                <Button disabled={busy} onClick={handleSaveRequirements} variant="gold">
                  Save Requirements
                </Button>
              </div>
            </div>
          )}

          {activeTab === "properties" && (
            <div className="grid gap-6 md:grid-cols-3">
              {/* Left Column: Property Interest & Suggested List */}
              <div className="md:col-span-1 space-y-6">
                {/* Property Interest card */}
                <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
                  <h4 className="font-semibold text-slate-800 text-sm tracking-wide uppercase">Property Interest</h4>
                  {lead.property ? (
                    <div className="flex gap-3 items-center rounded-xl bg-slate-50 border p-3">
                      <div className="h-12 w-12 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400 font-bold shrink-0">
                        {lead.property.symbol}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{lead.property.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Primary Inquiry</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">No primary property associated yet.</p>
                  )}
                </div>

                {/* ALSO INTERESTED IN (Suggested List) */}
                <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
                  <h4 className="font-semibold text-slate-850 text-xs font-bold tracking-wider uppercase">Also Interested In</h4>
                  <div className="space-y-2">
                    {properties
                      .filter((p) => suggestedPropertyIds.includes(p.id))
                      .map((p) => (
                        <div key={p.id} className="group flex justify-between items-center bg-slate-50 hover:bg-slate-100/70 border rounded-xl p-3 transition">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate">{p.title}</p>
                            <p className="text-[10px] text-emerald-650 font-bold mt-0.5">(Suggested)</p>
                          </div>
                          <button
                            onClick={() => handleUnsuggestProperty(p.id)}
                            className="text-xs text-slate-400 hover:text-red-500 font-bold px-2 py-1"
                            title="Remove suggestion"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    {properties.filter((p) => suggestedPropertyIds.includes(p.id)).length === 0 && (
                      <p className="text-xs text-slate-400">No properties suggested yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Matched Properties List */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-slate-855 text-xs font-bold tracking-wider uppercase">Matched Properties</h4>
                  <span className="text-xs text-slate-500">{matchedPropertiesList.length} total options</span>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {matchedPropertiesList.map(({ property: p, percentage, matches }) => {
                    const isSuggested = suggestedPropertyIds.includes(p.id);
                    const parsedImages = (() => {
                      try { return JSON.parse(p.images); } catch(e) { return []; }
                    })();
                    const thumbUrl = parsedImages[0] || null;

                    return (
                      <div key={p.id} className="flex gap-4 bg-white border hover:shadow-md transition duration-205 rounded-2xl p-4 items-center">
                        {/* Thumbnail image */}
                        <div className="h-16 w-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                          {thumbUrl ? (
                            <img src={thumbUrl} alt={p.title} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">{p.symbol}</span>
                          )}
                        </div>

                        {/* Property details */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="font-bold text-slate-900 text-sm truncate hover:text-brand-hover">
                              <Link href={`/properties/${p.slug}`} target="_blank">{p.title}</Link>
                            </h5>
                          </div>
                          
                          <p className="text-xs text-slate-500 font-medium">
                            ₹{p.price >= 10000000 ? `${(p.price / 10000000).toFixed(2)} Cr` : `${(p.price / 100000).toFixed(2)} Lakh`} · {p.area ? `${p.area}, ` : ""}{p.city}
                          </p>

                          {/* Criterion Tags */}
                          <div className="flex flex-wrap gap-1 mt-1 text-[10px] font-semibold">
                            <span className={`px-1.5 py-0.5 rounded ${matches.budget ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>Budget</span>
                            <span className={`px-1.5 py-0.5 rounded ${matches.category ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>Category</span>
                            <span className={`px-1.5 py-0.5 rounded ${matches.type ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>Type</span>
                            <span className={`px-1.5 py-0.5 rounded ${matches.config ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>Config</span>
                            <span className={`px-1.5 py-0.5 rounded ${matches.city ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>City</span>
                            <span className={`px-1.5 py-0.5 rounded ${matches.area ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>Area</span>
                            {matches.bhk !== undefined && (
                              <span className={`px-1.5 py-0.5 rounded ${matches.bhk ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-100"}`}>BHK</span>
                            )}
                          </div>
                        </div>

                        {/* Match Percentage & Action Buttons */}
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <span className={`text-lg font-extrabold ${percentage >= 80 ? "text-emerald-600" : percentage >= 60 ? "text-sky-650" : "text-amber-600"}`}>
                              {percentage}%
                            </span>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <Button
                              size="sm"
                              variant={isSuggested ? "secondary" : "gold"}
                              className="h-7 text-xs px-2.5 font-semibold py-1 flex items-center gap-1"
                              onClick={() => isSuggested ? handleUnsuggestProperty(p.id) : handleSuggestProperty(p.id)}
                            >
                              {isSuggested ? "Suggested" : "Suggest"}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-xs px-2.5 font-semibold py-1 flex items-center gap-1 border-slate-200 text-slate-600 hover:bg-slate-50"
                              onClick={() => handleShareProperty(p.slug, p.title)}
                            >
                              Share
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {matchedPropertiesList.length === 0 && (
                    <p className="text-slate-400 text-sm text-center py-10">No matching properties found.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "offers" && (
            <div className="rounded-2xl border bg-white p-6 shadow-sm text-center py-12 space-y-2">
              <h3 className="font-semibold text-slate-900 text-base">Client Offers &amp; Bids</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">This lead has not submitted or received any official negotiation offers yet.</p>
            </div>
          )}

          {activeTab === "overview" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-2">
                <h4 className="font-semibold text-slate-900 text-sm">Status &amp; Routing</h4>
                <p className="text-sm text-slate-600">
                  <strong>Lifecycle Stage:</strong> {edit.lifecycleStage}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Lead Status:</strong> {edit.leadStatus}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Owner / Advisor:</strong> {lead.owner ? lead.owner.name : "Unassigned"}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Source Channel:</strong> {lead.source}
                </p>
              </div>

              <div className="rounded-2xl border bg-white p-5 shadow-sm space-y-2">
                <h4 className="font-semibold text-slate-900 text-sm">Property Interest</h4>
                {lead.property ? (
                  <>
                    <p className="text-sm font-semibold text-brand-hover">{lead.property.symbol}</p>
                    <p className="text-xs text-slate-600 font-medium">{lead.property.title}</p>
                    <Link
                      href={`/properties/${lead.property.slug}`}
                      className="text-xs text-slate-400 hover:text-brand-hover flex items-center gap-1 mt-1 underline"
                    >
                      View property listing <ExternalLink className="h-3 w-3" />
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">No properties associated yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "intelligence" && (
            <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-hover animate-pulse" />
                  Lead Score: {lead.score} / 100
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Automatic AI-driven scoring calculated dynamically based on details, interaction depth, and lifecycle stages.
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-slate-800 text-sm mb-3">Scoring Breakdown</h4>
                <div className="space-y-2">
                  {scoreDetails.details.map((d, i) => (
                    <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                      <span className="text-slate-600">{d.label}</span>
                      <span className={`font-mono font-bold ${d.score >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {d.score >= 0 ? `+${d.score}` : d.score} pts
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-sm font-bold pt-3 text-slate-900 border-t">
                    <span>Final Calculated Score</span>
                    <span>{scoreDetails.total} / 100</span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
