"use client";

export type LogCategory = "admin" | "employee" | "agent" | "seller" | "customer" | "edit";

export type ActivityLogItem = {
  id: string;
  category: LogCategory;
  action: string;
  actorName: string;
  actorRole: string;
  actorEmail?: string;
  target: string;
  details: string;
  ipAddress?: string;
  location?: string;
  timestamp: string;
};

export const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  // ── ADMIN LOGS ──
  {
    id: "LOG-ADM-9201",
    category: "admin",
    action: "New Developer Profile Added",
    actorName: "Bhavya",
    actorRole: "SUPERADMIN",
    actorEmail: "bhavya@gmail.com",
    target: "Bhavya Infrastructure & Developers Pvt Ltd",
    details: "Created developer organization profile with 15 ongoing projects, 12 years experience, and linked escrow bank account.",
    ipAddress: "103.21.124.8",
    location: "Gurgaon, India",
    timestamp: "2026-08-06 00:10:15",
  },
  {
    id: "LOG-ADM-9202",
    category: "admin",
    action: "Global Roles & Permissions Master Updated",
    actorName: "Bhavya",
    actorRole: "SUPERADMIN",
    actorEmail: "bhavya@gmail.com",
    target: "Security & Governance Schema",
    details: "Updated granular sub-permissions for Pipeline & Inquiries modules across Admin, Employee, Agent, Seller, and Buyer roles.",
    ipAddress: "103.21.124.8",
    location: "Gurgaon, India",
    timestamp: "2026-08-06 00:08:42",
  },
  {
    id: "LOG-ADM-9203",
    category: "admin",
    action: "White Label Franchise Org Created",
    actorName: "Bhavya",
    actorRole: "SUPERADMIN",
    actorEmail: "bhavya@gmail.com",
    target: "Apex Properties Dubai Franchise (FRAN-DXB-001)",
    details: "Provisioned new white-label tenant unit with custom domain mapping, branding assets, and dedicated database schema.",
    ipAddress: "103.21.124.8",
    location: "Gurgaon, India",
    timestamp: "2026-08-05 23:45:10",
  },

  // ── EMPLOYEE LOGS ──
  {
    id: "LOG-EMP-8301",
    category: "employee",
    action: "Lead Round-Robin Re-assigned",
    actorName: "Pooja Verma",
    actorRole: "EMPLOYEE",
    actorEmail: "pooja.v@plotsnhomes.com",
    target: "Batch #LD-8800 to #LD-8825 (25 Leads)",
    details: "Re-allocated unassigned incoming high-budget buyer leads to Senior Sales Executives based on regional coverage.",
    ipAddress: "122.176.10.4",
    location: "Delhi NCR, India",
    timestamp: "2026-08-05 22:15:30",
  },
  {
    id: "LOG-EMP-8302",
    category: "employee",
    action: "Q3 Sales Audit PDF Exported",
    actorName: "Amit Saxena",
    actorRole: "EMPLOYEE",
    actorEmail: "amit.s@plotsnhomes.com",
    target: "Financial Revenue & Escrow Report",
    details: "Generated comprehensive quarterly settlement audit PDF including 64 processed transactions and commission breakdowns.",
    ipAddress: "122.176.10.4",
    location: "Delhi NCR, India",
    timestamp: "2026-08-05 20:50:18",
  },
  {
    id: "LOG-EMP-8303",
    category: "employee",
    action: "KYC Verification Approved",
    actorName: "Neha Mehta",
    actorRole: "EMPLOYEE",
    actorEmail: "neha.m@plotsnhomes.com",
    target: "Seller Account: Bhavya Infrastructure",
    details: "Verified corporate GSTIN certificate, director PAN card, and RERA registration documents.",
    ipAddress: "122.176.10.4",
    location: "Delhi NCR, India",
    timestamp: "2026-08-05 19:30:05",
  },

  // ── AGENT LOGS ──
  {
    id: "LOG-AGT-9001",
    category: "agent",
    action: "Site Visit Scheduled",
    actorName: "Rahul Sharma",
    actorRole: "AGENT",
    actorEmail: "rahul.sharma@plotsnhomes.com",
    target: "DLF Privana South (BKV-PROP-GUG-008)",
    details: "Scheduled in-person site visit with client Priya Verma for 8th August 2026 at 11:30 AM.",
    ipAddress: "103.211.12.8",
    location: "Gurgaon, India",
    timestamp: "2026-08-05 17:45:10",
  },
  {
    id: "LOG-AGT-9002",
    category: "agent",
    action: "Commission Claimed",
    actorName: "Vikram Singh",
    actorRole: "AGENT",
    actorEmail: "vikram.singh@plotsnhomes.com",
    target: "Kensington Manor (TXN-8821)",
    details: "Submitted 2.5% brokerage commission payout claim for ₹3,13,012 on completed escrow sale.",
    ipAddress: "122.176.45.19",
    location: "Delhi NCR, India",
    timestamp: "2026-08-05 16:30:22",
  },
  {
    id: "LOG-AGT-9003",
    category: "agent",
    action: "Lead Stage Updated",
    actorName: "Ananya Gupta",
    actorRole: "AGENT",
    actorEmail: "ananya.gupta@plotsnhomes.com",
    target: "Lead #LD-4092 (Marcus Chen)",
    details: "Moved lead pipeline stage from 'Qualified In-Person' to 'Contract & Token Sent'.",
    ipAddress: "49.36.192.81",
    location: "Mumbai, India",
    timestamp: "2026-08-05 15:10:05",
  },

  // ── SELLER LOGS ──
  {
    id: "LOG-SLR-6401",
    category: "seller",
    action: "New Property Listing Submitted",
    actorName: "Apex Properties Corp",
    actorRole: "SELLER",
    actorEmail: "seller@plotsnhomes.com",
    target: "Apartment in Downtown, Dubai (BV-AE-0001)",
    details: "Submitted luxury 3BHK high-rise apartment listing ($1,450,000) for platform compliance verification.",
    ipAddress: "185.220.101.5",
    location: "Dubai, UAE",
    timestamp: "2026-08-05 18:20:14",
  },
  {
    id: "LOG-SLR-6402",
    category: "seller",
    action: "Listing Price Revised",
    actorName: "Bhavya Builders Pvt Ltd",
    actorRole: "SELLER",
    actorEmail: "seller@plotsnhomes.com",
    target: "Horizon Heights 4BHK Villa (BKV-PROP-GUG-015)",
    details: "Updated base launch price from ₹3,75,00,000 to ₹3,85,00,000 following early-bird booking phase.",
    ipAddress: "103.21.124.8",
    location: "Gurgaon, India",
    timestamp: "2026-08-05 14:12:00",
  },
  {
    id: "LOG-SLR-6403",
    category: "seller",
    action: "Title Deed & RERA Uploaded",
    actorName: "DLF Developers Ltd",
    actorRole: "SELLER",
    actorEmail: "seller@plotsnhomes.com",
    target: "DLF Privana South Plot #44",
    details: "Uploaded notarized land title deed, approval blueprints, and state RERA clearance certificate PDF.",
    ipAddress: "122.176.88.10",
    location: "Gurgaon, India",
    timestamp: "2026-08-05 11:05:40",
  },

  // ── CUSTOMER LOGS ──
  {
    id: "LOG-CUST-8001",
    category: "customer",
    action: "Property Inquiry Submitted",
    actorName: "Priya Verma",
    actorRole: "BUYER",
    actorEmail: "priya.verma@gmail.com",
    target: "Godrej Palm Retreat (BKV-PROP-009)",
    details: "Submitted price request and site visit inquiry for 3BHK corner unit with lake view.",
    ipAddress: "115.240.99.14",
    location: "Delhi, India",
    timestamp: "2026-08-05 17:10:00",
  },
  {
    id: "LOG-CUST-8002",
    category: "customer",
    action: "Home Loan EMI Calculated",
    actorName: "James Harrington",
    actorRole: "BUYER",
    actorEmail: "james.h@example.com",
    target: "Home Loan Calculator (HDFC Bank)",
    details: "Calculated monthly EMI for ₹1,25,00,000 principal at 8.50% interest rate over 20-year tenure (EMI: ₹1,08,526/mo).",
    ipAddress: "86.130.44.12",
    location: "London, UK",
    timestamp: "2026-08-05 16:45:33",
  },
  {
    id: "LOG-CUST-8003",
    category: "customer",
    action: "Property Saved to Favorites",
    actorName: "Marcus Chen",
    actorRole: "BUYER",
    actorEmail: "marcus.chen@example.com",
    target: "Manhattan Penthouse (BKV-PROP-NYC-003)",
    details: "Shortlisted luxury penthouse listing to personal saved properties collection.",
    ipAddress: "108.12.90.33",
    location: "New York, USA",
    timestamp: "2026-08-05 15:55:12",
  },

  // ── EDIT & SYSTEM MUTATION LOGS ──
  {
    id: "LOG-EDIT-7010",
    category: "edit",
    action: "Developer Agreement & Compliance Approved",
    actorName: "Bhavya",
    actorRole: "SUPERADMIN",
    actorEmail: "bhavya@gmail.com",
    target: "Bhavya Infrastructure & Developers Pvt Ltd",
    details: "Verified developer GSTIN, RERA registration certificate, and approved primary HDFC escrow bank account.",
    ipAddress: "103.21.124.8",
    location: "Gurgaon, India",
    timestamp: "2026-08-06 00:06:12",
  },
  {
    id: "LOG-EDIT-7009",
    category: "edit",
    action: "Property Master Plan & Specs Updated",
    actorName: "Bhavya",
    actorRole: "SUPERADMIN",
    actorEmail: "bhavya@gmail.com",
    target: "Bhavya Horizon Heights (BKV-PROP-GUG-015)",
    details: "Uploaded high-resolution PDF brochures, 3D floor plan layouts, and assigned Senior CRM Lead.",
    ipAddress: "103.21.124.8",
    location: "Gurgaon, India",
    timestamp: "2026-08-06 00:04:30",
  },
  {
    id: "LOG-EDIT-7001",
    category: "edit",
    action: "Property Price Updated",
    actorName: "Super Admin",
    actorRole: "SUPERADMIN",
    actorEmail: "admin@plotsnhomes.com",
    target: "DLF Privana South (BKV-PROP-GUG-008)",
    details: "Updated base price from ₹4,20,00,000 to ₹4,50,00,000 (INR) following Q3 market revision.",
    ipAddress: "103.21.124.8",
    location: "Gurgaon, India",
    timestamp: "2026-08-05 17:50:00",
  },
];

const STORAGE_KEY = "plotsnhomes_activity_logs_v5";

export function getAllActivityLogs(): ActivityLogItem[] {
  if (typeof window === "undefined") return INITIAL_ACTIVITY_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITY_LOGS));
      return INITIAL_ACTIVITY_LOGS;
    }
    let parsed: ActivityLogItem[] = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const existingIds = new Set(parsed.map((l) => l.id));
      const missing = INITIAL_ACTIVITY_LOGS.filter((l) => !existingIds.has(l.id));
      if (missing.length > 0) {
        parsed = [...missing, ...parsed];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ACTIVITY_LOGS));
    return INITIAL_ACTIVITY_LOGS;
  } catch (e) {
    return INITIAL_ACTIVITY_LOGS;
  }
}

export function saveActivityLogs(logs: ActivityLogItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new Event("plotsnhomes_logs_updated"));
  } catch (e) {
    console.error("Failed to save activity logs", e);
  }
}

export function logActivity(item: Omit<ActivityLogItem, "id" | "timestamp">) {
  const currentLogs = getAllActivityLogs();
  const now = new Date();
  const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(
    2,
    "0"
  )}:${String(now.getSeconds()).padStart(2, "0")}`;

  const prefixMap: Record<LogCategory, string> = {
    admin: "ADM",
    employee: "EMP",
    agent: "AGT",
    seller: "SLR",
    customer: "CUST",
    edit: "EDIT",
  };
  const prefix = prefixMap[item.category] || "LOG";
  const newLog: ActivityLogItem = {
    ...item,
    id: `LOG-${prefix}-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: formattedDate,
  };

  const updated = [newLog, ...currentLogs];
  saveActivityLogs(updated);
  return newLog;
}
