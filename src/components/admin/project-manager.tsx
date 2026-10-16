"use client";

import React, { useState, useEffect } from "react";
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
  ExternalLink,
  ChevronDown,
  Clock,
  X,
  FileCode,
  Users,
  CheckSquare,
  Building,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { useAdminPermissions } from "@/components/admin/admin-permissions-context";

export interface DeveloperOption {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
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
  relationshipsJson?: string | null;

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
  const [leadSettingsObj, setLeadSettingsObj] = useState({
    assignTeam: "Residential Sales Team Alpha",
    defaultLeadSource: "Website",
    autoAssignment: true,
    notificationEmail: "leads@projectdomain.com",
    whatsappNotification: true,
    leadFormEnabled: true,
  });

  // Section 20: Financial Information
  const [financialInfoObj, setFinancialInfoObj] = useState({
    constructionLinkedPlan: true,
    constructionLinkedPlanDetails: "10% Booking, 15% Excavation, 15% Slab 5, 10% Possession",
    downPaymentPlan: true,
    downPaymentPlanDetails: "10% Booking, 80% in 30 Days (8% Discount), 10% Possession",
    emiAvailable: true,
    loanPartners: "HDFC Bank, ICICI Bank, SBI, Axis Bank, Kotak Mahindra",
    bankApprovals: "HDFC, SBI, ICICI, Axis Bank, PNB Housing",
    emiCalculator: true,
  });

  // Section 21: Timeline
  const [timelineObj, setTimelineObj] = useState({
    foundationStatus: "Completed",
    structureStatus: "Completed",
    finishingStatus: "Ongoing",
    possessionDateText: "Dec 2028",
    progressImages: [
      "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7",
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
    ],
  });

  const [newProgressImageUrl, setNewProgressImageUrl] = useState("");

  // Section 22: Analytics
  const [analyticsObj, setAnalyticsObj] = useState({
    views: 1240,
    enquiries: 84,
    favorites: 42,
    shortlisted: 28,
    conversions: 12,
    revenue: 45000000,
    leadSources: "Website (45%), Google Ads (30%), Walk-in (15%), Referral (10%)",
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
    setActiveTab("basic");
    setModalOpen(true);
  };

  const handleOpenEditModal = (proj: ProjectData) => {
    setEditingProjectId(proj.id);
    setFormData(proj);

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
      if (proj.financialInfoJson) setFinancialInfoObj(JSON.parse(proj.financialInfoJson));
      if (proj.timelineJson) setTimelineObj(JSON.parse(proj.timelineJson));
      if (proj.analyticsJson) setAnalyticsObj(JSON.parse(proj.analyticsJson));
      if (proj.relationshipsJson) setRelationshipsMap(JSON.parse(proj.relationshipsJson));
      if (proj.customFieldsJson) setCustomFieldsList(JSON.parse(proj.customFieldsJson));
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
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
                          ? "bg-amber-500 text-slate-950 shadow-xs"
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
                        <Input value={formData.country || "IN"} onChange={(e) => setFormData({ ...formData, country: e.target.value })} placeholder="IN" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">State</label>
                        <Input value={formData.state || ""} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="Haryana" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">City</label>
                        <Input value={formData.city || ""} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Gurugram" />
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
                        <Input value={formData.zip || ""} onChange={(e) => setFormData({ ...formData, zip: e.target.value })} placeholder="122001" />
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
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Project USP / Key Highlights</label>
                        <Input value={formData.projectUspJson || ""} onChange={(e) => setFormData({ ...formData, projectUspJson: e.target.value })} placeholder="e.g. 80% Green Open Space, Olympic Size Pool, Smart Automation" />
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
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cover Image URL</label>
                        <Input value={formData.coverImage || ""} onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })} placeholder="https://images.unsplash.com/photo-..." />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Banner Image URL</label>
                        <Input value={formData.bannerImage || ""} onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })} placeholder="https://images.unsplash.com/photo-..." />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Master Plan URL</label>
                        <Input value={formData.masterPlanUrl || ""} onChange={(e) => setFormData({ ...formData, masterPlanUrl: e.target.value })} placeholder="https://..." />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Brochure PDF URL</label>
                        <Input value={formData.brochurePdfUrl || ""} onChange={(e) => setFormData({ ...formData, brochurePdfUrl: e.target.value })} placeholder="https://...brochure.pdf" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Price Sheet PDF URL</label>
                        <Input value={formData.priceSheetPdfUrl || ""} onChange={(e) => setFormData({ ...formData, priceSheetPdfUrl: e.target.value })} placeholder="https://...price-sheet.pdf" />
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
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Drone Video URL</label>
                        <Input value={formData.droneVideoUrl || ""} onChange={(e) => setFormData({ ...formData, droneVideoUrl: e.target.value })} placeholder="https://..." />
                      </div>
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
                  </div>
                )}

                {/* 6. UNIT CONFIGURATIONS */}
                {activeTab === "configs" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        6. Unit Configurations Matrix
                      </h4>
                      <Button type="button" size="sm" variant="gold" onClick={addConfigurationRow} className="gap-1 text-xs">
                        <Plus className="h-3.5 w-3.5" /> Add Configuration
                      </Button>
                    </div>

                    <div className="space-y-3">
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
                      <Button type="button" size="sm" variant="gold" onClick={addTowerRow} className="gap-1 text-xs">
                        <Plus className="h-3.5 w-3.5" /> Add Tower
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {towersList.map((t, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 grid gap-2 sm:grid-cols-5 items-center">
                          <Input value={t.name} onChange={(e) => { const next = [...towersList]; next[idx].name = e.target.value; setTowersList(next); }} placeholder="Tower Name (e.g. Tower A)" />
                          <Input type="number" value={t.floors} onChange={(e) => { const next = [...towersList]; next[idx].floors = parseInt(e.target.value) || 0; setTowersList(next); }} placeholder="Total Floors" />
                          <Input type="number" value={t.liftCount} onChange={(e) => { const next = [...towersList]; next[idx].liftCount = parseInt(e.target.value) || 0; setTowersList(next); }} placeholder="Lift Count" />
                          <Input value={t.status} onChange={(e) => { const next = [...towersList]; next[idx].status = e.target.value; setTowersList(next); }} placeholder="Status" />
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
                      <Button type="button" size="sm" variant="gold" onClick={addInventoryRow} className="gap-1 text-xs">
                        <Plus className="h-3.5 w-3.5" /> Add Unit
                      </Button>
                    </div>

                    <div className="space-y-3">
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
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      9. Project Amenities Matrix
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {Object.keys(amenitiesMap).map((key) => (
                        <label key={key} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold cursor-pointer">
                          <input type="checkbox" checked={amenitiesMap[key]} onChange={(e) => setAmenitiesMap({ ...amenitiesMap, [key]: e.target.checked })} className="rounded text-amber-500" />
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </label>
                      ))}
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
                          <select value={place.category} onChange={(e) => { const next = [...nearbyPlacesList]; next[idx].category = e.target.value; setNearbyPlacesList(next); }} className="rounded-xl border border-slate-300 p-2 text-xs font-bold">
                            {["School", "Hospital", "Metro", "Airport", "Mall", "Restaurant", "Bank", "Highway"].map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
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
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      11. Architectural Specifications
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.keys(specificationsObj).map((key) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{key}</label>
                          <Input value={specificationsObj[key]} onChange={(e) => setSpecificationsObj({ ...specificationsObj, [key]: e.target.value })} placeholder={`e.g. ${key} details...`} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 12. DOCUMENTS */}
                {activeTab === "documents" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      12. Legal Documents & Approvals
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {Object.keys(documentsObj).map((key) => (
                        <div key={key} className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
                          <Input value={documentsObj[key]} onChange={(e) => setDocumentsObj({ ...documentsObj, [key]: e.target.value })} placeholder="Document PDF URL..." />
                        </div>
                      ))}
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
                  </div>
                )}

                {/* 15. BUILDER INFO */}
                {activeTab === "builder" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      15. Builder Information & Profile
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Builder Name</label>
                        <Input value={formData.builderName || ""} onChange={(e) => setFormData({ ...formData, builderName: e.target.value })} placeholder="Godrej Properties" />
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
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">CRM Assigned</label>
                        <Input value={formData.crmAssignedId || ""} onChange={(e) => setFormData({ ...formData, crmAssignedId: e.target.value })} placeholder="CRM-MGR-001" />
                      </div>
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sales Manager</label>
                        <Input value={formData.salesManagerName || ""} onChange={(e) => setFormData({ ...formData, salesManagerName: e.target.value })} placeholder="Rahul Sharma (Senior VP Sales)" />
                      </div>
                    </div>
                  </div>
                )}

                {/* 17. LEAD SETTINGS */}
                {activeTab === "leads" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      17. Lead Settings & Routing Rules
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Assign Team</label>
                        <Input value={leadSettingsObj.assignTeam} onChange={(e) => setLeadSettingsObj({ ...leadSettingsObj, assignTeam: e.target.value })} placeholder="Residential Sales Alpha" />
                      </div>
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
                      {["Luxury", "Near Metro", "Ready to Move", "Investment", "Premium", "Affordable", "Corner Plot", "Lake View", "Hill View", "Smart Home"].map((tag) => (
                        <label key={tag} className="flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer bg-slate-50 dark:bg-slate-950">
                          <input type="checkbox" checked={tagsMap[tag] ?? false} onChange={(e) => setTagsMap({ ...tagsMap, [tag]: e.target.checked })} className="rounded text-amber-500" />
                          {tag}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 20. FINANCIAL INFORMATION */}
                {activeTab === "financial" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      20. Financial Plans & Bank Approvals
                    </h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-slate-50 rounded-2xl border space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                          <input type="checkbox" checked={financialInfoObj.constructionLinkedPlan} onChange={(e) => setFinancialInfoObj({ ...financialInfoObj, constructionLinkedPlan: e.target.checked })} className="rounded text-amber-500" />
                          Construction Linked Plan (CLP)
                        </label>
                        <Input value={financialInfoObj.constructionLinkedPlanDetails} onChange={(e) => setFinancialInfoObj({ ...financialInfoObj, constructionLinkedPlanDetails: e.target.value })} placeholder="CLP terms..." />
                      </div>

                      <div className="p-3 bg-slate-50 rounded-2xl border space-y-2">
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                          <input type="checkbox" checked={financialInfoObj.downPaymentPlan} onChange={(e) => setFinancialInfoObj({ ...financialInfoObj, downPaymentPlan: e.target.checked })} className="rounded text-amber-500" />
                          Down Payment Plan
                        </label>
                        <Input value={financialInfoObj.downPaymentPlanDetails} onChange={(e) => setFinancialInfoObj({ ...financialInfoObj, downPaymentPlanDetails: e.target.value })} placeholder="Down Payment terms..." />
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Loan Partners</label>
                          <Input value={financialInfoObj.loanPartners} onChange={(e) => setFinancialInfoObj({ ...financialInfoObj, loanPartners: e.target.value })} placeholder="HDFC, ICICI, SBI..." />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Bank Approvals</label>
                          <Input value={financialInfoObj.bankApprovals} onChange={(e) => setFinancialInfoObj({ ...financialInfoObj, bankApprovals: e.target.value })} placeholder="Approved banks list..." />
                        </div>
                      </div>

                      <div className="pt-2">
                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                          <input type="checkbox" checked={financialInfoObj.emiCalculator} onChange={(e) => setFinancialInfoObj({ ...financialInfoObj, emiCalculator: e.target.checked })} className="rounded text-amber-500" />
                          ✓ Enable EMI Calculator Widget on Project Page
                        </label>
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

                    <div className="space-y-2 pt-2 border-t">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Monthly Progress Images</label>
                      <div className="flex gap-2">
                        <Input value={newProgressImageUrl} onChange={(e) => setNewProgressImageUrl(e.target.value)} placeholder="Progress image URL..." />
                        <Button type="button" variant="gold" size="sm" onClick={addTimelineProgressImage} className="shrink-0">
                          Add Image
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {timelineObj.progressImages.map((imgUrl, i) => (
                          <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border">
                            <img src={imgUrl} alt={`Progress ${i + 1}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setTimelineObj({ ...timelineObj, progressImages: timelineObj.progressImages.filter((_, idx) => idx !== i) })} className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 22. ANALYTICS */}
                {activeTab === "analytics" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      22. Analytics & Performance Tracking
                    </h4>
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
                  </div>
                )}

                {/* 23. PROJECT SETTINGS */}
                {activeTab === "settings" && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white border-b pb-2">
                      23. Project Visibility & Lifecycle Settings
                    </h4>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Visibility Status</label>
                      <select value={formData.visibility || "Public"} onChange={(e) => setFormData({ ...formData, visibility: e.target.value })} className="w-full rounded-xl border p-2.5 text-xs font-bold">
                        {["Public", "Private", "Archived", "Draft", "Published", "Deleted"].map((v) => (<option key={v} value={v}>{v}</option>))}
                      </select>
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
