"use client";

import React, { useState, useEffect } from "react";
import { ViewToggle, useViewMode, viewContainerClass } from "@/components/admin/view-toggle";
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  Upload,
  EyeOff,
  Globe,
  Tag,
  ShieldAlert,
  Phone,
  Mail,
  Video,
  Award,
  BarChart3,
  Sliders,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  ChevronDown,
  Clock,
  X,
  FileCode,
  Users,
  CheckSquare,
  Building,
  Image as ImageIcon,
  Loader2,
  FileSpreadsheet,
  Link2,
  Film,
  Download,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";
import { CountrySelect } from "@/components/ui/country-select";
import { GlobalStateSelect, GlobalCitySelect, GlobalZipSelect } from "@/components/ui/location-select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { State } from "country-state-city";

export interface DeveloperOption {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  description?: string | null;
  experienceYears?: number | null;
  logo?: string | null;
  projectsDelivered?: number | null;
  ongoingProjectsCount?: number | null;
}

export interface ProjectData {
  id: string;
  name: string;
  code?: string | null;
  slug?: string | null;
  developerId?: string | null;
  developer?: DeveloperOption | null;
  projectType?: string | null;
  projectCategory?: string | null;
  status?: string | null;
  reraNumber?: string | null;
  reraRegDate?: string | null;
  possessionDate?: string | null;
  launchDate?: string | null;
  completionDate?: string | null;

  // 2. Location
  country?: string | null;
  state?: string | null;
  city?: string | null;
  area?: string | null;
  locality?: string | null;
  landmark?: string | null;
  address?: string | null;
  zip?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  googleMapsUrl?: string | null;
  mapEmbed?: string | null;

  // 3. Description
  shortDescription?: string | null;
  fullDescription?: string | null;
  highlightsJson?: string | null;
  whyInvestJson?: string | null;
  projectUspJson?: string | null;
  lifestyleDescription?: string | null;

  // 4. Media
  coverImage?: string | null;
  bannerImage?: string | null;
  galleryImagesJson?: string | null;
  masterPlanUrl?: string | null;
  floorPlansJson?: string | null;
  brochurePdfUrl?: string | null;
  priceSheetPdfUrl?: string | null;
  eBrochureUrl?: string | null;
  walkthroughVideoUrl?: string | null;
  youtubeUrl?: string | null;
  virtualTourUrl?: string | null;
  droneVideoUrl?: string | null;
  tour360Url?: string | null;

  // 5. Pricing
  minPrice?: number | null;
  maxPrice?: number | null;
  pricePerSqft?: number | null;
  bookingAmount?: number | null;
  maintenanceCharges?: number | null;
  plcCharges?: number | null;
  gstPct?: number | null;
  stampDutyPct?: number | null;
  registrationCharges?: number | null;
  otherCharges?: number | null;
  priceHistoryJson?: string | null;
  offersJson?: string | null;
  discountsJson?: string | null;
  festiveOffersJson?: string | null;

  // 6. Unit Configurations, 7. Towers & 8. Inventory
  configurationsJson?: string | null;
  towersJson?: string | null;
  unitsJson?: string | null;

  // New: media assets, pricing extras & sales managers
  assetsJson?: string | null;
  videosJson?: string | null;
  pricingExtraJson?: string | null;
  salesManagersJson?: string | null;

  // 9. Amenities & 10. Nearby & 11. Specs & 12. Docs & 21. Timeline
  amenitiesJson?: string | null;
  nearbyPlacesJson?: string | null;
  specificationsJson?: string | null;
  documentsJson?: string | null;
  timelineJson?: string | null;

  // 15. Builder Info
  builderName?: string | null;
  builderLogo?: string | null;
  aboutBuilder?: string | null;
  yearsExperience?: number | null;
  projectsDelivered?: number | null;
  ongoingProjectsCount?: number | null;
  website?: string | null;

  // 14. Sales & 16. Contact & 17. Lead Settings
  salesStatus?: string | null;
  inventoryPct?: number | null;
  availableUnitsCount?: number | null;
  soldUnitsCount?: number | null;
  reservedUnitsCount?: number | null;
  launchOffer?: string | null;
  salesPhone?: string | null;
  salesEmail?: string | null;
  salesWhatsapp?: string | null;
  salesOfficeAddress?: string | null;
  crmAssignedId?: string | null;
  salesManagerName?: string | null;
  leadSettingsJson?: string | null;

  // 18. Website Controls & 13. SEO & 19. Tags
  showOnWebsite?: boolean;
  featured?: boolean;
  trending?: boolean;
  isNewLaunch?: boolean;
  isHotProperty?: boolean;
  isSoldOut?: boolean;
  enableEnquiry?: boolean;
  enablePriceRequest?: boolean;
  enableDownloadBrochure?: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
  tagsJson?: string | null;

  // 20. Financial
  financialInfoJson?: string | null;

  // 23. Settings & 24. Custom Fields & 22. Analytics & 25. Relationships
  visibility?: string | null;
  customFieldsJson?: string | null;
  analyticsJson?: string | null;
  analyticsConfigJson?: string | null;
  relationshipsJson?: string | null;
  salesInfoJson?: string | null;
  builderExtraJson?: string | null;
  settingsJson?: string | null;
  sectionVisibilityJson?: string | null;

  _count?: { properties: number };
  createdAt?: string;
}

interface ProjectManagerProps {
  initialProjects?: ProjectData[];
  developersList?: DeveloperOption[];
  preselectedDeveloperId?: string;
}

const PROJECT_TAB_SECTIONS = [
  { id: "basic", label: "1. Basic Info", icon: Building2 },
  { id: "location", label: "2. Location", icon: MapPin },
  { id: "description", label: "3. Project Description", icon: FileText },
  { id: "media", label: "4. Media & Assets", icon: Video },
  { id: "pricing", label: "5. Pricing & Offers", icon: DollarSign },
  { id: "configs", label: "6. Unit Configurations", icon: Layers },
  { id: "towers", label: "7. Towers / Buildings", icon: Building2 },
  { id: "inventory", label: "8. Linked Inventory", icon: Layers },
  { id: "amenities", label: "9. Amenities", icon: Sparkles },
  { id: "nearby", label: "10. Nearby Places", icon: MapPin },
  { id: "specifications", label: "11. Specifications", icon: Sliders },
  { id: "documents", label: "12. Documents", icon: FileText },
  { id: "seo", label: "13. SEO Metadata", icon: Globe },
  { id: "sales", label: "14. Sales Information", icon: Phone },
  { id: "builder", label: "15. Builder Info", icon: Award },
  { id: "contact", label: "16. Contact Info", icon: Mail },
  { id: "leads", label: "17. Lead Settings", icon: Users },
  { id: "website_controls", label: "18. Website Controls", icon: Eye },
  { id: "tags", label: "19. Tags & Badges", icon: Tag },
  { id: "financial", label: "20. Financial & Loans", icon: DollarSign },
  { id: "timeline", label: "21. Timeline & Progress", icon: Clock },
  { id: "analytics", label: "22. Analytics & Performance", icon: BarChart3 },
  { id: "settings", label: "23. Project Settings", icon: Sliders },
  { id: "custom_fields", label: "24. Dynamic Custom Fields", icon: FileCode },
  { id: "relationships", label: "25. Relationships", icon: Users },
];

export function ProjectManager({
  initialProjects = [],
  developersList = [],
  preselectedDeveloperId = "ALL",
}: ProjectManagerProps) {
  const { hasAddPermission, hasEditPermission, hasDeletePermission } = useAdminPermissions();
  const canAdd = hasAddPermission("/admin/projects");
  const canEdit = hasEditPermission("/admin/projects");
  const canDelete = hasDeletePermission("/admin/projects");

  const [projects, setProjects] = useState<ProjectData[]>(initialProjects);
  const [developers, setDevelopers] = useState<DeveloperOption[]>(developersList);
  const [selectedDeveloperId, setSelectedDeveloperId] = useState<string>(preselectedDeveloperId);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useViewMode("admin-projects");

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ProjectData>>({
    name: "",
    code: "",
    slug: "",
    developerId: selectedDeveloperId !== "ALL" ? selectedDeveloperId : "",
    projectType: "Apartment",
    projectCategory: "Residential",
    status: "New Launch",
    country: "IN",
    state: "",
    city: "",
    area: "",
    locality: "",
    landmark: "",
    address: "",
    zip: "",
    minPrice: 5000000,
    maxPrice: 15000000,
    pricePerSqft: 7500,
    showOnWebsite: true,
    featured: false,
    trending: false,
    isNewLaunch: true,
    isHotProperty: false,
    isSoldOut: false,
    enableEnquiry: true,
    enablePriceRequest: true,
    enableDownloadBrochure: true,
    visibility: "Public",
    salesStatus: "Booking Open",
    salesOfficeAddress: "",
    salesPhone: "",
    salesEmail: "",
    salesWhatsapp: "",
    crmAssignedId: "",
    salesManagerName: "",
  });

  // Dynamic Lists & Structures
  const [configurationsList, setConfigurationsList] = useState<any[]>([
    { type: "1 BHK", size: "650 sqft", startingPrice: "4500000", carpetArea: "500 sqft", builtupArea: "600 sqft", balcony: 1, bathrooms: 1, parking: 1, studyRoom: false, servantRoom: false },
    { type: "2 BHK", size: "980 sqft", startingPrice: "6800000", carpetArea: "750 sqft", builtupArea: "900 sqft", balcony: 2, bathrooms: 2, parking: 1, studyRoom: false, servantRoom: false },
    { type: "3 BHK", size: "1350 sqft", startingPrice: "9500000", carpetArea: "1050 sqft", builtupArea: "1250 sqft", balcony: 3, bathrooms: 3, parking: 2, studyRoom: true, servantRoom: false },
    { type: "Villa", size: "2500 sqft", startingPrice: "20000000", carpetArea: "2100 sqft", builtupArea: "2400 sqft", balcony: 4, bathrooms: 4, parking: 2, studyRoom: true, servantRoom: true },
  ]);

  const [towersList, setTowersList] = useState<any[]>([
    { name: "Tower A", number: "1", floors: 24, liftCount: 3, unitsPerFloor: 4, status: "Under Construction", possession: "Dec 2027" },
    { name: "Tower B", number: "2", floors: 24, liftCount: 3, unitsPerFloor: 4, status: "Under Construction", possession: "Dec 2027" },
  ]);

  const [inventoryList, setInventoryList] = useState<any[]>([
    { unitNo: "A-101", tower: "Tower A", floor: 1, facing: "East", area: "1350 sqft", config: "3 BHK", status: "Available", price: 9500000, parking: 1 },
    { unitNo: "A-102", tower: "Tower A", floor: 1, facing: "North", area: "980 sqft", config: "2 BHK", status: "Booked", price: 6800000, parking: 1 },
  ]);

  const [nearbyPlacesList, setNearbyPlacesList] = useState<any[]>([
    { category: "School", name: "ABC International School", distance: "1.2 km", travelTime: "5 min" },
    { category: "Hospital", name: "City Super Specialty Hospital", distance: "2.0 km", travelTime: "8 min" },
    { category: "Metro", name: "Central Metro Station", distance: "800 m", travelTime: "3 min" },
    { category: "Airport", name: "International Airport", distance: "15 km", travelTime: "25 min" },
  ]);

  const [specificationsObj, setSpecificationsObj] = useState<Record<string, string>>({
    flooring: "Imported Italian Marble in Living & Dining, Wooden Flooring in Bedrooms",
    kitchen: "Modular Kitchen with Granite Countertop & Stainless Steel Sink",
    bathroom: "Premium Kohler / Grohe Sanitary Ware & CP Fittings",
    electrical: "Concealed Copper Wiring with Modular Switches (Havells/Legrand)",
    doors: "Teak Wood Frame Main Door with Digital Smart Lock",
    windows: "UPVC Soundproof Double Glazed Sliding Windows",
    walls: "Smooth POP Finish with Acrylic Emulsion Paint",
    painting: "Weatherproof Exterior Paint",
    lift: "High-Speed Mitsubishi / Otis Automatic Passenger Lifts",
    structure: "Earthquake Resistant RCC Frame Structure Zone 5",
  });

  const [documentsObj, setDocumentsObj] = useState<Record<string, string>>({
    reraCertificate: "",
    approvalDocuments: "",
    occupancyCertificate: "",
    completionCertificate: "",
    nocDocuments: "",
    layoutPlanPdf: "",
    legalDocuments: "",
    sampleAgreementPdf: "",
  });

  const [amenitiesMap, setAmenitiesMap] = useState<Record<string, boolean>>({
    Gym: true, Clubhouse: true, Library: true, IndoorGames: true, BanquetHall: true,
    SwimmingPool: true, Garden: true, CricketPitch: false, Basketball: true, Tennis: true, KidsPlayArea: true, JoggingTrack: true,
    CCTV: true, Security: true, FireFighting: true, Intercom: true,
    PowerBackup: true, WaterSupply: true, EVCharging: true, RainWaterHarvesting: true, Solar: true,
  });

  const [tagsMap, setTagsMap] = useState<Record<string, boolean>>({
    Luxury: true, NearMetro: true, ReadyToMove: false, Investment: true, Premium: true,
    Affordable: false, CornerPlot: false, LakeView: false, HillView: false, SmartHome: true,
  });

  // Section 17: Lead Settings
  const [leadSettingsObj, setLeadSettingsObj] = useState<any>({
    assignTeam: "",
    assignTeamId: "",
    defaultLeadSource: "Website",
    autoAssignment: true,
    notificationEmail: "leads@projectdomain.com",
    whatsappNotification: true,
    leadFormEnabled: true,
  });

  // Section 20: Financial Information (richer structure with listings)
  const [financialInfoObj, setFinancialInfoObj] = useState<any>({
    emiAvailable: true,
    emiCalculator: true,
    paymentPlans: [
      { name: "Construction Linked Plan", type: "CLP", details: "10% Booking, 15% Excavation, 15% Slab 5, 10% Possession", enabled: true },
      { name: "Down Payment Plan", type: "Down Payment", details: "10% Booking, 80% in 30 Days (8% Discount), 10% Possession", enabled: true },
    ],
    bankApprovals: [
      { bankName: "HDFC Bank", loanType: "Home Loan", interestRate: "8.70", maxFundingPct: "80", status: "Approved" },
      { bankName: "SBI", loanType: "Home Loan", interestRate: "8.50", maxFundingPct: "85", status: "Approved" },
    ],
    loanPartners: [{ name: "HDFC Bank" }, { name: "ICICI Bank" }, { name: "SBI" }, { name: "Axis Bank" }],
  });

  // Section 21: Timeline (extended with milestones, videos & video links)
  const [timelineObj, setTimelineObj] = useState<any>({
    foundationStatus: "Completed",
    structureStatus: "Completed",
    finishingStatus: "Ongoing",
    possessionDateText: "Dec 2028",
    progressImages: [
      "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7",
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
    ],
    milestones: [],
    videos: [],
    videoLinks: [],
  });

  const [newProgressImageUrl, setNewProgressImageUrl] = useState("");

  // Section 22: Analytics (extended with custom metrics)
  const [analyticsObj, setAnalyticsObj] = useState<any>({
    views: 1240,
    enquiries: 84,
    favorites: 42,
    shortlisted: 28,
    conversions: 12,
    revenue: 45000000,
    leadSources: "Website (45%), Google Ads (30%), Walk-in (15%), Referral (10%)",
    customMetrics: [],
  });

  // Section 25: Relationships
  const [relationshipsMap, setRelationshipsMap] = useState<Record<string, boolean>>({
    PropertiesUnits: true,
    Leads: true,
    Customers: true,
    Builders: true,
    Agents: true,
    SalesTeam: true,
    Tasks: true,
    Documents: true,
    Campaigns: true,
    SiteVisits: true,
    Bookings: true,
    Payments: true,
    Invoices: true,
    Collections: true,
    Agreements: true,
  });

  // Section 24: Dynamic Custom Fields
  const [customFieldsList, setCustomFieldsList] = useState<any[]>([]);
  const [newCustomFieldName, setNewCustomFieldName] = useState("");
  const [newCustomFieldType, setNewCustomFieldType] = useState("Text");
  const [newCustomFieldValue, setNewCustomFieldValue] = useState("");

  // New dynamic lists & section helpers
  const [galleryList, setGalleryList] = useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [videosList, setVideosList] = useState<any[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [uspList, setUspList] = useState<string[]>([]);
  const [locationStateCode, setLocationStateCode] = useState("");
  const [fieldDefaults, setFieldDefaults] = useState<any>(null);
  const [newNearbyCategory, setNewNearbyCategory] = useState("");
  const [salesInfoObj, setSalesInfoObj] = useState<Record<string, string>>({});
  const [newSalesLabel, setNewSalesLabel] = useState("");
  const [builderExtraList, setBuilderExtraList] = useState<any[]>([]);
  const [settingsObj, setSettingsObj] = useState<any>({});
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({});
  const [analyticsConfig, setAnalyticsConfig] = useState<any>({});
  const [orgHierarchy, setOrgHierarchy] = useState<any>(null);

  // Clean display label: keep already-spaced labels / acronyms as-is, split camelCase otherwise.
  const niceLabel = (k: string) => (/\s/.test(k) ? k : k.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (c) => c.toUpperCase()));

  // Build project field maps from the central catalog (enabled items only).
  const amenitiesFromCatalog = (): Record<string, boolean> => {
    const map: Record<string, boolean> = {};
    (fieldDefaults?.amenities || []).forEach((a: any) => { if (a.enabled && a.label) map[a.label] = true; });
    return map;
  };
  const specsFromCatalog = (): Record<string, string> => {
    const obj: Record<string, string> = {};
    (fieldDefaults?.specifications || []).forEach((s: any) => { if (s.enabled && s.label) obj[s.label] = s.value || ""; });
    return obj;
  };
  const docsFromCatalog = (): Record<string, string> => {
    const obj: Record<string, string> = {};
    (fieldDefaults?.documents || []).forEach((d: any) => { if (d.enabled && d.label) obj[d.label] = ""; });
    return obj;
  };
  const nearbyCategoryOptions = (): string[] => {
    const cats = (fieldDefaults?.nearbyCategories || []).filter((c: any) => c.enabled).map((c: any) => c.label);
    return cats.length ? cats : ["School", "Hospital", "Metro", "Airport", "Mall", "Restaurant", "Bank", "Highway"];
  };

  // Download a sample CSV template with the exact importer columns.
  function downloadSampleCsv(filename: string, headers: string[], example: string[]) {
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(","), example.map(esc).join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  const [assetsList, setAssetsList] = useState<any[]>([]);
  const [pricingExtraList, setPricingExtraList] = useState<any[]>([]);
  const [salesManagersList, setSalesManagersList] = useState<any[]>([]);
  const [teamsOptions, setTeamsOptions] = useState<{ id: string; name: string }[]>([]);
  const [newAmenity, setNewAmenity] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newDocLabel, setNewDocLabel] = useState("");
  const [newSpecLabel, setNewSpecLabel] = useState("");
  const [newVideoLink, setNewVideoLink] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  // Upload a file to the shared /api/upload endpoint (Cloudinary → local fallback).
  async function uploadFile(file: File, kind?: string): Promise<{ url: string; name: string; type: string; kind: string } | null> {
    const fd = new FormData();
    fd.append("file", file);
    if (kind) fd.append("kind", kind);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert(data.error || "Upload failed");
        return null;
      }
      return { url: data.url, name: data.name, type: data.type, kind: data.kind };
    } catch {
      alert("Upload failed. Please try again.");
      return null;
    }
  }

  // Upload a single file straight into a formData URL field (Cover, Banner, PDFs, etc.)
  async function uploadToField(field: keyof ProjectData, file: File, kind?: string) {
    setUploading(`field-${String(field)}`);
    const res = await uploadFile(file, kind);
    if (res) setFormData((prev) => ({ ...prev, [field]: res.url }));
    setUploading(null);
  }

  // Compact "upload a file into this field" button rendered next to a URL input.
  const fieldUploadBtn = (field: keyof ProjectData, accept: string, kind?: string) => (
    <label className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 shrink-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" title="Upload a file">
      {uploading === `field-${String(field)}` ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : <Upload className="h-4 w-4 text-slate-500" />}
      <input type="file" accept={accept} className="hidden" disabled={!!uploading}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadToField(field, f, kind); e.target.value = ""; }} />
    </label>
  );

  // Parse the first sheet of an .xlsx/.csv file into row objects, then map each
  // row via `mapRow` (header lookups are case-insensitive).
  async function parseExcel(file: File, mapRow: (get: (col: string) => any) => any): Promise<any[]> {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    return rows.map((row) => {
      const lower: Record<string, any> = {};
      Object.keys(row).forEach((k) => { lower[k.toLowerCase().trim()] = row[k]; });
      const get = (col: string) => lower[col.toLowerCase().trim()] ?? "";
      return mapRow(get);
    });
  }

  // Fetch developers if not passed
  useEffect(() => {
    if (developersList.length === 0) {
      fetch("/api/admin/developers")
        .then((res) => res.json())
        .then((data) => {
          if (data.developers) setDevelopers(data.developers);
        })
        .catch(() => {});
    }
  }, [developersList]);

  // Fetch projects from API
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const url = new URL("/api/admin/projects", window.location.origin);
      if (selectedDeveloperId !== "ALL") url.searchParams.set("developerId", selectedDeveloperId);
      if (statusFilter !== "ALL") url.searchParams.set("status", statusFilter);
      if (searchQuery) url.searchParams.set("q", searchQuery);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const [dynamicDropdowns, setDynamicDropdowns] = useState<Record<string, Array<{ label: string; value: string }>>>({});

  useEffect(() => {
    async function loadDynamicDropdowns() {
      try {
        const res = await fetch("/api/settings/dropdowns");
        if (res.ok) {
          const data = await res.json();
          if (data.sections && Array.isArray(data.sections)) {
            const projSec = data.sections.find((s: any) => s.sectionKey === "projects");
            if (projSec && Array.isArray(projSec.fields)) {
              const map: Record<string, Array<{ label: string; value: string }>> = {};
              projSec.fields.forEach((field: any) => {
                map[field.key] = (field.options || [])
                  .filter((o: any) => o.enabled !== false)
                  .map((o: any) => ({ label: o.label, value: o.value }));
              });
              setDynamicDropdowns(map);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load project dropdown settings", err);
      }
    }
    loadDynamicDropdowns();
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [selectedDeveloperId, statusFilter, searchQuery]);

  // Load the central field-defaults catalog (amenities/specs/docs/sales/nearby)
  useEffect(() => {
    fetch("/api/admin/project-defaults")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.defaults) setFieldDefaults(data.defaults); })
      .catch(() => {});
  }, []);

  // Load the org hierarchy + users (Lead-Settings cascade & Contact dropdowns)
  useEffect(() => {
    fetch("/api/admin/org-hierarchy")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data?.success) setOrgHierarchy(data); })
      .catch(() => {});
  }, []);

  const crmUsers: any[] = orgHierarchy?.users || [];
  const salesFieldsFromCatalog = (): Record<string, string> => {
    const obj: Record<string, string> = {};
    (fieldDefaults?.salesFields || []).forEach((s: any) => { if (s.enabled && s.label) obj[s.label] = s.value || ""; });
    return obj;
  };

  // Load teams for the Lead Settings "Assign Team" dropdown
  useEffect(() => {
    fetch("/api/admin/teams")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.teams) setTeamsOptions(data.teams.map((t: any) => ({ id: t.id, name: t.name })));
      })
      .catch(() => {});
  }, []);

  const handleOpenAddModal = () => {
    setEditingProjectId(null);
    setFormData({
      name: "",
      code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
      slug: "",
      developerId: selectedDeveloperId !== "ALL" ? selectedDeveloperId : developers[0]?.id || "",
      projectType: "Apartment",
      projectCategory: "Residential",
      status: "New Launch",
      country: "IN",
      state: "",
      city: "",
      area: "",
      locality: "",
      landmark: "",
      address: "",
      zip: "",
      minPrice: 5000000,
      maxPrice: 15000000,
      pricePerSqft: 7500,
      showOnWebsite: true,
      featured: false,
      trending: false,
      isNewLaunch: true,
      isHotProperty: false,
      isSoldOut: false,
      enableEnquiry: true,
      enablePriceRequest: true,
      enableDownloadBrochure: true,
      visibility: "Public",
      salesStatus: "Booking Open",
      salesOfficeAddress: "",
      salesPhone: "",
      salesEmail: "",
      salesWhatsapp: "",
      crmAssignedId: "",
      salesManagerName: "",
    });
    setGalleryList([]);
    setVideosList([]);
    setUspList([]);
    setLocationStateCode("");
    setBuilderExtraList([]);
    setSettingsObj({});
    setSectionVisibility({});
    setAnalyticsConfig({});
    // Pre-fill amenities / specs / documents / sales fields from the central catalog
    if (fieldDefaults) {
      const am = amenitiesFromCatalog(); if (Object.keys(am).length) setAmenitiesMap(am);
      const sp = specsFromCatalog(); if (Object.keys(sp).length) setSpecificationsObj(sp);
      const dc = docsFromCatalog(); if (Object.keys(dc).length) setDocumentsObj(dc);
      setSalesInfoObj(salesFieldsFromCatalog());
    } else {
      setSalesInfoObj({});
    }
    setAssetsList([]);
    setPricingExtraList([]);
    setSalesManagersList([]);
    setActiveTab("basic");
    setModalOpen(true);
  };

  const handleOpenEditModal = (proj: ProjectData) => {
    setEditingProjectId(proj.id);
    // Builder Info reflects the linked developer (source of truth): overlay the
    // developer's profile so the builder name stays consistent with it and the
    // two-way sync on save never renames the developer by accident. Project
    // values are kept where the developer has none.
    const dev = proj.developerId ? developers.find((d) => d.id === proj.developerId) : null;
    setFormData(
      dev
        ? {
            ...proj,
            builderName: dev.name,
            builderLogo: dev.logo ?? proj.builderLogo ?? "",
            website: dev.website ?? proj.website ?? "",
            aboutBuilder: dev.description ?? proj.aboutBuilder ?? "",
            yearsExperience: dev.experienceYears ?? proj.yearsExperience ?? null,
            projectsDelivered: dev.projectsDelivered ?? proj.projectsDelivered ?? null,
            ongoingProjectsCount: dev.ongoingProjectsCount ?? proj.ongoingProjectsCount ?? null,
          }
        : proj
    );

    try {
      if (proj.configurationsJson) setConfigurationsList(JSON.parse(proj.configurationsJson));
      if (proj.towersJson) setTowersList(JSON.parse(proj.towersJson));
      if (proj.unitsJson) setInventoryList(JSON.parse(proj.unitsJson));
      if (proj.nearbyPlacesJson) setNearbyPlacesList(JSON.parse(proj.nearbyPlacesJson));
      if (proj.specificationsJson) setSpecificationsObj(JSON.parse(proj.specificationsJson));
      if (proj.documentsJson) setDocumentsObj(JSON.parse(proj.documentsJson));
      if (proj.amenitiesJson) setAmenitiesMap(JSON.parse(proj.amenitiesJson));
      if (proj.tagsJson) setTagsMap(JSON.parse(proj.tagsJson));
      if (proj.leadSettingsJson) setLeadSettingsObj(JSON.parse(proj.leadSettingsJson));
      if (proj.relationshipsJson) setRelationshipsMap(JSON.parse(proj.relationshipsJson));
      if (proj.customFieldsJson) setCustomFieldsList(JSON.parse(proj.customFieldsJson));

      // New dynamic lists
      setGalleryList(proj.galleryImagesJson ? (JSON.parse(proj.galleryImagesJson) as any[]).filter((x) => typeof x === "string") : []);
      setVideosList(proj.videosJson ? JSON.parse(proj.videosJson) : []);
      setSalesInfoObj(proj.salesInfoJson ? JSON.parse(proj.salesInfoJson) : {});
      setBuilderExtraList(proj.builderExtraJson ? JSON.parse(proj.builderExtraJson) : []);
      setSettingsObj(proj.settingsJson ? JSON.parse(proj.settingsJson) : {});
      setSectionVisibility(proj.sectionVisibilityJson ? JSON.parse(proj.sectionVisibilityJson) : {});
      setAnalyticsConfig(proj.analyticsConfigJson ? JSON.parse(proj.analyticsConfigJson) : {});
      try {
        const u = proj.projectUspJson ? JSON.parse(proj.projectUspJson) : [];
        setUspList(Array.isArray(u) ? u.filter((x) => typeof x === "string") : (typeof proj.projectUspJson === "string" && proj.projectUspJson.trim() ? proj.projectUspJson.split(",").map((s) => s.trim()).filter(Boolean) : []));
      } catch {
        setUspList(typeof proj.projectUspJson === "string" && proj.projectUspJson.trim() ? proj.projectUspJson.split(",").map((s) => s.trim()).filter(Boolean) : []);
      }
      try {
        const states = State.getStatesOfCountry(proj.country || "IN");
        const found = states.find((s) => s.name === proj.state);
        setLocationStateCode(found ? found.isoCode : "");
      } catch { setLocationStateCode(""); }
      setAssetsList(proj.assetsJson ? JSON.parse(proj.assetsJson) : []);
      setPricingExtraList(proj.pricingExtraJson ? JSON.parse(proj.pricingExtraJson) : []);
      const parsedManagers = proj.salesManagersJson ? JSON.parse(proj.salesManagersJson) : [];
      setSalesManagersList(
        Array.isArray(parsedManagers) && parsedManagers.length > 0
          ? parsedManagers
          : proj.salesManagerName
            ? [{ name: proj.salesManagerName, role: "", phone: proj.salesPhone || "", email: proj.salesEmail || "", whatsapp: proj.salesWhatsapp || "" }]
            : []
      );

      // Analytics — ensure customMetrics array
      if (proj.analyticsJson) {
        const a = JSON.parse(proj.analyticsJson);
        setAnalyticsObj({ ...a, customMetrics: Array.isArray(a.customMetrics) ? a.customMetrics : [] });
      }

      // Timeline — ensure milestones/videos/videoLinks arrays
      if (proj.timelineJson) {
        const t = JSON.parse(proj.timelineJson);
        setTimelineObj({
          ...t,
          progressImages: Array.isArray(t.progressImages) ? t.progressImages : [],
          milestones: Array.isArray(t.milestones) ? t.milestones : [],
          videos: Array.isArray(t.videos) ? t.videos : [],
          videoLinks: Array.isArray(t.videoLinks) ? t.videoLinks : [],
        });
      }

      // Financial — migrate old flat shape into listings when needed
      if (proj.financialInfoJson) {
        const f = JSON.parse(proj.financialInfoJson);
        const next: any = {
          emiAvailable: f.emiAvailable ?? true,
          emiCalculator: f.emiCalculator ?? true,
          paymentPlans: Array.isArray(f.paymentPlans) ? f.paymentPlans : [],
          bankApprovals: Array.isArray(f.bankApprovals) ? f.bankApprovals : [],
          loanPartners: Array.isArray(f.loanPartners) ? f.loanPartners : [],
        };
        if (next.paymentPlans.length === 0) {
          if (f.constructionLinkedPlanDetails) next.paymentPlans.push({ name: "Construction Linked Plan", type: "CLP", details: f.constructionLinkedPlanDetails, enabled: f.constructionLinkedPlan ?? true });
          if (f.downPaymentPlanDetails) next.paymentPlans.push({ name: "Down Payment Plan", type: "Down Payment", details: f.downPaymentPlanDetails, enabled: f.downPaymentPlan ?? true });
        }
        if (next.bankApprovals.length === 0 && typeof f.bankApprovals === "string") {
          next.bankApprovals = f.bankApprovals.split(",").map((s: string) => ({ bankName: s.trim(), loanType: "Home Loan", interestRate: "", maxFundingPct: "", status: "Approved" })).filter((b: any) => b.bankName);
        }
        if (next.loanPartners.length === 0 && typeof f.loanPartners === "string") {
          next.loanPartners = f.loanPartners.split(",").map((s: string) => ({ name: s.trim() })).filter((p: any) => p.name);
        }
        setFinancialInfoObj(next);
      }
    } catch {}

    setActiveTab("basic");
    setModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProjectId && !canEdit) {
      alert("Permission denied: You do not have permission to edit projects.");
      return;
    }
    if (!editingProjectId && !canAdd) {
      alert("Permission denied: You do not have permission to add projects.");
      return;
    }
    if (!formData.name?.trim()) {
      alert("Please provide a project name");
      return;
    }

    const payload = {
      ...formData,
      configurationsJson: JSON.stringify(configurationsList),
      towersJson: JSON.stringify(towersList),
      unitsJson: JSON.stringify(inventoryList),
      nearbyPlacesJson: JSON.stringify(nearbyPlacesList),
      specificationsJson: JSON.stringify(specificationsObj),
      documentsJson: JSON.stringify(documentsObj),
      amenitiesJson: JSON.stringify(amenitiesMap),
      tagsJson: JSON.stringify(tagsMap),
      leadSettingsJson: JSON.stringify(leadSettingsObj),
      financialInfoJson: JSON.stringify(financialInfoObj),
      timelineJson: JSON.stringify(timelineObj),
      analyticsJson: JSON.stringify(analyticsObj),
      relationshipsJson: JSON.stringify(relationshipsMap),
      customFieldsJson: JSON.stringify(customFieldsList),
      salesInfoJson: JSON.stringify(salesInfoObj),
      builderExtraJson: JSON.stringify(builderExtraList),
      settingsJson: JSON.stringify(settingsObj),
      sectionVisibilityJson: JSON.stringify(sectionVisibility),
      analyticsConfigJson: JSON.stringify(analyticsConfig),
      galleryImagesJson: JSON.stringify(galleryList),
      videosJson: JSON.stringify(videosList),
      projectUspJson: JSON.stringify(uspList.filter((x) => x.trim())),
      assetsJson: JSON.stringify(assetsList),
      pricingExtraJson: JSON.stringify(pricingExtraList),
      salesManagersJson: JSON.stringify(salesManagersList),
    };

    setLoading(true);
    try {
      const url = editingProjectId ? `/api/admin/projects/${editingProjectId}` : "/api/admin/projects";
      const method = editingProjectId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Builder Info ↔ Developer two-way sync: push the edited builder
        // profile back onto the linked developer record.
        if (formData.developerId) {
          const devPayload: any = {};
          if (formData.builderName?.trim()) devPayload.name = formData.builderName.trim();
          if (formData.builderLogo !== undefined) devPayload.logo = formData.builderLogo || null;
          if (formData.aboutBuilder !== undefined) devPayload.description = formData.aboutBuilder || null;
          if (formData.website !== undefined) devPayload.website = formData.website || null;
          if (formData.yearsExperience !== undefined && formData.yearsExperience !== null) devPayload.experienceYears = Number(formData.yearsExperience);
          if (formData.projectsDelivered !== undefined && formData.projectsDelivered !== null) devPayload.projectsDelivered = Number(formData.projectsDelivered);
          if (formData.ongoingProjectsCount !== undefined && formData.ongoingProjectsCount !== null) devPayload.ongoingProjectsCount = Number(formData.ongoingProjectsCount);
          if (Object.keys(devPayload).length > 0) {
            fetch(`/api/admin/developers/${formData.developerId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(devPayload),
            }).catch(() => {});
          }
        }
        setModalOpen(false);
        fetchProjects();
      } else {
        alert(data.error || "Failed to save project");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving project");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!canDelete) {
      alert("Permission denied: You do not have permission to delete projects.");
      return;
    }
    if (!confirm(`Are you sure you want to delete project "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchProjects();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper rows appenders
  const addConfigurationRow = () => {
    setConfigurationsList([
      ...configurationsList,
      { type: "3 BHK", size: "1450 sqft", startingPrice: "11000000", carpetArea: "1150 sqft", builtupArea: "1350 sqft", balcony: 3, bathrooms: 3, parking: 1, studyRoom: false, servantRoom: false },
    ]);
  };

  const addTowerRow = () => {
    setTowersList([
      ...towersList,
      { name: `Tower ${String.fromCharCode(65 + towersList.length)}`, number: String(towersList.length + 1), floors: 24, liftCount: 3, unitsPerFloor: 4, status: "Under Construction", possession: "Dec 2027" },
    ]);
  };

  const addInventoryRow = () => {
    setInventoryList([
      ...inventoryList,
      { unitNo: `U-${inventoryList.length + 101}`, tower: "Tower A", floor: 2, facing: "East", area: "1350 sqft", config: "3 BHK", status: "Available", price: 9800000, parking: 1 },
    ]);
  };

  const addNearbyPlaceRow = () => {
    setNearbyPlacesList([
      ...nearbyPlacesList,
      { category: "School", name: "New Landmark School", distance: "1.0 km", travelTime: "4 min" },
    ]);
  };

  const addCustomField = () => {
    if (!newCustomFieldName.trim()) return;
    setCustomFieldsList([
      ...customFieldsList,
      { name: newCustomFieldName.trim(), type: newCustomFieldType, value: newCustomFieldValue },
    ]);
    setNewCustomFieldName("");
    setNewCustomFieldValue("");
  };

  const addTimelineProgressImage = () => {
    if (!newProgressImageUrl.trim()) return;
    setTimelineObj({
      ...timelineObj,
      progressImages: [...timelineObj.progressImages, newProgressImageUrl.trim()],
    });
    setNewProgressImageUrl("");
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-amber-500" />
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Projects & Builder Master
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise 25-Section Project Lifecycle Management, Inventory & CRM Engine
          </p>
        </div>

        {canAdd && (
          <Button type="button" variant="gold" onClick={handleOpenAddModal} className="gap-2 font-extrabold shadow-sm">
            <Plus className="h-4 w-4" /> Add New Project
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search project name, code, RERA or city..."
            className="pl-9 bg-white dark:bg-slate-900 text-xs"
          />
        </div>

        <select
          value={selectedDeveloperId}
          onChange={(e) => setSelectedDeveloperId(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
        >
          <option value="ALL">All Developers</option>
          {developers.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold"
        >
          <option value="ALL">All Statuses</option>
          {["Upcoming", "New Launch", "Under Construction", "Ready to Move", "Sold Out"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <ViewToggle mode={viewMode} onChange={setViewMode} className="ml-auto" />
      </div>

      {/* Projects Grid List */}
      {loading ? (
        <div className="py-12 text-center text-sm font-semibold text-slate-500 animate-pulse">
          Loading projects data...
        </div>
      ) : projects.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <Building2 className="h-10 w-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Projects Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Add New Project&quot; to configure a new developer project with all 25 sections.
          </p>
          {canAdd && (
            <Button type="button" variant="gold" size="sm" onClick={handleOpenAddModal} className="gap-1.5 font-bold">
              <Plus className="h-4 w-4" /> Add First Project
            </Button>
          )}
        </div>
      ) : (
        <div className={viewContainerClass(viewMode)}>
          {projects.map((p) => viewMode === "list" ? (
            <div
              key={p.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-xs hover:border-slate-300 transition"
            >
              <span className="text-[10px] font-mono font-bold bg-brand-soft border border-brand/20 text-brand px-2 py-0.5 rounded-lg shrink-0">
                {p.code || "PRJ-XXXX"}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">{p.name}</h3>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                  🏢 {p.developer?.name || p.builderName || "Independent Developer"}
                  <span className="text-slate-300">·</span>
                  <MapPin className="h-3 w-3 text-brand shrink-0" />
                  {p.area ? `${p.area}, ${p.city}` : p.city || "—"}
                </p>
              </div>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                {p.minPrice ? formatCurrency(p.minPrice) : "On Request"}
                {p.maxPrice ? ` - ${formatCurrency(p.maxPrice)}` : ""}
              </span>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 shrink-0">
                {p.status || "New Launch"}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {canEdit && (
                  <Button type="button" variant="secondary" size="sm" onClick={() => handleOpenEditModal(p)} className="text-xs font-bold gap-1">
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                )}
                {canDelete && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteProject(p.id, p.name)} className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2" title="Delete Project">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div
              key={p.id}
              className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-lg">
                    {p.code || "PRJ-XXXX"}
                  </span>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    {p.status || "New Launch"}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    🏢 {p.developer?.name || p.builderName || "Independent Developer"}
                  </p>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">{p.area ? `${p.area}, ${p.city}` : p.city || "Gurugram, IN"}</span>
                  </div>
                  {p.reraNumber && (
                    <div className="flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="font-mono text-[11px]">RERA: {p.reraNumber}</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">Price Range</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {p.minPrice ? formatCurrency(p.minPrice) : "On Request"}
                    {p.maxPrice ? ` - ${formatCurrency(p.maxPrice)}` : ""}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
                {canEdit && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenEditModal(p)}
                    className="flex-1 text-xs font-bold gap-1"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit Project
                  </Button>
                )}
                {canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProject(p.id, p.name)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2"
                    title="Delete Project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 25-Section Multi-Tab Add/Edit Project Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-5xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <Building2 className="h-6 w-6 text-amber-500" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {editingProjectId ? `Edit Project: ${formData.name}` : "Create New Developer Project"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Complete Enterprise 25-Section Master Project Lifecycle Configurator
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Navigation Tabs (25 Sections) */}
              <div className="w-60 shrink-0 border-r border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-2.5 space-y-1 overflow-y-auto max-h-[80vh]">
                {PROJECT_TAB_SECTIONS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition ${
                        isActive
                          ? "bg-brand text-white shadow-xs"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Form Panels */}
              <form onSubmit={handleSaveProject} className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Per-section frontend visibility toggle */}
                {(() => {
                  const shown = sectionVisibility[activeTab] !== false;
                  const tabLabel = PROJECT_TAB_SECTIONS.find((t) => t.id === activeTab)?.label || "This section";
                  return (
                    <div className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${shown ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"}`}>
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {shown ? "✓ This section is shown on the public project page" : "Hidden from the public project page"}
                      </span>
                      <button type="button" onClick={() => setSectionVisibility({ ...sectionVisibility, [activeTab]: !shown })}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${shown ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200 hover:bg-slate-400"}`}
                        title={`Show or hide "${tabLabel}" on the website`}>
                        {shown ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {shown ? "Shown on site" : "Hidden"}
                      </button>
                    </div>
                  );
                })()}
                {/* 1. BASIC INFORMATION */}
                {activeTab === "basic" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      1. Basic Information
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Project Name *</label>
                        <Input value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Godrej Sky Greens" required />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Developer / Builder *</label>
                        <select value={formData.developerId || ""} onChange={(e) => setFormData({ ...formData, developerId: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold">
                          <option value="">Select Developer</option>
                          {developers.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Project Code (Auto/Custom)</label>
                        <Input value={formData.code || ""} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="PRJ-GDJ-2026" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Project Slug (for website)</label>
                        <Input value={formData.slug || ""} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="godrej-sky-greens" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Project Type</label>
                        <select value={formData.projectType || ""} onChange={(e) => setFormData({ ...formData, projectType: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold">
                          {(dynamicDropdowns.project_type?.length
                            ? dynamicDropdowns.project_type
                            : [
                                { label: "Apartment", value: "Apartment" },
                                { label: "Villa", value: "Villa" },
                                { label: "Plot", value: "Plot" },
                                { label: "Commercial", value: "Commercial" },
                                { label: "Office", value: "Office" },
                                { label: "Retail", value: "Retail" },
                                { label: "Warehouse", value: "Warehouse" },
                                { label: "Mixed Use", value: "Mixed Use" },
                              ]
                          ).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Project Category</label>
                        <select value={formData.projectCategory || ""} onChange={(e) => setFormData({ ...formData, projectCategory: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold">
                          {(dynamicDropdowns.project_category?.length
                            ? dynamicDropdowns.project_category
                            : [
                                { label: "RESIDENTIAL", value: "Residential" },
                                { label: "COMMERCIAL", value: "Commercial" },
                                { label: "LAND", value: "Land" },
                                { label: "RENTAL", value: "Rental" },
                                { label: "INDUSTRIAL", value: "Industrial" },
                                { label: "HOSPITALITY", value: "Hospitality" },
                              ]
                          ).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Project Status</label>
                        <select value={formData.status || ""} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs font-semibold">
                          {(dynamicDropdowns.project_status?.length
                            ? dynamicDropdowns.project_status
                            : [
                                { label: "Upcoming", value: "Upcoming" },
                                { label: "New Launch", value: "New Launch" },
                                { label: "Under Construction", value: "Under Construction" },
                                { label: "Ready to Move", value: "Ready to Move" },
                                { label: "Sold Out", value: "Sold Out" },
                              ]
                          ).map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">RERA Number</label>
                        <Input value={formData.reraNumber || ""} onChange={(e) => setFormData({ ...formData, reraNumber: e.target.value })} placeholder="HRERA-GGM-789-2026" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">RERA Registration Date</label>
                        <Input type="date" value={formData.reraRegDate || ""} onChange={(e) => setFormData({ ...formData, reraRegDate: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Possession Date</label>
                        <Input type="date" value={formData.possessionDate || ""} onChange={(e) => setFormData({ ...formData, possessionDate: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Launch Date</label>
                        <Input type="date" value={formData.launchDate || ""} onChange={(e) => setFormData({ ...formData, launchDate: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Completion Date</label>
                        <Input type="date" value={formData.completionDate || ""} onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. LOCATION */}
                {activeTab === "location" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      2. Location & Coordinates
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Country</label>
                        <CountrySelect value={formData.country || "IN"} onChange={(code) => { setFormData({ ...formData, country: code, state: "", city: "", zip: "" }); setLocationStateCode(""); }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">State</label>
                        <GlobalStateSelect countryCode={formData.country || "IN"} value={locationStateCode} onChange={(code, name) => { setLocationStateCode(code); setFormData({ ...formData, state: name, city: "", zip: "" }); }} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">City</label>
                        <GlobalCitySelect countryCode={formData.country || "IN"} stateCode={locationStateCode} value={formData.city || ""} onChange={(city) => setFormData({ ...formData, city, zip: "" })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Area</label>
                        <Input value={formData.area || ""} onChange={(e) => setFormData({ ...formData, area: e.target.value })} placeholder="Golf Course Ext Road" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Locality</label>
                        <Input value={formData.locality || ""} onChange={(e) => setFormData({ ...formData, locality: e.target.value })} placeholder="Sector 65" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Landmark</label>
                        <Input value={formData.landmark || ""} onChange={(e) => setFormData({ ...formData, landmark: e.target.value })} placeholder="Near Rapid Metro Station" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pin Code</label>
                        <GlobalZipSelect countryCode={formData.country || "IN"} city={formData.city || ""} value={formData.zip || ""} onChange={(zip) => setFormData({ ...formData, zip })} placeholder="Auto-loads from city" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Latitude</label>
                        <Input type="number" step="any" value={formData.latitude || ""} onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })} placeholder="28.4595" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Longitude</label>
                        <Input type="number" step="any" value={formData.longitude || ""} onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })} placeholder="77.0266" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Google Maps URL</label>
                        <Input value={formData.googleMapsUrl || ""} onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })} placeholder="https://maps.google.com/?q=..." />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Complete Address</label>
                        <Input value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Plot 1, Golf Course Extension Road, Sector 65, Gurugram" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. PROJECT DESCRIPTION */}
                {activeTab === "description" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      3. Project Description & USPs
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Short Description</label>
                        <Input value={formData.shortDescription || ""} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })} placeholder="Luxury 3 & 4 BHK Golf Residences" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Description</label>
                        <textarea rows={4} value={formData.fullDescription || ""} onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-3 text-xs" placeholder="Full project story, architecture specs, and lifestyle summary..." />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Project USP / Key Highlights <span className="text-slate-400 font-medium">(shown as bullet points)</span></label>
                          <Button type="button" size="sm" variant="gold" className="gap-1 text-xs" onClick={() => setUspList([...uspList, ""])}><Plus className="h-3.5 w-3.5" /> Add USP</Button>
                        </div>
                        {uspList.length === 0 ? (
                          <p className="text-[11px] text-slate-400">No highlights yet. Click &quot;Add USP&quot; to add key selling points.</p>
                        ) : (
                          uspList.map((usp, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-brand">•</span>
                              <Input value={usp} onChange={(e) => { const next = [...uspList]; next[idx] = e.target.value; setUspList(next); }} placeholder="e.g. 80% Green Open Space" />
                              <Button type="button" variant="ghost" size="sm" onClick={() => setUspList(uspList.filter((_, i) => i !== idx))} className="text-rose-600 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lifestyle & Amenities Description</label>
                        <textarea rows={3} value={formData.lifestyleDescription || ""} onChange={(e) => setFormData({ ...formData, lifestyleDescription: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-3 text-xs" placeholder="Describe 5-star clubhouse, sports arenas, and wellness facilities..." />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. MEDIA */}
                {activeTab === "media" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      4. Media, Video Links & Assets
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cover Image <span className="text-slate-400 font-medium">(upload or URL)</span></label>
                        <div className="flex gap-1.5">
                          <Input value={formData.coverImage || ""} onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })} placeholder="Upload or paste image URL" />
                          {fieldUploadBtn("coverImage", "image/*", "image")}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Banner Image <span className="text-slate-400 font-medium">(upload or URL)</span></label>
                        <div className="flex gap-1.5">
                          <Input value={formData.bannerImage || ""} onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })} placeholder="Upload or paste image URL" />
                          {fieldUploadBtn("bannerImage", "image/*", "image")}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Master Plan <span className="text-slate-400 font-medium">(upload or URL)</span></label>
                        <div className="flex gap-1.5">
                          <Input value={formData.masterPlanUrl || ""} onChange={(e) => setFormData({ ...formData, masterPlanUrl: e.target.value })} placeholder="Upload image/PDF or paste URL" />
                          {fieldUploadBtn("masterPlanUrl", "image/*,application/pdf")}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Brochure PDF <span className="text-slate-400 font-medium">(upload or URL)</span></label>
                        <div className="flex gap-1.5">
                          <Input value={formData.brochurePdfUrl || ""} onChange={(e) => setFormData({ ...formData, brochurePdfUrl: e.target.value })} placeholder="Upload or paste PDF URL" />
                          {fieldUploadBtn("brochurePdfUrl", "application/pdf", "pdf")}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Price Sheet PDF <span className="text-slate-400 font-medium">(upload or URL)</span></label>
                        <div className="flex gap-1.5">
                          <Input value={formData.priceSheetPdfUrl || ""} onChange={(e) => setFormData({ ...formData, priceSheetPdfUrl: e.target.value })} placeholder="Upload or paste PDF URL" />
                          {fieldUploadBtn("priceSheetPdfUrl", "application/pdf", "pdf")}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">YouTube Walkthrough Link</label>
                        <Input value={formData.youtubeUrl || ""} onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">360 Virtual Tour URL</label>
                        <Input value={formData.virtualTourUrl || ""} onChange={(e) => setFormData({ ...formData, virtualTourUrl: e.target.value })} placeholder="https://my.matterport.com/show/..." />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Drone Video <span className="text-slate-400 font-medium">(upload or URL)</span></label>
                        <div className="flex gap-1.5">
                          <Input value={formData.droneVideoUrl || ""} onChange={(e) => setFormData({ ...formData, droneVideoUrl: e.target.value })} placeholder="Upload or paste video URL" />
                          {fieldUploadBtn("droneVideoUrl", "video/*", "video")}
                        </div>
                      </div>
                    </div>

                    {/* Project gallery images (shown in the public gallery) */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5 text-brand" /> Project Gallery Images</label>
                          <p className="text-[11px] text-slate-400">Upload multiple photos — they appear in the gallery on the public project page.</p>
                        </div>
                        <label className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer transition ${uploading === "gallery" ? "bg-slate-200 text-slate-500" : "bg-brand text-white hover:bg-brand-hover"}`}>
                          {uploading === "gallery" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          {uploading === "gallery" ? "Uploading..." : "Upload Images"}
                          <input type="file" multiple accept="image/*" className="hidden" disabled={uploading === "gallery"}
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (!files.length) return;
                              setUploading("gallery");
                              for (const f of files) {
                                const res = await uploadFile(f, "image");
                                if (res) setGalleryList((prev) => [...prev, res.url]);
                              }
                              setUploading(null);
                              e.target.value = "";
                            }} />
                        </label>
                      </div>
                      {galleryList.length === 0 ? (
                        <p className="text-[11px] text-slate-400">No gallery images yet.</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {galleryList.map((url, idx) => {
                            const isCover = formData.coverImage === url;
                            return (
                              <div key={idx} className="relative group aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                                <img src={url} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                                {isCover && <span className="absolute left-1.5 top-1.5 rounded-md bg-brand px-1.5 py-0.5 text-[9px] font-bold text-white">COVER</span>}
                                <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 group-hover:opacity-100 transition">
                                  {idx > 0 && <button type="button" title="Move left" onClick={() => { const next = [...galleryList]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; setGalleryList(next); }} className="rounded bg-white/90 p-1 text-slate-700 hover:bg-white"><ChevronLeft className="h-3.5 w-3.5" /></button>}
                                  {!isCover && <button type="button" title="Make cover" onClick={() => setFormData({ ...formData, coverImage: url })} className="rounded bg-white/90 px-1.5 py-1 text-[9px] font-bold text-slate-700 hover:bg-white">★</button>}
                                  {idx < galleryList.length - 1 && <button type="button" title="Move right" onClick={() => { const next = [...galleryList]; [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]]; setGalleryList(next); }} className="rounded bg-white/90 p-1 text-slate-700 hover:bg-white"><ChevronRight className="h-3.5 w-3.5" /></button>}
                                  <button type="button" title="Remove" onClick={() => setGalleryList(galleryList.filter((_, i) => i !== idx))} className="rounded bg-rose-600 p-1 text-white hover:bg-rose-700"><X className="h-3.5 w-3.5" /></button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input value={newGalleryUrl} onChange={(e) => setNewGalleryUrl(e.target.value)} placeholder="...or paste an image URL" />
                        <Button type="button" variant="gold" size="sm" className="shrink-0 gap-1" onClick={() => {
                          const u = newGalleryUrl.trim(); if (!u) return;
                          setGalleryList([...galleryList, u]); setNewGalleryUrl("");
                        }}><Plus className="h-3.5 w-3.5" /> Add</Button>
                      </div>
                    </div>

                    {/* Project videos */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"><Film className="h-3.5 w-3.5 text-brand" /> Project Videos</label>
                          <p className="text-[11px] text-slate-400">Upload multiple videos — they play in the gallery on the public project page.</p>
                        </div>
                        <label className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer transition ${uploading === "video" ? "bg-slate-200 text-slate-500" : "bg-brand text-white hover:bg-brand-hover"}`}>
                          {uploading === "video" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          {uploading === "video" ? "Uploading..." : "Upload Videos"}
                          <input type="file" multiple accept="video/*" className="hidden" disabled={uploading === "video"}
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (!files.length) return;
                              setUploading("video");
                              for (const f of files) {
                                const res = await uploadFile(f, "video");
                                if (res) setVideosList((prev) => [...prev, { url: res.url, name: res.name }]);
                              }
                              setUploading(null);
                              e.target.value = "";
                            }} />
                        </label>
                      </div>
                      {videosList.length === 0 ? (
                        <p className="text-[11px] text-slate-400">No videos uploaded yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {videosList.map((v, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                              <Film className="h-4 w-4 text-slate-400 shrink-0" />
                              <a href={v.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-xs font-semibold text-brand-hover truncate hover:underline">{v.name || v.url}</a>
                              <button type="button" onClick={() => setVideosList(videosList.filter((_, i) => i !== idx))} className="text-rose-600 shrink-0"><X className="h-4 w-4" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input value={newVideoUrl} onChange={(e) => setNewVideoUrl(e.target.value)} placeholder="...or paste a video URL (mp4 / YouTube etc.)" />
                        <Button type="button" variant="gold" size="sm" className="shrink-0 gap-1" onClick={() => {
                          const u = newVideoUrl.trim(); if (!u) return;
                          setVideosList([...videosList, { url: u, name: u.split("/").pop() || "Video" }]); setNewVideoUrl("");
                        }}><Plus className="h-3.5 w-3.5" /> Add</Button>
                      </div>
                    </div>

                    {/* Uploaded assets (images / PDFs / other) */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Upload Images, PDFs &amp; Other Assets</label>
                        <label className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer transition ${uploading === "asset" ? "bg-slate-200 text-slate-500" : "bg-brand text-white hover:bg-brand-hover"}`}>
                          {uploading === "asset" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                          {uploading === "asset" ? "Uploading..." : "Upload Asset"}
                          <input type="file" multiple accept="image/*,application/pdf,video/*" className="hidden" disabled={uploading === "asset"}
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (!files.length) return;
                              setUploading("asset");
                              for (const f of files) {
                                const res = await uploadFile(f);
                                if (res) setAssetsList((prev) => [...prev, res]);
                              }
                              setUploading(null);
                              e.target.value = "";
                            }} />
                        </label>
                      </div>
                      {assetsList.length === 0 ? (
                        <p className="text-[11px] text-slate-400">No assets uploaded yet.</p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {assetsList.map((a, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                              {a.kind === "image" ? <img src={a.url} alt={a.name} className="w-9 h-9 rounded object-cover shrink-0" /> : <FileText className="h-6 w-6 text-slate-400 shrink-0" />}
                              <a href={a.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-xs font-semibold text-brand-hover truncate hover:underline">{a.name || a.url}</a>
                              <span className="text-[10px] uppercase text-slate-400 shrink-0">{a.kind}</span>
                              <button type="button" onClick={() => setAssetsList(assetsList.filter((_, i) => i !== idx))} className="text-rose-600 shrink-0"><X className="h-4 w-4" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. PRICING */}
                {activeTab === "pricing" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      5. Pricing & Statutory Charges
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Minimum Price (₹)</label>
                        <Input type="number" value={formData.minPrice || ""} onChange={(e) => setFormData({ ...formData, minPrice: parseFloat(e.target.value) || 0 })} placeholder="4500000" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Maximum Price (₹)</label>
                        <Input type="number" value={formData.maxPrice || ""} onChange={(e) => setFormData({ ...formData, maxPrice: parseFloat(e.target.value) || 0 })} placeholder="20000000" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Price per Sq Ft (₹)</label>
                        <Input type="number" value={formData.pricePerSqft || ""} onChange={(e) => setFormData({ ...formData, pricePerSqft: parseFloat(e.target.value) || 0 })} placeholder="7500" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Booking Amount (₹)</label>
                        <Input type="number" value={formData.bookingAmount || ""} onChange={(e) => setFormData({ ...formData, bookingAmount: parseFloat(e.target.value) || 0 })} placeholder="500000" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Maintenance Charges (₹/sqft/mo)</label>
                        <Input type="number" value={formData.maintenanceCharges || ""} onChange={(e) => setFormData({ ...formData, maintenanceCharges: parseFloat(e.target.value) || 0 })} placeholder="5" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">PLC Charges (₹/sqft)</label>
                        <Input type="number" value={formData.plcCharges || ""} onChange={(e) => setFormData({ ...formData, plcCharges: parseFloat(e.target.value) || 0 })} placeholder="350" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">GST Tax (%)</label>
                        <Input type="number" value={formData.gstPct || ""} onChange={(e) => setFormData({ ...formData, gstPct: parseFloat(e.target.value) || 0 })} placeholder="5" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Stamp Duty (%)</label>
                        <Input type="number" value={formData.stampDutyPct || ""} onChange={(e) => setFormData({ ...formData, stampDutyPct: parseFloat(e.target.value) || 0 })} placeholder="6" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Registration Charges (₹)</label>
                        <Input type="number" value={formData.registrationCharges || ""} onChange={(e) => setFormData({ ...formData, registrationCharges: parseFloat(e.target.value) || 0 })} placeholder="50000" />
                      </div>
                    </div>

                    {/* Custom pricing fields */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Additional Pricing Fields &amp; Values</label>
                        <Button type="button" size="sm" variant="gold" onClick={() => setPricingExtraList([...pricingExtraList, { label: "", value: "" }])} className="gap-1 text-xs">
                          <Plus className="h-3.5 w-3.5" /> Add Field
                        </Button>
                      </div>
                      {pricingExtraList.length === 0 ? (
                        <p className="text-[11px] text-slate-400">No custom pricing fields. Click &quot;Add Field&quot; to create one.</p>
                      ) : (
                        pricingExtraList.map((row, idx) => (
                          <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-center">
                            <Input value={row.label} onChange={(e) => { const next = [...pricingExtraList]; next[idx].label = e.target.value; setPricingExtraList(next); }} placeholder="Field name (e.g. Club Membership)" />
                            <Input value={row.value} onChange={(e) => { const next = [...pricingExtraList]; next[idx].value = e.target.value; setPricingExtraList(next); }} placeholder="Value (e.g. ₹2,00,000)" />
                            <Button type="button" variant="ghost" size="sm" onClick={() => setPricingExtraList(pricingExtraList.filter((_, i) => i !== idx))} className="text-rose-600 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 6. UNIT CONFIGURATIONS */}
                {activeTab === "configs" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        6. Unit Configurations Matrix
                      </h4>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => downloadSampleCsv("unit-configurations-sample.csv", ["Type", "Size", "Starting Price", "Carpet Area", "Builtup Area", "Balcony", "Bathrooms", "Parking"], ["2 BHK", "980 sqft", "6800000", "750 sqft", "900 sqft", "2", "2", "1"])} className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800" title="Download a sample CSV with the exact columns">
                          <FileDown className="h-3.5 w-3.5 text-brand" /> Sample CSV
                        </button>
                        <label className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" title="Bulk upload from Excel/CSV. Columns: Type, Size, Starting Price, Carpet Area, Builtup Area, Balcony, Bathrooms, Parking">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Upload Excel
                          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={async (e) => {
                            const f = e.target.files?.[0]; if (!f) return;
                            const rows = await parseExcel(f, (get) => ({
                              type: String(get("type") || get("configuration") || ""),
                              size: String(get("size") || ""),
                              startingPrice: String(get("starting price") || get("price") || ""),
                              carpetArea: String(get("carpet area") || ""),
                              builtupArea: String(get("builtup area") || get("built up area") || ""),
                              balcony: parseInt(get("balcony")) || 0,
                              bathrooms: parseInt(get("bathrooms")) || 0,
                              parking: parseInt(get("parking")) || 0,
                              studyRoom: false, servantRoom: false,
                            })).catch(() => { alert("Could not read the Excel file."); return []; });
                            const valid = rows.filter((r: any) => r.type);
                            if (valid.length) setConfigurationsList((prev) => [...prev, ...valid]);
                            else alert("No valid rows found. Ensure a 'Type' column exists.");
                            e.target.value = "";
                          }} />
                        </label>
                        <Button type="button" size="sm" variant="gold" onClick={addConfigurationRow} className="gap-1 text-xs">
                          <Plus className="h-3.5 w-3.5" /> Add Configuration
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {configurationsList.length > 0 && (
                        <div className="hidden sm:grid gap-2 sm:grid-cols-4 items-center px-3">
                          {["Config Type", "Size", "Starting Price", ""].map((h, i) => (<span key={i} className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h || <span className="sr-only">Actions</span>}</span>))}
                        </div>
                      )}
                      {configurationsList.map((cfg, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 grid gap-2 sm:grid-cols-4 items-center">
                          <Input value={cfg.type} onChange={(e) => { const next = [...configurationsList]; next[idx].type = e.target.value; setConfigurationsList(next); }} placeholder="Type (e.g. 2 BHK)" />
                          <Input value={cfg.size} onChange={(e) => { const next = [...configurationsList]; next[idx].size = e.target.value; setConfigurationsList(next); }} placeholder="Size (e.g. 980 sqft)" />
                          <Input value={cfg.startingPrice} onChange={(e) => { const next = [...configurationsList]; next[idx].startingPrice = e.target.value; setConfigurationsList(next); }} placeholder="Price (e.g. 6800000)" />
                          <Button type="button" variant="ghost" size="sm" onClick={() => setConfigurationsList(configurationsList.filter((_, i) => i !== idx))} className="text-rose-600 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 7. TOWERS / BUILDINGS */}
                {activeTab === "towers" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        7. Towers & Building Blocks
                      </h4>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => downloadSampleCsv("towers-sample.csv", ["Tower Name", "Total Floors", "Lift Count", "Status"], ["Tower A", "24", "3", "Under Construction"])} className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800" title="Download a sample CSV with the exact columns">
                          <FileDown className="h-3.5 w-3.5 text-brand" /> Sample CSV
                        </button>
                        <label className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" title="Bulk upload from Excel/CSV. Columns: Tower Name, Total Floors, Lift Count, Status">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Upload Excel
                          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={async (e) => {
                            const f = e.target.files?.[0]; if (!f) return;
                            const rows = await parseExcel(f, (get) => ({
                              name: String(get("tower name") || get("name") || get("tower") || ""),
                              floors: parseInt(get("total floors") || get("floors")) || 0,
                              liftCount: parseInt(get("lift count") || get("lifts")) || 0,
                              status: String(get("status") || "Under Construction"),
                            })).catch(() => { alert("Could not read the Excel file."); return []; });
                            const valid = rows.filter((r: any) => r.name);
                            if (valid.length) setTowersList((prev) => [...prev, ...valid]);
                            else alert("No valid rows found. Ensure a 'Tower Name' column exists.");
                            e.target.value = "";
                          }} />
                        </label>
                        <Button type="button" size="sm" variant="gold" onClick={addTowerRow} className="gap-1 text-xs">
                          <Plus className="h-3.5 w-3.5" /> Add Tower
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Column headers */}
                      {towersList.length > 0 && (
                        <div className="hidden sm:grid gap-2 sm:grid-cols-5 items-center px-3">
                          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tower Name</span>
                          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Floors</span>
                          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Lift Count</span>
                          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</span>
                          <span className="sr-only">Actions</span>
                        </div>
                      )}
                      {towersList.map((t, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 grid gap-2 sm:grid-cols-5 items-center">
                          <div>
                            <label className="sm:hidden block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Tower Name</label>
                            <Input value={t.name} onChange={(e) => { const next = [...towersList]; next[idx].name = e.target.value; setTowersList(next); }} placeholder="Tower Name (e.g. Tower A)" />
                          </div>
                          <div>
                            <label className="sm:hidden block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Total Floors</label>
                            <Input type="number" value={t.floors} onChange={(e) => { const next = [...towersList]; next[idx].floors = parseInt(e.target.value) || 0; setTowersList(next); }} placeholder="Total Floors" />
                          </div>
                          <div>
                            <label className="sm:hidden block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Lift Count</label>
                            <Input type="number" value={t.liftCount} onChange={(e) => { const next = [...towersList]; next[idx].liftCount = parseInt(e.target.value) || 0; setTowersList(next); }} placeholder="Lift Count" />
                          </div>
                          <div>
                            <label className="sm:hidden block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">Status</label>
                            <Input value={t.status} onChange={(e) => { const next = [...towersList]; next[idx].status = e.target.value; setTowersList(next); }} placeholder="Status" />
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setTowersList(towersList.filter((_, i) => i !== idx))} className="text-rose-600 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. INVENTORY UNITS */}
                {activeTab === "inventory" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        8. Inventory Units Linker
                      </h4>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => downloadSampleCsv("inventory-units-sample.csv", ["Unit No", "Tower", "Floor", "Facing", "Area", "Config", "Status", "Price", "Parking"], ["A-101", "Tower A", "1", "East", "1350 sqft", "3 BHK", "Available", "9500000", "1"])} className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800" title="Download a sample CSV with the exact columns">
                          <FileDown className="h-3.5 w-3.5 text-brand" /> Sample CSV
                        </button>
                        <label className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800" title="Bulk upload from Excel/CSV. Columns: Unit No, Tower, Floor, Facing, Area, Config, Status, Price, Parking">
                          <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> Upload Excel
                          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={async (e) => {
                            const f = e.target.files?.[0]; if (!f) return;
                            const rows = await parseExcel(f, (get) => ({
                              unitNo: String(get("unit no") || get("unit") || ""),
                              tower: String(get("tower") || ""),
                              floor: parseInt(get("floor")) || 0,
                              facing: String(get("facing") || ""),
                              area: String(get("area") || ""),
                              config: String(get("config") || get("configuration") || ""),
                              status: String(get("status") || "Available"),
                              price: parseFloat(get("price")) || 0,
                              parking: parseInt(get("parking")) || 0,
                            })).catch(() => { alert("Could not read the Excel file."); return []; });
                            const valid = rows.filter((r: any) => r.unitNo);
                            if (valid.length) setInventoryList((prev) => [...prev, ...valid]);
                            else alert("No valid rows found. Ensure a 'Unit No' column exists.");
                            e.target.value = "";
                          }} />
                        </label>
                        <Button type="button" size="sm" variant="gold" onClick={addInventoryRow} className="gap-1 text-xs">
                          <Plus className="h-3.5 w-3.5" /> Add Unit
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {inventoryList.length > 0 && (
                        <div className="hidden sm:grid gap-2 sm:grid-cols-5 items-center px-3">
                          {["Unit No", "Config", "Price (₹)", "Status", ""].map((h, i) => (<span key={i} className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{h || <span className="sr-only">Actions</span>}</span>))}
                        </div>
                      )}
                      {inventoryList.map((u, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 grid gap-2 sm:grid-cols-5 items-center">
                          <Input value={u.unitNo} onChange={(e) => { const next = [...inventoryList]; next[idx].unitNo = e.target.value; setInventoryList(next); }} placeholder="Unit No (e.g. A-101)" />
                          <Input value={u.config} onChange={(e) => { const next = [...inventoryList]; next[idx].config = e.target.value; setInventoryList(next); }} placeholder="Config (e.g. 3 BHK)" />
                          <Input type="number" value={u.price} onChange={(e) => { const next = [...inventoryList]; next[idx].price = parseFloat(e.target.value) || 0; setInventoryList(next); }} placeholder="Price (₹)" />
                          <select value={u.status} onChange={(e) => { const next = [...inventoryList]; next[idx].status = e.target.value; setInventoryList(next); }} className="rounded-xl border border-slate-300 p-2 text-xs font-bold">
                            {["Available", "Booked", "Sold", "Reserved"].map((st) => (<option key={st} value={st}>{st}</option>))}
                          </select>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setInventoryList(inventoryList.filter((_, i) => i !== idx))} className="text-rose-600 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 9. AMENITIES */}
                {activeTab === "amenities" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">9. Project Amenities Matrix</h4>
                      <Button type="button" size="sm" variant="ghost" className="text-xs gap-1" title="Load the enabled amenities from the central catalog" onClick={() => setAmenitiesMap({ ...amenitiesFromCatalog(), ...amenitiesMap })}><Plus className="h-3.5 w-3.5" /> Load catalog defaults</Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {Object.keys(amenitiesMap).map((key) => (
                        <label key={key} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold cursor-pointer">
                          <span className="flex items-center gap-2">
                            <input type="checkbox" checked={amenitiesMap[key]} onChange={(e) => setAmenitiesMap({ ...amenitiesMap, [key]: e.target.checked })} className="rounded text-amber-500" />
                            {niceLabel(key)}
                          </span>
                          <button type="button" onClick={(ev) => { ev.preventDefault(); const next = { ...amenitiesMap }; delete next[key]; setAmenitiesMap(next); }} className="text-slate-300 hover:text-rose-600"><X className="h-3.5 w-3.5" /></button>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Input value={newAmenity} onChange={(e) => setNewAmenity(e.target.value)} placeholder="Add a new amenity (e.g. Co-working Space)" />
                      <Button type="button" variant="gold" size="sm" className="shrink-0 gap-1" onClick={() => {
                        const key = newAmenity.trim();
                        if (!key) return;
                        setAmenitiesMap({ ...amenitiesMap, [key]: true });
                        setNewAmenity("");
                      }}><Plus className="h-3.5 w-3.5" /> Add</Button>
                    </div>
                  </div>
                )}

                {/* 10. NEARBY PLACES */}
                {activeTab === "nearby" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        10. Nearby Landmarks & Connectivity
                      </h4>
                      <Button type="button" size="sm" variant="gold" onClick={addNearbyPlaceRow} className="gap-1 text-xs">
                        <Plus className="h-3.5 w-3.5" /> Add Landmark
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {nearbyPlacesList.map((place, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 grid gap-2 sm:grid-cols-4 items-center">
                          <select value={place.category} onChange={(e) => {
                            if (e.target.value === "__custom__") {
                              const custom = window.prompt("Enter a custom category:")?.trim();
                              if (custom) { const next = [...nearbyPlacesList]; next[idx].category = custom; setNearbyPlacesList(next); }
                              return;
                            }
                            const next = [...nearbyPlacesList]; next[idx].category = e.target.value; setNearbyPlacesList(next);
                          }} className="rounded-xl border border-slate-300 p-2 text-xs font-bold">
                            {Array.from(new Set([...(place.category ? [place.category] : []), ...nearbyCategoryOptions()])).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                            <option value="__custom__">+ Add custom…</option>
                          </select>
                          <Input value={place.name} onChange={(e) => { const next = [...nearbyPlacesList]; next[idx].name = e.target.value; setNearbyPlacesList(next); }} placeholder="Name (e.g. DPS School)" />
                          <Input value={place.distance} onChange={(e) => { const next = [...nearbyPlacesList]; next[idx].distance = e.target.value; setNearbyPlacesList(next); }} placeholder="Distance (e.g. 1.2 km)" />
                          <Button type="button" variant="ghost" size="sm" onClick={() => setNearbyPlacesList(nearbyPlacesList.filter((_, i) => i !== idx))} className="text-rose-600 shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 11. SPECIFICATIONS */}
                {activeTab === "specifications" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">11. Architectural Specifications</h4>
                      <Button type="button" size="sm" variant="ghost" className="text-xs gap-1" title="Load default specifications from the central catalog" onClick={() => setSpecificationsObj({ ...specsFromCatalog(), ...specificationsObj })}><Plus className="h-3.5 w-3.5" /> Load catalog defaults</Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.keys(specificationsObj).map((key) => (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{niceLabel(key)}</label>
                            <button type="button" onClick={() => { const next = { ...specificationsObj }; delete next[key]; setSpecificationsObj(next); }} className="text-slate-300 hover:text-rose-600" title="Remove"><X className="h-3.5 w-3.5" /></button>
                          </div>
                          <Input value={specificationsObj[key]} onChange={(e) => setSpecificationsObj({ ...specificationsObj, [key]: e.target.value })} placeholder={`e.g. ${niceLabel(key)} details...`} />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Input value={newSpecLabel} onChange={(e) => setNewSpecLabel(e.target.value)} placeholder="Add a specification field (e.g. Terrace)" />
                      <Button type="button" variant="gold" size="sm" className="shrink-0 gap-1" onClick={() => {
                        const key = newSpecLabel.trim();
                        if (!key || specificationsObj[key] !== undefined) { setNewSpecLabel(""); return; }
                        setSpecificationsObj({ ...specificationsObj, [key]: "" });
                        setNewSpecLabel("");
                      }}><Plus className="h-3.5 w-3.5" /> Add Field</Button>
                    </div>
                  </div>
                )}

                {/* 12. DOCUMENTS */}
                {activeTab === "documents" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">12. Legal Documents & Approvals</h4>
                      <Button type="button" size="sm" variant="ghost" className="text-xs gap-1" title="Load default document fields from the central catalog" onClick={() => setDocumentsObj({ ...docsFromCatalog(), ...documentsObj })}><Plus className="h-3.5 w-3.5" /> Load catalog defaults</Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.keys(documentsObj).map((key) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{niceLabel(key)}</label>
                          <div className="flex gap-1.5">
                            <Input value={documentsObj[key]} onChange={(e) => setDocumentsObj({ ...documentsObj, [key]: e.target.value })} placeholder="Document PDF URL..." />
                            <label className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 cursor-pointer shrink-0" title="Upload PDF">
                              {uploading === `doc-${key}` ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : <Upload className="h-4 w-4 text-slate-500" />}
                              <input type="file" accept="application/pdf,image/*" className="hidden" disabled={!!uploading}
                                onChange={async (e) => {
                                  const f = e.target.files?.[0]; if (!f) return;
                                  setUploading(`doc-${key}`);
                                  const res = await uploadFile(f);
                                  if (res) setDocumentsObj((prev) => ({ ...prev, [key]: res.url }));
                                  setUploading(null);
                                  e.target.value = "";
                                }} />
                            </label>
                            <button type="button" onClick={() => { const next = { ...documentsObj }; delete next[key]; setDocumentsObj(next); }} className="inline-flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 px-2 text-rose-600 shrink-0" title="Remove field"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Input value={newDocLabel} onChange={(e) => setNewDocLabel(e.target.value)} placeholder="Add a document / approval field (e.g. Fire NOC)" />
                      <Button type="button" variant="gold" size="sm" className="shrink-0 gap-1" onClick={() => {
                        const key = newDocLabel.trim().replace(/\s+(.)/g, (_m, c) => c.toUpperCase()).replace(/\s+/g, "").replace(/^(.)/, (_m, c) => c.toLowerCase());
                        if (!key || documentsObj[key] !== undefined) { setNewDocLabel(""); return; }
                        setDocumentsObj({ ...documentsObj, [key]: "" });
                        setNewDocLabel("");
                      }}><Plus className="h-3.5 w-3.5" /> Add Field</Button>
                    </div>
                  </div>
                )}

                {/* 13. SEO METADATA */}
                {activeTab === "seo" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      13. SEO & OpenGraph Meta
                    </h4>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">SEO Title</label>
                        <Input value={formData.seoTitle || ""} onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })} placeholder="Luxury 3 BHK Apartments in Golf Course Ext Rd | Godrej Sky Greens" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">SEO Meta Description</label>
                        <textarea rows={3} value={formData.seoDescription || ""} onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })} className="w-full rounded-xl border p-2 text-xs" placeholder="Explore Godrej Sky Greens with floor plans, prices, RERA details..." />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">SEO Keywords</label>
                        <Input value={formData.seoKeywords || ""} onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })} placeholder="Godrej Greens, Luxury Apartments Gurugram, 3 BHK Golf Course" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 14. SALES INFO */}
                {activeTab === "sales" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      14. Sales & Inventory Status
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sales Status</label>
                        <select value={formData.salesStatus || "Booking Open"} onChange={(e) => setFormData({ ...formData, salesStatus: e.target.value })} className="w-full rounded-xl border p-2 text-xs font-bold">
                          {["Booking Open", "Booking Closed", "Sold Out", "EOI Phase"].map((st) => (<option key={st} value={st}>{st}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Available Units Count</label>
                        <Input type="number" value={formData.availableUnitsCount || 0} onChange={(e) => setFormData({ ...formData, availableUnitsCount: parseInt(e.target.value) || 0 })} />
                      </div>
                    </div>

                    {/* Detailed sales fields (catalog-driven) */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sales Details</label>
                        <Button type="button" size="sm" variant="ghost" className="text-xs gap-1" title="Load default sales fields from the central catalog" onClick={() => setSalesInfoObj({ ...salesFieldsFromCatalog(), ...salesInfoObj })}><Plus className="h-3.5 w-3.5" /> Load catalog defaults</Button>
                      </div>
                      {Object.keys(salesInfoObj).length === 0 ? (
                        <p className="text-[11px] text-slate-400">No sales detail fields. Click &quot;Load catalog defaults&quot; or add one below.</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {Object.keys(salesInfoObj).map((key) => (
                            <div key={key} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{niceLabel(key)}</label>
                                <button type="button" onClick={() => { const next = { ...salesInfoObj }; delete next[key]; setSalesInfoObj(next); }} className="text-slate-300 hover:text-rose-600" title="Remove"><X className="h-3.5 w-3.5" /></button>
                              </div>
                              <Input value={salesInfoObj[key]} onChange={(e) => setSalesInfoObj({ ...salesInfoObj, [key]: e.target.value })} placeholder={niceLabel(key)} />
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Input value={newSalesLabel} onChange={(e) => setNewSalesLabel(e.target.value)} placeholder="Add a sales field (e.g. Maintenance Deposit)" />
                        <Button type="button" variant="gold" size="sm" className="shrink-0 gap-1" onClick={() => {
                          const key = newSalesLabel.trim();
                          if (!key || salesInfoObj[key] !== undefined) { setNewSalesLabel(""); return; }
                          setSalesInfoObj({ ...salesInfoObj, [key]: "" });
                          setNewSalesLabel("");
                        }}><Plus className="h-3.5 w-3.5" /> Add Field</Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 15. BUILDER INFO */}
                {activeTab === "builder" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      15. Builder Information & Profile
                    </h4>
                    <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 p-3 text-[11px] text-blue-800 dark:text-blue-300">
                      Pick a builder from the <strong>Developers</strong> directory — the remaining fields auto-fill from that record. Any edits you make here are synced back to the developer on save.
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Builder Name (from Developers)</label>
                        <select
                          value={formData.developerId || ""}
                          onChange={(e) => {
                            const devId = e.target.value;
                            const dev = developers.find((d) => d.id === devId);
                            if (!dev) { setFormData({ ...formData, developerId: devId }); return; }
                            setFormData({
                              ...formData,
                              developerId: devId,
                              builderName: dev.name,
                              builderLogo: dev.logo ?? formData.builderLogo ?? "",
                              website: dev.website ?? formData.website ?? "",
                              aboutBuilder: dev.description ?? formData.aboutBuilder ?? "",
                              yearsExperience: dev.experienceYears ?? formData.yearsExperience ?? null,
                              projectsDelivered: dev.projectsDelivered ?? formData.projectsDelivered ?? null,
                              ongoingProjectsCount: dev.ongoingProjectsCount ?? formData.ongoingProjectsCount ?? null,
                            });
                          }}
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-xs font-bold"
                        >
                          <option value="">— Select Developer —</option>
                          {developers.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Builder Logo URL</label>
                        <Input value={formData.builderLogo || ""} onChange={(e) => setFormData({ ...formData, builderLogo: e.target.value })} placeholder="https://logo.url/builder-logo.png" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Years Experience</label>
                        <Input type="number" value={formData.yearsExperience || ""} onChange={(e) => setFormData({ ...formData, yearsExperience: parseInt(e.target.value) || 0 })} placeholder="35" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Projects Delivered</label>
                        <Input type="number" value={formData.projectsDelivered || ""} onChange={(e) => setFormData({ ...formData, projectsDelivered: parseInt(e.target.value) || 0 })} placeholder="120" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Ongoing Projects</label>
                        <Input type="number" value={formData.ongoingProjectsCount || ""} onChange={(e) => setFormData({ ...formData, ongoingProjectsCount: parseInt(e.target.value) || 0 })} placeholder="45" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Website</label>
                        <Input value={formData.website || ""} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://godrejproperties.com" />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">About Builder</label>
                        <textarea rows={3} value={formData.aboutBuilder || ""} onChange={(e) => setFormData({ ...formData, aboutBuilder: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 text-xs font-medium" placeholder="Over 3 decades of real estate excellence..." />
                      </div>
                    </div>

                    {/* Additional builder details (awards, certifications, etc.) */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Additional Builder Details</label>
                        <Button type="button" size="sm" variant="gold" className="gap-1 text-xs" onClick={() => setBuilderExtraList([...builderExtraList, { label: "", value: "" }])}><Plus className="h-3.5 w-3.5" /> Add Detail</Button>
                      </div>
                      {builderExtraList.length === 0 ? (
                        <p className="text-[11px] text-slate-400">Add awards, certifications, RERA registration, group turnover, etc.</p>
                      ) : (
                        builderExtraList.map((row, idx) => (
                          <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_1.5fr_auto] items-center">
                            <Input value={row.label} onChange={(e) => { const next = [...builderExtraList]; next[idx] = { ...next[idx], label: e.target.value }; setBuilderExtraList(next); }} placeholder="Label (e.g. Awards)" />
                            <Input value={row.value} onChange={(e) => { const next = [...builderExtraList]; next[idx] = { ...next[idx], value: e.target.value }; setBuilderExtraList(next); }} placeholder="Value (e.g. CREDAI Developer of the Year 2024)" />
                            <Button type="button" variant="ghost" size="sm" onClick={() => setBuilderExtraList(builderExtraList.filter((_, i) => i !== idx))} className="text-rose-600 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 16. CONTACT INFORMATION */}
                {activeTab === "contact" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      16. Contact Information & Sales Office
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sales Office</label>
                        <Input value={formData.salesOfficeAddress || ""} onChange={(e) => setFormData({ ...formData, salesOfficeAddress: e.target.value })} placeholder="Experience Centre, Sector 65, Golf Course Extension Rd" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone</label>
                        <Input value={formData.salesPhone || ""} onChange={(e) => setFormData({ ...formData, salesPhone: e.target.value })} placeholder="+91 98765 43210" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email</label>
                        <Input value={formData.salesEmail || ""} onChange={(e) => setFormData({ ...formData, salesEmail: e.target.value })} placeholder="sales@godrej.com" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">WhatsApp</label>
                        <Input value={formData.salesWhatsapp || ""} onChange={(e) => setFormData({ ...formData, salesWhatsapp: e.target.value })} placeholder="+91 98765 43210" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">CRM Assigned (search user)</label>
                        <SearchableSelect
                          options={[{ value: "", label: "— Unassigned —" }, ...crmUsers.map((u: any) => ({ value: u.id, label: u.name, sublabel: [u.role ? String(u.role).replace(/_/g, " ") : "", u.email].filter(Boolean).join(" · ") }))]}
                          value={formData.crmAssignedId || ""}
                          onChange={(val) => setFormData({ ...formData, crmAssignedId: val })}
                          placeholder="Assign a CRM user..."
                          searchPlaceholder="Search name, email..."
                        />
                      </div>
                    </div>

                    {/* Multiple sales managers */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sales Managers</label>
                        <Button type="button" size="sm" variant="gold" onClick={() => setSalesManagersList([...salesManagersList, { name: "", role: "", phone: "", email: "", whatsapp: "" }])} className="gap-1 text-xs">
                          <Plus className="h-3.5 w-3.5" /> Add Sales Manager
                        </Button>
                      </div>
                      {salesManagersList.length === 0 ? (
                        <p className="text-[11px] text-slate-400">No sales managers added yet.</p>
                      ) : (
                        salesManagersList.map((m, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <SearchableSelect
                                  options={[{ value: "", label: "— Select user —" }, ...crmUsers.map((u: any) => ({ value: u.id, label: u.name, sublabel: [u.role ? String(u.role).replace(/_/g, " ") : "", u.email].filter(Boolean).join(" · ") }))]}
                                  value={m.userId || ""}
                                  onChange={(val) => {
                                    const u = crmUsers.find((x: any) => x.id === val);
                                    const next = [...salesManagersList];
                                    next[idx] = u
                                      ? { userId: u.id, name: u.name, role: u.role ? String(u.role).replace(/_/g, " ") : "", phone: [u.countryCode, u.phone].filter(Boolean).join(" "), email: u.email || "", whatsapp: [u.countryCode, u.phone].filter(Boolean).join(" ") }
                                      : { ...next[idx], userId: "" };
                                    setSalesManagersList(next);
                                  }}
                                  placeholder="Search & pick a user..."
                                  searchPlaceholder="Search name, email..."
                                />
                              </div>
                              <button type="button" onClick={() => setSalesManagersList(salesManagersList.filter((_, i) => i !== idx))} className="text-rose-600 shrink-0"><Trash2 className="h-4 w-4" /></button>
                            </div>
                            {m.userId ? (
                              <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2 text-[11px] text-slate-600 dark:text-slate-400 px-1">
                                <span>Role: <strong className="text-slate-800 dark:text-slate-200">{m.role || "—"}</strong></span>
                                <span>Phone: <strong className="text-slate-800 dark:text-slate-200">{m.phone || "—"}</strong></span>
                                <span className="truncate">Email: <strong className="text-slate-800 dark:text-slate-200">{m.email || "—"}</strong></span>
                                <span>WhatsApp: <strong className="text-slate-800 dark:text-slate-200">{m.whatsapp || "—"}</strong></span>
                                <span className="sm:col-span-2 text-[10px] text-slate-400">Details come from the user profile and can&apos;t be edited here.</span>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-400 px-1">Pick a listed user — their role, phone, email &amp; WhatsApp fill in automatically.</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 17. LEAD SETTINGS */}
                {activeTab === "leads" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      17. Lead Settings & Routing Rules
                    </h4>
                    {/* Org hierarchy cascade: Whitelabel → Franchise → Branch → Department → Team → Manager */}
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Routing Hierarchy</p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {(() => {
                          const H = orgHierarchy || {};
                          const L = leadSettingsObj;
                          const set = (patch: any) => setLeadSettingsObj({ ...L, ...patch });
                          const franchises = (H.franchises || []).filter((f: any) => !L.whitelabelId || f.organizationId === L.whitelabelId);
                          const branches = (H.branches || []).filter((b: any) => !L.franchiseId || b.franchiseId === L.franchiseId);
                          const departments = (H.departments || []).filter((d: any) => !L.branchId || d.branchId === L.branchId);
                          const teams = (H.teams || []).filter((t: any) => !L.departmentId || t.departmentId === L.departmentId);
                          const managers = (H.users || []).filter((u: any) => (L.teamId ? u.teamId === L.teamId : L.departmentId ? u.departmentId === L.departmentId : L.branchId ? u.branchId === L.branchId : false));
                          const sel = "w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 text-xs font-bold";
                          return (
                            <>
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-500">Whitelabel</label>
                                <select className={sel} value={L.whitelabelId || ""} onChange={(e) => set({ whitelabelId: e.target.value, franchiseId: "", branchId: "", departmentId: "", teamId: "", managerId: "", assignTeamId: "", assignTeam: "" })}>
                                  <option value="">— Any —</option>
                                  {(H.organizations || []).map((o: any) => (<option key={o.id} value={o.id}>{o.name}</option>))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-500">Franchise</label>
                                <select className={sel} value={L.franchiseId || ""} onChange={(e) => set({ franchiseId: e.target.value, branchId: "", departmentId: "", teamId: "", managerId: "", assignTeamId: "", assignTeam: "" })}>
                                  <option value="">— Any —</option>
                                  {franchises.map((f: any) => (<option key={f.id} value={f.id}>{f.name}</option>))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-500">Branch</label>
                                <select className={sel} value={L.branchId || ""} onChange={(e) => set({ branchId: e.target.value, departmentId: "", teamId: "", managerId: "", assignTeamId: "", assignTeam: "" })}>
                                  <option value="">— Any —</option>
                                  {branches.map((b: any) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-500">Department</label>
                                <select className={sel} value={L.departmentId || ""} onChange={(e) => set({ departmentId: e.target.value, teamId: "", managerId: "", assignTeamId: "", assignTeam: "" })}>
                                  <option value="">— Any —</option>
                                  {departments.map((d: any) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-500">Team</label>
                                <select className={sel} value={L.teamId || ""} onChange={(e) => { const t = teams.find((x: any) => x.id === e.target.value); set({ teamId: e.target.value, assignTeamId: e.target.value, assignTeam: t?.name || "", managerId: "" }); }}>
                                  <option value="">— Any —</option>
                                  {teams.map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-500">Manager</label>
                                <select className={sel} value={L.managerId || ""} onChange={(e) => { const u = managers.find((x: any) => x.id === e.target.value); set({ managerId: e.target.value, managerName: u?.name || "" }); }}>
                                  <option value="">{managers.length === 0 ? "— Pick a team first —" : "— Any —"}</option>
                                  {managers.map((u: any) => (<option key={u.id} value={u.id}>{u.name}</option>))}
                                </select>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Lead Source</label>
                        <select value={leadSettingsObj.defaultLeadSource} onChange={(e) => setLeadSettingsObj({ ...leadSettingsObj, defaultLeadSource: e.target.value })} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 text-xs font-bold">
                          {["Website", "Walk-in", "Facebook Ads", "Google Ads", "Portal", "Referral"].map((src) => (<option key={src} value={src}>{src}</option>))}
                        </select>
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Notification Email</label>
                        <Input value={leadSettingsObj.notificationEmail} onChange={(e) => setLeadSettingsObj({ ...leadSettingsObj, notificationEmail: e.target.value })} placeholder="leads@projectdomain.com" />
                      </div>
                    </div>
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        <input type="checkbox" checked={leadSettingsObj.autoAssignment} onChange={(e) => setLeadSettingsObj({ ...leadSettingsObj, autoAssignment: e.target.checked })} className="rounded text-amber-500" />
                        Auto Assignment (Round Robin Distribution)
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        <input type="checkbox" checked={leadSettingsObj.whatsappNotification} onChange={(e) => setLeadSettingsObj({ ...leadSettingsObj, whatsappNotification: e.target.checked })} className="rounded text-amber-500" />
                        WhatsApp Notification
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        <input type="checkbox" checked={leadSettingsObj.leadFormEnabled} onChange={(e) => setLeadSettingsObj({ ...leadSettingsObj, leadFormEnabled: e.target.checked })} className="rounded text-amber-500" />
                        Lead Form Enabled
                      </label>
                    </div>
                  </div>
                )}

                {/* 18. WEBSITE CONTROLS */}
                {activeTab === "website_controls" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      18. Website Controls & Display Badges
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950">
                        <input type="checkbox" checked={formData.showOnWebsite ?? true} onChange={(e) => setFormData({ ...formData, showOnWebsite: e.target.checked })} className="rounded text-amber-500" />
                        ✓ Show on Website
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950">
                        <input type="checkbox" checked={formData.featured ?? false} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="rounded text-amber-500" />
                        ✓ Featured Project
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950">
                        <input type="checkbox" checked={formData.trending ?? false} onChange={(e) => setFormData({ ...formData, trending: e.target.checked })} className="rounded text-amber-500" />
                        ✓ Trending
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950">
                        <input type="checkbox" checked={formData.isNewLaunch ?? true} onChange={(e) => setFormData({ ...formData, isNewLaunch: e.target.checked })} className="rounded text-amber-500" />
                        ✓ New Launch Badge
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950">
                        <input type="checkbox" checked={formData.isHotProperty ?? false} onChange={(e) => setFormData({ ...formData, isHotProperty: e.target.checked })} className="rounded text-amber-500" />
                        ✓ Hot Property Badge
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950">
                        <input type="checkbox" checked={formData.isSoldOut ?? false} onChange={(e) => setFormData({ ...formData, isSoldOut: e.target.checked })} className="rounded text-amber-500" />
                        ✓ Sold Out Badge
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950">
                        <input type="checkbox" checked={formData.enableEnquiry ?? true} onChange={(e) => setFormData({ ...formData, enableEnquiry: e.target.checked })} className="rounded text-amber-500" />
                        ✓ Enable Enquiry Button
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950">
                        <input type="checkbox" checked={formData.enablePriceRequest ?? true} onChange={(e) => setFormData({ ...formData, enablePriceRequest: e.target.checked })} className="rounded text-amber-500" />
                        ✓ Enable Price Request
                      </label>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-950">
                        <input type="checkbox" checked={formData.enableDownloadBrochure ?? true} onChange={(e) => setFormData({ ...formData, enableDownloadBrochure: e.target.checked })} className="rounded text-amber-500" />
                        ✓ Enable Download Brochure
                      </label>
                    </div>
                  </div>
                )}

                {/* 19. TAGS */}
                {activeTab === "tags" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      19. Tags & Badges
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {Object.keys(tagsMap).map((tag) => (
                        <label key={tag} className="flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer bg-slate-50 dark:bg-slate-950">
                          <span className="flex items-center gap-2">
                            <input type="checkbox" checked={tagsMap[tag] ?? false} onChange={(e) => setTagsMap({ ...tagsMap, [tag]: e.target.checked })} className="rounded text-amber-500" />
                            {tag.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          <button type="button" onClick={(ev) => { ev.preventDefault(); const next = { ...tagsMap }; delete next[tag]; setTagsMap(next); }} className="text-slate-300 hover:text-rose-600"><X className="h-3.5 w-3.5" /></button>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add a tag (e.g. Gated Community)" />
                      <Button type="button" variant="gold" size="sm" className="shrink-0 gap-1" onClick={() => {
                        const key = newTag.trim().replace(/\s+/g, "");
                        if (!key) return;
                        setTagsMap({ ...tagsMap, [key]: true });
                        setNewTag("");
                      }}><Plus className="h-3.5 w-3.5" /> Add</Button>
                    </div>
                  </div>
                )}

                {/* 20. FINANCIAL INFORMATION */}
                {activeTab === "financial" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      20. Financial Plans & Bank Approvals
                    </h4>
                    <div className="space-y-5">
                      {/* Toggles */}
                      <div className="grid gap-2 sm:grid-cols-2">
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                          <input type="checkbox" checked={financialInfoObj.emiAvailable} onChange={(e) => setFinancialInfoObj({ ...financialInfoObj, emiAvailable: e.target.checked })} className="rounded text-amber-500" />
                          Home Loan / EMI Available
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                          <input type="checkbox" checked={financialInfoObj.emiCalculator} onChange={(e) => setFinancialInfoObj({ ...financialInfoObj, emiCalculator: e.target.checked })} className="rounded text-amber-500" />
                          Show EMI Calculator Widget
                        </label>
                      </div>

                      {/* Payment Plans */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Payment Plans</h5>
                          <Button type="button" size="sm" variant="gold" className="gap-1 text-xs" onClick={() => setFinancialInfoObj({ ...financialInfoObj, paymentPlans: [...(financialInfoObj.paymentPlans || []), { name: "", type: "CLP", details: "", enabled: true }] })}>
                            <Plus className="h-3.5 w-3.5" /> Add Plan
                          </Button>
                        </div>
                        {(financialInfoObj.paymentPlans || []).length === 0 ? (
                          <p className="text-[11px] text-slate-400">No payment plans yet.</p>
                        ) : (
                          (financialInfoObj.paymentPlans || []).map((p: any, idx: number) => (
                            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] items-center">
                                <Input value={p.name} onChange={(e) => { const next = [...financialInfoObj.paymentPlans]; next[idx] = { ...next[idx], name: e.target.value }; setFinancialInfoObj({ ...financialInfoObj, paymentPlans: next }); }} placeholder="Plan name" />
                                <select value={p.type} onChange={(e) => { const next = [...financialInfoObj.paymentPlans]; next[idx] = { ...next[idx], type: e.target.value }; setFinancialInfoObj({ ...financialInfoObj, paymentPlans: next }); }} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs font-bold">
                                  {["CLP", "Down Payment", "Flexi", "Subvention", "Possession Linked"].map((t) => (<option key={t} value={t}>{t}</option>))}
                                </select>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1 text-[11px] font-bold"><input type="checkbox" checked={p.enabled} onChange={(e) => { const next = [...financialInfoObj.paymentPlans]; next[idx] = { ...next[idx], enabled: e.target.checked }; setFinancialInfoObj({ ...financialInfoObj, paymentPlans: next }); }} className="rounded text-amber-500" /> On</label>
                                  <button type="button" onClick={() => setFinancialInfoObj({ ...financialInfoObj, paymentPlans: financialInfoObj.paymentPlans.filter((_: any, i: number) => i !== idx) })} className="text-rose-600"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </div>
                              <Input value={p.details} onChange={(e) => { const next = [...financialInfoObj.paymentPlans]; next[idx] = { ...next[idx], details: e.target.value }; setFinancialInfoObj({ ...financialInfoObj, paymentPlans: next }); }} placeholder="Terms (e.g. 10% Booking, 80% in 30 days...)" />
                            </div>
                          ))
                        )}
                      </div>

                      {/* Bank Approvals */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Approved Banks</h5>
                          <Button type="button" size="sm" variant="gold" className="gap-1 text-xs" onClick={() => setFinancialInfoObj({ ...financialInfoObj, bankApprovals: [...(financialInfoObj.bankApprovals || []), { bankName: "", loanType: "Home Loan", interestRate: "", maxFundingPct: "", status: "Approved" }] })}>
                            <Plus className="h-3.5 w-3.5" /> Add Bank
                          </Button>
                        </div>
                        {(financialInfoObj.bankApprovals || []).length > 0 && (
                          <div className="hidden sm:grid gap-2 sm:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.9fr_auto] items-center px-1">
                            {["Bank", "Loan Type", "Rate %", "Max LTV %", "Status", ""].map((h, i) => (<span key={i} className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{h}</span>))}
                          </div>
                        )}
                        {(financialInfoObj.bankApprovals || []).length === 0 ? (
                          <p className="text-[11px] text-slate-400">No approved banks yet.</p>
                        ) : (
                          (financialInfoObj.bankApprovals || []).map((b: any, idx: number) => (
                            <div key={idx} className="grid gap-2 sm:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_0.9fr_auto] items-center">
                              <Input value={b.bankName} onChange={(e) => { const next = [...financialInfoObj.bankApprovals]; next[idx] = { ...next[idx], bankName: e.target.value }; setFinancialInfoObj({ ...financialInfoObj, bankApprovals: next }); }} placeholder="Bank name" />
                              <Input value={b.loanType} onChange={(e) => { const next = [...financialInfoObj.bankApprovals]; next[idx] = { ...next[idx], loanType: e.target.value }; setFinancialInfoObj({ ...financialInfoObj, bankApprovals: next }); }} placeholder="Home Loan" />
                              <Input value={b.interestRate} onChange={(e) => { const next = [...financialInfoObj.bankApprovals]; next[idx] = { ...next[idx], interestRate: e.target.value }; setFinancialInfoObj({ ...financialInfoObj, bankApprovals: next }); }} placeholder="8.70" />
                              <Input value={b.maxFundingPct} onChange={(e) => { const next = [...financialInfoObj.bankApprovals]; next[idx] = { ...next[idx], maxFundingPct: e.target.value }; setFinancialInfoObj({ ...financialInfoObj, bankApprovals: next }); }} placeholder="80" />
                              <select value={b.status} onChange={(e) => { const next = [...financialInfoObj.bankApprovals]; next[idx] = { ...next[idx], status: e.target.value }; setFinancialInfoObj({ ...financialInfoObj, bankApprovals: next }); }} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs font-bold">
                                {["Approved", "Pending", "In Process"].map((s) => (<option key={s} value={s}>{s}</option>))}
                              </select>
                              <button type="button" onClick={() => setFinancialInfoObj({ ...financialInfoObj, bankApprovals: financialInfoObj.bankApprovals.filter((_: any, i: number) => i !== idx) })} className="text-rose-600 shrink-0"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Loan Partners */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Loan / Channel Partners</h5>
                          <Button type="button" size="sm" variant="gold" className="gap-1 text-xs" onClick={() => setFinancialInfoObj({ ...financialInfoObj, loanPartners: [...(financialInfoObj.loanPartners || []), { name: "" }] })}>
                            <Plus className="h-3.5 w-3.5" /> Add Partner
                          </Button>
                        </div>
                        {(financialInfoObj.loanPartners || []).length === 0 ? (
                          <p className="text-[11px] text-slate-400">No loan partners yet.</p>
                        ) : (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {(financialInfoObj.loanPartners || []).map((lp: any, idx: number) => (
                              <div key={idx} className="flex gap-1.5 items-center">
                                <Input value={lp.name} onChange={(e) => { const next = [...financialInfoObj.loanPartners]; next[idx] = { ...next[idx], name: e.target.value }; setFinancialInfoObj({ ...financialInfoObj, loanPartners: next }); }} placeholder="Partner name" />
                                <button type="button" onClick={() => setFinancialInfoObj({ ...financialInfoObj, loanPartners: financialInfoObj.loanPartners.filter((_: any, i: number) => i !== idx) })} className="text-rose-600 shrink-0"><Trash2 className="h-4 w-4" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 21. TIMELINE */}
                {activeTab === "timeline" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      21. Construction Progress Timeline
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Foundation Status</label>
                        <select value={timelineObj.foundationStatus} onChange={(e) => setTimelineObj({ ...timelineObj, foundationStatus: e.target.value })} className="w-full rounded-xl border p-2 text-xs font-bold">
                          {["Completed", "Ongoing", "Pending"].map((st) => (<option key={st} value={st}>{st}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Structure Status</label>
                        <select value={timelineObj.structureStatus} onChange={(e) => setTimelineObj({ ...timelineObj, structureStatus: e.target.value })} className="w-full rounded-xl border p-2 text-xs font-bold">
                          {["Completed", "Ongoing", "Pending"].map((st) => (<option key={st} value={st}>{st}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Finishing Status</label>
                        <select value={timelineObj.finishingStatus} onChange={(e) => setTimelineObj({ ...timelineObj, finishingStatus: e.target.value })} className="w-full rounded-xl border p-2 text-xs font-bold">
                          {["Completed", "Ongoing", "Pending"].map((st) => (<option key={st} value={st}>{st}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Possession Date</label>
                        <Input value={timelineObj.possessionDateText} onChange={(e) => setTimelineObj({ ...timelineObj, possessionDateText: e.target.value })} placeholder="Dec 2028" />
                      </div>
                    </div>

                    {/* Construction milestones */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Additional Milestones</label>
                        <Button type="button" variant="gold" size="sm" className="gap-1 text-xs" onClick={() => setTimelineObj({ ...timelineObj, milestones: [...(timelineObj.milestones || []), { label: "", status: "Pending", date: "" }] })}>
                          <Plus className="h-3.5 w-3.5" /> Add Milestone
                        </Button>
                      </div>
                      {(timelineObj.milestones || []).length === 0 ? (
                        <p className="text-[11px] text-slate-400">No extra milestones. Click &quot;Add Milestone&quot;.</p>
                      ) : (
                        (timelineObj.milestones || []).map((m: any, idx: number) => (
                          <div key={idx} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_1fr_auto] items-center">
                            <Input value={m.label} onChange={(e) => { const next = [...timelineObj.milestones]; next[idx] = { ...next[idx], label: e.target.value }; setTimelineObj({ ...timelineObj, milestones: next }); }} placeholder="Milestone (e.g. Slab 10 Casting)" />
                            <select value={m.status} onChange={(e) => { const next = [...timelineObj.milestones]; next[idx] = { ...next[idx], status: e.target.value }; setTimelineObj({ ...timelineObj, milestones: next }); }} className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs font-bold">
                              {["Completed", "Ongoing", "Pending"].map((s) => (<option key={s} value={s}>{s}</option>))}
                            </select>
                            <Input type="date" value={m.date} onChange={(e) => { const next = [...timelineObj.milestones]; next[idx] = { ...next[idx], date: e.target.value }; setTimelineObj({ ...timelineObj, milestones: next }); }} />
                            <button type="button" onClick={() => setTimelineObj({ ...timelineObj, milestones: timelineObj.milestones.filter((_: any, i: number) => i !== idx) })} className="text-rose-600 shrink-0"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Progress images (URL or upload) */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Progress Images</label>
                        <label className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer transition ${uploading === "timg" ? "bg-slate-200 text-slate-500" : "bg-brand text-white hover:bg-brand-hover"}`}>
                          {uploading === "timg" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload Image
                          <input type="file" accept="image/*" multiple className="hidden" disabled={!!uploading} onChange={async (e) => {
                            const files = Array.from(e.target.files || []); if (!files.length) return;
                            setUploading("timg");
                            for (const f of files) { const res = await uploadFile(f, "image"); if (res) setTimelineObj((prev: any) => ({ ...prev, progressImages: [...(prev.progressImages || []), res.url] })); }
                            setUploading(null); e.target.value = "";
                          }} />
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Input value={newProgressImageUrl} onChange={(e) => setNewProgressImageUrl(e.target.value)} placeholder="...or paste a progress image URL" />
                        <Button type="button" variant="gold" size="sm" onClick={addTimelineProgressImage} className="shrink-0">Add URL</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {(timelineObj.progressImages || []).map((imgUrl: string, i: number) => (
                          <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border">
                            <img src={imgUrl} alt={`Progress ${i + 1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setTimelineObj({ ...timelineObj, progressImages: timelineObj.progressImages.filter((_: string, idx: number) => idx !== i) })} className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Progress videos (upload) */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Progress Videos</label>
                        <label className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer transition ${uploading === "tvid" ? "bg-slate-200 text-slate-500" : "bg-brand text-white hover:bg-brand-hover"}`}>
                          {uploading === "tvid" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Film className="h-3.5 w-3.5" />} Upload Video
                          <input type="file" accept="video/*" className="hidden" disabled={!!uploading} onChange={async (e) => {
                            const f = e.target.files?.[0]; if (!f) return;
                            setUploading("tvid");
                            const res = await uploadFile(f, "video");
                            if (res) setTimelineObj((prev: any) => ({ ...prev, videos: [...(prev.videos || []), res.url] }));
                            setUploading(null); e.target.value = "";
                          }} />
                        </label>
                      </div>
                      {(timelineObj.videos || []).length === 0 ? (
                        <p className="text-[11px] text-slate-400">No videos uploaded yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {(timelineObj.videos || []).map((v: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                              <Film className="h-4 w-4 text-slate-400 shrink-0" />
                              <a href={v} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-xs font-semibold text-brand-hover truncate hover:underline">{v}</a>
                              <button type="button" onClick={() => setTimelineObj({ ...timelineObj, videos: timelineObj.videos.filter((_: string, idx: number) => idx !== i) })} className="text-rose-600 shrink-0"><X className="h-4 w-4" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Video links (YouTube / external) */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Video Links (YouTube / Drive / etc.)</label>
                      <div className="flex gap-2">
                        <Input value={newVideoLink} onChange={(e) => setNewVideoLink(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                        <Button type="button" variant="gold" size="sm" className="shrink-0 gap-1" onClick={() => {
                          const url = newVideoLink.trim(); if (!url) return;
                          setTimelineObj({ ...timelineObj, videoLinks: [...(timelineObj.videoLinks || []), url] });
                          setNewVideoLink("");
                        }}><Link2 className="h-3.5 w-3.5" /> Add Link</Button>
                      </div>
                      {(timelineObj.videoLinks || []).length > 0 && (
                        <div className="space-y-1.5">
                          {(timelineObj.videoLinks || []).map((v: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                              <Link2 className="h-4 w-4 text-slate-400 shrink-0" />
                              <a href={v} target="_blank" rel="noreferrer" className="flex-1 min-w-0 text-xs font-semibold text-brand-hover truncate hover:underline">{v}</a>
                              <button type="button" onClick={() => setTimelineObj({ ...timelineObj, videoLinks: timelineObj.videoLinks.filter((_: string, idx: number) => idx !== i) })} className="text-rose-600 shrink-0"><X className="h-4 w-4" /></button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 22. ANALYTICS */}
                {activeTab === "analytics" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      22. Analytics & Performance Tracking
                    </h4>

                    {/* Tracking integrations — IDs saved per project, scripts injected on the public page */}
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950 p-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tracking &amp; Integrations</p>
                        <span className="text-[10px] text-slate-400">Paste IDs now — tracking activates on the live page</span>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {[
                          ["ga4", "Google Analytics 4 (Measurement ID)", "G-XXXXXXX"],
                          ["ga4PropertyId", "GA4 Property ID (for live numbers)", "123456789"],
                          ["gtm", "Google Tag Manager ID", "GTM-XXXXXX"],
                          ["metaPixel", "Meta (Facebook) Pixel ID", "123456789012345"],
                          ["searchConsole", "Search Console verification", "google-site-verification=..."],
                          ["hotjar", "Hotjar Site ID", "3xxxxxx"],
                          ["clarity", "Microsoft Clarity ID", "xxxxxxxxxx"],
                          ["linkedin", "LinkedIn Insight Partner ID", "1234567"],
                        ].map(([key, label, ph]) => (
                          <div key={key} className="space-y-1">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</label>
                            <Input value={analyticsConfig[key] || ""} onChange={(e) => setAnalyticsConfig({ ...analyticsConfig, [key]: e.target.value })} placeholder={ph} />
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Recommended tools: Google Analytics 4 + Search Console (traffic &amp; SEO), Meta Pixel &amp; LinkedIn Insight (ad conversions), Hotjar / Microsoft Clarity (heatmaps &amp; recordings), Google Tag Manager (manage all tags). Live GA numbers appear automatically once an admin adds the Google service-account key under <strong>Settings → Analytics Integration</strong> and sets the GA4 Property ID above.
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Manual / Fallback Metrics</p>
                      <span className="text-[10px] text-slate-400">Shown until live GA data is connected</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Views</label>
                        <Input type="number" value={analyticsObj.views} onChange={(e) => setAnalyticsObj({ ...analyticsObj, views: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Enquiries</label>
                        <Input type="number" value={analyticsObj.enquiries} onChange={(e) => setAnalyticsObj({ ...analyticsObj, enquiries: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Favorites</label>
                        <Input type="number" value={analyticsObj.favorites} onChange={(e) => setAnalyticsObj({ ...analyticsObj, favorites: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Shortlisted</label>
                        <Input type="number" value={analyticsObj.shortlisted} onChange={(e) => setAnalyticsObj({ ...analyticsObj, shortlisted: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Conversions</label>
                        <Input type="number" value={analyticsObj.conversions} onChange={(e) => setAnalyticsObj({ ...analyticsObj, conversions: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Revenue (₹)</label>
                        <Input type="number" value={analyticsObj.revenue} onChange={(e) => setAnalyticsObj({ ...analyticsObj, revenue: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lead Sources Breakdown</label>
                      <Input value={analyticsObj.leadSources} onChange={(e) => setAnalyticsObj({ ...analyticsObj, leadSources: e.target.value })} placeholder="Website (45%), Meta Ads (30%)..." />
                    </div>

                    {/* Custom analytics fields */}
                    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Additional Metrics &amp; Values</label>
                        <Button type="button" size="sm" variant="gold" onClick={() => setAnalyticsObj({ ...analyticsObj, customMetrics: [...(analyticsObj.customMetrics || []), { label: "", value: "" }] })} className="gap-1 text-xs">
                          <Plus className="h-3.5 w-3.5" /> Add Field
                        </Button>
                      </div>
                      {(analyticsObj.customMetrics || []).length === 0 ? (
                        <p className="text-[11px] text-slate-400">No custom metrics. Click &quot;Add Field&quot; to track one.</p>
                      ) : (
                        (analyticsObj.customMetrics || []).map((row: any, idx: number) => (
                          <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-center">
                            <Input value={row.label} onChange={(e) => { const next = [...analyticsObj.customMetrics]; next[idx] = { ...next[idx], label: e.target.value }; setAnalyticsObj({ ...analyticsObj, customMetrics: next }); }} placeholder="Metric name (e.g. Brochure Downloads)" />
                            <Input value={row.value} onChange={(e) => { const next = [...analyticsObj.customMetrics]; next[idx] = { ...next[idx], value: e.target.value }; setAnalyticsObj({ ...analyticsObj, customMetrics: next }); }} placeholder="Value" />
                            <Button type="button" variant="ghost" size="sm" onClick={() => setAnalyticsObj({ ...analyticsObj, customMetrics: analyticsObj.customMetrics.filter((_: any, i: number) => i !== idx) })} className="text-rose-600 shrink-0"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 23. PROJECT SETTINGS */}
                {activeTab === "settings" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      23. Project Visibility & Lifecycle Settings
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Visibility Status</label>
                        <select value={formData.visibility || "Public"} onChange={(e) => setFormData({ ...formData, visibility: e.target.value })} className="w-full rounded-xl border p-2.5 text-xs font-bold">
                          {["Public", "Unlisted", "Private", "Draft", "Published", "Archived"].map((v) => (<option key={v} value={v}>{v}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Lifecycle Stage</label>
                        <select value={settingsObj.lifecycleStage || ""} onChange={(e) => setSettingsObj({ ...settingsObj, lifecycleStage: e.target.value })} className="w-full rounded-xl border p-2.5 text-xs font-bold">
                          {["", "Planning", "Pre-Launch", "Launched", "Under Construction", "Nearing Possession", "Ready to Move", "Sold Out", "On Hold"].map((v) => (<option key={v} value={v}>{v || "— Select —"}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Approval Status</label>
                        <select value={settingsObj.approvalStatus || "Approved"} onChange={(e) => setSettingsObj({ ...settingsObj, approvalStatus: e.target.value })} className="w-full rounded-xl border p-2.5 text-xs font-bold">
                          {["Approved", "Pending Review", "Rejected", "Needs Changes"].map((v) => (<option key={v} value={v}>{v}</option>))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Listing Priority (sort order)</label>
                        <Input type="number" value={settingsObj.priority ?? ""} onChange={(e) => setSettingsObj({ ...settingsObj, priority: e.target.value === "" ? "" : parseInt(e.target.value) || 0 })} placeholder="Higher shows first (e.g. 10)" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Publish Date</label>
                        <Input type="date" value={settingsObj.publishDate || ""} onChange={(e) => setSettingsObj({ ...settingsObj, publishDate: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Listing Expiry Date</label>
                        <Input type="date" value={settingsObj.expiryDate || ""} onChange={(e) => setSettingsObj({ ...settingsObj, expiryDate: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                      {[["archived", "Archived (hidden everywhere)"], ["allowComparisons", "Allow in compare tool"], ["showPriceToPublic", "Show price publicly"], ["acceptingBookings", "Accepting bookings"]].map(([k, lbl]) => (
                        <label key={k} className="flex items-center gap-2 text-xs font-bold cursor-pointer p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                          <input type="checkbox" checked={!!settingsObj[k]} onChange={(e) => setSettingsObj({ ...settingsObj, [k]: e.target.checked })} className="rounded text-amber-500" />
                          {lbl}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 24. DYNAMIC CUSTOM FIELDS */}
                {activeTab === "custom_fields" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      24. Admins Dynamic Custom Fields Builder
                    </h4>
                    <div className="grid gap-2 sm:grid-cols-4 items-center">
                      <Input value={newCustomFieldName} onChange={(e) => setNewCustomFieldName(e.target.value)} placeholder="Field Label (e.g. Architect)" />
                      <select value={newCustomFieldType} onChange={(e) => setNewCustomFieldType(e.target.value)} className="rounded-xl border p-2 text-xs font-bold">
                        {["Text", "Number", "Dropdown", "Multi-select", "Date", "Boolean", "URL", "File upload"].map((t) => (<option key={t} value={t}>{t}</option>))}
                      </select>
                      <Input value={newCustomFieldValue} onChange={(e) => setNewCustomFieldValue(e.target.value)} placeholder="Value..." />
                      <Button type="button" variant="gold" size="sm" onClick={addCustomField} className="shrink-0">
                        Add Field
                      </Button>
                    </div>

                    <div className="space-y-2 pt-3">
                      {customFieldsList.map((cf, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border text-xs font-bold">
                          <div>
                            <span className="font-extrabold text-slate-900">{cf.name}</span>
                            <span className="text-[10px] ml-2 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-mono">{cf.type}</span>
                            <p className="text-xs text-slate-600 mt-0.5">{cf.value || "—"}</p>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => setCustomFieldsList(customFieldsList.filter((_, idx) => idx !== i))} className="text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 25. RELATIONSHIPS */}
                {activeTab === "relationships" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      25. Linked CRM Modules & System Relationships
                    </h4>
                    <p className="text-xs text-slate-500">Enable or link project data across enterprise CRM modules:</p>

                    {/* Live linked summary + quick manage links */}
                    <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950 p-3 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200">Linked Properties: <strong className="text-brand">{formData._count?.properties ?? 0}</strong></span>
                        {formData.developerId && <span className="inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-200">Developer linked ✓</span>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[["Properties", "/admin/properties"], ["Leads", "/admin/leads"], ["Site Visits", "/admin/showings"], ["Bookings", "/admin/bookings"], ["Invoices", "/admin/invoices"], ["Payments", "/admin/payments"]].map(([label, href]) => (
                          <a key={label} href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-brand/50 hover:text-brand">
                            <ExternalLink className="h-3 w-3" /> Manage {label}
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        "Properties/Units", "Leads", "Customers", "Builders", "Agents",
                        "Sales Team", "Tasks", "Documents", "Campaigns", "Site Visits",
                        "Bookings", "Payments", "Invoices", "Collections", "Agreements"
                      ].map((mod) => {
                        const key = mod.replace(/[^a-zA-Z]/g, "");
                        return (
                          <label key={mod} className="flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer bg-slate-50 dark:bg-slate-950">
                            <input type="checkbox" checked={relationshipsMap[key] ?? true} onChange={(e) => setRelationshipsMap({ ...relationshipsMap, [key]: e.target.checked })} className="rounded text-amber-500" />
                            ✓ {mod}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submit Action Bar */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <Button type="button" variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  {canEdit && (
                    <Button type="submit" variant="gold" size="sm" className="font-extrabold px-6">
                      {editingProjectId ? "Update Project" : "Save Project"}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
