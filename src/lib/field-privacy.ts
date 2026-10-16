import { prisma } from "./prisma";
import { isSuperAdmin } from "./roles";

export type FieldKey =
  | "email"
  | "phone"
  | "dob"
  | "address"
  | "pan"
  | "aadhar"
  | "kycDocs"
  | "financials";

export const SENSITIVE_FIELDS: { key: FieldKey; label: string; description: string }[] = [
  { key: "email", label: "Email Address", description: "User primary email address" },
  { key: "phone", label: "Phone Number", description: "User mobile / WhatsApp contact number" },
  { key: "dob", label: "Date of Birth", description: "Personal birth date" },
  { key: "address", label: "Residential Address", description: "Street, city, state, zip address details" },
  { key: "pan", label: "PAN Card Number", description: "Tax identity number" },
  { key: "aadhar", label: "Aadhaar Card Number", description: "National identity card number" },
  { key: "kycDocs", label: "KYC Document Uploads", description: "Id proofs, photo, and address proofs" },
  { key: "financials", label: "Loans & Transactions", description: "Loan applications, wallet balances & history" },
];

export type HierarchyLevelKey =
  | "Platform"
  | "Tenant"
  | "Franchise"
  | "Branch"
  | "Department"
  | "Team"
  | "Employee"
  | "Customer"
  | "Guest";

export const HIERARCHY_LEVEL_LIST: { key: HierarchyLevelKey; label: string }[] = [
  { key: "Platform", label: "Platform Level (Super Admin / Platform Admin)" },
  { key: "Tenant", label: "Tenant Level (White Label Admin)" },
  { key: "Franchise", label: "Franchise Level (Franchise Admin)" },
  { key: "Branch", label: "Branch Level (Branch Manager)" },
  { key: "Department", label: "Department Level (Department Head)" },
  { key: "Team", label: "Team Level (Team Leader)" },
  { key: "Employee", label: "Employee Level (Executives / Agents / Staff)" },
  { key: "Customer", label: "Customer Level (Buyers / Sellers)" },
  { key: "Guest", label: "Guest Level (Demo Accounts)" },
];

export type FieldPrivacyMatrix = Record<HierarchyLevelKey, Record<FieldKey, boolean>>;

export const DEFAULT_FIELD_PRIVACY_MATRIX: FieldPrivacyMatrix = {
  Platform:   { email: true, phone: true, dob: true, address: true, pan: true, aadhar: true, kycDocs: true, financials: true },
  Tenant:     { email: true, phone: true, dob: true, address: true, pan: true, aadhar: true, kycDocs: true, financials: true },
  Franchise:  { email: true, phone: true, dob: true, address: true, pan: false, aadhar: false, kycDocs: true, financials: true },
  Branch:     { email: true, phone: true, dob: true, address: true, pan: false, aadhar: false, kycDocs: false, financials: false },
  Department: { email: true, phone: true, dob: false, address: false, pan: false, aadhar: false, kycDocs: false, financials: false },
  Team:       { email: true, phone: true, dob: false, address: false, pan: false, aadhar: false, kycDocs: false, financials: false },
  Employee:   { email: true, phone: false, dob: false, address: false, pan: false, aadhar: false, kycDocs: false, financials: false },
  Customer:   { email: false, phone: false, dob: false, address: false, pan: false, aadhar: false, kycDocs: false, financials: false },
  Guest:      { email: false, phone: false, dob: false, address: false, pan: false, aadhar: false, kycDocs: false, financials: false },
};

export async function getFieldPrivacyConfig(): Promise<FieldPrivacyMatrix> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "user_field_privacy_settings" },
    });
    if (setting) {
      const parsed = JSON.parse(setting.value);
      const merged = { ...DEFAULT_FIELD_PRIVACY_MATRIX };
      for (const level of Object.keys(DEFAULT_FIELD_PRIVACY_MATRIX) as HierarchyLevelKey[]) {
        merged[level] = {
          ...DEFAULT_FIELD_PRIVACY_MATRIX[level],
          ...(parsed[level] || {}),
        };
      }
      return merged;
    }
  } catch (err) {
    console.error("Failed to read user_field_privacy_settings:", err);
  }
  return DEFAULT_FIELD_PRIVACY_MATRIX;
}

export async function saveFieldPrivacyConfig(config: FieldPrivacyMatrix): Promise<boolean> {
  try {
    await prisma.systemSetting.upsert({
      where: { key: "user_field_privacy_settings" },
      update: { value: JSON.stringify(config, null, 2) },
      create: { key: "user_field_privacy_settings", value: JSON.stringify(config, null, 2) },
    });
    return true;
  } catch (err) {
    console.error("Failed to save user_field_privacy_settings:", err);
    return false;
  }
}

/** Check if viewer can see a specific field for target user */
export function isFieldVisibleForViewer(
  viewerRole: string,
  viewerId: string,
  targetUser: { id: string; managerId?: string | null; hierarchyLevel?: string | null },
  fieldKey: FieldKey,
  config: FieldPrivacyMatrix = DEFAULT_FIELD_PRIVACY_MATRIX
): boolean {
  // Super Admin can always view all fields
  if (isSuperAdmin(viewerRole as any)) return true;

  // Direct Self inspecting own profile
  if (viewerId === targetUser.id) return true;

  // Direct Manager inspecting direct subordinate
  if (targetUser.managerId === viewerId) return true;

  const targetLevel = (targetUser.hierarchyLevel as HierarchyLevelKey) || "Employee";
  const levelSettings = config[targetLevel] || DEFAULT_FIELD_PRIVACY_MATRIX.Employee;

  return Boolean(levelSettings[fieldKey]);
}
