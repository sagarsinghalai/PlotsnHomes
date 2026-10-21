import { prisma } from "@/lib/prisma";

export const SITE_SETTING_KEYS = {
  HERO_STATS: "site_hero_stats",
  TICKER_CONFIG: "site_ticker_config",
  HERO_CARDS: "site_hero_cards",
  FEATURED_AREAS: "site_featured_areas",
  HERO_CONTENT: "site_hero_content",
  HOW_IT_WORKS: "site_how_it_works",
  TESTIMONIALS: "site_testimonials",
  TEAM_MEMBERS: "site_team_members",
  DROPDOWN_OPTIONS: "site_dropdown_options",
  PROJECT_FIELD_DEFAULTS: "project_field_defaults",
  ANALYTICS_INTEGRATION: "analytics_integration",
} as const;

export type SiteSettingKey = typeof SITE_SETTING_KEYS[keyof typeof SITE_SETTING_KEYS];

export interface DropdownOptionItem {
  id: string;
  label: string;
  value: string;
  badgeColor?: string;
  enabled: boolean;
}

export interface DropdownFieldConfig {
  key: string;
  name: string;
  description: string;
  options: DropdownOptionItem[];
}

export interface SectionDropdownConfig {
  sectionKey: string;
  sectionTitle: string;
  fields: DropdownFieldConfig[];
}

// ─── Central "master list" catalogs that pre-fill every project ───
export interface CatalogItem {
  key: string;        // stable key (also the field key for specs/docs/sales)
  label: string;      // display label / amenity name / category name
  value?: string;     // default value text (specs & sales fields)
  enabled: boolean;   // whether it pre-fills new projects / shows in pickers
}

export interface ProjectFieldDefaults {
  amenities: CatalogItem[];
  specifications: CatalogItem[];
  documents: CatalogItem[];
  salesFields: CatalogItem[];
  nearbyCategories: CatalogItem[];
}

export interface AnalyticsIntegration {
  gaServiceAccountJson?: string; // Google service-account key (platform-wide)
  gaEnabled?: boolean;
  defaultGtmId?: string;
  defaultMetaPixelId?: string;
}

const ci = (label: string, value?: string, key?: string): CatalogItem => ({
  key: key || label.replace(/[^a-zA-Z0-9]+/g, (m, i) => (i === 0 ? "" : " ")).trim().replace(/\s+(.)/g, (_m, c) => c.toUpperCase()).replace(/^(.)/, (_m, c) => c.toLowerCase()) || label,
  label,
  ...(value !== undefined ? { value } : {}),
  enabled: true,
});

export const DEFAULT_PROJECT_FIELD_DEFAULTS: ProjectFieldDefaults = {
  amenities: [
    "Gymnasium", "Swimming Pool", "Clubhouse", "Kids Play Area", "Jogging Track",
    "Landscaped Gardens", "Indoor Games", "Banquet Hall", "Library", "Yoga / Meditation Deck",
    "Amphitheatre", "Multipurpose Court", "Tennis Court", "Basketball Court", "Cricket Pitch",
    "Table Tennis", "Billiards", "Squash Court", "Spa & Sauna", "Senior Citizen Area",
    "Party Lawn", "Cafeteria", "Mini Theatre", "Co-working Space", "Business Centre",
    "24x7 Security", "CCTV Surveillance", "Video Door Phone", "Gated Community", "Fire Fighting System",
    "Power Backup", "Lifts / Elevators", "Covered Car Parking", "Visitor Parking", "EV Charging",
    "Rain Water Harvesting", "Sewage Treatment Plant", "Solar Power", "Water Softening Plant", "Piped Gas",
    "Intercom", "Wi-Fi Connectivity", "Smart Home Automation", "Maintenance Staff", "Vastu Compliant",
  ].map((a) => ci(a)),
  specifications: [
    ["Flooring", "Imported Italian Marble in Living & Dining, Wooden Flooring in Bedrooms"],
    ["Kitchen", "Modular Kitchen with Granite Countertop & Stainless Steel Sink"],
    ["Bathroom", "Premium Kohler / Grohe Sanitary Ware & CP Fittings"],
    ["Electrical", "Concealed Copper Wiring with Modular Switches (Havells/Legrand)"],
    ["Doors", "Teak Wood Frame Main Door with Digital Smart Lock"],
    ["Windows", "UPVC Soundproof Double Glazed Sliding Windows"],
    ["Walls", "Smooth POP Finish with Acrylic Emulsion Paint"],
    ["Painting", "Weatherproof Exterior Paint"],
    ["Lift", "High-Speed Mitsubishi / Otis Automatic Passenger Lifts"],
    ["Structure", "Earthquake Resistant RCC Frame Structure Zone 5"],
    ["Ceiling Height", "10 ft floor-to-floor height"],
    ["Balcony", "Toughened glass railing with anti-skid tiles"],
  ].map(([label, value]) => ci(label, value)),
  documents: [
    "RERA Certificate", "Approval Documents", "Occupancy Certificate", "Completion Certificate",
    "NOC Documents", "Layout Plan PDF", "Legal Documents", "Sample Agreement PDF",
    "Fire NOC", "Environment Clearance", "Commencement Certificate", "Title Deed / Encumbrance",
  ].map((d) => ci(d)),
  salesFields: [
    ["Total Units", ""], ["Available Units", ""], ["Booked Units", ""], ["Sold Units", ""],
    ["Possession Date", ""], ["Booking Amount", ""], ["Price on Request", "No"],
    ["Sample Flat Available", "Yes"], ["Home Loan Available", "Yes"], ["Approved Banks", ""],
    ["Payment Plan", ""], ["Current Offer", ""], ["Offer Valid Till", ""], ["Booking Window", ""],
    ["Channel Partner", ""], ["Sales Office Hours", "Mon–Sun, 10 AM – 7 PM"], ["Site Visit Available", "Yes"],
  ].map(([label, value]) => ci(label, value)),
  nearbyCategories: [
    "School", "Hospital", "Metro Station", "Railway Station", "Airport", "Bus Stop",
    "Shopping Mall", "Supermarket", "Restaurant", "Bank / ATM", "Highway", "Park",
    "Gym / Fitness", "Pharmacy", "IT Park", "Business District", "University / College",
    "Petrol Pump", "Place of Worship", "Cinema",
  ].map((n) => ci(n)),
};

export interface HeroStat {
  id: string;
  label: string;
  value: string;
}

export interface TickerItem {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
  yieldRate: number;
  slug: string;
}

export interface TickerConfig {
  speed: number;
  items: TickerItem[];
}

export interface HeroCard {
  id: string;
  title: string;
  symbol: string;
  price: number;
  yieldRate: number;
  change24h: number;
  imageUrl: string;
  slug: string;
  city: string;
  state: string;
}

export interface FeaturedArea {
  id: string;
  area: string;
  count: number;
  imageUrl: string;
}

export interface HeroContent {
  title1: string;
  highlightedText: string;
  title2: string;
  subtitle: string;
  videoUrl: string;
}

export interface HowItWorksStep {
  title: string;
  desc: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  image: string;
  rating: number;
  text: string;
  investmentAmount: string;
  portfolioSize: string;
}

export interface TestimonialsConfig {
  googleReviewUrl: string;
  items: TestimonialItem[];
}

export interface TeamMemberItem {
  id: string;
  name: string;
  designation: string;
  countryCode: string;
  phone: string;
  image?: string;
}

export const DEFAULT_USERS_ACCOUNTS_DROPDOWNS: SectionDropdownConfig[] = [
  {
    sectionKey: "projects",
    sectionTitle: "Projects",
    fields: [
      {
        key: "project_type",
        name: "Project Type",
        description: "Selectable property & project types for developer projects catalog.",
        options: [
          { id: "1", label: "Apartment", value: "Apartment", enabled: true },
          { id: "2", label: "Villa", value: "Villa", enabled: true },
          { id: "3", label: "Plot", value: "Plot", enabled: true },
          { id: "4", label: "Commercial", value: "Commercial", enabled: true },
          { id: "5", label: "Office", value: "Office", enabled: true },
          { id: "6", label: "Retail", value: "Retail", enabled: true },
          { id: "7", label: "Warehouse", value: "Warehouse", enabled: true },
          { id: "8", label: "Mixed Use", value: "Mixed Use", enabled: true },
        ],
      },
      {
        key: "project_category",
        name: "Project Category",
        description: "Selectable property categories for developer projects.",
        options: [
          { id: "1", label: "RESIDENTIAL", value: "Residential", enabled: true },
          { id: "2", label: "COMMERCIAL", value: "Commercial", enabled: true },
          { id: "3", label: "LAND", value: "Land", enabled: true },
          { id: "4", label: "RENTAL", value: "Rental", enabled: true },
          { id: "5", label: "INDUSTRIAL", value: "Industrial", enabled: true },
          { id: "6", label: "HOSPITALITY", value: "Hospitality", enabled: true },
        ],
      },
      {
        key: "project_status",
        name: "Project Status",
        description: "Construction and sales status flags for developer projects.",
        options: [
          { id: "1", label: "Upcoming", value: "Upcoming", enabled: true },
          { id: "2", label: "New Launch", value: "New Launch", enabled: true },
          { id: "3", label: "Under Construction", value: "Under Construction", enabled: true },
          { id: "4", label: "Ready to Move", value: "Ready to Move", enabled: true },
          { id: "5", label: "Sold Out", value: "Sold Out", enabled: true },
        ],
      },
    ],
  },
  {
    sectionKey: "properties",
    sectionTitle: "Properties",
    fields: [
      {
        key: "listing_type",
        name: "Listing type",
        description: "Selectable listing transaction types (e.g. Sales, Rent, Lease, PG).",
        options: [
          { id: "1", label: "Sales", value: "Sales", enabled: true },
          { id: "2", label: "Rent", value: "Rent", enabled: true },
          { id: "3", label: "Lease", value: "Lease", enabled: true },
          { id: "4", label: "PG / Hostel", value: "PG", enabled: true },
          { id: "5", label: "Resale", value: "Resale", enabled: true },
        ],
      },
      {
        key: "property_category",
        name: "Category",
        description: "Selectable categories for property listings.",
        options: [
          { id: "1", label: "Apartment", value: "Apartment", enabled: true },
          { id: "2", label: "Villa", value: "Villa", enabled: true },
          { id: "3", label: "Penthouse", value: "Penthouse", enabled: true },
          { id: "4", label: "Plot", value: "Plot", enabled: true },
          { id: "5", label: "Commercial", value: "Commercial", enabled: true },
          { id: "6", label: "Office", value: "Office", enabled: true },
          { id: "7", label: "Studio", value: "Studio", enabled: true },
        ],
      },
      {
        key: "property_type",
        name: "Type",
        description: "Classification type of property asset.",
        options: [
          { id: "1", label: "RESIDENTIAL", value: "RESIDENTIAL", enabled: true },
          { id: "2", label: "COMMERCIAL", value: "COMMERCIAL", enabled: true },
          { id: "3", label: "LAND", value: "LAND", enabled: true },
          { id: "4", label: "RENTAL", value: "RENTAL", enabled: true },
          { id: "5", label: "INDUSTRIAL", value: "INDUSTRIAL", enabled: true },
          { id: "6", label: "HOSPITALITY", value: "HOSPITALITY", enabled: true },
        ],
      },
      {
        key: "property_status",
        name: "Status",
        description: "Publication & inventory availability status.",
        options: [
          { id: "1", label: "ACTIVE", value: "ACTIVE", enabled: true },
          { id: "2", label: "INACTIVE", value: "INACTIVE", enabled: true },
          { id: "3", label: "DRAFT", value: "DRAFT", enabled: true },
          { id: "4", label: "SOLD", value: "SOLD", enabled: true },
          { id: "5", label: "RENTED", value: "RENTED", enabled: true },
          { id: "6", label: "PENDING_APPROVAL", value: "PENDING_APPROVAL", enabled: true },
        ],
      },
      {
        key: "configuration",
        name: "Configuration (BHK / Layout)",
        description: "BHK room counts and layout configurations.",
        options: [
          { id: "1", label: "1BHK", value: "1BHK", enabled: true },
          { id: "2", label: "2BHK", value: "2BHK", enabled: true },
          { id: "3", label: "3BHK", value: "3BHK", enabled: true },
          { id: "4", label: "4BHK", value: "4BHK", enabled: true },
          { id: "5", label: "5BHK", value: "5BHK", enabled: true },
          { id: "6", label: "Studio", value: "Studio", enabled: true },
          { id: "7", label: "Duplex", value: "Duplex", enabled: true },
          { id: "8", label: "Penthouse", value: "Penthouse", enabled: true },
        ],
      },
      {
        key: "furnishing_status",
        name: "Furnishing Status",
        description: "Interior furnishing condition level.",
        options: [
          { id: "1", label: "None", value: "None", enabled: true },
          { id: "2", label: "Unfurnished", value: "Unfurnished", enabled: true },
          { id: "3", label: "Semi Furnished", value: "Semi Furnished", enabled: true },
          { id: "4", label: "Fully Furnished", value: "Fully Furnished", enabled: true },
        ],
      },
      {
        key: "lift_type",
        name: "Lift Type",
        description: "Elevator access amenity type.",
        options: [
          { id: "1", label: "None", value: "None", enabled: true },
          { id: "2", label: "Common Lift", value: "Common Lift", enabled: true },
          { id: "3", label: "Personal Lift", value: "Personal Lift", enabled: true },
          { id: "4", label: "No Lift", value: "No Lift", enabled: true },
          { id: "5", label: "Service Lift", value: "Service Lift", enabled: true },
        ],
      },
      {
        key: "availability",
        name: "Availability",
        description: "Unit inventory availability status.",
        options: [
          { id: "1", label: "Available", value: "Available", enabled: true },
          { id: "2", label: "Sold", value: "Sold", enabled: true },
          { id: "3", label: "Rented", value: "Rented", enabled: true },
          { id: "4", label: "Under Offer", value: "Under Offer", enabled: true },
          { id: "5", label: "Reserved", value: "Reserved", enabled: true },
        ],
      },
    ],
  },
  {
    sectionKey: "all_leads",
    sectionTitle: "All leads",
    fields: [
      {
        key: "lead_source",
        name: "Lead Source",
        description: "Source channel where the lead originated.",
        options: [
          { id: "1", label: "Site Visit", value: "Site Visit", enabled: true },
          { id: "2", label: "Website", value: "Website", enabled: true },
          { id: "3", label: "Referral", value: "Referral", enabled: true },
          { id: "4", label: "Cold Call", value: "Cold Call", enabled: true },
          { id: "5", label: "Facebook Ads", value: "Facebook Ads", enabled: true },
          { id: "6", label: "Google Search", value: "Google Search", enabled: true },
          { id: "7", label: "WhatsApp Inquiry", value: "WhatsApp Inquiry", enabled: true },
          { id: "8", label: "Property Portal", value: "Property Portal", enabled: true },
        ],
      },
      {
        key: "lifecycle_stage",
        name: "Lifecycle Stage",
        description: "Lead lifecycle funnel progression stage.",
        options: [
          { id: "1", label: "Lead", value: "Lead", enabled: true },
          { id: "2", label: "Subscriber", value: "Subscriber", enabled: true },
          { id: "3", label: "Prospect", value: "Prospect", enabled: true },
          { id: "4", label: "MQL", value: "MQL", enabled: true },
          { id: "5", label: "SQL", value: "SQL", enabled: true },
          { id: "6", label: "Opportunity", value: "Opportunity", enabled: true },
          { id: "7", label: "Customer", value: "Customer", enabled: true },
          { id: "8", label: "Closed Won", value: "Closed Won", enabled: true },
          { id: "9", label: "Closed Lost", value: "Closed Lost", enabled: true },
        ],
      },
      {
        key: "lead_status",
        name: "Lead Status",
        description: "Current active CRM workflow status.",
        options: [
          { id: "1", label: "NEW", value: "NEW", enabled: true },
          { id: "2", label: "CONTACTED", value: "CONTACTED", enabled: true },
          { id: "3", label: "QUALIFIED", value: "QUALIFIED", enabled: true },
          { id: "4", label: "PROPOSAL_SENT", value: "PROPOSAL_SENT", enabled: true },
          { id: "5", label: "NEGOTIATION", value: "NEGOTIATION", enabled: true },
          { id: "6", label: "WON", value: "WON", enabled: true },
          { id: "7", label: "LOST", value: "LOST", enabled: true },
          { id: "8", label: "UNQUALIFIED", value: "UNQUALIFIED", enabled: true },
        ],
      },
      {
        key: "priority",
        name: "Priority Level",
        description: "Urgent response priority level.",
        options: [
          { id: "1", label: "LOW", value: "LOW", enabled: true },
          { id: "2", label: "MEDIUM", value: "MEDIUM", enabled: true },
          { id: "3", label: "HIGH", value: "HIGH", enabled: true },
          { id: "4", label: "URGENT", value: "URGENT", enabled: true },
        ],
      },
    ],
  },
];

const DEFAULTS: Record<string, string> = {
  [SITE_SETTING_KEYS.HERO_STATS]:
    '[{"id":"1","label":"Assets Under Management","value":"₹12.4 Cr"},{"id":"2","label":"Active Investors","value":"2,841"},{"id":"3","label":"Properties Listed","value":"48"}]',
  [SITE_SETTING_KEYS.TICKER_CONFIG]: '{"speed":45,"items":[]}',
  [SITE_SETTING_KEYS.HERO_CARDS]: "[]",
  [SITE_SETTING_KEYS.FEATURED_AREAS]:
    '[{"id":"1","area":"Downtown","count":29,"imageUrl":"https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80"},{"id":"2","area":"Dubai Hills Estate","count":28,"imageUrl":"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80"},{"id":"3","area":"Business Bay","count":24,"imageUrl":"https://images.unsplash.com/photo-1546412414-8035e1776c9a?auto=format&fit=crop&w=1600&q=80"},{"id":"4","area":"Marina","count":19,"imageUrl":"https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=80"},{"id":"5","area":"Jumeirah","count":15,"imageUrl":"https://images.unsplash.com/photo-1549294413-26f195afcbce?auto=format&fit=crop&w=1600&q=80"}]',
  [SITE_SETTING_KEYS.TESTIMONIALS]:
    '{"googleReviewUrl":"https://g.page/r/plotsnhomes/review","items":[{"id":"1","name":"Rohan Sharma","role":"Senior Software Engineer","image":"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80","rating":5,"text":"PlotsnHomes made it possible for me to invest in prime office spaces in Business Bay with just ₹1 Lac. The monthly rental payouts arrive in my wallet without fail. Brilliant UX!","investmentAmount":"₹2,50,000","portfolioSize":"3 Properties"},{"id":"2","name":"Priya Patel","role":"Management Consultant","image":"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80","rating":5,"text":"I was skeptical about fractional ownership, but the transparency and KYC process cleared all doubts. I own fractions of two luxury residential apartments in Marina and Downtown. 10/10 service.","investmentAmount":"₹5,00,000","portfolioSize":"2 Properties"},{"id":"3","name":"Vikram Malhotra","role":"Business Owner","image":"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80","rating":5,"text":"Selling shares on the secondary marketplace is incredibly fast. I exited one of my assets in under 24 hours to secure capital gains. The liquidity feature is a game-changer.","investmentAmount":"₹12,00,000","portfolioSize":"5 Properties"}]}',
  [SITE_SETTING_KEYS.TEAM_MEMBERS]:
    '[{"id":"1","name":"Sarah Mitchell","designation":"Real estate agent","countryCode":"+91","phone":"9820134567"},{"id":"2","name":"Maria Lopez","designation":"Real estate agent","countryCode":"+91","phone":"9678045123"},{"id":"3","name":"David Kim","designation":"Real estate agent","countryCode":"+91","phone":"9845671234"},{"id":"4","name":"James Chen","designation":"Real estate agent","countryCode":"+91","phone":"9730022891"}]',
  [SITE_SETTING_KEYS.DROPDOWN_OPTIONS]: JSON.stringify(DEFAULT_USERS_ACCOUNTS_DROPDOWNS),
  [SITE_SETTING_KEYS.PROJECT_FIELD_DEFAULTS]: JSON.stringify(DEFAULT_PROJECT_FIELD_DEFAULTS),
  [SITE_SETTING_KEYS.ANALYTICS_INTEGRATION]: JSON.stringify({ gaEnabled: false } as AnalyticsIntegration),
};

export async function getSiteSetting<T>(key: string): Promise<T> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  const raw = row?.value ?? DEFAULTS[key] ?? "null";
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to parse site setting ${key}:`, e);
    return JSON.parse(DEFAULTS[key] ?? "null") as T;
  }
}

export async function saveSiteSetting(key: string, value: any) {
  const jsonValue = JSON.stringify(value);
  return prisma.systemSetting.upsert({
    where: { key },
    create: { key, value: jsonValue },
    update: { value: jsonValue },
  });
}

export async function getDropdownOptionsForField(sectionKey: string, fieldKey: string): Promise<DropdownOptionItem[]> {
  const sections = await getSiteSetting<SectionDropdownConfig[]>(SITE_SETTING_KEYS.DROPDOWN_OPTIONS);
  const targetSec = sections.find((s) => s.sectionKey === sectionKey);
  const targetField = targetSec?.fields.find((f) => f.key === fieldKey);
  if (targetField && targetField.options) {
    return targetField.options.filter((o) => o.enabled);
  }
  const defaultSec = DEFAULT_USERS_ACCOUNTS_DROPDOWNS.find((s) => s.sectionKey === sectionKey);
  const defaultField = defaultSec?.fields.find((f) => f.key === fieldKey);
  return defaultField ? defaultField.options.filter((o) => o.enabled) : [];
}
