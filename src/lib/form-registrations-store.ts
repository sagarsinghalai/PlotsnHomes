import { getSetting, setSetting } from "@/lib/system-settings";

export type RegistrationType = "WHITE_LABEL_PARTNER" | "SELLER";
export type RegistrationStatus = "PENDING" | "APPROVED" | "DECLINED";

export type FormRegistrationRecord = {
  id: string;
  type: RegistrationType;
  name: string;
  email: string;
  phone: string;
  companyOrPropertyTitle: string;
  categoryOrRole: string;
  locationOrRegion?: string;
  detailsJson: string;
  status: RegistrationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  generatedUserId?: string;
  generatedPassword?: string;
  approvedAt?: string;
  declinedAt?: string;
  declineReason?: string;
};

const REGISTRATIONS_KEY = "form_registrations_store_v2";

export const DEFAULT_REGISTRATIONS: FormRegistrationRecord[] = [
  {
    id: "reg-wl-101",
    type: "WHITE_LABEL_PARTNER",
    name: "Sagar Singhal",
    email: "sagar@apexpremier.com",
    phone: "+91 98201 34567",
    companyOrPropertyTitle: "Apex Premier Developers Pvt. Ltd.",
    categoryOrRole: "Real Estate Developer",
    locationOrRegion: "Indore, MP",
    detailsJson: JSON.stringify({
      businessType: "Real Estate Developer",
      customDomain: "invest.apexpremier.com",
      expectedVolume: "₹50 Cr - ₹200 Cr",
      portfolioUnits: "150 Units",
      requestedModules: ["WhatsApp Hub", "Loan Processing Engine", "Webpage Visual Editor"],
    }),
    status: "PENDING",
    createdAt: "2026-08-13T10:30:00.000Z",
    updatedAt: "2026-08-13T10:30:00.000Z",
  },
  {
    id: "reg-sel-102",
    type: "SELLER",
    name: "Bhavya Pandey",
    email: "seller@plotsnhomes.com",
    phone: "+91 98765 43210",
    companyOrPropertyTitle: "Emerald Luxury Plots - Super Corridor",
    categoryOrRole: "Plot & Land Seller",
    locationOrRegion: "Indore, MP",
    detailsJson: JSON.stringify({
      sellerType: "Individual Owner",
      propertyType: "RESIDENTIAL",
      askingPrice: 4500000,
      areaSqft: 1500,
      bedrooms: "3 BHK",
      reraApproved: true,
    }),
    status: "PENDING",
    createdAt: "2026-08-13T11:00:00.000Z",
    updatedAt: "2026-08-13T11:00:00.000Z",
  },
  {
    id: "reg-wl-100",
    type: "WHITE_LABEL_PARTNER",
    name: "Vikramaditya Sharma",
    email: "vikram@metroland.in",
    phone: "+91 99887 76655",
    companyOrPropertyTitle: "MetroLand Infrastructure",
    categoryOrRole: "Franchise Network",
    locationOrRegion: "NCR Delhi",
    detailsJson: JSON.stringify({
      customDomain: "portal.metroland.in",
    }),
    status: "APPROVED",
    generatedUserId: "USER-WL-901",
    generatedPassword: "Partner#2026!Metro",
    approvedAt: "2026-08-12T14:20:00.000Z",
    createdAt: "2026-08-12T09:00:00.000Z",
    updatedAt: "2026-08-12T14:20:00.000Z",
  },
];

export async function getFormRegistrations(): Promise<FormRegistrationRecord[]> {
  const raw = await getSetting(REGISTRATIONS_KEY);
  if (!raw) return DEFAULT_REGISTRATIONS;
  try {
    const list = JSON.parse(raw);
    if (Array.isArray(list) && list.length > 0) return list;
    return DEFAULT_REGISTRATIONS;
  } catch {
    return DEFAULT_REGISTRATIONS;
  }
}

export async function saveFormRegistrations(records: FormRegistrationRecord[]): Promise<FormRegistrationRecord[]> {
  await setSetting(REGISTRATIONS_KEY, JSON.stringify(records));
  return records;
}

export async function addFormRegistration(
  record: Omit<FormRegistrationRecord, "id" | "createdAt" | "updatedAt">
): Promise<FormRegistrationRecord> {
  const current = await getFormRegistrations();
  const now = new Date().toISOString();
  const newRec: FormRegistrationRecord = {
    ...record,
    id: `reg-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };
  const updatedList = [newRec, ...current];
  await saveFormRegistrations(updatedList);
  return newRec;
}
