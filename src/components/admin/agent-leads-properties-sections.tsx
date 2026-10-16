"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Search,
  UserCheck,
  Building2,
  Phone,
  Mail,
  Calendar,
  IndianRupee,
  ExternalLink,
  Edit,
  Filter,
  ArrowUpRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type LeadProperty = {
  id: string;
  title: string;
  symbol: string;
  slug?: string | null;
  price: number;
  city: string;
  state: string;
  address?: string | null;
  images?: string | null;
  image?: string | null;
  isPublished?: boolean;
};

export type AgentLead = {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  source: string;
  stage: string;
  leadStatus: string;
  lifecycleStage: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  requirements?: string | null;
  notes?: string | null;
  nextFollowUpAt?: string | null;
  createdAt: string;
  property?: LeadProperty | null;
  inquiry?: { property?: LeadProperty | null } | null;
  showing?: { property?: LeadProperty | null } | null;
};

export type InterestedPropertyWithLeads = {
  property: LeadProperty;
  associatedLeads: { id: string; userId?: string | null; name: string; email: string; stage: string }[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatCurrencyINR(amount: number): string {
  if (!amount || isNaN(amount)) return "₹0";
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getPropertyThumbnail(property: LeadProperty): string | null {
  if (property.image) return property.image;
  if (property.images) {
    try {
      const parsed = JSON.parse(property.images);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === "string") return parsed[0];
    } catch {
      if (typeof property.images === "string" && property.images.startsWith("http")) return property.images;
    }
  }
  return null;
}

const STAGE_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  NEW:         { bg: "bg-blue-50 dark:bg-blue-950/70",    text: "text-blue-800 dark:text-blue-200",    border: "border-blue-300 dark:border-blue-800" },
  CONTACTED:   { bg: "bg-purple-50 dark:bg-purple-950/70",  text: "text-purple-800 dark:text-purple-200",  border: "border-purple-300 dark:border-purple-800" },
  QUALIFIED:   { bg: "bg-amber-50 dark:bg-amber-950/70",   text: "text-amber-900 dark:text-amber-200",   border: "border-amber-300 dark:border-amber-800" },
  PROPOSAL:    { bg: "bg-indigo-50 dark:bg-indigo-950/70",  text: "text-indigo-800 dark:text-indigo-200",  border: "border-indigo-300 dark:border-indigo-800" },
  NEGOTIATION: { bg: "bg-orange-50 dark:bg-orange-950/70", text: "text-orange-900 dark:text-orange-200", border: "border-orange-300 dark:border-orange-800" },
  WON:         { bg: "bg-emerald-50 dark:bg-emerald-950/70", text: "text-emerald-900 dark:text-emerald-200", border: "border-emerald-300 dark:border-emerald-800" },
  LOST:        { bg: "bg-red-50 dark:bg-red-950/70",     text: "text-red-800 dark:text-red-200",     border: "border-red-300 dark:border-red-800" },
};

function getStageBadge(stage: string) {
  const upper = (stage || "NEW").toUpperCase();
  const cfg = STAGE_BADGES[upper] || { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-800 dark:text-slate-200", border: "border-slate-300 dark:border-slate-700" };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {stage}
    </span>
  );
}

// ─── Extraction Helper ────────────────────────────────────────────────────────
export function getInterestedPropertiesFromLeads(leads: AgentLead[]): InterestedPropertyWithLeads[] {
  const propertyMap = new Map<string, InterestedPropertyWithLeads>();

  for (const lead of leads) {
    const propsToProcess: (LeadProperty | null | undefined)[] = [
      lead.property,
      lead.inquiry?.property,
      lead.showing?.property,
    ];

    for (const prop of propsToProcess) {
      if (!prop || !prop.id) continue;

      if (!propertyMap.has(prop.id)) {
        propertyMap.set(prop.id, {
          property: prop,
          associatedLeads: [],
        });
      }

      const entry = propertyMap.get(prop.id)!;
      const alreadyHasLead = entry.associatedLeads.some((l) => l.id === lead.id);
      if (!alreadyHasLead) {
        entry.associatedLeads.push({
          id: lead.id,
          userId: lead.userId || null,
          name: lead.name,
          email: lead.email,
          stage: lead.stage || lead.leadStatus || "New",
        });
      }
    }
  }

  return Array.from(propertyMap.values());
}

// ─── 1. Assigned Leads Section Component ──────────────────────────────────────
export function AgentAssignedLeadsSection({ leads }: { leads: AgentLead[] }) {
  const [search, setSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState("ALL");

  const stagesList = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => { if (l.stage) set.add(l.stage); });
    return ["ALL", ...Array.from(set)];
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const matchesStage = selectedStage === "ALL" || l.stage === selectedStage;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.phone && l.phone.includes(q)) ||
        (l.requirements && l.requirements.toLowerCase().includes(q)) ||
        (l.source && l.source.toLowerCase().includes(q));

      return matchesStage && matchesSearch;
    });
  }, [leads, search, selectedStage]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-slate-700" />
            Assigned Leads ({leads.length})
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Complete list of prospective clients assigned to this agent
          </p>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 w-44 sm:w-56 transition"
            />
          </div>

          {/* Stage Dropdown */}
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-400 transition"
            >
              {stagesList.map((st) => (
                <option key={st} value={st}>
                  {st === "ALL" ? "All Stages" : st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
          <UserCheck className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No assigned leads found</p>
          <p className="text-xs text-slate-500 mt-1">
            {leads.length === 0
              ? "No leads are currently assigned to this agent."
              : "No leads match your search or stage filters."}
          </p>
        </div>
      ) : (
        /* Leads Grid / Cards */
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {filteredLeads.map((lead) => {
            const hasBudget = (lead.budgetMin && lead.budgetMin > 0) || (lead.budgetMax && lead.budgetMax > 0);
            const linkedProp = lead.property || lead.inquiry?.property || lead.showing?.property;

            return (
              <div
                key={lead.id}
                className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 hover:border-slate-300 transition shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Info Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={lead.userId ? `/admin/users/${lead.userId}` : `/admin/leads?search=${encodeURIComponent(lead.name || lead.email)}`}
                        className="text-sm font-bold text-slate-900 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                      >
                        {lead.name}
                        <ArrowUpRight className="h-3.5 w-3.5 text-slate-400" />
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <a href={`mailto:${lead.email}`} className="hover:underline hover:text-slate-900">
                            {lead.email}
                          </a>
                        </span>
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <a href={`tel:${lead.phone}`} className="hover:underline hover:text-slate-900">
                              {lead.phone}
                            </a>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStageBadge(lead.stage || lead.leadStatus || "NEW")}
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {lead.source}
                      </span>
                    </div>
                  </div>

                  {/* Details Badges & Budget */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Assigned Date</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Budget</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <IndianRupee className="h-3 w-3 text-slate-400" />
                        {hasBudget ? (
                          <>
                            {lead.budgetMin ? formatCurrencyINR(lead.budgetMin) : "Any"} -{" "}
                            {lead.budgetMax ? formatCurrencyINR(lead.budgetMax) : "Flexible"}
                          </>
                        ) : (
                          <span className="text-slate-400 italic">Not specified</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Requirements / Notes */}
                  {(lead.requirements || lead.notes) && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
                      {lead.requirements && (
                        <p className="text-slate-700 font-medium">
                          <span className="font-bold text-slate-900">Requirements: </span>
                          {lead.requirements}
                        </p>
                      )}
                      {lead.notes && (
                        <p className="text-slate-500 italic">
                          <span className="font-bold text-slate-700 not-italic">Notes: </span>
                          {lead.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Linked Interested Property snippet */}
                {linkedProp && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs mt-2">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 truncate">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      Interested Property: <span className="font-bold text-slate-900 truncate">{linkedProp.title}</span>
                    </span>
                    <Link
                      href={`/admin/properties/${linkedProp.id}/edit`}
                      className="text-[11px] font-bold text-slate-900 hover:text-slate-700 inline-flex items-center gap-0.5 underline shrink-0"
                    >
                      View Property <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── 2. Interested Properties Section Component ───────────────────────────────
export function AgentInterestedPropertiesSection({ leads }: { leads: AgentLead[] }) {
  const interestedProperties = useMemo(() => {
    return getInterestedPropertiesFromLeads(leads);
  }, [leads]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-700" />
            Interested Properties ({interestedProperties.length})
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            All properties associated with this agent&apos;s assigned leads (<span className="font-semibold text-slate-700">Agent → Assigned Leads → Interested Properties</span>)
          </p>
        </div>
      </div>

      {/* Empty State */}
      {interestedProperties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No interested properties found</p>
          <p className="text-xs text-slate-500 mt-1">
            None of the leads assigned to this agent are currently linked to any properties.
          </p>
        </div>
      ) : (
        /* Properties Grid */
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {interestedProperties.map(({ property, associatedLeads }) => {
            const thumbnail = getPropertyThumbnail(property);

            return (
              <div
                key={property.id}
                className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 hover:border-slate-300 transition shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header & Symbol */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={property.title}
                          className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {property.symbol || "PROP"}
                        </div>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {property.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {property.city}, {property.state} {property.address ? `· ${property.address}` : ""}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg shrink-0">
                      {formatCurrencyINR(property.price)}
                    </span>
                  </div>

                  {/* Associated Leads Pills */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-slate-400" />
                        Interested Lead(s) ({associatedLeads.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {associatedLeads.map((lead) => (
                        <Link
                          key={lead.id}
                          href={lead.userId ? `/admin/users/${lead.userId}` : `/admin/leads?search=${encodeURIComponent(lead.name || lead.email)}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-400 px-2 py-0.5 rounded-md text-slate-800 hover:text-blue-700 transition shadow-2xs group"
                        >
                          👤 <span className="font-bold underline group-hover:text-blue-700">{lead.name}</span>
                          <span className="text-[10px] text-slate-500 font-medium">({lead.stage})</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Property Clickable Navigation Links */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-3">
                  <Link
                    href={`/admin/properties/${property.id}/edit`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-2 text-xs font-bold transition shadow-xs text-center"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Property Details &amp; Edit
                  </Link>
                  <Link
                    href={`/properties/${property.slug || property.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-xs font-semibold border border-slate-200 transition text-center"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Public View
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
